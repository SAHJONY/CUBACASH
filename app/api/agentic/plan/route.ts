import { planAgentRun } from '@/lib/agentic/orchestrator';
import type { AgentRunInput } from '@/lib/agentic/types';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request: Request){
  const supabase=await supabaseServer();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user) return Response.json({error:'UNAUTHENTICATED'},{status:401});

  let body:AgentRunInput;
  try{
    const raw=await request.text();
    if(raw.length>32768) return Response.json({error:'PAYLOAD_TOO_LARGE'},{status:413});
    body=JSON.parse(raw) as AgentRunInput;
  }catch{
    return Response.json({error:'INVALID_JSON'},{status:400});
  }

  if(typeof body?.goal!=='string'||body.goal.trim().length<3||body.goal.length>4000){
    return Response.json({error:'INVALID_GOAL'},{status:400});
  }

  let plan;
  try{plan=planAgentRun(body);}catch{
    return Response.json({error:'PLAN_FAILED'},{status:400});
  }

  const {error:runError}=await supabase.from('agent_runs').insert({
    id:plan.runId,
    owner_user_id:user.id,
    goal:plan.goal,
    primary_agent_id:plan.primaryAgentId,
    status:plan.status,
    policy_version:plan.policyVersion,
    requires_human_approval:plan.requiresHumanApproval,
    context:body.context??{}
  });
  if(runError) return Response.json({error:'RUN_PERSISTENCE_FAILED'},{status:500});

  const taskRows=plan.tasks.map((task)=>({
    run_id:plan.runId,
    task_key:task.id,
    agent_id:task.agentId,
    objective:task.objective,
    action_risk:task.actionRisk,
    decision:task.decision,
    reason:task.reason,
    dependencies:task.dependencies,
    evidence_required:task.evidenceRequired,
    task_status:task.decision==='BLOCK'?'BLOCKED':task.decision==='REQUEST_APPROVAL'?'WAITING_APPROVAL':'PLANNED'
  }));
  const {error:taskError}=await supabase.from('agent_tasks').insert(taskRows);
  if(taskError) return Response.json({error:'TASK_PERSISTENCE_FAILED',runId:plan.runId},{status:500});

  return Response.json({
    plan,
    executionMode:'POLICY_GATED',
    note:'This endpoint creates and persists an execution plan. Regulated or material actions are not auto-approved.'
  },{status:201,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
