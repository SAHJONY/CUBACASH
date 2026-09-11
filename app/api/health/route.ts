export async function GET(){
  const sanctionsProviderConfigured=process.env.SANCTIONS_PROVIDER!=='unconfigured'&&!!process.env.SANCTIONS_PROVIDER;
  const databaseConfigured=!!process.env.NEXT_PUBLIC_SUPABASE_URL&&!!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return Response.json({
    ok:true,
    service:'mycubacash.com',
    version:'0.2.0',
    mode:'standalone-private-economy-platform',
    locales:['es','en','fr','pt','ar'],
    corridors:['CU-CU','CU-WORLD','WORLD-CU','CU-US','WORLD-WORLD'],
    policyVersion:'mycubacash-policy-v2',
    sanctionsPolicyVersion:'mycubacash-sanctions-v1',
    auditPolicyVersion:'mycubacash-audit-v1',
    sanctionsProviderConfigured,
    databaseConfigured,
    failClosed:true,
    timestamp:new Date().toISOString()
  },{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
