export type Corridor = 'CU-CU'|'CU-WORLD'|'WORLD-CU'|'CU-US'|'WORLD-WORLD';
export type SanctionsState = 'CLEAR'|'PENDING'|'REVIEW'|'BLOCKED'|'ERROR';
export type Decision = 'ALLOW_WITH_CONTROLS'|'REVIEW'|'HOLD'|'BLOCK';

export type RiskInput = {
  originCountry: string;
  destinationCountry: string;
  usNexus?: boolean;
  kycKybVerified?: boolean;
  beneficialOwnershipVerified?: boolean;
  sanctionsState?: SanctionsState;
  sanctionsEvidenceCurrent?: boolean;
  jurisdictionReviewCurrent?: boolean;
  authorizedReviewRequired?: boolean;
  authorizedReviewComplete?: boolean;
  fraudIndicator?: boolean;
  structuringIndicator?: boolean;
  transactionAnomaly?: boolean;
  stableFamilyRemittancePattern?: boolean;
  recurringRecipient?: boolean;
  productControlReviewComplete?: boolean;
};

export type RiskResult = {
  corridor: Corridor;
  riskBand: 'LOW'|'MEDIUM'|'HIGH'|'PROHIBITED';
  decision: Decision;
  reasons: string[];
  evidenceRequirements: string[];
  remittanceEffect: 'LOWER_ANOMALY_WEIGHT_ONLY'|'NONE';
  policyVersion: 'mycubacash-policy-v2';
};

export function corridorOf(originCountry: string, destinationCountry: string, usNexus=false): Corridor {
  const o=originCountry.trim().toUpperCase(), d=destinationCountry.trim().toUpperCase();
  if(o==='CU'&&d==='CU') return 'CU-CU';
  if((o==='CU'&&d==='US')||(d==='CU'&&o==='US')||((o==='CU'||d==='CU')&&usNexus)) return 'CU-US';
  if(o==='CU') return 'CU-WORLD';
  if(d==='CU') return 'WORLD-CU';
  return 'WORLD-WORLD';
}

export function evaluateRisk(input: RiskInput): RiskResult {
  const corridor=corridorOf(input.originCountry,input.destinationCountry,!!input.usNexus);
  const sanctions=input.sanctionsState??'PENDING';
  const reasons:string[]=[];
  const evidenceRequirements:string[]=[];
  const stable=!!input.stableFamilyRemittancePattern&&!!input.recurringRecipient;

  if(sanctions==='BLOCKED') return {corridor,riskBand:'PROHIBITED',decision:'BLOCK',reasons:['SANCTIONS_BLOCK'],evidenceRequirements:['AUTHORITATIVE_SANCTIONS_EVIDENCE'],remittanceEffect:'NONE',policyVersion:'mycubacash-policy-v2'};
  if(['PENDING','REVIEW','ERROR'].includes(sanctions)) return {corridor,riskBand:'HIGH',decision:'HOLD',reasons:[`SANCTIONS_${sanctions}`],evidenceRequirements:['CURRENT_AUTHORITATIVE_SANCTIONS_RESULT'],remittanceEffect:'NONE',policyVersion:'mycubacash-policy-v2'};

  if(!input.sanctionsEvidenceCurrent){ reasons.push('SANCTIONS_EVIDENCE_NOT_CURRENT'); evidenceRequirements.push('CURRENT_AUTHORITATIVE_SANCTIONS_RESULT'); }
  if(!input.jurisdictionReviewCurrent){ reasons.push('JURISDICTION_REVIEW_REQUIRED'); evidenceRequirements.push('CURRENT_JURISDICTION_RULE_SOURCE'); }
  if(!input.kycKybVerified){ reasons.push('KYC_KYB_REQUIRED'); evidenceRequirements.push('IDENTITY_OR_BUSINESS_VERIFICATION'); }
  if(!input.beneficialOwnershipVerified){ reasons.push('BENEFICIAL_OWNERSHIP_REQUIRED'); evidenceRequirements.push('BENEFICIAL_OWNERSHIP_EVIDENCE'); }
  if(input.authorizedReviewRequired&&!input.authorizedReviewComplete){ reasons.push('AUTHORIZED_REVIEW_REQUIRED'); evidenceRequirements.push('AUTHORIZED_COMPLIANCE_OR_LEGAL_REVIEW'); }
  if(input.fraudIndicator) reasons.push('FRAUD_INDICATOR');
  if(input.structuringIndicator) reasons.push('STRUCTURING_INDICATOR');
  if(corridor==='CU-US'&&!input.productControlReviewComplete){ reasons.push('US_PRODUCT_CONTROL_REVIEW_REQUIRED'); evidenceRequirements.push('CURRENT_PRODUCT_AND_EXPORT_CONTROL_REVIEW'); }

  if(reasons.length) return {corridor,riskBand:'HIGH',decision:'HOLD',reasons,evidenceRequirements:[...new Set(evidenceRequirements)],remittanceEffect:stable?'LOWER_ANOMALY_WEIGHT_ONLY':'NONE',policyVersion:'mycubacash-policy-v2'};
  if(input.transactionAnomaly&&!stable) return {corridor,riskBand:'MEDIUM',decision:'REVIEW',reasons:['TRANSACTION_ANOMALY'],evidenceRequirements:['TRANSACTION_CONTEXT_REVIEW'],remittanceEffect:'NONE',policyVersion:'mycubacash-policy-v2'};
  return {corridor,riskBand:stable?'LOW':'MEDIUM',decision:'ALLOW_WITH_CONTROLS',reasons:['CONTROLS_SATISFIED'],evidenceRequirements:[],remittanceEffect:stable?'LOWER_ANOMALY_WEIGHT_ONLY':'NONE',policyVersion:'mycubacash-policy-v2'};
}
