import { supabaseServer } from '@/lib/supabase/server';

export const runtime='nodejs';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

function optionalMoney(value:unknown){
  if(value===null||value===undefined||value==='') return null;
  const parsed=Number(value);
  return Number.isFinite(parsed)&&parsed>=0?Math.round(parsed*100)/100:NaN;
}

function optionalNumber(value:unknown,min:number,max:number){
  if(value===null||value===undefined||value==='') return null;
  const parsed=Number(value);
  return Number.isFinite(parsed)&&parsed>=min&&parsed<=max?parsed:NaN;
}

function optionalInteger(value:unknown,min:number,max:number){
  if(value===null||value===undefined||value==='') return null;
  const parsed=Number(value);
  return Number.isInteger(parsed)&&parsed>=min&&parsed<=max?parsed:NaN;
}

function optionalTime(value:unknown){
  if(value===null||value===undefined||value==='') return null;
  const parsed=String(value).trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(parsed)?parsed:NaN;
}

const providerFields='user_id,public_provider_id,display_name,profile_status,public_listing_enabled,pricing_model,fee_currency,base_fee,per_km_fee,minimum_fee,maximum_fee,pricing_notes,pricing_updated_at,public_latitude,public_longitude,location_precision,estimated_eta_min_minutes,estimated_eta_max_minutes,accepting_jobs,supports_express_1_3h,express_1_3h_surcharge,supports_same_day,same_day_surcharge,same_day_cutoff_local';

export async function GET(){
  try{
    const supabase=await supabaseServer();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user) return json({error:'UNAUTHORIZED'},401);

    const {data,error}=await supabase.from('delivery_provider_profiles')
      .select(providerFields)
      .eq('user_id',user.id).maybeSingle();
    if(error) return json({error:'PROVIDER_PROFILE_READ_FAILED'},500);
    if(!data) return json({error:'DELIVERY_PROVIDER_PROFILE_REQUIRED'},404);
    return json({provider:data});
  }catch(error){
    console.error('delivery provider pricing GET failed',error);
    return json({error:'DELIVERY_PRICING_SERVICE_UNAVAILABLE'},503);
  }
}

export async function PATCH(request:Request){
  try{
    const supabase=await supabaseServer();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user) return json({error:'UNAUTHORIZED'},401);

    let body:Record<string,unknown>;
    try{body=await request.json();}catch{return json({error:'INVALID_JSON'},400);}

    const pricingModel=String(body.pricingModel??'QUOTE').trim().toUpperCase();
    const feeCurrency=String(body.feeCurrency??'USD').trim().toUpperCase();
    const baseFee=optionalMoney(body.baseFee);
    const perKmFee=optionalMoney(body.perKmFee);
    const minimumFee=optionalMoney(body.minimumFee);
    const maximumFee=optionalMoney(body.maximumFee);
    const pricingNotes=body.pricingNotes?String(body.pricingNotes).trim():null;
    const publicLatitude=optionalNumber(body.publicLatitude,-90,90);
    const publicLongitude=optionalNumber(body.publicLongitude,-180,180);
    const locationPrecision=String(body.locationPrecision??'CITY').trim().toUpperCase();
    const etaMin=optionalInteger(body.etaMinMinutes,0,10080);
    const etaMax=optionalInteger(body.etaMaxMinutes,0,10080);
    const acceptingJobs=body.acceptingJobs===undefined?true:Boolean(body.acceptingJobs);
    const supportsExpress1_3h=Boolean(body.supportsExpress1_3h);
    const express1_3hSurcharge=optionalMoney(body.express1_3hSurcharge);
    const supportsSameDay=Boolean(body.supportsSameDay);
    const sameDaySurcharge=optionalMoney(body.sameDaySurcharge);
    const sameDayCutoffLocal=optionalTime(body.sameDayCutoffLocal);

    if(!['FLAT','PER_DISTANCE','HYBRID','QUOTE'].includes(pricingModel)) return json({error:'INVALID_PRICING_MODEL'},400);
    if(!/^[A-Z]{3}$/.test(feeCurrency)) return json({error:'INVALID_CURRENCY'},400);
    if([baseFee,perKmFee,minimumFee,maximumFee,express1_3hSurcharge,sameDaySurcharge].some(v=>Number.isNaN(v))) return json({error:'INVALID_FEE'},400);
    if([publicLatitude,publicLongitude,etaMin,etaMax].some(v=>Number.isNaN(v))) return json({error:'INVALID_PUBLIC_SERVICE_LOCATION_OR_ETA'},400);
    if(Number.isNaN(sameDayCutoffLocal)) return json({error:'INVALID_SAME_DAY_CUTOFF'},400);
    if(!['CITY','ZONE','APPROXIMATE'].includes(locationPrecision)) return json({error:'INVALID_LOCATION_PRECISION'},400);
    if((publicLatitude===null)!==(publicLongitude===null)) return json({error:'PUBLIC_LATITUDE_AND_LONGITUDE_REQUIRED_TOGETHER'},400);
    if(etaMin!==null&&etaMax!==null&&etaMin>etaMax) return json({error:'ETA_MINIMUM_EXCEEDS_MAXIMUM'},400);
    if(minimumFee!==null&&maximumFee!==null&&minimumFee>maximumFee) return json({error:'MINIMUM_EXCEEDS_MAXIMUM'},400);
    if(pricingModel==='FLAT'&&baseFee===null) return json({error:'BASE_FEE_REQUIRED_FOR_FLAT_RATE'},400);
    if(pricingModel==='PER_DISTANCE'&&perKmFee===null) return json({error:'PER_KM_FEE_REQUIRED'},400);
    if(pricingModel==='HYBRID'&&(baseFee===null||perKmFee===null)) return json({error:'BASE_AND_PER_KM_FEES_REQUIRED'},400);
    if(pricingNotes&&pricingNotes.length>500) return json({error:'PRICING_NOTES_TOO_LONG'},400);
    if(supportsExpress1_3h&&etaMax!==null&&etaMax>180) return json({error:'EXPRESS_1_3H_REQUIRES_ETA_MAX_180_MINUTES_OR_LESS'},400);

    const {data:existing,error:readError}=await supabase.from('delivery_provider_profiles')
      .select('user_id,profile_status')
      .eq('user_id',user.id).maybeSingle();
    if(readError) return json({error:'PROVIDER_PROFILE_READ_FAILED'},500);
    if(!existing) return json({error:'DELIVERY_PROVIDER_PROFILE_REQUIRED'},404);
    if(existing.profile_status==='SUSPENDED') return json({error:'PROVIDER_SUSPENDED'},403);

    const {data,error}=await supabase.from('delivery_provider_profiles').update({
      pricing_model:pricingModel,
      fee_currency:feeCurrency,
      base_fee:baseFee,
      per_km_fee:perKmFee,
      minimum_fee:minimumFee,
      maximum_fee:maximumFee,
      pricing_notes:pricingNotes?.slice(0,500)??null,
      pricing_updated_at:new Date().toISOString(),
      public_latitude:publicLatitude,
      public_longitude:publicLongitude,
      location_precision:locationPrecision,
      estimated_eta_min_minutes:etaMin,
      estimated_eta_max_minutes:etaMax,
      accepting_jobs:acceptingJobs,
      supports_express_1_3h:supportsExpress1_3h,
      express_1_3h_surcharge:express1_3hSurcharge,
      supports_same_day:supportsSameDay,
      same_day_surcharge:sameDaySurcharge,
      same_day_cutoff_local:sameDayCutoffLocal
    }).eq('user_id',user.id)
      .select(providerFields)
      .single();

    if(error) return json({error:'DELIVERY_PRICING_UPDATE_FAILED'},400);
    return json({provider:data});
  }catch(error){
    console.error('delivery provider pricing PATCH failed',error);
    return json({error:'DELIVERY_PRICING_SERVICE_UNAVAILABLE'},503);
  }
}
