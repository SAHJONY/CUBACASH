type TelegramResult={ok:boolean;messageId?:number;error?:string};

function cfg(){
  const token=process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId=process.env.TELEGRAM_CHANNEL_ID?.trim();
  return {token,chatId,configured:Boolean(token&&chatId)};
}

export function telegramStatus(){
  const {configured}=cfg();
  return {configured};
}

export async function publishTelegram(input:{text:string;imageUrl?:string}):Promise<TelegramResult>{
  const {token,chatId,configured}=cfg();
  if(!configured||!token||!chatId) return {ok:false,error:'TELEGRAM_NOT_CONFIGURED'};
  const text=input.text.trim();
  if(!text) return {ok:false,error:'EMPTY_MESSAGE'};
  if(text.length>4096) return {ok:false,error:'MESSAGE_TOO_LONG'};

  const imageUrl=input.imageUrl?.trim();
  if(imageUrl&& !/^https:\/\//i.test(imageUrl)) return {ok:false,error:'HTTPS_IMAGE_REQUIRED'};

  const endpoint=imageUrl?'sendPhoto':'sendMessage';
  const body=imageUrl
    ? {chat_id:chatId,photo:imageUrl,caption:text.slice(0,1024),parse_mode:'HTML'}
    : {chat_id:chatId,text,parse_mode:'HTML',disable_web_page_preview:false};

  try{
    const res=await fetch(`https://api.telegram.org/bot${token}/${endpoint}`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'
    });
    const data=await res.json() as {ok?:boolean;description?:string;result?:{message_id?:number}};
    if(!res.ok||!data.ok) return {ok:false,error:data.description||`TELEGRAM_HTTP_${res.status}`};
    return {ok:true,messageId:data.result?.message_id};
  }catch{
    return {ok:false,error:'TELEGRAM_REQUEST_FAILED'};
  }
}
