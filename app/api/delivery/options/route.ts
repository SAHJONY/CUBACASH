import {supabaseServer} from '@/lib/supabase/server';

export const dynamic='force-dynamic';
export const runtime='nodejs';

function json(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DELIVERY_SPEEDS=['XPRESS_1H','EXPRESS_1_3H','SAME_DAY','FLEXIBLE'] as const;

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
  const surcharge=
    speed==='XPRESS_1H'?row.xpress_1h_surcharge:
    speed==='EXPRESS_1_3H'?row.express_1_3h_surcharge:
    speed==='SAME_DAY'?row.same_day_surcharge:null;
  if(base==null&&surcharge==null) return null;
  return (base??0)+Number(surcharge??0);
}

function supportsSpeed(row:any,speed:string){
  if(speed==='XPRESS_1H') return row.supports_xpress_1h===true;
  if(speed==='EXPRESS_1_3H') return row.supports_express_1_3h===true||row.supports_xpress_1h===true;
  if(speed==='SAME_DAY') return row.supports_same_day===true||row.supports_express_1_3h===true||row.supports_xpress_1h===true;
  return true;
}

function normalizedLowerIsBetter(value:number|null,min:number|null,max:number|null){
  if(value==null||min==null||max==null) return 0.5;
  if(max<=min) return 1;
  return 1-((value-min)/(max-min));
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
  if(!DELIVERY_SPEEDS.includes(speed as any)) return json({error:'INVALID_DELIVERY_SPEED'},400);

  const {data,error}=await supabase.from('delivery_provider_public_directory')
    .select('public_provider_id,display_name,city,region,country_code,service_zones,service_area,transport_mode,pricing_model,fee_currency,base_fee,per_km_fee,minimum_fee,maximum_fee,pricing_notes,estimated_eta_min_minutes,estimated_eta_max_minutes,accepting_jobs,verified,updated_at,supports_xpress_1h,xpress_1h_surcharge,supports_express_1_3h,express_1_3h_surcharge,supports_same_day,same_day_surcharge,same_day_cutoff_local')
    .eq('country_code',country).eq('verified',true).eq('accepting_jobs',true).limit(36);
  if(error) return json({error:'DELIVERY_OPTIONS_UNAVAILABLE'},503);

  const eligible=(data??[]).filter((row:any)=>supportsSpeed(row,speed));

  const prepared=eligible.map((row:any)=>{
    const zones=[...(Array.isArray(row.service_zones)?row.service_zones:[]),row.city,row.region,row.service_area].filter(Boolean).map((v:string)=>String(v).toLowerCase());
    const zoneMatch=!zone||zones.some((v:string)=>v.includes(zone)||zone.includes(v));
    return {...row,zone_match:zoneMatch,starting_fee:startFee(row),effective_starting_fee:speedFee(row,speed)};
  });

  const feeValues=prepared.filter((r:any)=>r.effective_starting_fee!=null).map((r:any)=>Number(r.effective_starting_fee));
  const etaValues=prepared.filter((r:any)=>r.estimated_eta_min_minutes!=null).map((r:any)=>Number(r.estimated_eta_min_minutes));
  const minFee=feeValues.length?Math.min(...feeValues):null;
  const maxFee=feeValues.length?Math.max(...feeValues):null;
  const minEta=etaValues.length?Math.min(...etaValues):null;
  const maxEta=etaValues.length?Math.max(...etaValues):null;

  const ranked=prepared.map((row:any)=>{
    const feeScore=normalizedLowerIsBetter(row.effective_starting_fee==null?null:Number(row.effective_starting_fee),minFee,maxFee);
    const etaScore=normalizedLowerIsBetter(row.estimated_eta_min_minutes==null?null:Number(row.estimated_eta_min_minutes),minEta,maxEta);
    const zoneScore=row.zone_match?1:0;
    const routingScore=Math.round((zoneScore*0.45+etaScore*0.30+feeScore*0.25)*100);
    return {...row,routing_score:routingScore,routing_factors:{zone_match:zoneScore,eta_value:etaScore,price_value:feeScore}};
  }).sort((a:any,b:any)=>{
    if(a.zone_match!==b.zone_match) return a.zone_match?-1:1;
    return (b.routing_score-a.routing_score)||((a.effective_starting_fee??999999)-(b.effective_starting_fee??999999))||((a.estimated_eta_min_minutes??99999)-(b.estimated_eta_min_minutes??99999));
  });

  const cheapest=minFee;
  const fastest=minEta;
  const bestValue=ranked.length?Math.max(...ranked.map((r:any)=>r.routing_score)):null;

  const options=ranked.slice(0,8).map((row:any,index:number)=>({
    ...row,
    delivery_speed:speed,
    badges:[
      speed==='XPRESS_1H'&&row.supports_xpress_1h?'XPRESS_1_HOUR':null,
      speed==='EXPRESS_1_3H'&&supportsSpeed(row,'EXPRESS_1_3H')?'DELIVERY_1_3_HOURS':null,
      speed==='SAME_DAY'&&supportsSpeed(row,'SAME_DAY')?'SAME_DAY':null,
      bestValue!==null&&row.routing_score===bestValue?'BEST_VALUE':null,
      index===0?'RECOMMENDED':null,
      cheapest!==null&&row.effective_starting_fee===cheapest?'LOWEST_STARTING_FEE':null,
      fastest!==null&&row.estimated_eta_min_minutes===fastest?'FASTEST_ETA':null
    ].filter(Boolean)
  }));
  return json({
    options,
    match:{country,zone:zone||null,speed},
    ranking:{principle:'LOCAL_PROVIDERS_COMPETE_FOR_THE_CUSTOMER',weights:{zone_match:0.45,eta:0.30,price:0.25},note:'Ranking compares verified, accepting providers using posted coverage, ETA and starting price. It does not override compliance, provider acceptance or final quote.'},
    selectionMeaning:'CUSTOMER_REQUEST_ONLY',
    timingNotice:'Delivery times are provider-posted estimates and remain subject to provider acceptance, route conditions and required transaction controls.'
  });
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
  if(!DELIVERY_SPEEDS.includes(speed as any)) return json({error:'INVALID_DELIVERY_SPEED'},400);

  const {data:intent}=await supabase.from('remittance_intents').select('id,owner_user_id').eq('id',remittanceIntentId).eq('owner_user_id',user.id).single();
  if(!intent) return json({error:'TRANSACTION_NOT_FOUND'},404);

  const {data:provider,error:providerError}=await supabase.from('delivery_provider_public_directory')
    .select('public_provider_id,display_name,city,region,country_code,service_zones,service_area,transport_mode,pricing_model,fee_currency,base_fee,per_km_fee,minimum_fee,maximum_fee,pricing_notes,estimated_eta_min_minutes,estimated_eta_max_minutes,accepting_jobs,verified,updated_at,supports_xpress_1h,xpress_1h_surcharge,supports_express_1_3h,express_1_3h_surcharge,supports_same_day,same_day_surcharge,same_day_cutoff_local')
    .eq('public_provider_id',publicProviderId).eq('verified',true).eq('accepting_jobs',true).single();
  if(providerError||!provider) return json({error:'PROVIDER_NOT_AVAILABLE'},409);
  if(!supportsSpeed(provider,speed)) return json({error:'PROVIDER_DOES_NOT_OFFER_SELECTED_SPEED'},409);

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
