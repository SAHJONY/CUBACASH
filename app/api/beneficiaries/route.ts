import { supabaseServer } from '@/lib/supabase/server';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

export async function GET(){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  const {data,error}=await supabase.from('beneficiaries').select('id,full_name,relationship,country_code,city,delivery_method,identity_status,sanctions_status,created_at').order('created_at',{ascending:false});
  if(error) return json({error:'BENEFICIARY_READ_FAILED'},500);
  return json({beneficiaries:data??[]});
}

export async function POST(req:Request){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}
  const fullName=String(body.fullName??'').trim();
  const countryCode=String(body.countryCode??'').trim().toUpperCase();
  const deliveryMethod=String(body.deliveryMethod??'PARTNER_NETWORK').trim().toUpperCase();
  if(fullName.length<2||!/^[A-Z]{2}$/.test(countryCode)) return json({error:'INVALID_BENEFICIARY'},400);
  const allowed=new Set(['BANK','CASH_PICKUP','MOBILE_WALLET','PARTNER_NETWORK','OTHER']);
  if(!allowed.has(deliveryMethod)) return json({error:'INVALID_DELIVERY_METHOD'},400);
  const {data,error}=await supabase.from('beneficiaries').insert({
    owner_user_id:user.id,
    full_name:fullName,
    relationship:body.relationship?String(body.relationship).trim().slice(0,80):null,
    country_code:countryCode,
    city:body.city?String(body.city).trim().slice(0,120):null,
    delivery_method:deliveryMethod,
    contact_phone:body.contactPhone?String(body.contactPhone).trim().slice(0,40):null,
    contact_email:body.contactEmail?String(body.contactEmail).trim().slice(0,254):null,
    identity_status:'PENDING',
    sanctions_status:'PENDING'
  }).select('id,full_name,country_code,delivery_method,identity_status,sanctions_status,created_at').single();
  if(error) return json({error:'BENEFICIARY_CREATE_FAILED'},500);
  return json({beneficiary:data},201);
}
