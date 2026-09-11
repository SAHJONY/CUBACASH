import {supabaseServer} from '@/lib/supabase/server';

export const dynamic='force-dynamic';
export const runtime='nodejs';

function json(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
function money(value:unknown){if(value===null||value===undefined||value==='') return null;const n=Number(value);return Number.isFinite(n)&&n>=0?Math.round(n*100)/100:NaN;}
function integer(value:unknown){if(value===null||value===undefined||value==='') return null;const n=Number(value);return Number.isInteger(n)&&n>=0&&n<=10080?n:NaN;}

export async function GET(){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);

  const [{data:provider},{data:catalog,error:catalogError},{data:offers,error:offerError}]=await Promise.all([
    supabase.from('delivery_provider_profiles').select('user_id,public_provider_id,display_name,profile_status').eq('user_id',user.id).maybeSingle(),
    supabase.from('delivery_service_catalog').select('code,display_name_es,display_name_en,category,requires_manual_review,sort_order').eq('active',true).order('sort_order'),
    supabase.from('delivery_provider_service_offers').select('service_code,active,fee_currency,starting_fee,minimum_fee,maximum_fee,eta_min_minutes,eta_max_minutes,conditions,approval_status,updated_at').eq('provider_user_id',user.id)
  ]);
  if(!provider) return json({error:'DELIVERY_PROVIDER_PROFILE_REQUIRED'},404);
  if(catalogError||offerError) return json({error:'PROVIDER_SERVICES_READ_FAILED'},500);
  const byCode=new Map((offers??[]).map((o:any)=>[o.service_code,o]));
  return json({provider,services:(catalog??[]).map((c:any)=>({...c,offer:byCode.get(c.code)??null}))});
}

export async function PATCH(request:Request){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  let body:Record<string,unknown>;
  try{body=await request.json()}catch{return json({error:'INVALID_JSON'},400)}
  const serviceCode=String(body.serviceCode??'').trim().toUpperCase();
  const active=Boolean(body.active);
  const feeCurrency=String(body.feeCurrency??'USD').trim().toUpperCase();
  const startingFee=money(body.startingFee),minimumFee=money(body.minimumFee),maximumFee=money(body.maximumFee);
  const etaMin=integer(body.etaMinMinutes),etaMax=integer(body.etaMaxMinutes);
  const conditions=body.conditions?String(body.conditions).trim().slice(0,500):null;

  if(!serviceCode) return json({error:'SERVICE_CODE_REQUIRED'},400);
  if(!/^[A-Z]{3}$/.test(feeCurrency)) return json({error:'INVALID_CURRENCY'},400);
  if([startingFee,minimumFee,maximumFee,etaMin,etaMax].some(v=>Number.isNaN(v))) return json({error:'INVALID_SERVICE_PRICING_OR_ETA'},400);
  if(minimumFee!==null&&maximumFee!==null&&minimumFee>maximumFee) return json({error:'MINIMUM_EXCEEDS_MAXIMUM'},400);
  if(etaMin!==null&&etaMax!==null&&etaMin>etaMax) return json({error:'ETA_MINIMUM_EXCEEDS_MAXIMUM'},400);

  const [{data:provider},{data:catalog,error:catalogError},{data:existing}]=await Promise.all([
    supabase.from('delivery_provider_profiles').select('user_id,profile_status').eq('user_id',user.id).maybeSingle(),
    supabase.from('delivery_service_catalog').select('code,requires_manual_review').eq('code',serviceCode).eq('active',true).maybeSingle(),
    supabase.from('delivery_provider_service_offers').select('approval_status').eq('provider_user_id',user.id).eq('service_code',serviceCode).maybeSingle()
  ]);
  if(!provider) return json({error:'DELIVERY_PROVIDER_PROFILE_REQUIRED'},404);
  if(provider.profile_status==='SUSPENDED') return json({error:'PROVIDER_SUSPENDED'},403);
  if(catalogError||!catalog) return json({error:'SERVICE_NOT_AVAILABLE'},404);

  const approvalStatus=catalog.requires_manual_review?'PENDING':(existing?.approval_status==='APPROVED'?'APPROVED':'PENDING');
  const {data,error}=await supabase.from('delivery_provider_service_offers').upsert({
    provider_user_id:user.id,service_code:serviceCode,active,fee_currency:feeCurrency,
    starting_fee:startingFee,minimum_fee:minimumFee,maximum_fee:maximumFee,
    eta_min_minutes:etaMin,eta_max_minutes:etaMax,conditions,
    approval_status:approvalStatus,updated_at:new Date().toISOString()
  },{onConflict:'provider_user_id,service_code'}).select('service_code,active,fee_currency,starting_fee,minimum_fee,maximum_fee,eta_min_minutes,eta_max_minutes,conditions,approval_status,updated_at').single();
  if(error) return json({error:'PROVIDER_SERVICE_SAVE_FAILED'},400);
  return json({offer:data,publication:approvalStatus==='APPROVED'&&active?'PUBLIC_IF_PROVIDER_VERIFIED':'PENDING_REVIEW'});
}
