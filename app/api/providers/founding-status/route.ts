import {supabaseServer} from '@/lib/supabase/server';

export const dynamic='force-dynamic';

export async function GET(){
  try{
    const supabase=await supabaseServer();
    const {data,error}=await supabase.from('founding_supplier_program_public_status').select('slots_total,slots_awarded').eq('program_key','FOUNDING_100').maybeSingle();
    if(error) return Response.json({available:false},{status:503,headers:{'Cache-Control':'no-store'}});
    const total=Number(data?.slots_total??100),awarded=Number(data?.slots_awarded??0),remaining=Math.max(total-awarded,0);
    return Response.json({
      available:true,
      total,awarded,remaining,open:remaining>0
    },{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }catch{
    return Response.json({available:false},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
