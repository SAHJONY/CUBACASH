import { supabaseServer } from '@/lib/supabase/server';

export async function GET(){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return Response.json({error:'UNAUTHENTICATED'},{status:401});
  const {data,error}=await supabase.from('marketplace_offers').select('id,business_id,offer_type,title,description,category,quantity,unit,currency,target_price,origin_country,destination_country,status,created_at').order('created_at',{ascending:false}).limit(100);
  if(error) return Response.json({error:'MARKETPLACE_QUERY_FAILED'},{status:500});
  return Response.json({offers:data??[]});
}

export async function POST(request:Request){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return Response.json({error:'UNAUTHENTICATED'},{status:401});
  let body:Record<string,unknown>;
  try{body=await request.json();}catch{return Response.json({error:'INVALID_JSON'},{status:400});}
  if(!body.business_id||!body.offer_type||!body.title) return Response.json({error:'BUSINESS_OFFER_TYPE_TITLE_REQUIRED'},{status:400});
  const allowed=['business_id','offer_type','title','description','category','quantity','unit','currency','target_price','origin_country','destination_country','status'];
  const payload=Object.fromEntries(Object.entries(body).filter(([k])=>allowed.includes(k)));
  const {data,error}=await supabase.from('marketplace_offers').insert(payload).select().single();
  if(error) return Response.json({error:'MARKETPLACE_CREATE_FAILED'},{status:400});
  return Response.json({offer:data},{status:201});
}
