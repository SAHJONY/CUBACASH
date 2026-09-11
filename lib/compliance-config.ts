import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

type DecisionBandConfig = {
  action: string;
  monitoring?: string;
  escalation_target?: string;
  human_review_required?: boolean;
  human_on_call_required?: boolean;
  max_hold_duration?: string;
  pre_review_package?: string;
  override_window?: string;
};

type CompliancePolicy = {
  version: string;
  scope: string;
  decision_bands: Record<'LOW'|'MEDIUM'|'HIGH'|'PROHIBITED', DecisionBandConfig>;
  authoritative_source_requirements: Record<string,string>;
};

type SanctionsPolicy = {
  version: string;
  sanctions_screening: {
    source_policy: { require_current_authoritative_source: boolean; allow_model_only_clearance: boolean };
    name_matching: { confidence_threshold: number; require_secondary_identifier: boolean; secondary_identifiers: string[]; fuzzy_match_assist?: string };
  };
};

type AuditPolicy = {
  version: string;
  audit_logging: { decision_capture: Record<string,boolean>; minimum_fields: string[] };
};

function readYaml<T>(relativePath:string):T {
  const absolutePath=path.join(process.cwd(),relativePath);
  return parse(fs.readFileSync(absolutePath,'utf8')) as T;
}

let cached: {policy:CompliancePolicy; sanctions:SanctionsPolicy; audit:AuditPolicy}|undefined;

export function getComplianceConfig(){
  if(!cached){
    cached={
      policy:readYaml<CompliancePolicy>('compliance/policy.yaml'),
      sanctions:readYaml<SanctionsPolicy>('compliance/sanctions.yaml'),
      audit:readYaml<AuditPolicy>('compliance/audit.yaml')
    };
  }
  return cached;
}
