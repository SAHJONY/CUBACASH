import { requestModelProposal } from '@/lib/agentic/model-router';
import type { ActionRisk } from '@/lib/agentic/types';

export type HealthSignal = {
  source:string;
  signalType:string;
  severity:'INFO'|'WARN'|'ERROR'|'CRITICAL';
  fingerprint:string;
  metricName?:string;
  metricValue?:number;
  details?:Record<string,unknown>;
};

export type HealingPlan = {
  action:'NONE'|'RETRY_IDEMPOTENT_JOB'|'QUARANTINE_ADAPTER'|'DEGRADE_FEATURE'|'OPEN_INCIDENT'|'ESCALATE_HUMAN';
  autonomyClass:'AUTO_SAFE'|'APPROVAL_REQUIRED';
  reason:string;
  actionRisk:ActionRisk;
  requiresApproval:boolean;
};

export function planHealing(signal:HealthSignal):HealingPlan{
  if(signal.severity==='INFO') return {action:'NONE',autonomyClass:'AUTO_SAFE',reason:'No repair required.',actionRisk:'READ',requiresApproval:false};
  if(signal.severity==='WARN') return {action:'RETRY_IDEMPOTENT_JOB',autonomyClass:'AUTO_SAFE',reason:'Retry only if the failed operation is explicitly idempotent and bounded.',actionRisk:'LOW_WRITE',requiresApproval:false};
  if(signal.severity==='ERROR') return {action:'QUARANTINE_ADAPTER',autonomyClass:'AUTO_SAFE',reason:'Isolate the failing adapter and degrade gracefully instead of cascading failure.',actionRisk:'LOW_WRITE',requiresApproval:false};
  return {action:'ESCALATE_HUMAN',autonomyClass:'APPROVAL_REQUIRED',reason:'Critical impact requires incident escalation; no autonomous destructive rollback or financial/compliance change.',actionRisk:'MATERIAL_WRITE',requiresApproval:true};
}

export type ImprovementInput={
  domain:string;
  metric:string;
  current:number;
  target:number;
  direction:'UP'|'DOWN';
  sampleSize?:number;
  guardrails?:Record<string,unknown>;
};

export type ImprovementPlan={
  experimentRecommended:boolean;
  gap:number;
  requiresApproval:boolean;
  hypothesis:string;
  guardrails:Record<string,unknown>;
};

export function planImprovement(input:ImprovementInput):ImprovementPlan{
  const gap=input.direction==='UP'?input.target-input.current:input.current-input.target;
  const experimentRecommended=gap>0;
  return {
    experimentRecommended,
    gap,
    requiresApproval:experimentRecommended,
    hypothesis:experimentRecommended
      ?`A bounded change in ${input.domain} may improve ${input.metric} toward ${input.target}; validate with a controlled experiment before promotion.`
      :`${input.metric} currently meets or exceeds the target; preserve the baseline and monitor drift.`,
    guardrails:{minimumSampleSize:input.sampleSize??100,noComplianceRegression:true,noFraudRegression:true,noMaterialPricingChangeWithoutApproval:true,...(input.guardrails??{})}
  };
}

export type GrowthLeadInput={
  leadType:'FAMILY_SENDER'|'BUSINESS_SENDER'|'ENTREPRENEUR'|'MARKETPLACE_BUYER'|'MARKETPLACE_SELLER'|'PARTNER';
  source:string;
  intentSignals:number;
  trustSignals:number;
  repeatActivity?:number;
  consentState:'UNKNOWN'|'OPTED_IN'|'TRANSACTIONAL_ONLY'|'OPTED_OUT';
  corridorInterest?:string;
};

export type GrowthPlan={
  intentScore:number;
  lifecycle:'DISCOVERED'|'QUALIFIED'|'NURTURE'|'DISQUALIFIED';
  allowedAutonomousChannels:string[];
  recommendedMotion:'INBOUND_CONVERSION'|'MARKETPLACE_MATCH'|'REACTIVATION'|'REFERRAL'|'PARTNER_OUTREACH'|'EDUCATION';
  externalOutreachAllowed:boolean;
  reason:string;
};

function clamp(n:number){return Math.max(0,Math.min(100,Math.round(n)));}

export function planGrowth(input:GrowthLeadInput):GrowthPlan{
  const intentScore=clamp(input.intentSignals*.55+input.trustSignals*.3+(input.repeatActivity??0)*.15);
  if(input.consentState==='OPTED_OUT') return {intentScore,lifecycle:'DISQUALIFIED',allowedAutonomousChannels:[],recommendedMotion:'EDUCATION',externalOutreachAllowed:false,reason:'Opt-out is a hard stop for autonomous outreach.'};
  const qualified=intentScore>=70;
  const lifecycle=qualified?'QUALIFIED':intentScore>=40?'NURTURE':'DISCOVERED';
  const allowedAutonomousChannels=input.consentState==='OPTED_IN'?['IN_APP','EMAIL']:['IN_APP'];
  const recommendedMotion=input.leadType==='MARKETPLACE_BUYER'||input.leadType==='MARKETPLACE_SELLER'?'MARKETPLACE_MATCH':input.leadType==='PARTNER'?'PARTNER_OUTREACH':input.repeatActivity&&input.repeatActivity>50?'REACTIVATION':'INBOUND_CONVERSION';
  return {intentScore,lifecycle,allowedAutonomousChannels,recommendedMotion,externalOutreachAllowed:input.consentState==='OPTED_IN',reason:'Autonomous selling is limited to consent-aware channels and first-party intent; pricing, regulated claims and partner commitments remain approval-gated.'};
}

export async function brainAdvisory(objective:string,domain:'executive'|'reliability'|'improvement'|'growth',context:Record<string,unknown>={}){
  const actionRisk:ActionRisk=domain==='reliability'?'LOW_WRITE':domain==='growth'?'LOW_WRITE':'READ';
  return requestModelProposal({domain,objective,actionRisk,context,maxOutputTokens:1400});
}
