import { supabaseServer } from '@/lib/supabase/server';
import { evaluateRisk } from '@/lib/risk';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

export async function GET(){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  const {data,error}=await supabase.from('remittance_intents')
    .select('id,reference,beneficiary_id,purpose,origin_country,destination_country,send_currency,send_amount,receive_currency,expected_receive_amount,corridor,compliance_state,sanctions_state,risk_band,transfer_status,settlement_status,partner_code,partner_reference,created_at,updated_at')
    .order('created_at',{ascending:false});
  if(error) return json({error:'REMITTANCE_READ_FAILED'},500);
  return json({remittances:data??[]});
}

export async function POST(req:Request){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}

  const beneficiaryId=String(body.beneficiaryId??'').trim();
  const originCountry=String(body.originCountry??'').trim().toUpperCase();
  const destinationCountry=String(body.destinationCountry??'').trim().toUpperCase();
  const sendCurrency=String(body.sendCurrency??'').trim().toUpperCase();
  const receiveCurrency=String(body.receiveCurrency??'').trim().toUpperCase();
  const purpose=String(body.purpose??'').trim();
  const sendAmount=Number(body.sendAmount);
  if(!beneficiaryId||!/^[A-Z]{2}$/.test(originCountry)||!/^[A-Z]{2}$/.test(destinationCountry)||!/^[A-Z]{3}$/.test(sendCurrency)||!/^[A-Z]{3}$/.test(receiveCurrency)||!purpose||!Number.isFinite(sendAmount)||sendAmount<=0){
    return json({error:'INVALID_REMITTANCE'},400);
  }

  const {data:beneficiary,error:beneficiaryError}=await supabase.from('beneficiaries').select('id,identity_status,sanctions_status').eq('id',beneficiaryId).single();
  if(beneficiaryError||!beneficiary) return json({error:'BENEFICIARY_NOT_FOUND'},404);

  const sanctionsState=(beneficiary.sanctions_status==='BLOCKED'?'BLOCKED':beneficiary.sanctions_status==='CLEAR'?'CLEAR':beneficiary.sanctions_status==='ERROR'?'ERROR':'PENDING') as 'BLOCKED'|'CLEAR'|'ERROR'|'PENDING';
  const risk=evaluateRisk({
    originCountry,
    destinationCountry,
    usNexus:!!body.usNexus,
    kycKybVerified:beneficiary.identity_status==='VERIFIED',
    beneficialOwnershipVerified:true,
    sanctionsState,
    sanctionsEvidenceCurrent:!!body.sanctionsEvidenceCurrent,
    jurisdictionReviewCurrent:!!body.jurisdictionReviewCurrent,
    authorizedReviewRequired:!!body.authorizedReviewRequired,
    authorizedReviewComplete:!!body.authorizedReviewComplete,
    fraudIndicator:!!body.fraudIndicator,
    structuringIndicator:!!body.structuringIndicator,
    transactionAnomaly:!!body.transactionAnomaly,
    stableFamilyRemittancePattern:!!body.stableFamilyRemittancePattern,
    recurringRecipient:!!body.recurringRecipient,
    productControlReviewComplete:!!body.productControlReviewComplete
  });

  const complianceState=risk.decision==='BLOCK'?'BLOCK':risk.decision==='ALLOW_WITH_CONTROLS'?'CLEAR':risk.decision==='REVIEW'?'REVIEW':'HOLD';
  const transferStatus=complianceState==='CLEAR'?'READY_FOR_PARTNER':'PENDING_REVIEW';
  const reference=`MC-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
  const {data,error}=await supabase.from('remittance_intents').insert({
    reference,
    owner_user_id:user.id,
    beneficiary_id:beneficiaryId,
    purpose:purpose.slice(0,240),
    source_of_funds:body.sourceOfFunds?String(body.sourceOfFunds).trim().slice(0,160):null,
    origin_country:originCountry,
    destination_country:destinationCountry,
    send_currency:sendCurrency,
    send_amount:sendAmount,
    receive_currency:receiveCurrency,
    expected_receive_amount:null,
    corridor:risk.corridor,
    compliance_state:complianceState,
    sanctions_state:sanctionsState,
    risk_band:risk.riskBand,
    transfer_status:transferStatus,
    settlement_status:'NOT_INITIATED',
    authoritative_evidence:{requirements:risk.evidenceRequirements,reasons:risk.reasons,policyVersion:risk.policyVersion,sanctionsPolicyVersion:risk.sanctionsPolicyVersion,auditPolicyVersion:risk.auditPolicyVersion}
  }).select('id,reference,corridor,compliance_state,sanctions_state,risk_band,transfer_status,settlement_status,created_at').single();
  if(error) return json({error:'REMITTANCE_CREATE_FAILED'},500);
  return json({remittance:data,risk:{decision:risk.decision,reasons:risk.reasons,evidenceRequirements:risk.evidenceRequirements,humanReviewRequired:risk.humanReviewRequired,policyVersion:risk.policyVersion}},201);
}
