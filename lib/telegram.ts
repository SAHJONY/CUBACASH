type TelegramResult={ok:boolean;messageId?:number;chatId?:string;error?:string};
type TelegramProbe={configured:boolean;reachable:boolean;botUsername?:string;chatTitle?:string;chatUsername?:string;chatType?:string;error?:string};

function cfg(){
  const token=process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId=process.env.TELEGRAM_CHANNEL_ID?.trim();
  return {token,chatId,configured:Boolean(token&&chatId)};
}

async function telegramCall<T>(method:string,payload?:Record<string,unknown>):Promise<{ok:boolean;result?:T;error?:string}>{
  const {token,configured}=cfg();
  if(!configured||!token) return {ok:false,error:'TELEGRAM_NOT_CONFIGURED'};
  try{
    const res=await fetch(`https://api.telegram.org/bot${token}/${method}`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload??{}),
      cache:'no-store'
    });
    const data=await res.json() as {ok?:boolean;description?:string;result?:T};
    if(!res.ok||!data.ok) return {ok:false,error:data.description||`TELEGRAM_HTTP_${res.status}`};
    return {ok:true,result:data.result};
  }catch{
    return {ok:false,error:'TELEGRAM_REQUEST_FAILED'};
  }
}

export function telegramStatus(){
  const {configured}=cfg();
  return {configured};
}

export async function probeTelegram():Promise<TelegramProbe>{
  const {chatId,configured}=cfg();
  if(!configured||!chatId) return {configured:false,reachable:false,error:'TELEGRAM_NOT_CONFIGURED'};

  const [me,chat]=await Promise.all([
    telegramCall<{username?:string}>('getMe'),
    telegramCall<{title?:string;username?:string;type?:string;id?:number|string}>('getChat',{chat_id:chatId})
  ]);

  if(!me.ok) return {configured:true,reachable:false,error:me.error};
  if(!chat.ok) return {configured:true,reachable:false,botUsername:me.result?.username,error:chat.error};

  return {
    configured:true,
    reachable:true,
    botUsername:me.result?.username,
    chatTitle:chat.result?.title,
    chatUsername:chat.result?.username,
    chatType:chat.result?.type
  };
}

export async function publishTelegram(input:{text:string;imageUrl?:string;buttonUrl?:string;buttonText?:string}):Promise<TelegramResult>{
  const {chatId,configured}=cfg();
  if(!configured||!chatId) return {ok:false,error:'TELEGRAM_NOT_CONFIGURED'};

  const text=input.text.trim();
  if(!text) return {ok:false,error:'EMPTY_MESSAGE'};
  if(text.length>4096) return {ok:false,error:'MESSAGE_TOO_LONG'};

  const imageUrl=input.imageUrl?.trim();
  const buttonUrl=input.buttonUrl?.trim();
  const buttonText=input.buttonText?.trim()||'Abrir MY CUBA CASH';
  if(imageUrl&&!/^https:\/\//i.test(imageUrl)) return {ok:false,error:'HTTPS_IMAGE_REQUIRED'};
  if(buttonUrl&&!/^https:\/\//i.test(buttonUrl)) return {ok:false,error:'HTTPS_BUTTON_URL_REQUIRED'};
  if(imageUrl&&text.length>1024) return {ok:false,error:'PHOTO_CAPTION_TOO_LONG'};

  const replyMarkup=buttonUrl?{inline_keyboard:[[{text:buttonText.slice(0,64),url:buttonUrl}]]}:undefined;
  const endpoint=imageUrl?'sendPhoto':'sendMessage';
  const body=imageUrl
    ? {chat_id:chatId,photo:imageUrl,caption:text,reply_markup:replyMarkup}
    : {chat_id:chatId,text,disable_web_page_preview:false,reply_markup:replyMarkup};

  const sent=await telegramCall<{message_id?:number;chat?:{id?:number|string}}>(endpoint,body);
  if(!sent.ok) return {ok:false,error:sent.error};
  return {ok:true,messageId:sent.result?.message_id,chatId:String(sent.result?.chat?.id??chatId)};
}
