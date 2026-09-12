import {supabaseServer} from '@/lib/supabase/server';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

async function ownerContext(){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {supabase,user:null,owner:false};
  const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();
  return {supabase,user,owner:profile?.role==='platform_owner'};
}

export async function GET(){
  const {user,owner}=await ownerContext();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  if(!owner) return json({error:'OWNER_REQUIRED'},403);
  return json({
    ok:true,
    configured:Boolean(process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_CHANNEL_ID),
    botTokenConfigured:Boolean(process.env.TELEGRAM_BOT_TOKEN),
    channelConfigured:Boolean(process.env.TELEGRAM_CHANNEL_ID)
  });
}

export async function POST(req:Request){
  const {user,owner}=await ownerContext();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  if(!owner) return json({error:'OWNER_REQUIRED'},403);

  const token=process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId=process.env.TELEGRAM_CHANNEL_ID?.trim();
  if(!token||!chatId) return json({error:'TELEGRAM_NOT_CONFIGURED'},503);

  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}

  const text=String(body.text??'').trim();
  const imageUrl=String(body.imageUrl??'').trim();
  const disableNotification=Boolean(body.disableNotification);

  if(!text) return json({error:'MESSAGE_REQUIRED'},400);
  if(text.length>4000) return json({error:'MESSAGE_TOO_LONG'},400);
  if(imageUrl&& !/^https:\/\//i.test(imageUrl)) return json({error:'HTTPS_IMAGE_URL_REQUIRED'},400);

  const endpoint=imageUrl?'sendPhoto':'sendMessage';
  const telegramBody=imageUrl
    ? {chat_id:chatId,photo:imageUrl,caption:text,parse_mode:'HTML',disable_notification:disableNotification}
    : {chat_id:chatId,text,parse_mode:'HTML',disable_notification:disableNotification,disable_web_page_preview:false};

  let upstream:Response;
  try{
    upstream=await fetch(`https://api.telegram.org/bot${token}/${endpoint}`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(telegramBody),
      cache:'no-store'
    });
  }catch{
    return json({error:'TELEGRAM_NETWORK_ERROR'},502);
  }

  const result=await upstream.json().catch(()=>null) as {ok?:boolean;description?:string;result?:{message_id?:number}}|null;
  if(!upstream.ok||!result?.ok){
    return json({error:'TELEGRAM_PUBLISH_FAILED',description:result?.description??'Unknown Telegram error'},502);
  }

  return json({ok:true,messageId:result.result?.message_id??null});
}
