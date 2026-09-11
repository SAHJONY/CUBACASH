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
  fraudIndicator?: boolean;
  structuringIndicator?: boolean;
  transactionAnomaly?: boolean;
  stableFamilyRemittancePattern?: boolean;
  recurringRecipient?: boolean;
  productControlReviewComplete?: boolean;
};

export function corridorOf(originCountry: string, destinationCountry: string, usNexus=false): Corridor {
  const o=originCountry.toUpperCase(), d=destinationCountry.toUpperCase();
  if(o==='CU'&&d==='CU') return 'CU-CU';
  if((o==='CU'&&d==='US')||(d==='CU'&&o==='US')||((o==='CU'||d==='CU')&&usNexus)) return 'CU-US';
  if(o==='CU') return 'CU-WORLD';
  if(d==='CU') return 'WORLD-CU';
  return 'WORLD-WORLD';
}

export function evaluateRisk(input: RiskInput){
  const corridor=corridorOf(input.originCountry,input.destinationCountry,!!input.usNexus);
  const sanctions=input.sanctionsState??'PENDING';
  const reasons:string[]=[];
  if(sanctions==='BLOCKED') return {corridor,riskBand:'PROHIBITED',decision:'BLOCK' as Decision,reasons:['SANCTIONS_BLOCK'],policyVersion:'cubacash-risk-v1'};
  if(['PENDING','REVIEW','ERROR'].includes(sanctions)) return {corridor,riskBand:'HIGH',decision:'HOLD' as Decision,reasons:[`SANCTIONS_${sanctions}`],policyVersion:'cubacash-risk-v1'};
  if(!input.kycKybVerified) reasons.push('KYC_KYB_REQUIRED');
  if(!input.beneficialOwnershipVerified) reasons.push('BENEFICIAL_OWNERSHIP_REQUIRED');
  if(input.fraudIndicator) reasons.push('FRAUD_INDICATOR');
  if(input.structuringIndicator) reasons.push('STRUCTURING_INDICATOR');
  if(corridor==='CU-US'&&!input.productControlReviewComplete) reasons.push('US_PRODUCT_CONTROL_REVIEW_REQUIRED');
  const stable=!!input.stableFamilyRemittancePattern&&!!input.recurringRecipient;
  if(reasons.length) return {corridor,riskBand:'HIGH',decision:'HOLD' as Decision,reasons,remittanceEffect:stable?'LOWER_ANOMALY_WEIGHT_ONLY':'NONE',policyVersion:'cubacash-risk-v1'};
  if(input.transactionAnomaly&&!stable) return {corridor,riskBand:'MEDIUM',decision:'REVIEW' as Decision,reasons:['TRANSACTION_ANOMALY'],remittanceEffect:'NONE',policyVersion:'cubacash-risk-v1'};
  return {corridor,riskBand:stable?'LOW':'MEDIUM',decision:'ALLOW_WITH_CONTROLS' as Decision,reasons:['CONTROLS_SATISFIED'],remittanceEffect:stable?'LOWER_ANOMALY_WEIGHT_ONLY':'NONE',policyVersion:'cubacash-risk-v1'};
}
