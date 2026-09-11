import {supabaseServer} from '@/lib/supabase/server';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'public, max-age=30, s-maxage=60','X-Content-Type-Options':'nosniff'}});
}

export async function GET(request:Request){
  try{
    const url=new URL(request.url);
    const type=(url.searchParams.get('type')||'').trim().toUpperCase();
    const category=(url.searchParams.get('category')||'').trim();
    const country=(url.searchParams.get('country')||'').trim().toUpperCase();
    const q=(url.searchParams.get('q')||'').trim().slice(0,80);
    const limit=Math.min(Math.max(Number(url.searchParams.get('limit')||24),1),60);

    if(type&&!['BUY','SELL','SERVICE'].includes(type)) return json({error:'INVALID_TYPE'},400);
    if(country&&!/^[A-Z]{2}$/.test(country)) return json({error:'INVALID_COUNTRY'},400);

    const supabase=await supabaseServer();
    let query=supabase.from('marketplace_public_directory')
      .select('offer_id,offer_type,title,description,category,quantity,unit,currency,target_price,origin_country,destination_country,business_display_name,entrepreneur_friendly,verified_business,published_at,updated_at')
      .order('verified_business',{ascending:false})
      .order('updated_at',{ascending:false})
      .limit(limit);

    if(type) query=query.eq('offer_type',type);
    if(category) query=query.ilike('category',`%${category.replace(/[%_]/g,'')}%`);
    if(country) query=query.or(`origin_country.eq.${country},destination_country.eq.${country}`);
    if(q){
      const safe=q.replace(/[%_,()]/g,' ');
      query=query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%,category.ilike.%${safe}%,business_display_name.ilike.%${safe}%`);
    }

    const {data,error}=await query;
    if(error){
      console.error('MARKETPLACE_PUBLIC_QUERY_FAILED',error);
      return json({error:'MARKETPLACE_DIRECTORY_UNAVAILABLE'},503);
    }
    return json({offers:data??[],count:data?.length??0});
  }catch(error){
    console.error('MARKETPLACE_PUBLIC_GET_FAILED',error);
    return json({error:'MARKETPLACE_DIRECTORY_UNAVAILABLE'},503);
  }
}
