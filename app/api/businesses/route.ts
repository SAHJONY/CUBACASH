import { supabaseServer } from '@/lib/supabase/server';

const ISO2=/^[A-Z]{2}$/;

export async function GET(){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return Response.json({error:'UNAUTHORIZED'},{status:401,headers:{'Cache-Control':'no-store'}});
  const {data,error}=await supabase.from('businesses').select('*').order('created_at',{ascending:false});
  if(error) return Response.json({error:'BUSINESS_READ_FAILED'},{status:500,headers:{'Cache-Control':'no-store'}});
  return Response.json({businesses:data??[]},{headers:{'Cache-Control':'no-store'}});
}

export async function POST(request:Request){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return Response.json({error:'UNAUTHORIZED'},{status:401,headers:{'Cache-Control':'no-store'}});

  let body:any;
  try{body=await request.json();}catch{return Response.json({error:'INVALID_JSON'},{status:400,headers:{'Cache-Control':'no-store'}});}
  const legalName=String(body?.legal_name??'').trim();
  const country=String(body?.country_code??'').trim().toUpperCase();
  const businessType=String(body?.business_type??'').trim();
  if(!legalName||!ISO2.test(country)||!businessType){
    return Response.json({error:'LEGAL_NAME_COUNTRY_AND_BUSINESS_TYPE_REQUIRED'},{status:400,headers:{'Cache-Control':'no-store'}});
  }

  const {data,error}=await supabase.from('businesses').insert({
    legal_name:legalName,
    trade_name:body?.trade_name?String(body.trade_name).trim():null,
    country_code:country,
    business_type:businessType,
    registration_number:body?.registration_number?String(body.registration_number).trim():null,
    owner_user_id:user.id
  }).select('*').single();

  if(error) return Response.json({error:'BUSINESS_CREATE_FAILED'},{status:400,headers:{'Cache-Control':'no-store'}});
  return Response.json({business:data},{status:201,headers:{'Cache-Control':'no-store'}});
}
