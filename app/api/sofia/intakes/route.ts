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

// Read-only shape for Sofia. payment_evidence is NEVER exposed here:
// excluded from the SELECT projection below AND from this mapper
// (defense in depth).
function publicIntake(row:Record<string,any>){
  return {
    id:row.id,
    channel:row.channel,
    intake_status:row.intake_status,
    request_type:row.request_type,
    requested_amount:row.requested_amount,
    requested_currency:row.requested_currency,
    sender_phone:row.sender_phone,
    notes:row.notes??null,
    created_at:row.created_at,
    updated_at:row.updated_at
  };
}

export async function GET(req:Request){
  if(!authorized(req)) return json({error:'UNAUTHORIZED'},401);

  const url=new URL(req.url);
  const senderPhone=(url.searchParams.get('sender_phone')??'').trim();
  if(senderPhone.length<7) return json({error:'SENDER_PHONE_REQUIRED'},400);

  const db=supabaseAdmin();
  const {data,error}=await db.from('sofia_order_intakes')
    .select('id,channel,intake_status,request_type,requested_amount,requested_currency,sender_phone,notes,created_at,updated_at')
    .eq('sender_phone',senderPhone)
    .order('created_at',{ascending:false})
    .limit(50);
  if(error) return json({error:'SOFIA_INTAKES_READ_FAILED'},500);

  return json({intakes:(data??[]).map(publicIntake)});
}
