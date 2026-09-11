export async function GET(){
  return Response.json({
    ok:true,
    service:'sahjony-cubacash',
    version:'0.1.0',
    mode:'standalone-private-economy-platform',
    locales:['es','en','fr','pt','ar'],
    corridors:['CU-CU','CU-WORLD','WORLD-CU','CU-US','WORLD-WORLD'],
    sanctionsProviderConfigured:process.env.SANCTIONS_PROVIDER!=='unconfigured'&&!!process.env.SANCTIONS_PROVIDER,
    custodialFunds:false,
    failClosed:true,
    timestamp:new Date().toISOString()
  });
}
