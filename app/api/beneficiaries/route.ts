import { supabaseServer } from '@/lib/supabase/server';

export const runtime='nodejs';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

export async function GET(){
  try{
    const supabase=await supabaseServer();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user) return json({error:'UNAUTHORIZED'},401);
    const {data,error}=await supabase.from('beneficiaries')
      .select('id,full_name,relationship,country_code,city,delivery_method,contact_phone,contact_email,beneficiary_type,business_name,registration_number,identity_status,sanctions_status,created_at')
      .order('created_at',{ascending:false});
    if(error) return json({error:'BENEFICIARY_READ_FAILED'},500);
    return json({beneficiaries:data??[]});
  }catch(error){
    console.error('beneficiaries GET failed',error);
    return json({error:'BENEFICIARY_SERVICE_UNAVAILABLE'},503);
  }
}

export async function POST(request:Request){
  try{
    const supabase=await supabaseServer();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user) return json({error:'UNAUTHORIZED'},401);
    let body:Record<string,unknown>;
    try{body=await request.json();}catch{return json({error:'INVALID_JSON'},400);}

    const fullName=String(body.fullName??'').trim();
    const relationship=body.relationship?String(body.relationship).trim():null;
    const countryCode=String(body.countryCode??'').trim().toUpperCase();
    const city=body.city?String(body.city).trim():null;
    const phone=body.phone?String(body.phone).trim():body.contactPhone?String(body.contactPhone).trim():null;
    const email=body.email?String(body.email).trim():body.contactEmail?String(body.contactEmail).trim():null;
    const beneficiaryType=String(body.beneficiaryType??'PERSON').trim().toUpperCase();
    const businessName=body.businessName?String(body.businessName).trim():null;
    const registrationNumber=body.registrationNumber?String(body.registrationNumber).trim():null;
    const deliveryMethod=String(body.deliveryMethod??'PARTNER_NETWORK').trim().toUpperCase();

    if(fullName.length<2||!/^[A-Z]{2}$/.test(countryCode)||!['PERSON','BUSINESS'].includes(beneficiaryType)||!['BANK','CASH_PICKUP','MOBILE_WALLET','PARTNER_NETWORK','OTHER'].includes(deliveryMethod)){
      return json({error:'INVALID_BENEFICIARY'},400);
    }
    if(beneficiaryType==='BUSINESS'&&!businessName) return json({error:'BUSINESS_NAME_REQUIRED'},400);

    const {data,error}=await supabase.from('beneficiaries').insert({
      owner_user_id:user.id,
      full_name:fullName.slice(0,160),
      relationship:relationship?.slice(0,80)??null,
      country_code:countryCode,
      city:city?.slice(0,120)??null,
      contact_phone:phone?.slice(0,40)??null,
      contact_email:email?.slice(0,254)??null,
      beneficiary_type:beneficiaryType,
      business_name:businessName?.slice(0,180)??null,
      registration_number:registrationNumber?.slice(0,120)??null,
      delivery_method:deliveryMethod,
      identity_status:'PENDING',
      sanctions_status:'PENDING'
    }).select('id,full_name,relationship,country_code,city,delivery_method,contact_phone,contact_email,beneficiary_type,business_name,registration_number,identity_status,sanctions_status,created_at').single();

    if(error) return json({error:'BENEFICIARY_CREATE_FAILED'},400);
    return json({beneficiary:data},201);
  }catch(error){
    console.error('beneficiaries POST failed',error);
    return json({error:'BENEFICIARY_SERVICE_UNAVAILABLE'},503);
  }
}
