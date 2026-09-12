import 'server-only';

const SDN_CSV_URL='https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV';
const CONSOLIDATED_CSV_URL='https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/CONSOLIDATED.CSV';
const USER_AGENT='mycubacash-sanctions-screen/1.0 (+https://www.mycubacash.com)';
const CACHE_TTL_MS=15*60*1000;

export type SanctionsListKind='SDN'|'CONSOLIDATED';
export type SanctionsMatch={
  list:SanctionsListKind;
  name:string;
  type?:string;
  program?:string;
  remarks?:string;
  score:number;
};

export type SanctionsScreenResult={
  provider:'OFAC_SLS';
  source:'U.S. Department of the Treasury, Office of Foreign Assets Control';
  sourceUrls:string[];
  checkedAt:string;
  query:string;
  status:'CLEAR'|'REVIEW'|'ERROR';
  matches:SanctionsMatch[];
  authoritativeEvidenceCurrent:boolean;
  notes:string[];
};

type CachedList={rows:string[][]; fetchedAt:number};
const cache=new Map<SanctionsListKind,CachedList>();

function parseCsvLine(line:string){
  const out:string[]=[];
  let cur='';
  let quoted=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){
      if(quoted&&line[i+1]==='"'){cur+='"';i++;}
      else quoted=!quoted;
    }else if(ch===','&&!quoted){out.push(cur);cur='';}
    else cur+=ch;
  }
  out.push(cur);
  return out.map(v=>v.trim());
}

function normalize(value:string){
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function tokenScore(query:string,candidate:string){
  const q=normalize(query);
  const c=normalize(candidate);
  if(!q||!c) return 0;
  if(q===c) return 1;
  if(c.includes(q)||q.includes(c)) return 0.92;
  const qa=new Set(q.split(' '));
  const ca=new Set(c.split(' '));
  let overlap=0;
  for(const token of qa) if(ca.has(token)) overlap++;
  return overlap/Math.max(qa.size,ca.size);
}

async function fetchList(kind:SanctionsListKind){
  const existing=cache.get(kind);
  if(existing&&Date.now()-existing.fetchedAt<CACHE_TTL_MS) return existing.rows;
  const url=kind==='SDN'?SDN_CSV_URL:CONSOLIDATED_CSV_URL;
  const response=await fetch(url,{headers:{'User-Agent':USER_AGENT,'Accept':'text/csv'},cache:'no-store'});
  if(!response.ok) throw new Error(`OFAC_SLS_${kind}_HTTP_${response.status}`);
  const text=await response.text();
  const rows=text.split(/\r?\n/).filter(Boolean).map(parseCsvLine);
  cache.set(kind,{rows,fetchedAt:Date.now()});
  return rows;
}

function rowToMatch(kind:SanctionsListKind,row:string[],score:number):SanctionsMatch{
  return {
    list:kind,
    name:row[1]||'',
    type:row[2]||undefined,
    program:row[3]||undefined,
    remarks:row[row.length-1]||undefined,
    score
  };
}

export function sanctionsProviderConfigured(){
  const configured=(process.env.SANCTIONS_PROVIDER||'ofac-sls').trim().toLowerCase();
  return configured==='ofac-sls';
}

export async function screenOfacName(name:string):Promise<SanctionsScreenResult>{
  const query=name.trim();
  const checkedAt=new Date().toISOString();
  if(!query){
    return {provider:'OFAC_SLS',source:'U.S. Department of the Treasury, Office of Foreign Assets Control',sourceUrls:[SDN_CSV_URL,CONSOLIDATED_CSV_URL],checkedAt,query,status:'ERROR',matches:[],authoritativeEvidenceCurrent:false,notes:['Name is required.']};
  }
  try{
    const [sdn,consolidated]=await Promise.all([fetchList('SDN'),fetchList('CONSOLIDATED')]);
    const threshold=0.75;
    const matches:SanctionsMatch[]=[];
    for(const [kind,rows] of [['SDN',sdn],['CONSOLIDATED',consolidated]] as const){
      for(const row of rows){
        if(row.length<2) continue;
        const score=tokenScore(query,row[1]||'');
        if(score>=threshold) matches.push(rowToMatch(kind,row,score));
      }
    }
    matches.sort((a,b)=>b.score-a.score);
    return {
      provider:'OFAC_SLS',
      source:'U.S. Department of the Treasury, Office of Foreign Assets Control',
      sourceUrls:[SDN_CSV_URL,CONSOLIDATED_CSV_URL],
      checkedAt,
      query,
      status:matches.length?'REVIEW':'CLEAR',
      matches:matches.slice(0,25),
      authoritativeEvidenceCurrent:true,
      notes:[
        'Sanctions disposition must remain tied to current authoritative source data.',
        'AI may assist prioritization and false-positive reduction, but may not clear a sanctions match without corroborating identifiers.',
        matches.length?'Potential name match requires corroborating identifiers and authorized review.':'No name match at the configured threshold in the current OFAC SLS datasets.'
      ]
    };
  }catch(error){
    return {
      provider:'OFAC_SLS',
      source:'U.S. Department of the Treasury, Office of Foreign Assets Control',
      sourceUrls:[SDN_CSV_URL,CONSOLIDATED_CSV_URL],
      checkedAt,
      query,
      status:'ERROR',
      matches:[],
      authoritativeEvidenceCurrent:false,
      notes:['Sanctions provider error: fail closed and hold for review.',error instanceof Error?error.message:'Unknown sanctions provider error']
    };
  }
}
