import { getComplianceConfig } from '@/lib/compliance-config';

export type Corridor = 'CU-CU'|'CU-WORLD'|'WORLD-CU'|'CU-US'|'WORLD-WORLD';
export type SanctionsState = 'CLEAR'|'PENDING'|'REVIEW'|'BLOCKED'|'ERROR';
export type Decision = 'ALLOW_WITH_CONTROLS'|'REVIEW'|'HOLD'|'BLOCK';
export type RiskBand = 'LOW'|'MEDIUM'|'HIGH'|'PROHIBITED';

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
  riskBand: RiskBand;
  decision: Decision;
  configuredAction: string;
  humanReviewRequired: boolean;
  reasons: string[];
  evidenceRequirements: string[];
  remittanceEffect: 'LOWER_ANOMALY_WEIGHT_ONLY'|'NONE';
  policyVersion: string;
  sanctionsPolicyVersion: string;
  auditPolicyVersion: string;
};

export function corridorOf(originCountry: string, destinationCountry: string, usNexus=false): Corridor {
  const o=originCountry.trim().toUpperCase(), d=destinationCountry.trim().toUpperCase();
  if(o==='CU'&&d==='CU') return 'CU-CU';
  if((o==='CU'&&d==='US')||(d==='CU'&&o==='US')||((o==='CU'||d==='CU')&&usNexus)) return 'CU-US';
  if(o==='CU') return 'CU-WORLD';
  if(d==='CU') return 'WORLD-CU';
  return 'WORLD-WORLD';
}

function finalize(
  corridor:Corridor,
  riskBand:RiskBand,
  decision:Decision,
  reasons:string[],
  evidenceRequirements:string[],
  remittanceEffect:'LOWER_ANOMALY_WEIGHT_ONLY'|'NONE'
):RiskResult{
  const {policy,sanctions,audit}=getComplianceConfig();
  const band=policy.decision_bands[riskBand];
  return {
    corridor,
    riskBand,
    decision,
    configuredAction:band.action,
    humanReviewRequired:!!band.human_review_required,
    reasons,
    evidenceRequirements:[...new Set(evidenceRequirements)],
    remittanceEffect,
    policyVersion:policy.version,
    sanctionsPolicyVersion:sanctions.version,
    auditPolicyVersion:audit.version
  };
}

export function evaluateRisk(input: RiskInput): RiskResult {
  const {sanctions}=getComplianceConfig();
  const corridor=corridorOf(input.originCountry,input.destinationCountry,!!input.usNexus);
  const sanctionsState=input.sanctionsState??'PENDING';
  const reasons:string[]=[];
  const evidenceRequirements:string[]=[];
  const stable=!!input.stableFamilyRemittancePattern&&!!input.recurringRecipient;

  if(sanctionsState==='BLOCKED'){
    return finalize(corridor,'PROHIBITED','BLOCK',['SANCTIONS_BLOCK'],['AUTHORITATIVE_SANCTIONS_EVIDENCE'],'NONE');
  }
  if(['PENDING','REVIEW','ERROR'].includes(sanctionsState)){
    return finalize(corridor,'HIGH','HOLD',[`SANCTIONS_${sanctionsState}`],['CURRENT_AUTHORITATIVE_SANCTIONS_RESULT'],'NONE');
  }

  if(sanctions.sanctions_screening.source_policy.require_current_authoritative_source&&!input.sanctionsEvidenceCurrent){
    reasons.push('SANCTIONS_EVIDENCE_NOT_CURRENT');
    evidenceRequirements.push('CURRENT_AUTHORITATIVE_SANCTIONS_RESULT');
  }
  if(!input.jurisdictionReviewCurrent){ reasons.push('JURISDICTION_REVIEW_REQUIRED'); evidenceRequirements.push('CURRENT_JURISDICTION_RULE_SOURCE'); }
  if(!input.kycKybVerified){ reasons.push('KYC_KYB_REQUIRED'); evidenceRequirements.push('IDENTITY_OR_BUSINESS_VERIFICATION'); }
  if(!input.beneficialOwnershipVerified){ reasons.push('BENEFICIAL_OWNERSHIP_REQUIRED'); evidenceRequirements.push('BENEFICIAL_OWNERSHIP_EVIDENCE'); }
  if(input.authorizedReviewRequired&&!input.authorizedReviewComplete){ reasons.push('AUTHORIZED_REVIEW_REQUIRED'); evidenceRequirements.push('AUTHORIZED_COMPLIANCE_OR_LEGAL_REVIEW'); }
  if(input.fraudIndicator) reasons.push('FRAUD_INDICATOR');
  if(input.structuringIndicator) reasons.push('STRUCTURING_INDICATOR');
  if(corridor==='CU-US'&&!input.productControlReviewComplete){ reasons.push('US_PRODUCT_CONTROL_REVIEW_REQUIRED'); evidenceRequirements.push('CURRENT_PRODUCT_AND_EXPORT_CONTROL_REVIEW'); }

  if(reasons.length) return finalize(corridor,'HIGH','HOLD',reasons,evidenceRequirements,stable?'LOWER_ANOMALY_WEIGHT_ONLY':'NONE');
  if(input.transactionAnomaly&&!stable) return finalize(corridor,'MEDIUM','REVIEW',['TRANSACTION_ANOMALY'],['TRANSACTION_CONTEXT_REVIEW'],'NONE');
  return finalize(corridor,stable?'LOW':'MEDIUM','ALLOW_WITH_CONTROLS',['CONTROLS_SATISFIED'],[],stable?'LOWER_ANOMALY_WEIGHT_ONLY':'NONE');
}
