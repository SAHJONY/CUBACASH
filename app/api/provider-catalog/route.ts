import {supabaseServer} from '@/lib/supabase/server';

export const dynamic='force-dynamic';
export const runtime='nodejs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PLAN_LIMITS:Record<string,number>={FOUNDING_100:500,PROVIDER_PRO:100,PROVIDER_BUSINESS:500,PROVIDER_EXPORTER:2000};

function json(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
function text(v:unknown,max:number){const s=String(v??'').trim();return s?s.slice(0,max):null}
function num(v:unknown){if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n:NaN}
async function ctx(){const supabase=await supabaseServer();const {data:{user}}=await supabase.auth.getUser();return {supabase,user}}

async function entitlement(supabase:Awaited<ReturnType<typeof supabaseServer>>,userId:string){
  const [{data:membership},{data:billing},{data:profile},{count}]=await Promise.all([
    supabase.from('provider_memberships').select('status,identity_status,plan_code,founding_slot,free_until').eq('user_id',userId).maybeSingle(),
    supabase.from('provider_billing_accounts').select('active_plan_code,subscription_status,current_period_end').eq('user_id',userId).maybeSingle(),
    supabase.from('profiles').select('role').eq('id',userId).maybeSingle(),
    supabase.from('provider_catalog_items').select('id',{count:'exact',head:true}).eq('provider_user_id',userId)
  ]);
  if(profile?.role==='platform_owner') return {active:true,plan:'OWNER',limit:Number.MAX_SAFE_INTEGER,count:count??0};
  const verified=membership?.status==='ACTIVE'&&membership?.identity_status==='VERIFIED';
  const foundingActive=Boolean(membership?.founding_slot&&membership.free_until&&new Date(membership.free_until).getTime()>Date.now());
  const subscriptionActive=Boolean(billing&&['ACTIVE','TRIALING'].includes(billing.subscription_status)&&(!billing.current_period_end||new Date(billing.current_period_end).getTime()>Date.now()));
  const plan=foundingActive?'FOUNDING_100':subscriptionActive?String(billing?.active_plan_code??''):'';
  return {active:verified&&(foundingActive||subscriptionActive),plan,limit:PLAN_LIMITS[plan]??0,count:count??0};
}

export async function GET(){
  const {supabase,user}=await ctx();if(!user)return json({error:'UNAUTHORIZED'},401);
  const [{data:provider},{data:businesses},{data:items,error},access]=await Promise.all([
    supabase.from('delivery_provider_profiles').select('user_id,business_id,display_name,profile_status').eq('user_id',user.id).maybeSingle(),
    supabase.from('businesses').select('id,legal_name,trade_name,country_code,kyb_status').eq('owner_user_id',user.id),
    supabase.from('provider_catalog_items').select('*').eq('provider_user_id',user.id).order('updated_at',{ascending:false}),
    entitlement(supabase,user.id)
  ]);
  if(error)return json({error:'CATALOG_READ_FAILED'},500);
  return json({provider,businesses:businesses??[],items:items??[],entitlement:access});
}

export async function POST(request:Request){
  const {supabase,user}=await ctx();if(!user)return json({error:'UNAUTHORIZED'},401);
  let body:Record<string,unknown>;try{body=await request.json()}catch{return json({error:'INVALID_JSON'},400)}
  const businessId=String(body.businessId??''),itemType=String(body.itemType??'').toUpperCase(),title=String(body.title??'').trim(),category=String(body.category??'').trim(),currency=String(body.currency??'USD').trim().toUpperCase(),price=num(body.price),stock=num(body.stockQuantity);
  if(!UUID.test(businessId)||!['PRODUCT','SERVICE'].includes(itemType)||title.length<3||title.length>180||category.length<2||category.length>120||!/^[A-Z]{3}$/.test(currency)||Number.isNaN(price)||Number.isNaN(stock))return json({error:'INVALID_CATALOG_ITEM'},400);
  const [{data:owned},{data:provider},access]=await Promise.all([
    supabase.from('businesses').select('id').eq('id',businessId).eq('owner_user_id',user.id).maybeSingle(),
    supabase.from('delivery_provider_profiles').select('user_id').eq('user_id',user.id).maybeSingle(),
    entitlement(supabase,user.id)
  ]);
  if(!owned||!provider)return json({error:'PROVIDER_BUSINESS_REQUIRED'},403);
  if(!access.active)return json({error:'ACTIVE_PLAN_REQUIRED'},402);
  if(access.count>=access.limit)return json({error:'CATALOG_PLAN_LIMIT',limit:access.limit,plan:access.plan},409);
  const {data,error}=await supabase.from('provider_catalog_items').insert({provider_user_id:user.id,business_id:businessId,item_type:itemType,title,description:text(body.description,2000),category,currency,price,unit:text(body.unit,40),available:body.available!==false,stock_quantity:stock,service_area:text(body.serviceArea,240),image_url:text(body.imageUrl,500),conditions:text(body.conditions,1000),review_status:'PENDING'}).select('*').single();
  if(error)return json({error:'CATALOG_CREATE_FAILED'},400);
  return json({item:data,publication:'PENDING_REVIEW',entitlement:{plan:access.plan,remaining:access.limit-access.count-1}},201);
}

export async function PATCH(request:Request){
  const {supabase,user}=await ctx();if(!user)return json({error:'UNAUTHORIZED'},401);
  let body:Record<string,unknown>;try{body=await request.json()}catch{return json({error:'INVALID_JSON'},400)}
  const id=String(body.id??'');if(!UUID.test(id))return json({error:'INVALID_ITEM_ID'},400);
  const price=num(body.price),stock=num(body.stockQuantity);if(Number.isNaN(price)||Number.isNaN(stock))return json({error:'INVALID_PRICE_OR_STOCK'},400);
  const access=await entitlement(supabase,user.id);if(!access.active)return json({error:'ACTIVE_PLAN_REQUIRED'},402);
  const patch:any={updated_at:new Date().toISOString(),review_status:'PENDING'};
  const fields:Array<[string,string|null]>=[['title',text(body.title,180)],['description',text(body.description,2000)],['category',text(body.category,120)],['unit',text(body.unit,40)],['service_area',text(body.serviceArea,240)],['image_url',text(body.imageUrl,500)],['conditions',text(body.conditions,1000)]];
  for(const [key,value] of fields)if(value!==null)patch[key]=value;
  if(body.currency)patch.currency=String(body.currency).toUpperCase();if(body.price!==undefined)patch.price=price;if(body.stockQuantity!==undefined)patch.stock_quantity=stock;if(body.available!==undefined)patch.available=Boolean(body.available);
  const {data,error}=await supabase.from('provider_catalog_items').update(patch).eq('id',id).eq('provider_user_id',user.id).select('*').single();
  if(error)return json({error:'CATALOG_UPDATE_FAILED'},400);return json({item:data,publication:'PENDING_REVIEW'});
}

export async function DELETE(request:Request){
  const {supabase,user}=await ctx();if(!user)return json({error:'UNAUTHORIZED'},401);
  let body:any;try{body=await request.json()}catch{return json({error:'INVALID_JSON'},400)}
  const id=String(body.id??'');if(!UUID.test(id))return json({error:'INVALID_ITEM_ID'},400);
  const {error}=await supabase.from('provider_catalog_items').delete().eq('id',id).eq('provider_user_id',user.id);
  if(error)return json({error:'CATALOG_DELETE_FAILED'},400);return json({deleted:true});
}
