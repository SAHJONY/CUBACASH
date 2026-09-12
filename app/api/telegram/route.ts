import {supabaseServer} from '@/lib/supabase/server';
import {probeTelegram,publishTelegram,telegramStatus} from '@/lib/telegram';

function json(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store'}});}

async function requireOwner(){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {ok:false as const,status:401};
  const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();
  if(profile?.role!=='platform_owner') return {ok:false as const,status:403};
  return {ok:true as const};
}

export async function GET(){
  const access=await requireOwner();
  if(!access.ok) return json({error:access.status===401?'UNAUTHORIZED':'OWNER_REQUIRED'},access.status);
  if(!telegramStatus().configured) return json({ok:true,configured:false,reachable:false,error:'TELEGRAM_NOT_CONFIGURED'});
  return json({ok:true,...await probeTelegram()});
}

export async function POST(req:Request){
  const access=await requireOwner();
  if(!access.ok) return json({error:access.status===401?'UNAUTHORIZED':'OWNER_REQUIRED'},access.status);
  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}
  const text=String(body.text??'').trim();
  if(!text) return json({error:'MESSAGE_REQUIRED'},400);
  const result=await publishTelegram({
    text,
    imageUrl:String(body.imageUrl??'').trim()||undefined,
    buttonUrl:String(body.buttonUrl??'').trim()||undefined,
    buttonText:String(body.buttonText??'').trim()||undefined
  });
  if(!result.ok) return json({ok:false,error:result.error},result.error==='TELEGRAM_NOT_CONFIGURED'?503:502);
  return json({ok:true,messageId:result.messageId,chatId:result.chatId});
}
