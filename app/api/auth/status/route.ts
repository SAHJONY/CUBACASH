import { supabaseServer } from '@/lib/supabase/server';

export async function GET(){
  const supabase=await supabaseServer();
  const {data:{user},error}=await supabase.auth.getUser();
  if(error||!user){
    return Response.json({authenticated:false},{status:401,headers:{'Cache-Control':'no-store'}});
  }
  const {data:profile}=await supabase.from('profiles').select('display_name,preferred_locale,role').eq('id',user.id).maybeSingle();
  return Response.json({authenticated:true,user:{id:user.id,email:user.email??null},profile:profile??null},{headers:{'Cache-Control':'no-store'}});
}
