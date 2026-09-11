import { timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

function authorized(req:Request){
  const expected=process.env.SOFIA_INGEST_SECRET??'';
  const supplied=req.headers.get('x-sofia-ingest-secret')??'';
  if(!expected||!supplied) return false;
  const a=Buffer.from(expected);
  const b=Buffer.from(supplied);
  return a.length===b.length&&timingSafeEqual(a,b);
}

const CHANNELS=['WHATSAPP','PHONE_CALL'] as const;

export async function POST(req:Request){
  if(!authorized(req)) return json({error:'UNAUTHORIZED'},401);

  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}

  const intakeId=String(body.intakeId??'').trim();
  const channel=String(body.channel??'').trim().toUpperCase();
  const channelIdentity=String(body.channelIdentity??'').trim();
  const confirmationReference=body.confirmationReference?String(body.confirmationReference).trim():'';

  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(intakeId)||!CHANNELS.includes(channel as typeof CHANNELS[number])||!channelIdentity){
    return json({error:'INVALID_RECEIVER_CONFIRMATION'},400);
  }

  const db=supabaseAdmin();
  const {data,error}=await db.rpc('sofia_confirm_receiver_and_maybe_close',{
    p_intake_id:intakeId,
    p_channel:channel,
    p_channel_identity:channelIdentity,
    p_confirmation_reference:confirmationReference,
    p_confirmation_payload:{
      source:'SOFIA_CHANNEL_CONFIRMATION',
      channel,
      receivedAt:new Date().toISOString()
    }
  });

  if(error){
    const message=String(error.message??'');
    if(message.includes('RECEIVER_IDENTITY_MISMATCH')) return json({error:'RECEIVER_IDENTITY_MISMATCH'},409);
    if(message.includes('RECEIVER_CHANNEL_NOT_BOUND')) return json({error:'RECEIVER_CHANNEL_NOT_BOUND'},409);
    if(message.includes('INTAKE_NOT_FOUND')) return json({error:'INTAKE_NOT_FOUND'},404);
    return json({error:'RECEIVER_CONFIRMATION_FAILED'},500);
  }

  const row=Array.isArray(data)?data[0]:data;
  return json({
    intake:row,
    receiverConfirmed:Boolean(row?.receiver_confirmed_at),
    closedAutonomously:row?.closed_by==='SOFIA'&&Boolean(row?.auto_closed_at),
    rule:'SOFIA_AUTOCLOSE_REQUIRES_BOUND_RECEIVER_IDENTITY_AND_VERIFIED_PAYMENT'
  });
}
