import { supabaseServer } from '@/lib/supabase/server';
import { brainAdvisory, planGrowth, planHealing, planImprovement } from '@/lib/autonomy/engines';

function json(body:unknown,status=200){
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

async function requireOperator(){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {ok:false as const,response:json({error:'UNAUTHORIZED'},401)};
  const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();
  if(!profile||!['platform_admin','platform_owner'].includes(profile.role)) return {ok:false as const,response:json({error:'FORBIDDEN'},403)};
  return {ok:true as const,supabase,user,role:profile.role};
}

export async function GET(){
  const auth=await requireOperator();
  if(!auth.ok) return auth.response;
  return json({
    service:'mycubacash-autonomy-control-plane',
    brain:'Application Brain / Executive Orchestrator',
    engines:['SELF_HEALING','SELF_IMPROVEMENT','AUTONOMOUS_GROWTH'],
    boundaries:{
      autoSafe:['idempotent retry','adapter quarantine','graceful degradation','in-app consent-aware conversion'],
      approvalRequired:['material configuration','production rollback','pricing changes','external outreach without established permission','binding partner commitments'],
      prohibited:['sanctions self-clearance','customer self-approval','unconsented marketing','autonomous regulated funds authorization']
    },
    modelConfigured:!!process.env.AGENT_MODEL_ENDPOINT&&!!process.env.AGENT_MODEL_API_KEY&&!!process.env.AGENT_MODEL_FAST
  });
}

export async function POST(req:Request){
  const auth=await requireOperator();
  if(!auth.ok) return auth.response;
  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}
  const mode=String(body.mode??'').trim().toUpperCase();

  if(mode==='HEAL'){
    const signal=body.signal as any;
    if(!signal||typeof signal!=='object') return json({error:'SIGNAL_REQUIRED'},400);
    return json({mode,plan:planHealing(signal)});
  }

  if(mode==='IMPROVE'){
    const input=body.input as any;
    if(!input||typeof input!=='object') return json({error:'INPUT_REQUIRED'},400);
    return json({mode,plan:planImprovement(input)});
  }

  if(mode==='GROW'){
    const input=body.input as any;
    if(!input||typeof input!=='object') return json({error:'INPUT_REQUIRED'},400);
    return json({mode,plan:planGrowth(input)});
  }

  if(mode==='BRAIN'){
    const objective=String(body.objective??'').trim();
    const domain=String(body.domain??'executive').toLowerCase();
    if(!objective) return json({error:'OBJECTIVE_REQUIRED'},400);
    if(!['executive','reliability','improvement','growth'].includes(domain)) return json({error:'INVALID_DOMAIN'},400);
    const context=(body.context&&typeof body.context==='object'&&!Array.isArray(body.context))?body.context as Record<string,unknown>:{};
    const advisory=await brainAdvisory(objective,domain as 'executive'|'reliability'|'improvement'|'growth',context);
    return json({mode,advisory,policy:'MODEL_PROPOSES_POLICY_AUTHORIZES'});
  }

  return json({error:'INVALID_MODE',allowed:['HEAL','IMPROVE','GROW','BRAIN']},400);
}
