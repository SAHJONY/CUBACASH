import { supabaseServer } from '@/lib/supabase/server';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

const TYPES=new Set(['CASH_PAYMENT','CASH_RECEIPT','BUSINESS_PAYMENT','P2P_TRANSFER','REFUND','SETTLEMENT']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);

  const {data,error}=await supabase.from('cash_transactions')
    .select('id,reference,payer_business_id,payee_business_id,transaction_type,amount,currency,purpose,location_label,settlement_method,platform_custody,status,compliance_state,evidence_state,initiated_by_role,created_at,updated_at,cash_confirmations(id,participant_business_id,participant_role,decision,created_at),cash_disputes(id,status,reason,created_at,resolved_at)')
    .order('created_at',{ascending:false});
  if(error) return json({error:'CASH_LEDGER_READ_FAILED'},500);
  return json({transactions:data??[]});
}

export async function POST(req:Request){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);

  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}

  const payerBusinessId=String(body.payerBusinessId??'').trim();
  const payeeBusinessId=String(body.payeeBusinessId??'').trim();
  const transactionType=String(body.transactionType??'BUSINESS_PAYMENT').trim().toUpperCase();
  const currency=String(body.currency??'').trim().toUpperCase();
  const purpose=String(body.purpose??'').trim();
  const locationLabel=body.locationLabel?String(body.locationLabel).trim():null;
  const initiatedByRole=String(body.initiatedByRole??'PAYER').trim().toUpperCase();
  const amount=Number(body.amount);

  if(!UUID.test(payerBusinessId)||!UUID.test(payeeBusinessId)||payerBusinessId===payeeBusinessId||!TYPES.has(transactionType)||!/^[A-Z]{3}$/.test(currency)||!purpose||!Number.isFinite(amount)||amount<=0||!['PAYER','PAYEE'].includes(initiatedByRole)){
    return json({error:'INVALID_CASH_TRANSACTION'},400);
  }

  const participantBusinessId=initiatedByRole==='PAYER'?payerBusinessId:payeeBusinessId;
  const {data:ownedBusiness,error:ownedError}=await supabase.from('businesses')
    .select('id')
    .eq('id',participantBusinessId)
    .single();
  if(ownedError||!ownedBusiness) return json({error:'INITIATOR_BUSINESS_NOT_OWNED'},403);

  const {data:verifications}=await supabase.from('community_business_verifications')
    .select('business_id,status,community_score')
    .in('business_id',[payerBusinessId,payeeBusinessId]);
  const blocked=(verifications??[]).find((v)=>v.status==='SUSPENDED'||v.status==='REVOKED');
  if(blocked) return json({error:'PARTICIPANT_NOT_ELIGIBLE',businessId:blocked.business_id,status:blocked.status},409);

  const reference=`MCC-CASH-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
  const {data,error}=await supabase.from('cash_transactions').insert({
    reference,
    created_by_user_id:user.id,
    payer_business_id:payerBusinessId,
    payee_business_id:payeeBusinessId,
    transaction_type:transactionType,
    amount,
    currency,
    purpose:purpose.slice(0,300),
    location_label:locationLabel?.slice(0,160)??null,
    settlement_method:'DIRECT_CASH_HANDOFF',
    platform_custody:false,
    status:'PENDING_CONFIRMATION',
    compliance_state:'RECORD_ONLY',
    evidence_state:'OPTIONAL',
    initiated_by_role:initiatedByRole,
    metadata:{recordNature:'DIRECT_PARTICIPANT_CASH_RECORD',platformCustody:false}
  }).select('id,reference,payer_business_id,payee_business_id,transaction_type,amount,currency,purpose,status,compliance_state,evidence_state,initiated_by_role,created_at').single();
  if(error) return json({error:'CASH_TRANSACTION_CREATE_FAILED'},500);

  const {data:feeGate}=await supabase.from('transaction_platform_fee_gates')
    .select('id,fee_amount,fee_currency,fee_status,due_before_execution,paid_at')
    .eq('entity_type','CASH_TRANSACTION')
    .eq('entity_id',data.id)
    .maybeSingle();

  const trust=Object.fromEntries((verifications??[]).map((v)=>[v.business_id,{status:v.status,communityScore:v.community_score}]));
  return json({
    transaction:data,
    trust,
    requiresDualConfirmation:true,
    platformCustody:false,
    platformFee:feeGate??(currency==='USD'?{status:'FEE_GATE_PENDING'}:{status:'USD_FEE_BASIS_REQUIRED',currency:'USD'})
  },201);
}
