export type AgentDomain =
  | 'executive'
  | 'compliance'
  | 'remittance'
  | 'cash'
  | 'marketplace'
  | 'rfq'
  | 'risk'
  | 'reconciliation'
  | 'support'
  | 'research'
  | 'fraud'
  | 'reliability'
  | 'improvement'
  | 'growth';

export type ActionRisk = 'READ' | 'LOW_WRITE' | 'MATERIAL_WRITE' | 'REGULATED' | 'PROHIBITED';
export type AgentDecision = 'EXECUTE' | 'REQUEST_APPROVAL' | 'HOLD' | 'BLOCK';
export type RunStatus = 'PLANNED' | 'RUNNING' | 'WAITING_APPROVAL' | 'COMPLETED' | 'FAILED' | 'BLOCKED';

export type AgentDefinition = {
  id: string;
  name: string;
  domain: AgentDomain;
  mission: string;
  capabilities: string[];
  allowedActionRisk: ActionRisk[];
  canDelegate: boolean;
};

export type AgentTask = {
  id: string;
  agentId: string;
  objective: string;
  actionRisk: ActionRisk;
  dependencies: string[];
  evidenceRequired: string[];
  decision: AgentDecision;
  reason: string;
};

export type AgentPlan = {
  runId: string;
  goal: string;
  primaryAgentId: string;
  tasks: AgentTask[];
  status: RunStatus;
  requiresHumanApproval: boolean;
  policyVersion: string;
};

export type AgentRunInput = {
  goal: string;
  context?: Record<string, unknown>;
  requestedDomain?: AgentDomain;
  allowMaterialWrites?: boolean;
};

export type ToolInvocation = {
  tool: string;
  action: string;
  actionRisk: ActionRisk;
  args: Record<string, unknown>;
  evidence?: Record<string, unknown>;
};

export type ToolDecision = {
  decision: AgentDecision;
  reason: string;
  requiresHumanApproval: boolean;
};
