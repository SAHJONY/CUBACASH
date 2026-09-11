import { evaluateRisk, type RiskInput } from '@/lib/risk';

export async function POST(request:Request){
  let payload:RiskInput;
  try{ payload=await request.json(); }catch{ return Response.json({error:'INVALID_JSON'},{status:400}); }
  if(!payload.originCountry||!payload.destinationCountry) return Response.json({error:'ORIGIN_AND_DESTINATION_REQUIRED'},{status:400});
  const result=evaluateRisk(payload);
  return Response.json({...result,advisory:true,liveSanctionsScreeningPerformed:false});
}
