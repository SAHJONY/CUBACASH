import { evaluateRisk, type RiskInput, type SanctionsState } from '@/lib/risk';

const COUNTRY=/^[A-Za-z]{2}$/;
const SANCTIONS = new Set<SanctionsState>(['CLEAR','PENDING','REVIEW','BLOCKED','ERROR']);

export async function POST(request:Request){
  const length=Number(request.headers.get('content-length')||0);
  if(length>16_384) return Response.json({error:'PAYLOAD_TOO_LARGE'},{status:413,headers:{'Cache-Control':'no-store'}});

  let raw:unknown;
  try{ raw=await request.json(); }catch{ return Response.json({error:'INVALID_JSON'},{status:400,headers:{'Cache-Control':'no-store'}}); }
  if(!raw||typeof raw!=='object'||Array.isArray(raw)) return Response.json({error:'INVALID_PAYLOAD'},{status:400,headers:{'Cache-Control':'no-store'}});

  const payload=raw as RiskInput;
  if(!COUNTRY.test(payload.originCountry||'')||!COUNTRY.test(payload.destinationCountry||'')){
    return Response.json({error:'VALID_ISO2_ORIGIN_AND_DESTINATION_REQUIRED'},{status:400,headers:{'Cache-Control':'no-store'}});
  }
  if(payload.sanctionsState&&!SANCTIONS.has(payload.sanctionsState)){
    return Response.json({error:'INVALID_SANCTIONS_STATE'},{status:400,headers:{'Cache-Control':'no-store'}});
  }

  const result=evaluateRisk(payload);
  return Response.json({
    ...result,
    advisory:true,
    policyLayer:'MY CUBA CASH',
    liveSanctionsScreeningPerformed:false,
    authoritativeSourceDataRequired:true,
    authorizedHumanReviewMayBeRequired:true
  },{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
