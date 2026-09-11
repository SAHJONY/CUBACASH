import {supabaseServer} from '@/lib/supabase/server';

export const runtime='nodejs';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

export async function GET(){
  try{
    const supabase=await supabaseServer();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user) return json({error:'UNAUTHORIZED'},401);

    const [{data:businesses,error:businessError},{data:offers,error:offerError}]=await Promise.all([
      supabase.from('businesses')
        .select('id,legal_name,trade_name,country_code,business_type,kyb_status,sanctions_status,risk_band')
        .eq('owner_user_id',user.id)
        .order('created_at',{ascending:false}),
      supabase.from('marketplace_offers')
        .select('id,business_id,offer_type,title,description,category,quantity,unit,currency,target_price,origin_country,destination_country,status,visibility,created_at,updated_at')
        .order('created_at',{ascending:false})
        .limit(100)
    ]);

    if(businessError||offerError) return json({error:'MARKETPLACE_CONTEXT_UNAVAILABLE'},503);
    return json({businesses:businesses??[],offers:offers??[]});
  }catch(error){
    console.error('MARKETPLACE_CONTEXT_FAILED',error);
    return json({error:'MARKETPLACE_CONTEXT_UNAVAILABLE'},503);
  }
}
