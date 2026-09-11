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
  const reason=String(body.reason??'').trim();
  if(!UUID.test(transactionId)||!reason) return json({error:'INVALID_DISPUTE'},400);

  const {data,error}=await supabase.from('cash_disputes').insert({
    cash_transaction_id:transactionId,
    opened_by_user_id:user.id,
    reason:reason.slice(0,500),
    status:'OPEN'
  }).select('id,cash_transaction_id,status,reason,created_at').single();
  if(error) return json({error:'DISPUTE_CREATE_FAILED'},500);

  const {data:transaction}=await supabase.from('cash_transactions')
    .select('id,reference,status,updated_at')
    .eq('id',transactionId)
    .single();
  return json({dispute:data,transaction},201);
}
