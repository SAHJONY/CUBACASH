import { hasSupabaseConfig } from '@/lib/supabase/config';
import { sanctionsProviderConfigured } from '@/lib/sanctions/ofac-sls';

export async function GET(){
  const sanctionsProviderReady=sanctionsProviderConfigured();
  const cryptoProviderConfigured=process.env.CRYPTO_PROVIDER!=='unconfigured'&&!!process.env.CRYPTO_PROVIDER;
  const databaseConfigured=hasSupabaseConfig();

  const readinessControls={
    scope:'CUBA_PRIVATE_SECTOR_ONLY',
    cubaPrivateSectorEligibility:'REQUIRES_VERIFIED_BUSINESS_AND_OWNERSHIP_EVIDENCE',
    stateLinkedEntityExclusion:'REQUIRES_POLICY_ENFORCEMENT',
    sanctionsScreening:sanctionsProviderReady?'CONFIGURED_FAIL_CLOSED':'NOT_CONFIGURED',
    disputeHandling:'PARTIAL',
    chargebackHandling:'NOT_CONFIGURED',
    refundReversalControls:'PARTIAL',
    kycKybRecordRetention:'NOT_VERIFIED',
    cryptoSettlement:cryptoProviderConfigured?'CONFIGURED':'NOT_CONFIGURED'
  } as const;

  return Response.json({
    ok:true,
    systemHealth:'HEALTHY',
    businessReadiness:'PARTIAL',
    service:'mycubacash.com',
    version:'0.8.0',
    mode:'family-business-remittance-marketplace',
    businessScope:'CUBA_PRIVATE_SECTOR_ONLY',
    locales:['es','en','fr','pt','ar'],
    corridors:['CU-CU','CU-WORLD','WORLD-CU','CU-US','WORLD-WORLD'],
    approvedCryptoAssets:['USDC','USDT','BTC','ETH'],
    cryptoNetworks:['BITCOIN','ETHEREUM','SOLANA'],
    cryptoMode:'PARTNER_ROUTED_NO_PLATFORM_CUSTODY',
    platformRevenueCurrency:'USD',
    policyVersion:'mycubacash-policy-v2',
    sanctionsPolicyVersion:'mycubacash-sanctions-v1',
    auditPolicyVersion:'mycubacash-audit-v1',
    sanctionsProvider:'OFAC_SLS',
    sanctionsProviderConfigured:sanctionsProviderReady,
    cryptoProviderConfigured,
    databaseConfigured,
    failClosed:true,
    readinessControls,
    timestamp:new Date().toISOString()
  },{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
