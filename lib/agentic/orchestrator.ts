import { randomUUID } from 'node:crypto';
import { agentForDomain } from './registry';
import type { ActionRisk, AgentDomain, AgentPlan, AgentRunInput, AgentTask, ToolDecision, ToolInvocation } from './types';

export const AGENTIC_POLICY_VERSION = 'mycubacash-agentic-v1';

const domainHints: Array<[RegExp, AgentDomain]> = [
  [/(cash|cash payment|cash receipt|pay cash|receive cash|community ledger|payment request)/i, 'cash'],
  [/(remit|send money|beneficiar|transfer)/i, 'remittance'],
  [/(sanction|compliance|kyc|kyb|ubo|regulat)/i, 'compliance'],
  [/(rfq|quotation|quote|sourcing)/i, 'rfq'],
  [/(marketplace|buyer|supplier|match)/i, 'marketplace'],
  [/(reconcil|settlement|mismatch)/i, 'reconciliation'],
  [/(fraud|structur|suspicious|velocity)/i, 'fraud'],
  [/(research|verify|source|evidence)/i, 'research'],
  [/(support|customer|case|ticket)/i, 'support'],
  [/(risk|anomaly)/i, 'risk']
];

function inferDomain(goal: string): AgentDomain {
  return domainHints.find(([rx]) => rx.test(goal))?.[1] ?? 'executive';
}

function decisionForRisk(actionRisk: ActionRisk, allowMaterialWrites=false): ToolDecision {
  if (actionRisk === 'PROHIBITED') return {decision:'BLOCK', reason:'PROHIBITED_ACTION', requiresHumanApproval:true};
  if (actionRisk === 'REGULATED') return {decision:'REQUEST_APPROVAL', reason:'AUTHORIZED_REVIEW_REQUIRED', requiresHumanApproval:true};
  if (actionRisk === 'MATERIAL_WRITE' && !allowMaterialWrites) return {decision:'REQUEST_APPROVAL', reason:'MATERIAL_WRITE_REQUIRES_APPROVAL', requiresHumanApproval:true};
  return {decision:'EXECUTE', reason:'WITHIN_AUTOMATION_BOUNDARY', requiresHumanApproval:false};
}

function task(id:string, agentId:string, objective:string, actionRisk:ActionRisk, deps:string[]=[], evidence:string[]=[], allowMaterialWrites=false):AgentTask {
  const gate=decisionForRisk(actionRisk,allowMaterialWrites);
  return {id,agentId,objective,actionRisk,dependencies:deps,evidenceRequired:evidence,decision:gate.decision,reason:gate.reason};
}

export function planAgentRun(input: AgentRunInput): AgentPlan {
  const goal=input.goal.trim();
  if(!goal) throw new Error('Goal is required');
  const domain=input.requestedDomain ?? inferDomain(goal);
  const primary=agentForDomain(domain);
  const runId=randomUUID();
  const allow=!!input.allowMaterialWrites;
  const tasks:AgentTask[]=[];

  tasks.push(task('t1','research-agent','Assemble verified context and evidence required to execute the goal.','READ',[],['CURRENT_SOURCE_EVIDENCE'],allow));

  if(domain==='remittance'){
    tasks.push(task('t2','compliance-sentinel','Evaluate KYC/KYB, beneficiary, sanctions state, jurisdiction evidence and corridor controls.','REGULATED',['t1'],['CURRENT_AUTHORITATIVE_SANCTIONS_RESULT','CURRENT_JURISDICTION_RULE_SOURCE'],allow));
    tasks.push(task('t3','fraud-guardian','Evaluate anomaly, duplicate identity, velocity and structuring indicators.','READ',['t1'],['TRANSACTION_CONTEXT'],allow));
    tasks.push(task('t4','remittance-router','Prepare provider-routing package and transfer intent only after hard controls are satisfied.','REGULATED',['t2','t3'],['APPROVED_PROVIDER_ROUTE','BENEFICIARY_VERIFICATION'],allow));
    tasks.push(task('t5','reconciliation-agent','Prepare post-submission tracking and reconciliation plan.','LOW_WRITE',['t4'],['PARTNER_REFERENCE'],allow));
  } else if(domain==='cash'){
    tasks.push(task('t2','cash-ledger-agent','Validate participant roles, direct-cash record semantics and community trust state without assuming custody of funds.','READ',['t1'],['PARTICIPANT_BUSINESS_IDS','DIRECT_CASH_HANDOFF_CONTEXT'],allow));
    tasks.push(task('t3','fraud-guardian','Check for suspicious velocity, duplicate records, coercion indicators or structuring signals.','READ',['t1','t2'],['TRANSACTION_CONTEXT'],allow));
    tasks.push(task('t4','cash-ledger-agent','Create or update only the permitted cash-ledger workflow state; completion requires independent payer and payee confirmation.','MATERIAL_WRITE',['t2','t3'],['DUAL_CONFIRMATION_REQUIREMENT'],allow));
    tasks.push(task('t5','risk-analyst','Challenge trust assumptions and route disputes or higher-risk patterns for review.','READ',['t4'],['COMMUNITY_TRUST_EVIDENCE','DISPUTE_STATE'],allow));
  } else if(domain==='marketplace' || domain==='rfq'){
    tasks.push(task('t2','compliance-sentinel','Confirm counterparties are eligible for the requested commercial workflow.','REGULATED',['t1'],['COUNTERPARTY_VERIFICATION'],allow));
    tasks.push(task('t3',domain==='rfq'?'rfq-operator':'marketplace-matchmaker','Structure and rank execution-ready opportunities using verified data.','LOW_WRITE',['t1','t2'],['COMMERCIAL_EVIDENCE'],allow));
    tasks.push(task('t4','risk-analyst','Score execution risk and identify unresolved evidence gaps.','READ',['t3'],['RISK_EVIDENCE'],allow));
  } else {
    tasks.push(task('t2',primary.id,`Execute specialist analysis for: ${goal}`,'LOW_WRITE',['t1'],[],allow));
    tasks.push(task('t3','risk-analyst','Challenge assumptions, detect evidence gaps and surface material risks.','READ',['t2'],[],allow));
  }

  tasks.push(task(`t${tasks.length+1}`,'executive-orchestrator','Synthesize specialist outputs, resolve conflicts and produce the next safe action.','MATERIAL_WRITE',tasks.map(t=>t.id),['AGENT_OUTPUTS','POLICY_GATES'],allow));
  const requiresHumanApproval=tasks.some(t=>t.decision==='REQUEST_APPROVAL'||t.decision==='BLOCK');
  return {runId,goal,primaryAgentId:primary.id,tasks,status:requiresHumanApproval?'WAITING_APPROVAL':'PLANNED',requiresHumanApproval,policyVersion:AGENTIC_POLICY_VERSION};
}

export function authorizeToolInvocation(invocation: ToolInvocation, allowMaterialWrites=false): ToolDecision {
  if(!invocation.tool.trim() || !invocation.action.trim()) return {decision:'BLOCK',reason:'INVALID_TOOL_INVOCATION',requiresHumanApproval:true};
  return decisionForRisk(invocation.actionRisk,allowMaterialWrites);
}
