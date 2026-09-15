import {supabaseServer} from '@/lib/supabase/server';

export const dynamic='force-dynamic';
function json(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}

async function ownerContext(){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {supabase,user:null,owner:false};
  const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
  return {supabase,user,owner:profile?.role==='platform_owner'};
}

export async function GET(){
  const {supabase,user,owner}=await ownerContext();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  if(!owner) return json({error:'FORBIDDEN'},403);
  const {data,error}=await supabase.from('delivery_provider_service_offers')
    .select('provider_user_id,service_code,active,fee_currency,starting_fee,minimum_fee,maximum_fee,eta_min_minutes,eta_max_minutes,conditions,approval_status,updated_at')
    .in('approval_status',['PENDING','REJECTED','SUSPENDED']).order('updated_at',{ascending:false}).limit(100);
  if(error) return json({error:'REVIEW_QUEUE_UNAVAILABLE'},500);
  const ids=[...new Set((data??[]).map((r:any)=>r.provider_user_id))];
  const {data:providers}=ids.length?await supabase.from('delivery_provider_profiles').select('user_id,public_provider_id,display_name,profile_status,country_code,city').in('user_id',ids):{data:[] as any[]};
  const map=new Map((providers??[]).map((p:any)=>[p.user_id,p]));
  return json({items:(data??[]).map((row:any)=>({...row,provider:map.get(row.provider_user_id)??null}))});
}

export async function PATCH(request:Request){
  const {supabase,user,owner}=await ownerContext();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  if(!owner) return json({error:'FORBIDDEN'},403);
  let body:Record<string,unknown>;try{body=await request.json()}catch{return json({error:'INVALID_JSON'},400)}
  const providerUserId=String(body.providerUserId??'');const serviceCode=String(body.serviceCode??'').toUpperCase();const decision=String(body.decision??'').toUpperCase();const authorizationEvidenceConfirmed=body.authorizationEvidenceConfirmed===true;
  if(!providerUserId||!serviceCode||!['APPROVED','REJECTED','SUSPENDED'].includes(decision)) return json({error:'INVALID_REVIEW_DECISION'},400);
  if(serviceCode==='REMITTANCE_CASH_DELIVERY'&&decision==='APPROVED'&&!authorizationEvidenceConfirmed) return json({error:'REMITTANCE_AUTHORIZATION_EVIDENCE_REQUIRED'},409);
  const {data,error}=await supabase.from('delivery_provider_service_offers').update({approval_status:decision,updated_at:new Date().toISOString()})
    .eq('provider_user_id',providerUserId).eq('service_code',serviceCode)
    .select('provider_user_id,service_code,active,approval_status,updated_at').single();
  if(error) return json({error:'REVIEW_UPDATE_FAILED'},400);
  return json({offer:data});
}
