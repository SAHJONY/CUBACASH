import type { AgentDefinition, AgentDomain } from './types';

export const AGENTS: readonly AgentDefinition[] = [
  {
    id: 'executive-orchestrator',
    name: 'Executive Orchestrator',
    domain: 'executive',
    mission: 'Decompose goals, coordinate specialist agents, optimize for evidence-backed completion, and enforce release gates.',
    capabilities: ['planning','delegation','conflict-resolution','priority-scoring','release-gating'],
    allowedActionRisk: ['READ','LOW_WRITE','MATERIAL_WRITE'],
    canDelegate: true
  },
  {
    id: 'compliance-sentinel',
    name: 'Compliance Sentinel',
    domain: 'compliance',
    mission: 'Keep regulated workflows fail-closed and require current authoritative evidence before sensitive actions advance.',
    capabilities: ['kyc-kyb-checks','ubo-checks','sanctions-state','jurisdiction-evidence','case-routing'],
    allowedActionRisk: ['READ','LOW_WRITE','MATERIAL_WRITE','REGULATED'],
    canDelegate: true
  },
  {
    id: 'remittance-router',
    name: 'Remittance Router',
    domain: 'remittance',
    mission: 'Prepare compliant remittance intents, beneficiaries, corridors, provider routing, status tracking and exception handling.',
    capabilities: ['beneficiary-workflow','corridor-routing','provider-selection','transfer-state','exceptions'],
    allowedActionRisk: ['READ','LOW_WRITE','MATERIAL_WRITE','REGULATED'],
    canDelegate: true
  },
  {
    id: 'cash-ledger-agent',
    name: 'Cash Ledger Guardian',
    domain: 'cash',
    mission: 'Orchestrate direct-cash transaction records, dual confirmation, evidence, community trust and disputes without taking custody of funds.',
    capabilities: ['cash-records','dual-confirmation','payment-requests','community-trust','dispute-routing','evidence-ledger'],
    allowedActionRisk: ['READ','LOW_WRITE','MATERIAL_WRITE'],
    canDelegate: true
  },
  {
    id: 'marketplace-matchmaker',
    name: 'Marketplace Matchmaker',
    domain: 'marketplace',
    mission: 'Match verified private-sector demand and supply using structured fit, trust, geography and execution readiness.',
    capabilities: ['buyer-supplier-match','offer-ranking','trust-scoring','opportunity-routing'],
    allowedActionRisk: ['READ','LOW_WRITE','MATERIAL_WRITE'],
    canDelegate: true
  },
  {
    id: 'rfq-operator',
    name: 'RFQ Operator',
    domain: 'rfq',
    mission: 'Transform demand into structured RFQs, compare responses and escalate transaction-ready opportunities.',
    capabilities: ['rfq-structuring','quote-comparison','commercial-normalization','readiness-scoring'],
    allowedActionRisk: ['READ','LOW_WRITE','MATERIAL_WRITE'],
    canDelegate: true
  },
  {
    id: 'risk-analyst',
    name: 'Risk Analyst',
    domain: 'risk',
    mission: 'Evaluate transaction, fraud, sanctions and execution signals without overriding hard controls.',
    capabilities: ['risk-scoring','anomaly-detection','evidence-gap-detection','counterparty-risk'],
    allowedActionRisk: ['READ','LOW_WRITE'],
    canDelegate: false
  },
  {
    id: 'reconciliation-agent',
    name: 'Reconciliation Agent',
    domain: 'reconciliation',
    mission: 'Compare expected and provider-reported settlement outcomes, surface mismatches and preserve evidence.',
    capabilities: ['settlement-match','fee-delta','fx-delta','exception-escalation','ledger-reconciliation'],
    allowedActionRisk: ['READ','LOW_WRITE','MATERIAL_WRITE'],
    canDelegate: false
  },
  {
    id: 'support-agent',
    name: 'Customer Operations Agent',
    domain: 'support',
    mission: 'Resolve customer questions from verified platform state and route unresolved financial or compliance matters safely.',
    capabilities: ['case-triage','status-explanation','document-request','multilingual-support'],
    allowedActionRisk: ['READ','LOW_WRITE'],
    canDelegate: true
  },
  {
    id: 'research-agent',
    name: 'Research Intelligence Agent',
    domain: 'research',
    mission: 'Collect and structure current evidence from approved sources without representing unverified information as fact.',
    capabilities: ['source-research','entity-resolution','market-intelligence','evidence-packaging'],
    allowedActionRisk: ['READ','LOW_WRITE'],
    canDelegate: false
  },
  {
    id: 'fraud-guardian',
    name: 'Fraud Guardian',
    domain: 'fraud',
    mission: 'Detect suspicious patterns, duplicate identities, velocity anomalies and structuring signals, then hold for review.',
    capabilities: ['velocity-checks','device-patterns','duplicate-identity','structuring-signals','case-escalation'],
    allowedActionRisk: ['READ','LOW_WRITE','MATERIAL_WRITE'],
    canDelegate: false
  }
] as const;

export function agentForDomain(domain: AgentDomain): AgentDefinition {
  return AGENTS.find((agent) => agent.domain === domain) ?? AGENTS[0];
}

export function agentById(id: string): AgentDefinition | undefined {
  return AGENTS.find((agent) => agent.id === id);
}
