import { supabaseServer } from '@/lib/supabase/server';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const METHODS=new Set(['CASH','BANK_TRANSFER','ACH','WIRE','CARD','OTHER']);

export async function POST(req:Request){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);

  const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();
  if(!profile||!['platform_owner','platform_admin'].includes(profile.role)){
    return json({error:'TRUSTED_PAYMENT_REVIEW_REQUIRED'},403);
  }

  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}

  const entityType=String(body.entityType??'CASH_TRANSACTION').trim().toUpperCase();
  const entityId=String(body.entityId??'').trim();
  const paymentReference=String(body.paymentReference??'').trim();
  const paymentMethod=String(body.paymentMethod??'').trim().toUpperCase();
  const notes=body.notes?String(body.notes).trim():null;
  const evidence=(body.evidence&&typeof body.evidence==='object'&&!Array.isArray(body.evidence))?body.evidence:{};

  if(!['CASH_TRANSACTION','REMITTANCE_INTENT','MARKETPLACE_TRANSACTION','BUSINESS_PAYMENT','OTHER'].includes(entityType)||!UUID.test(entityId)||paymentReference.length<3||paymentReference.length>160||!METHODS.has(paymentMethod)||((notes?.length??0)>500)){
    return json({error:'INVALID_MANUAL_PAYMENT_CONFIRMATION'},400);
  }

  const {data,error}=await supabase.rpc('confirm_manual_platform_fee_payment',{
    p_entity_type:entityType,
    p_entity_id:entityId,
    p_payment_reference:paymentReference,
    p_payment_method:paymentMethod,
    p_notes:notes,
    p_evidence:evidence
  });

  if(error){
    const message=String(error.message||'MANUAL_PAYMENT_CONFIRMATION_FAILED');
    if(message.includes('PLATFORM_FEE_GATE_NOT_FOUND')) return json({error:'PLATFORM_FEE_GATE_NOT_FOUND'},404);
    if(message.includes('PLATFORM_FEE_NOT_PAYABLE')) return json({error:'PLATFORM_FEE_NOT_PAYABLE'},409);
    if(message.includes('PLATFORM_FEE_RECONCILIATION_MISMATCH')) return json({error:'PLATFORM_FEE_RECONCILIATION_MISMATCH'},409);
    if(message.includes('MANUAL_PAYMENT_EVIDENCE_REQUIRED')) return json({error:'MANUAL_PAYMENT_EVIDENCE_REQUIRED'},400);
    return json({error:'MANUAL_PAYMENT_CONFIRMATION_FAILED'},500);
  }

  return json({ok:true,confirmation:Array.isArray(data)?data[0]??null:data,confirmationMode:'TRUSTED_MANUAL'});
}
