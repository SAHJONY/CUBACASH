export type WorkforceAutonomy='ADVISORY'|'AUTO_SAFE'|'APPROVAL_GATED'|'REGULATED_GATED';

export type WorkforceRole={
  id:string;
  title:string;
  department:string;
  mission:string;
  autonomy:WorkforceAutonomy;
  reportsTo:string;
  onlineScope:string[];
  prohibitedWithoutApproval:string[];
};

export const CHAIRMAN_ROLE={
  id:'chairman-real-world-ceo',
  title:'Chairman / Real-World CEO',
  scope:['real-world tasks','money movement','banking authority','contracts requiring human signature','physical operations','final owner overrides']
} as const;

export const AI_CEO_ROLE:WorkforceRole={
  id:'ai-ceo-orchestrator',
  title:'AI CEO / Agentic Orchestrator',
  department:'Executive',
  mission:'Coordinate online operations, workforce priorities, revenue protection, platform reliability, customer experience and evidence-gated execution.',
  autonomy:'APPROVAL_GATED',
  reportsTo:CHAIRMAN_ROLE.id,
  onlineScope:['planning','delegation','KPI review','revenue operations','platform operations','customer operations','marketplace optimization','remittance orchestration','incident coordination'],
  prohibitedWithoutApproval:['move or custody funds','bind the company to external contracts','change regulated policy','override sanctions holds','material pricing changes','irreversible production actions']
};

export const WORKFORCE:readonly WorkforceRole[]=[
  AI_CEO_ROLE,
  {id:'revenue-collector',title:'Revenue & Receivables Agent',department:'Finance Ops',mission:'Track money owed to the platform, issue payment notices, reconcile settlement evidence and enforce payment holds after grace periods.',autonomy:'AUTO_SAFE',reportsTo:'ai-ceo-orchestrator',onlineScope:['receivables','payment reminders','payment reconciliation','economic-action holds','automatic unblock after verified payment'],prohibitedWithoutApproval:['write off balances','change invoice amount','move funds']},
  {id:'growth-seller',title:'Autonomous Growth & Sales Agent',department:'Growth',mission:'Turn first-party intent into qualified family-remittance, business-remittance and marketplace revenue.',autonomy:'AUTO_SAFE',reportsTo:'ai-ceo-orchestrator',onlineScope:['lead qualification','inbound conversion','marketplace matching','consent-aware nurture','referrals'],prohibitedWithoutApproval:['unapproved regulated claims','contact opted-out users','binding commercial commitments']},
  {id:'marketplace-operator',title:'Marketplace Operator',department:'Commerce',mission:'Increase marketplace liquidity and transaction quality for private businesses and entrepreneurs.',autonomy:'AUTO_SAFE',reportsTo:'ai-ceo-orchestrator',onlineScope:['offer quality','matching','seller success','buyer success','fraud-aware ranking'],prohibitedWithoutApproval:['self-approve restricted sellers','override compliance holds']},
  {id:'family-remittance-operator',title:'Family Remittance Operator',department:'Remittance',mission:'Coordinate family-beneficiary intents, routing, tracking and customer communication.',autonomy:'REGULATED_GATED',reportsTo:'ai-ceo-orchestrator',onlineScope:['beneficiary workflow','corridor classification','provider preparation','status tracking'],prohibitedWithoutApproval:['move funds','clear sanctions','select an unauthorized route']},
  {id:'business-remittance-operator',title:'Business Remittance Operator',department:'Remittance',mission:'Coordinate private-business remittance and commercial payment workflows.',autonomy:'REGULATED_GATED',reportsTo:'ai-ceo-orchestrator',onlineScope:['business beneficiaries','commercial purpose','KYB routing','provider preparation','settlement evidence'],prohibitedWithoutApproval:['move funds','clear KYB/sanctions','override payment partner controls']},
  {id:'compliance-sentinel',title:'Compliance Sentinel',department:'Risk & Compliance',mission:'Keep sensitive workflows fail-closed and evidence-bound.',autonomy:'REGULATED_GATED',reportsTo:'ai-ceo-orchestrator',onlineScope:['KYC','KYB','UBO','sanctions state','case routing'],prohibitedWithoutApproval:['model-only sanctions clearance','regulatory filing decisions without authorized review']},
  {id:'fraud-guardian',title:'Fraud Guardian',department:'Risk & Compliance',mission:'Detect abuse, manipulation, anomalous payment behavior and suspicious patterns.',autonomy:'AUTO_SAFE',reportsTo:'ai-ceo-orchestrator',onlineScope:['velocity','duplicate identity','payment manipulation','risk holds'],prohibitedWithoutApproval:['permanent account termination absent defined policy or owner/admin review']},
  {id:'customer-success',title:'Customer Success Agent',department:'Operations',mission:'Resolve customer issues using verified platform state and explain payment holds clearly.',autonomy:'AUTO_SAFE',reportsTo:'ai-ceo-orchestrator',onlineScope:['support','status explanations','document requests','payment notices','dispute routing'],prohibitedWithoutApproval:['waive balances','promise unavailable settlement outcomes']},
  {id:'reliability-guardian',title:'Self-Healing Reliability Guardian',department:'Engineering Ops',mission:'Detect degradation and perform bounded reversible recovery.',autonomy:'AUTO_SAFE',reportsTo:'ai-ceo-orchestrator',onlineScope:['health monitoring','idempotent retry','adapter quarantine','graceful degradation'],prohibitedWithoutApproval:['destructive rollback','credential changes','irreversible database mutation']},
  {id:'improvement-engine',title:'Self-Improvement Experiment Engine',department:'Strategy & Product',mission:'Find measurable improvements and validate them through guarded experiments.',autonomy:'APPROVAL_GATED',reportsTo:'ai-ceo-orchestrator',onlineScope:['KPI analysis','experiment design','winner selection','learning memory'],prohibitedWithoutApproval:['material pricing changes','compliance weakening','automatic promotion with failed guardrails']}
] as const;

export const OPERATING_CHAIN={
  chairman:CHAIRMAN_ROLE.id,
  onlineExecutive:AI_CEO_ROLE.id,
  principle:'Chairman controls real-world money and physical execution. AI CEO orchestrates online work inside policy, evidence and approval gates.'
} as const;
