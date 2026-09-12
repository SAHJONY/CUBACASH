import {supabaseServer} from '@/lib/supabase/server';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

const METHOD_KEYS=new Set(['ZELLE','CASH_APP','PAYPAL','SQUARE']);

async function ownerContext(){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {supabase,user:null,owner:false};
  const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();
  return {supabase,user,owner:profile?.role==='platform_owner'};
}

export async function GET(){
  const {supabase,user,owner}=await ownerContext();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  if(!owner) return json({error:'OWNER_REQUIRED'},403);
  const {data,error}=await supabase.from('platform_payment_methods')
    .select('id,method_key,display_name,recipient_identifier,payment_url,instructions,enabled,public_visible,updated_at')
    .order('display_name');
  if(error) return json({error:'PAYMENT_METHODS_LOAD_FAILED'},500);
  return json({ok:true,methods:data??[]});
}

export async function PATCH(req:Request){
  const {supabase,user,owner}=await ownerContext();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  if(!owner) return json({error:'OWNER_REQUIRED'},403);

  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}

  const methodKey=String(body.methodKey??'').trim().toUpperCase();
  if(!METHOD_KEYS.has(methodKey)) return json({error:'INVALID_METHOD'},400);

  const recipientIdentifier=String(body.recipientIdentifier??'').trim();
  const paymentUrl=String(body.paymentUrl??'').trim();
  const instructions=String(body.instructions??'').trim();
  const enabled=Boolean(body.enabled);
  const publicVisible=Boolean(body.publicVisible);

  if(recipientIdentifier.length>180||paymentUrl.length>500||instructions.length>500){
    return json({error:'INVALID_PAYMENT_METHOD_SETTINGS'},400);
  }
  if(paymentUrl&& !/^https:\/\//i.test(paymentUrl)) return json({error:'HTTPS_PAYMENT_URL_REQUIRED'},400);
  if(enabled&&!recipientIdentifier&&!paymentUrl) return json({error:'PAYMENT_DESTINATION_REQUIRED'},400);

  const {data,error}=await supabase.from('platform_payment_methods')
    .update({
      recipient_identifier:recipientIdentifier||null,
      payment_url:paymentUrl||null,
      instructions:instructions||null,
      enabled,
      public_visible:publicVisible
    })
    .eq('method_key',methodKey)
    .select('id,method_key,display_name,recipient_identifier,payment_url,instructions,enabled,public_visible,updated_at')
    .single();

  if(error) return json({error:'PAYMENT_METHOD_UPDATE_FAILED'},500);
  return json({ok:true,method:data});
}
