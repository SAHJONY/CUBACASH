import { screenOfacName } from '@/lib/sanctions/ofac-sls';

export async function POST(request:Request){
  try{
    const body=await request.json() as {name?:string};
    const result=await screenOfacName(body?.name||'');
    const status=result.status==='ERROR'?503:200;
    return Response.json(result,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }catch{
    return Response.json({
      provider:'OFAC_SLS',
      status:'ERROR',
      authoritativeEvidenceCurrent:false,
      notes:['Invalid request or sanctions provider error. Fail closed and hold for review.']
    },{status:400,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
}
