import { supabaseServer } from '@/lib/supabase/server';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req:Request){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  const url=new URL(req.url);
  const businessId=url.searchParams.get('businessId')??'';
  if(!UUID.test(businessId)) return json({error:'INVALID_BUSINESS_ID'},400);

  const {data,error}=await supabase.from('community_endorsements')
    .select('vote')
    .eq('target_business_id',businessId);
  if(error) return json({error:'ENDORSEMENT_READ_FAILED'},500);
  const rows=data??[];
  return json({businessId,trust:rows.filter((r)=>r.vote==='TRUST').length,flags:rows.filter((r)=>r.vote==='FLAG').length,total:rows.length});
}

export async function POST(req:Request){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}

  const targetBusinessId=String(body.targetBusinessId??'').trim();
  const vote=String(body.vote??'').trim().toUpperCase();
  const rationale=body.rationale?String(body.rationale).trim().slice(0,300):null;
  if(!UUID.test(targetBusinessId)||!['TRUST','FLAG'].includes(vote)) return json({error:'INVALID_ENDORSEMENT'},400);

  const {data,error}=await supabase.from('community_endorsements').upsert({
    target_business_id:targetBusinessId,
    endorser_user_id:user.id,
    vote,
    rationale,
    updated_at:new Date().toISOString()
  },{onConflict:'target_business_id,endorser_user_id'}).select('id,target_business_id,vote,created_at,updated_at').single();
  if(error) return json({error:'ENDORSEMENT_WRITE_FAILED'},500);
  return json({endorsement:data},201);
}
