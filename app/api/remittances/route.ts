import { supabaseServer } from '@/lib/supabase/server';
import { evaluateRisk } from '@/lib/risk';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  const {data,error}=await supabase.from('remittance_intents')
    .select('id,reference,remittance_type,sender_business_id,beneficiary_id,purpose,business_purpose_code,origin_country,destination_country,send_currency,send_amount,receive_currency,expected_receive_amount,corridor,compliance_state,sanctions_state,risk_band,transfer_status,settlement_status,partner_code,partner_reference,created_at,updated_at')
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
  const remittanceType=String(body.remittanceType??'FAMILY').trim().toUpperCase();
  const senderBusinessId=body.senderBusinessId?String(body.senderBusinessId).trim():null;
  const originCountry=String(body.originCountry??'').trim().toUpperCase();
  const destinationCountry=String(body.destinationCountry??'').trim().toUpperCase();
  const sendCurrency=String(body.sendCurrency??'').trim().toUpperCase();
  const receiveCurrency=String(body.receiveCurrency??'').trim().toUpperCase();
  const purpose=String(body.purpose??'').trim();
  const sourceOfFunds=body.sourceOfFunds?String(body.sourceOfFunds).trim():'';
  const businessPurposeCode=body.businessPurposeCode?String(body.businessPurposeCode).trim().toUpperCase():null;
  const sendAmount=Number(body.sendAmount);

  if(!UUID.test(beneficiaryId)||!['FAMILY','BUSINESS'].includes(remittanceType)||!/^[A-Z]{2}$/.test(originCountry)||!/^[A-Z]{2}$/.test(destinationCountry)||!/^[A-Z]{3}$/.test(sendCurrency)||!/^[A-Z]{3}$/.test(receiveCurrency)||!purpose||!Number.isFinite(sendAmount)||sendAmount<=0){
    return json({error:'INVALID_REMITTANCE'},400);
  }
  if(remittanceType==='BUSINESS'&&(!senderBusinessId||!UUID.test(senderBusinessId))){
    return json({error:'BUSINESS_SENDER_REQUIRED'},400);
  }

  const {data:beneficiary,error:beneficiaryError}=await supabase.from('beneficiaries')
    .select('id,beneficiary_type,identity_status,sanctions_status')
    .eq('id',beneficiaryId)
    .single();
  if(beneficiaryError||!beneficiary) return json({error:'BENEFICIARY_NOT_FOUND'},404);
  if(remittanceType==='FAMILY'&&beneficiary.beneficiary_type!=='PERSON') return json({error:'FAMILY_REQUIRES_PERSON_BENEFICIARY'},409);
  if(remittanceType==='BUSINESS'&&beneficiary.beneficiary_type!=='BUSINESS') return json({error:'BUSINESS_REQUIRES_BUSINESS_BENEFICIARY'},409);

  const sanctionsState=(beneficiary.sanctions_status==='BLOCKED'?'BLOCKED':beneficiary.sanctions_status==='CLEAR'?'CLEAR':beneficiary.sanctions_status==='ERROR'?'ERROR':'PENDING') as 'BLOCKED'|'CLEAR'|'ERROR'|'PENDING';
  const usNexus=originCountry==='US'||destinationCountry==='US';

  // Customer requests never self-supply trusted compliance evidence. Risk output is advisory;
  // the database intent remains HOLD/PENDING_REVIEW until trusted evidence and authorized review advance it.
  const risk=evaluateRisk({
    originCountry,
    destinationCountry,
    usNexus,
    kycKybVerified:beneficiary.identity_status==='VERIFIED',
    beneficialOwnershipVerified:remittanceType==='FAMILY',
    sanctionsState,
    sanctionsEvidenceCurrent:false,
    jurisdictionReviewCurrent:false,
    authorizedReviewRequired:usNexus||remittanceType==='BUSINESS',
    authorizedReviewComplete:false,
    fraudIndicator:false,
    structuringIndicator:false,
    transactionAnomaly:false,
    stableFamilyRemittancePattern:false,
    recurringRecipient:false,
    productControlReviewComplete:false
  });

  if(risk.decision==='BLOCK') return json({error:'REMITTANCE_BLOCKED',risk:{decision:risk.decision,reasons:risk.reasons,evidenceRequirements:risk.evidenceRequirements}},409);

  const reference=`MC-${remittanceType==='FAMILY'?'FAM':'BIZ'}-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
  const {data,error}=await supabase.rpc('create_customer_remittance_intent',{
    p_reference:reference,
    p_beneficiary_id:beneficiaryId,
    p_remittance_type:remittanceType,
    p_sender_business_id:remittanceType==='BUSINESS'?senderBusinessId:null,
    p_purpose:purpose,
    p_source_of_funds:sourceOfFunds,
    p_origin_country:originCountry,
    p_destination_country:destinationCountry,
    p_send_currency:sendCurrency,
    p_send_amount:sendAmount,
    p_receive_currency:receiveCurrency,
    p_corridor:risk.corridor,
    p_business_purpose_code:remittanceType==='BUSINESS'?businessPurposeCode:null
  });
  if(error) return json({error:'REMITTANCE_CREATE_FAILED'},500);

  const row=Array.isArray(data)?data[0]:data;
  return json({
    remittance:row,
    familyOrBusiness:remittanceType,
    risk:{
      advisory:true,
      decision:risk.decision,
      reasons:risk.reasons,
      evidenceRequirements:risk.evidenceRequirements,
      humanReviewRequired:risk.humanReviewRequired,
      policyVersion:risk.policyVersion
    },
    fundsMovement:'AUTHORIZED_PARTNER_ONLY',
    complianceState:'HOLD'
  },201);
}
