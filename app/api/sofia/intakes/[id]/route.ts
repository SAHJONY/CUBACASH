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

// Sofia may ONLY touch these two fields. Money/identity state is
// hard-blocked below: Sofia can never verify payment, change amounts,
// touch payment evidence, or rewire the remittance intent.
const ALLOWED_STATUS=['COLLECTING','READY_FOR_REVIEW','ON_HOLD','CANCELLED'] as const;
const BLOCKED_FIELDS=['payment_status','requested_amount','payment_evidence','remittance_intent_id'] as const;

export async function PATCH(req:Request,ctx:{params:Promise<{id:string}>}){
  if(!authorized(req)) return json({error:'UNAUTHORIZED'},401);

  const {id}=await ctx.params;
  const intakeId=(id??'').trim();
  if(!intakeId) return json({error:'INTAKE_ID_REQUIRED'},400);

  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}

  // Hard block: any attempt to touch money/identity fields rejects the
  // whole request. Nothing is written.
  const blocked=BLOCKED_FIELDS.filter((f)=>f in body);
  if(blocked.length) return json({error:'FIELD_NOT_UPDATABLE_BY_SOFIA',fields:blocked},422);

  // Allowlist: only notes and intake_status are accepted.
  const unknown=Object.keys(body).filter((k)=>k!=='notes'&&k!=='intake_status');
  if(unknown.length) return json({error:'UNKNOWN_FIELD',fields:unknown},422);

  const patch:Record<string,unknown>={};
  if('notes' in body){
    patch.notes=String(body.notes??'').slice(0,2000)||null;
  }
  if('intake_status' in body){
    const status=String(body.intake_status??'').trim().toUpperCase();
    if(!ALLOWED_STATUS.includes(status as typeof ALLOWED_STATUS[number])){
      return json({error:'INVALID_INTAKE_STATUS',allowed:[...ALLOWED_STATUS]},422);
    }
    patch.intake_status=status;
  }
  if(!Object.keys(patch).length) return json({error:'NOTHING_TO_UPDATE'},400);

  const db=supabaseAdmin();
  const {data:existing,error:fetchError}=await db.from('sofia_order_intakes')
    .select('id,intake_status')
    .eq('id',intakeId)
    .maybeSingle();
  if(fetchError||!existing) return json({error:'INTAKE_NOT_FOUND'},404);

  patch.updated_at=new Date().toISOString();
  const {data:updated,error:updateError}=await db.from('sofia_order_intakes')
    .update(patch)
    .eq('id',intakeId)
    .select('id,intake_status,notes,updated_at')
    .single();
  if(updateError||!updated) return json({error:'SOFIA_INTAKE_UPDATE_FAILED'},500);

  return json({intake:{
    id:updated.id,
    intake_status:updated.intake_status,
    notes:updated.notes??null,
    updated_at:updated.updated_at
  }});
}
