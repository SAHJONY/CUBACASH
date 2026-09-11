import {supabaseServer} from '@/lib/supabase/server';

function json(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req:Request){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);

  let body:Record<string,unknown>;
  try{body=await req.json()}catch{return json({error:'INVALID_JSON'},400)}
  const action=String(body.action??'').toUpperCase();
  const remittanceIntentId=String(body.remittanceIntentId??'');
  if(!UUID.test(remittanceIntentId)) return json({error:'INVALID_TRANSACTION'},400);

  const {data:intent}=await supabase.from('remittance_intents').select('id,owner_user_id,transfer_status,compliance_state').eq('id',remittanceIntentId).single();
  if(!intent) return json({error:'TRANSACTION_NOT_FOUND'},404);

  if(action==='PREFERENCE'){
    const paymentPreference=String(body.paymentPreference??'UNDECIDED').toUpperCase();
    const requestedFulfillment=String(body.requestedFulfillment??'CASH').toUpperCase();
    const deliveryRequested=Boolean(body.deliveryRequested);
    const deliverySpeedPreference=String(body.deliverySpeedPreference??'FLEXIBLE').toUpperCase();
    const customerNotes=body.customerNotes?String(body.customerNotes).trim().slice(0,500):null;
    if(!['CASH','ZELLE','CASH_APP','OTHER','UNDECIDED'].includes(paymentPreference)) return json({error:'INVALID_PAYMENT_PREFERENCE'},400);
    if(!['CASH','PRODUCTS','SERVICES','SPLIT'].includes(requestedFulfillment)) return json({error:'INVALID_FULFILLMENT'},400);
    if(!['XPRESS_1H','EXPRESS_1_3H','SAME_DAY','FLEXIBLE'].includes(deliverySpeedPreference)) return json({error:'INVALID_DELIVERY_SPEED'},400);
    const {data,error}=await supabase.from('remittance_customer_preferences').upsert({
      remittance_intent_id:remittanceIntentId,owner_user_id:user.id,payment_preference:paymentPreference,
      requested_fulfillment:requestedFulfillment,delivery_requested:deliveryRequested,delivery_speed_preference:deliveryRequested?deliverySpeedPreference:'FLEXIBLE',customer_notes:customerNotes,updated_at:new Date().toISOString()
    },{onConflict:'remittance_intent_id'}).select().single();
    if(error) return json({error:'PREFERENCE_SAVE_FAILED'},500);
    return json({preference:data});
  }

  if(action==='EVIDENCE'){
    const evidenceType=String(body.evidenceType??'PAYMENT_REFERENCE').toUpperCase();
    const evidenceReference=String(body.evidenceReference??'').trim();
    const customerNote=body.customerNote?String(body.customerNote).trim().slice(0,500):null;
    if(!['PAYMENT_REFERENCE','DELIVERY_NOTE','RECEIPT_NOTE','OTHER'].includes(evidenceType)||evidenceReference.length<3||evidenceReference.length>240){
      return json({error:'INVALID_EVIDENCE'},400);
    }
    const {data,error}=await supabase.from('remittance_customer_evidence').insert({
      remittance_intent_id:remittanceIntentId,owner_user_id:user.id,evidence_type:evidenceType,
      evidence_reference:evidenceReference,customer_note:customerNote,review_status:'SUBMITTED'
    }).select('id,evidence_type,evidence_reference,customer_note,review_status,created_at').single();
    if(error) return json({error:'EVIDENCE_SUBMIT_FAILED'},500);
    return json({evidence:data,verification:'PENDING_TRUSTED_REVIEW'},201);
  }

  return json({error:'INVALID_ACTION'},400);
}
