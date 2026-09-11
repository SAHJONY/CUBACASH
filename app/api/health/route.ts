import { hasSupabaseConfig } from '@/lib/supabase/config';

export async function GET(){
  const sanctionsProviderConfigured=process.env.SANCTIONS_PROVIDER!=='unconfigured'&&!!process.env.SANCTIONS_PROVIDER;
  const cryptoProviderConfigured=process.env.CRYPTO_PROVIDER!=='unconfigured'&&!!process.env.CRYPTO_PROVIDER;
  const databaseConfigured=hasSupabaseConfig();

  return Response.json({
    ok:true,
    service:'mycubacash.com',
    version:'0.8.0',
    mode:'family-business-remittance-marketplace',
    locales:['es','en','fr','pt','ar'],
    corridors:['CU-CU','CU-WORLD','WORLD-CU','CU-US','WORLD-WORLD'],
    approvedCryptoAssets:['USDC','USDT','BTC','ETH'],
    cryptoNetworks:['BITCOIN','ETHEREUM','SOLANA'],
    cryptoMode:'PARTNER_ROUTED_NO_PLATFORM_CUSTODY',
    platformRevenueCurrency:'USD',
    policyVersion:'mycubacash-policy-v2',
    sanctionsPolicyVersion:'mycubacash-sanctions-v1',
    auditPolicyVersion:'mycubacash-audit-v1',
    sanctionsProviderConfigured,
    cryptoProviderConfigured,
    databaseConfigured,
    failClosed:true,
    timestamp:new Date().toISOString()
  },{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
