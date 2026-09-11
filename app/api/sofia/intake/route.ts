import { timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

function authorized(req:Request){
  const expected=process.env.SOFIA_INGEST_SECRET??'';
  const supplied=req.headers.get('x-sofia-ingest-secret')??'';
  if(!expected||!supplied) return false;
  const a=Buffer.from(expected);
  const b=Buffer.from(supplied);
  return a.length===b.length&&timingSafeEqual(a,b);
}

const CHANNELS=['WHATSAPP','PHONE_CALL'] as const;
const PAYMENT=['CASH','ZELLE','CASH_APP','OTHER','UNDECIDED'] as const;
const FULFILLMENT=['CASH','PRODUCTS_SERVICES','SPLIT','UNDECIDED'] as const;
const REQUESTS=['FAMILY_REMITTANCE','BUSINESS_REMITTANCE','PRODUCTS_SERVICES','DELIVERY','LOCAL_SERVICE','OTHER'] as const;
const DELIVERY_SPEEDS=['XPRESS_1H','EXPRESS_1_3H','SAME_DAY','FLEXIBLE'] as const;
const SERVICE_CODE=/^[A-Z0-9_]{2,64}$/;

export async function POST(req:Request){
  if(!authorized(req)) return json({error:'UNAUTHORIZED'},401);

  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}

  const channel=String(body.channel??'').trim().toUpperCase();
  const senderFullName=String(body.senderFullName??'').trim();
  const senderPhone=String(body.senderPhone??'').trim();
  const senderCountryCode=String(body.senderCountryCode??'').trim().toUpperCase();
  const paymentPreference=String(body.paymentPreference??'UNDECIDED').trim().toUpperCase();
  const requestedFulfillment=String(body.requestedFulfillment??'UNDECIDED').trim().toUpperCase();
  const requestType=String(body.requestType??'FAMILY_REMITTANCE').trim().toUpperCase();
  const deliverySpeedPreference=String(body.deliverySpeedPreference??'FLEXIBLE').trim().toUpperCase();
  const requestedServiceCode=body.requestedServiceCode?String(body.requestedServiceCode).trim().toUpperCase():null;
  const amount=body.requestedAmount==null?null:Number(body.requestedAmount);
  const currency=String(body.requestedCurrency??'USD').trim().toUpperCase();
  const receiverWhatsApp=body.receiverWhatsAppPhone?String(body.receiverWhatsAppPhone).trim():null;
  const receiverPhone=body.receiverPhone?String(body.receiverPhone).trim():null;

  if(!CHANNELS.includes(channel as typeof CHANNELS[number])||senderFullName.length<2||senderPhone.length<7||!/^[A-Z]{2}$/.test(senderCountryCode)){
    return json({error:'SENDER_INFORMATION_REQUIRED'},400);
  }
  if(!PAYMENT.includes(paymentPreference as typeof PAYMENT[number])||!FULFILLMENT.includes(requestedFulfillment as typeof FULFILLMENT[number])||!REQUESTS.includes(requestType as typeof REQUESTS[number])||!DELIVERY_SPEEDS.includes(deliverySpeedPreference as typeof DELIVERY_SPEEDS[number])||!/^[A-Z]{3}$/.test(currency)||amount!==null&&(!Number.isFinite(amount)||amount<=0)){
    return json({error:'INVALID_INTAKE'},400);
  }
  if(requestedServiceCode&&!SERVICE_CODE.test(requestedServiceCode)) return json({error:'INVALID_SERVICE_CODE'},400);
  if(requestType==='LOCAL_SERVICE'&&!requestedServiceCode) return json({error:'LOCAL_SERVICE_CODE_REQUIRED'},400);
  if(!receiverWhatsApp&&!receiverPhone){
    return json({error:'RECEIVER_CONTACT_REQUIRED',requiredOneOf:['receiverWhatsAppPhone','receiverPhone']},400);
  }

  const externalReference=body.externalReference?String(body.externalReference).trim():null;
  const db=supabaseAdmin();
  if(externalReference){
    const {data:existing}=await db.from('sofia_order_intakes').select('id,intake_status').eq('external_reference',externalReference).maybeSingle();
    if(existing) return json({intake:existing,idempotent:true});
  }

  const payload={
    external_reference:externalReference,
    channel,
    conversation_reference:body.conversationReference?String(body.conversationReference).trim():null,
    sender_full_name:senderFullName,
    sender_phone:senderPhone,
    sender_email:body.senderEmail?String(body.senderEmail).trim():null,
    sender_country_code:senderCountryCode,
    beneficiary_full_name:body.beneficiaryFullName?String(body.beneficiaryFullName).trim():null,
    beneficiary_phone:body.beneficiaryPhone?String(body.beneficiaryPhone).trim():null,
    beneficiary_address:body.beneficiaryAddress?String(body.beneficiaryAddress).trim():null,
    beneficiary_country_code:body.beneficiaryCountryCode?String(body.beneficiaryCountryCode).trim().toUpperCase():null,
    receiver_whatsapp_phone:receiverWhatsApp,
    receiver_phone:receiverPhone,
    request_type:requestType,
    requested_service_code:requestedServiceCode,
    delivery_speed_preference:deliverySpeedPreference,
    requested_amount:amount,
    requested_currency:currency,
    requested_fulfillment:requestedFulfillment,
    payment_preference:paymentPreference,
    payment_status:paymentPreference==='UNDECIDED'?'NOT_VERIFIED':'AWAITING_PAYMENT',
    delivery_requested:Boolean(body.deliveryRequested),
    notes:body.notes?String(body.notes).slice(0,2000):null,
    intake_status:'READY_FOR_REVIEW'
  };

  const {data,error}=await db.from('sofia_order_intakes').insert(payload).select('id,channel,intake_status,request_type,requested_service_code,delivery_speed_preference,payment_preference,payment_status,receiver_whatsapp_phone,receiver_phone,created_at').single();
  if(error){
    if((error as {code?:string}).code==='23505'&&externalReference){
      const {data:existing}=await db.from('sofia_order_intakes').select('id,intake_status').eq('external_reference',externalReference).single();
      if(existing) return json({intake:existing,idempotent:true});
    }
    return json({error:'SOFIA_INTAKE_FAILED'},500);
  }

  return json({
    intake:data,
    nextAction:'PROCESS_WITH_POLICY_GATES',
    paymentRule:'CUSTOMER_PREFERENCE_RECORDED_NOT_PAYMENT_VERIFICATION',
    receiverRule:'BOUND_WHATSAPP_OR_PHONE_REQUIRED_FOR_FINAL_CONFIRMATION',
    serviceRule:'LOCAL_SERVICE_SELECTION_DOES_NOT_AUTHORIZE_MONEY_TRANSMISSION_CURRENCY_EXCHANGE_CUSTODY_OR_SETTLEMENT',
    deliveryRule:'DELIVERY_SPEED_IS_A_CUSTOMER_PREFERENCE_UNTIL_PROVIDER_ACCEPTANCE',
    permittedPaymentPreferences:['CASH','ZELLE','CASH_APP','OTHER','UNDECIDED']
  },201);
}
