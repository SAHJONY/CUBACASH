import { mkdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';

// Deal-advisory intake (deal/partnership pre-commitment legal review).
// INTERNAL ONLY, owner role only. Submissions are stored as local files under
// legal/deal-intakes/ — they are NEVER sent anywhere (no email, no WhatsApp,
// no external API, no authority).

const DEAL_TYPES=['ALIANZA','PROVEEDOR','INVERSION','COMPRA','VENTA','SERVICIO','OTRO'] as const;
const URGENCY=['NORMAL','PRONTO','URGENTE'] as const;
const LABEL='Investigación legal con IA — no es asesoría legal';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

async function requireOwner(){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return null;
  const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();
  return profile?.role==='platform_owner'?user:null;
}

export async function POST(req:Request){
  const user=await requireOwner();
  if(!user) return json({error:'OWNER_ONLY'},403);

  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}

  const dealType=String(body.dealType??'').trim().toUpperCase();
  const description=String(body.description??'').trim();
  const counterparty=body.counterparty?String(body.counterparty).trim().slice(0,200):null;
  const jurisdiction=body.jurisdiction?String(body.jurisdiction).trim().slice(0,120):null;
  const amountApprox=body.amountApprox?String(body.amountApprox).trim().slice(0,120):null;
  const questions=body.questions?String(body.questions).trim().slice(0,3000):null;
  const urgency=String(body.urgency??'NORMAL').trim().toUpperCase();

  if(!DEAL_TYPES.includes(dealType as typeof DEAL_TYPES[number])) return json({error:'INVALID_DEAL_TYPE'},400);
  if(!URGENCY.includes(urgency as typeof URGENCY[number])) return json({error:'INVALID_URGENCY'},400);
  if(description.length<20||description.length>5000) return json({error:'DESCRIPTION_REQUIRED_20_5000'},400);

  const now=new Date();
  const stamp=now.toISOString().replace(/[-:]/g,'').slice(0,15); // YYYYMMDDTHHMMSS
  const rand=randomBytes(4).toString('hex');
  const basename=`deal-intake-${stamp}-${rand}`;

  const record={
    label_es:LABEL,
    label_en:'AI LEGAL RESEARCH — NOT LEGAL ADVICE',
    submitted_at:now.toISOString(),
    submitted_by:user.id,
    business:'MY CUBA CASH',
    storage:'LOCAL_ONLY — never sent anywhere',
    deal_type:dealType,
    counterparty,
    jurisdiction,
    amount_approx:amountApprox,
    description,
    questions,
    urgency
  };

  const dir=path.join(process.cwd(),'legal','deal-intakes');
  await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,`${basename}.json`),JSON.stringify(record,null,2),'utf8');
  const md=[
    `# Deal-advisory intake — ${dealType}`,
    '',
    `> ${LABEL} — AI LEGAL RESEARCH — NOT LEGAL ADVICE`,
    `> Internal, owner-only. Not sent anywhere.`,
    '',
    `- **Submitted:** ${now.toISOString()} (America/Chicago)`,
    `- **Business:** MY CUBA CASH (separate from SAHJONY Import/Export — never cross-file)`,
    `- **Urgency:** ${urgency}`,
    counterparty?`- **Counterparty:** ${counterparty}`:'',
    jurisdiction?`- **Jurisdiction:** ${jurisdiction}`:'',
    amountApprox?`- **Amount (approx):** ${amountApprox}`:'',
    '',
    '## Deal description',
    description,
    '',
    '## Legal questions',
    questions??'_(none submitted)_',
    '',
    '---',
    `*${LABEL}*`
  ].filter((l)=>l!=='').join('\n');
  await writeFile(path.join(dir,`${basename}.md`),md,'utf8');

  return json({ok:true,reference:basename,urgency,next:'INTERNAL_REVIEW_QUEUE'},201);
}
