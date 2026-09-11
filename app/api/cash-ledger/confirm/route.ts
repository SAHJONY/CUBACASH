import { supabaseServer } from '@/lib/supabase/server';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req:Request){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);

  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}

  const transactionId=String(body.transactionId??'').trim();
  const participantBusinessId=String(body.participantBusinessId??'').trim();
  const participantRole=String(body.participantRole??'').trim().toUpperCase();
  const decision=String(body.decision??'').trim().toUpperCase();
  if(!UUID.test(transactionId)||!UUID.test(participantBusinessId)||!['PAYER','PAYEE'].includes(participantRole)||!['CONFIRMED','REJECTED'].includes(decision)){
    return json({error:'INVALID_CONFIRMATION'},400);
  }

  const {data:ownedBusiness,error:ownedError}=await supabase.from('businesses')
    .select('id')
    .eq('id',participantBusinessId)
    .single();
  if(ownedError||!ownedBusiness) return json({error:'PARTICIPANT_BUSINESS_NOT_OWNED'},403);

  const evidence=(body.evidence&&typeof body.evidence==='object'&&!Array.isArray(body.evidence))?body.evidence:{};
  const {data,error}=await supabase.from('cash_confirmations').insert({
    cash_transaction_id:transactionId,
    participant_business_id:participantBusinessId,
    confirmed_by_user_id:user.id,
    participant_role:participantRole,
    decision,
    evidence
  }).select('id,cash_transaction_id,participant_business_id,participant_role,decision,created_at').single();

  if(error){
    const duplicate=String(error.code)==='23505';
    return json({error:duplicate?'CONFIRMATION_ALREADY_RECORDED':'CONFIRMATION_FAILED'},duplicate?409:500);
  }

  const {data:transaction}=await supabase.from('cash_transactions')
    .select('id,reference,status,evidence_state,updated_at')
    .eq('id',transactionId)
    .single();

  return json({confirmation:data,transaction},201);
}
