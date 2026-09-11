import type { ActionRisk, AgentDomain } from './types';

export type ModelTier = 'FAST' | 'REASONING' | 'HIGH_ASSURANCE';

export type ModelRequest = {
  domain: AgentDomain;
  objective: string;
  actionRisk: ActionRisk;
  context?: Record<string, unknown>;
  maxOutputTokens?: number;
};

export type ModelProposal = {
  configured: boolean;
  tier: ModelTier;
  model: string | null;
  proposal: string | null;
  raw?: unknown;
};

function tierFor(request:ModelRequest):ModelTier{
  if(request.actionRisk==='REGULATED'||request.actionRisk==='PROHIBITED'||['compliance','risk','fraud'].includes(request.domain)) return 'HIGH_ASSURANCE';
  if(['executive','remittance','rfq','reconciliation'].includes(request.domain)) return 'REASONING';
  return 'FAST';
}

function modelForTier(tier:ModelTier):string|undefined{
  if(tier==='HIGH_ASSURANCE') return process.env.AGENT_MODEL_HIGH_ASSURANCE||process.env.AGENT_MODEL_REASONING||process.env.AGENT_MODEL_FAST;
  if(tier==='REASONING') return process.env.AGENT_MODEL_REASONING||process.env.AGENT_MODEL_FAST;
  return process.env.AGENT_MODEL_FAST;
}

export async function requestModelProposal(request:ModelRequest):Promise<ModelProposal>{
  const tier=tierFor(request);
  const endpoint=process.env.AGENT_MODEL_ENDPOINT;
  const apiKey=process.env.AGENT_MODEL_API_KEY;
  const model=modelForTier(tier);
  if(!endpoint||!apiKey||!model) return {configured:false,tier,model:model??null,proposal:null};

  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),20_000);
  try{
    const response=await fetch(endpoint,{
      method:'POST',
      signal:controller.signal,
      headers:{'content-type':'application/json','authorization':`Bearer ${apiKey}`},
      body:JSON.stringify({
        model,
        temperature:0,
        max_tokens:Math.min(Math.max(request.maxOutputTokens??1200,128),3000),
        messages:[
          {role:'system',content:'You are a specialist inside the mycubacash.com Agentic Command Network. Produce evidence-aware analysis and proposed next actions. Never claim an external action succeeded unless evidence in the supplied context proves it. Never clear sanctions or authorize regulated funds movement. Return concise plain text.'},
          {role:'user',content:JSON.stringify({domain:request.domain,objective:request.objective,actionRisk:request.actionRisk,context:request.context??{}})}
        ]
      })
    });
    if(!response.ok) return {configured:true,tier,model,proposal:null,raw:{status:response.status}};
    const data=await response.json() as any;
    const proposal=data?.choices?.[0]?.message?.content;
    return {configured:true,tier,model,proposal:typeof proposal==='string'?proposal:null};
  }catch(error){
    return {configured:true,tier,model,proposal:null,raw:{error:error instanceof Error?error.message:'MODEL_REQUEST_FAILED'}};
  }finally{
    clearTimeout(timeout);
  }
}
