import {supabaseServer} from '@/lib/supabase/server';

export const dynamic='force-dynamic';
export const runtime='nodejs';

function json(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function startFee(row:any){
  const base=row.base_fee==null?null:Number(row.base_fee);
  const min=row.minimum_fee==null?null:Number(row.minimum_fee);
  if(base==null&&min==null) return null;
  if(base==null) return min;
  if(min==null) return base;
  return Math.max(base,min);
}

function speedFee(row:any,speed:string){
  const base=startFee(row);
  const surcharge=speed==='EXPRESS_1_3H'?row.express_1_3h_surcharge:speed==='SAME_DAY'?row.same_day_surcharge:null;
  if(base==null&&surcharge==null) return null;
  return (base??0)+Number(surcharge??0);
}

export async function GET(request:Request){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);

  const url=new URL(request.url);
  const country=String(url.searchParams.get('country')||'CU').trim().toUpperCase();
  const zone=String(url.searchParams.get('zone')||'').trim().toLowerCase();
  const speed=String(url.searchParams.get('speed')||'FLEXIBLE').trim().toUpperCase();
  if(!/^[A-Z]{2}$/.test(country)) return json({error:'INVALID_COUNTRY'},400);
  if(!['EXPRESS_1_3H','SAME_DAY','FLEXIBLE'].includes(speed)) return json({error:'INVALID_DELIVERY_SPEED'},400);

  const {data,error}=await supabase.from('delivery_provider_public_directory')
    .select('public_provider_id,display_name,city,region,country_code,service_zones,service_area,transport_mode,pricing_model,fee_currency,base_fee,per_km_fee,minimum_fee,maximum_fee,pricing_notes,estimated_eta_min_minutes,estimated_eta_max_minutes,accepting_jobs,verified,updated_at,supports_express_1_3h,express_1_3h_surcharge,supports_same_day,same_day_surcharge,same_day_cutoff_local')
    .eq('country_code',country).eq('verified',true).eq('accepting_jobs',true).limit(36);
  if(error) return json({error:'DELIVERY_OPTIONS_UNAVAILABLE'},503);

  const eligible=(data??[]).filter((row:any)=>{
    if(speed==='EXPRESS_1_3H') return row.supports_express_1_3h===true;
    if(speed==='SAME_DAY') return row.supports_same_day===true||row.supports_express_1_3h===true;
    return true;
  });

  const rows=eligible.map((row:any)=>{
    const zones=[...(Array.isArray(row.service_zones)?row.service_zones:[]),row.city,row.region,row.service_area].filter(Boolean).map((v:string)=>String(v).toLowerCase());
    const zoneMatch=!zone||zones.some((v:string)=>v.includes(zone)||zone.includes(v));
    return {...row,zone_match:zoneMatch,starting_fee:startFee(row),effective_starting_fee:speedFee(row,speed)};
  }).sort((a:any,b:any)=>{
    if(a.zone_match!==b.zone_match) return a.zone_match?-1:1;
    if(speed==='EXPRESS_1_3H'&&a.supports_express_1_3h!==b.supports_express_1_3h) return a.supports_express_1_3h?-1:1;
    if(speed==='SAME_DAY'&&a.supports_same_day!==b.supports_same_day) return a.supports_same_day?-1:1;
    const aEta=a.estimated_eta_min_minutes??99999,bEta=b.estimated_eta_min_minutes??99999;
    const aFee=a.effective_starting_fee??999999,bFee=b.effective_starting_fee??999999;
    return (aEta-bEta)||(aFee-bFee);
  });

  const fees=rows.filter((r:any)=>r.effective_starting_fee!=null).map((r:any)=>r.effective_starting_fee);
  const etas=rows.filter((r:any)=>r.estimated_eta_min_minutes!=null).map((r:any)=>r.estimated_eta_min_minutes);
  const cheapest=fees.length?Math.min(...fees):null;
  const fastest=etas.length?Math.min(...etas):null;

  const options=rows.slice(0,8).map((row:any,index:number)=>({
    ...row,
    delivery_speed:speed,
    badges:[
      speed==='EXPRESS_1_3H'&&row.supports_express_1_3h?'DELIVERY_1_3_HOURS':null,
      speed==='SAME_DAY'&&(row.supports_same_day||row.supports_express_1_3h)?'SAME_DAY':null,
      index===0?'RECOMMENDED':null,
      cheapest!==null&&row.effective_starting_fee===cheapest?'LOWEST_STARTING_FEE':null,
      fastest!==null&&row.estimated_eta_min_minutes===fastest?'FASTEST_ETA':null
    ].filter(Boolean)
  }));
  return json({options,match:{country,zone:zone||null,speed},selectionMeaning:'CUSTOMER_REQUEST_ONLY',timingNotice:'Delivery times are provider-posted estimates and remain subject to provider acceptance, route conditions and required transaction controls.'});
}

export async function POST(request:Request){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  let body:Record<string,unknown>;
  try{body=await request.json()}catch{return json({error:'INVALID_JSON'},400)}
  const remittanceIntentId=String(body.remittanceIntentId||'');
  const publicProviderId=String(body.publicProviderId||'').trim();
  const speed=String(body.deliverySpeed||'FLEXIBLE').trim().toUpperCase();
  if(!UUID.test(remittanceIntentId)||publicProviderId.length<3) return json({error:'INVALID_SELECTION'},400);
  if(!['EXPRESS_1_3H','SAME_DAY','FLEXIBLE'].includes(speed)) return json({error:'INVALID_DELIVERY_SPEED'},400);

  const {data:intent}=await supabase.from('remittance_intents').select('id,owner_user_id').eq('id',remittanceIntentId).eq('owner_user_id',user.id).single();
  if(!intent) return json({error:'TRANSACTION_NOT_FOUND'},404);

  const {data:provider,error:providerError}=await supabase.from('delivery_provider_public_directory')
    .select('public_provider_id,display_name,city,region,country_code,service_zones,service_area,transport_mode,pricing_model,fee_currency,base_fee,per_km_fee,minimum_fee,maximum_fee,pricing_notes,estimated_eta_min_minutes,estimated_eta_max_minutes,accepting_jobs,verified,updated_at,supports_express_1_3h,express_1_3h_surcharge,supports_same_day,same_day_surcharge,same_day_cutoff_local')
    .eq('public_provider_id',publicProviderId).eq('verified',true).eq('accepting_jobs',true).single();
  if(providerError||!provider) return json({error:'PROVIDER_NOT_AVAILABLE'},409);
  if(speed==='EXPRESS_1_3H'&&!provider.supports_express_1_3h) return json({error:'PROVIDER_DOES_NOT_OFFER_1_3_HOUR_DELIVERY'},409);
  if(speed==='SAME_DAY'&&!provider.supports_same_day&&!provider.supports_express_1_3h) return json({error:'PROVIDER_DOES_NOT_OFFER_SAME_DAY_DELIVERY'},409);

  const snapshot={...provider,delivery_speed:speed,effective_starting_fee:speedFee(provider,speed)};
  const {data,error}=await supabase.from('remittance_delivery_selections').upsert({
    remittance_intent_id:remittanceIntentId,
    owner_user_id:user.id,
    public_provider_id:provider.public_provider_id,
    provider_display_name:provider.display_name,
    provider_snapshot:snapshot,
    selection_status:'REQUESTED',
    updated_at:new Date().toISOString()
  },{onConflict:'remittance_intent_id'}).select('remittance_intent_id,public_provider_id,provider_display_name,selection_status,selected_at,updated_at').single();
  if(error) return json({error:'DELIVERY_SELECTION_SAVE_FAILED'},500);
  return json({selection:data,assignment:'PENDING_PROVIDER_CONFIRMATION',deliverySpeed:speed},201);
}
