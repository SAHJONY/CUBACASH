import { supabaseServer } from '@/lib/supabase/server';

export const dynamic='force-dynamic';
export const runtime='nodejs';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function cleanText(value:unknown,max:number){const text=value?String(value).trim():'';return text?text.slice(0,max):null;}

async function authContext(){
  try{
    const supabase=await supabaseServer();
    const {data,error}=await supabase.auth.getUser();
    if(error) return {supabase,user:null,authError:error};
    return {supabase,user:data.user,authError:null};
  }catch(error){return {supabase:null,user:null,authError:error};}
}

export async function GET(){
  const ctx=await authContext();
  if(!ctx.supabase){console.error('MARKETPLACE_AUTH_INIT_FAILED',ctx.authError);return json({error:'AUTH_SERVICE_UNAVAILABLE'},503);}
  if(!ctx.user) return json({error:'UNAUTHENTICATED'},401);
  try{
    const {data,error}=await ctx.supabase.from('marketplace_offers')
      .select('id,business_id,offer_type,title,description,category,quantity,unit,currency,target_price,origin_country,destination_country,status,entrepreneur_friendly,contact_method,payment_preference,visibility,created_at,updated_at')
      .order('created_at',{ascending:false}).limit(100);
    if(error){console.error('MARKETPLACE_QUERY_FAILED',error);return json({error:'MARKETPLACE_QUERY_FAILED'},503);}
    return json({offers:data??[]});
  }catch(error){console.error('MARKETPLACE_GET_UNHANDLED',error);return json({error:'MARKETPLACE_SERVICE_UNAVAILABLE'},503);}
}

export async function POST(request:Request){
  const ctx=await authContext();
  if(!ctx.supabase){console.error('MARKETPLACE_AUTH_INIT_FAILED',ctx.authError);return json({error:'AUTH_SERVICE_UNAVAILABLE'},503);}
  if(!ctx.user) return json({error:'UNAUTHENTICATED'},401);

  let body:Record<string,unknown>;
  try{body=await request.json();}catch{return json({error:'INVALID_JSON'},400);}

  const businessId=String(body.businessId??body.business_id??'').trim();
  const offerType=String(body.offerType??body.offer_type??'').trim().toUpperCase();
  const title=String(body.title??'').trim();
  const currency=String(body.currency??'USD').trim().toUpperCase();
  const visibility=String(body.visibility??'NETWORK').trim().toUpperCase();
  const quantity=body.quantity===undefined||body.quantity===null||body.quantity===''?null:Number(body.quantity);
  const targetPrice=body.targetPrice===undefined&&body.target_price===undefined?null:(body.targetPrice===''||body.target_price===''?null:Number(body.targetPrice??body.target_price));
  const originCountry=cleanText(body.originCountry??body.origin_country,2)?.toUpperCase()??null;
  const destinationCountry=cleanText(body.destinationCountry??body.destination_country,2)?.toUpperCase()??null;

  if(!UUID.test(businessId)||!['BUY','SELL','SERVICE'].includes(offerType)||title.length<3||title.length>180||!/^[A-Z]{3}$/.test(currency)||!['NETWORK','PUBLIC'].includes(visibility)||quantity!==null&&(!Number.isFinite(quantity)||quantity<0)||targetPrice!==null&&(!Number.isFinite(targetPrice)||targetPrice<0)||originCountry&&!/^[A-Z]{2}$/.test(originCountry)||destinationCountry&&!/^[A-Z]{2}$/.test(destinationCountry)) return json({error:'INVALID_MARKETPLACE_OFFER'},400);

  const description=cleanText(body.description,2000);
  const category=cleanText(body.category,120);
  const unit=cleanText(body.unit,40);
  const contactMethod=cleanText(body.contactMethod,160);
  const paymentPreference=cleanText(body.paymentPreference,160);

  try{
    const {data,error}=await ctx.supabase.rpc('create_marketplace_offer',{
      p_business_id:businessId,p_offer_type:offerType,p_title:title,p_description:description,p_category:category,p_quantity:quantity,p_unit:unit,p_currency:currency,p_target_price:targetPrice,p_origin_country:originCountry,p_destination_country:destinationCountry,p_contact_method:contactMethod,p_payment_preference:paymentPreference,p_visibility:visibility
    });
    if(error){console.error('MARKETPLACE_CREATE_FAILED',error);return json({error:'MARKETPLACE_CREATE_FAILED'},400);}
    const offer=Array.isArray(data)?data[0]:data;
    return json({offer,moderationState:'DRAFT',audience:'PRIVATE_SECTOR_AND_ENTREPRENEURS'},201);
  }catch(error){console.error('MARKETPLACE_POST_UNHANDLED',error);return json({error:'MARKETPLACE_SERVICE_UNAVAILABLE'},503);}
}
