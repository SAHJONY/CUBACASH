import {supabaseAdmin} from '@/lib/supabase/admin';
import {supabaseServer} from '@/lib/supabase/server';
import {stripeClient} from '@/lib/stripe';

export const dynamic='force-dynamic';

export async function POST(req:Request){
  const supabase=await supabaseServer();const {data:{user}}=await supabase.auth.getUser();
  if(!user)return Response.json({error:'UNAUTHORIZED'},{status:401});
  try{
    const admin=supabaseAdmin();
    const {data:billing}=await admin.from('provider_billing_accounts').select('stripe_customer_id').eq('user_id',user.id).maybeSingle();
    if(!billing?.stripe_customer_id)return Response.json({error:'BILLING_ACCOUNT_NOT_FOUND'},{status:404});
    const body=await req.json().catch(()=>({}));const locale=String(body.locale??'es')==='en'?'en':'es';
    const base=(process.env.NEXT_PUBLIC_SITE_URL?.trim()||new URL(req.url).origin).replace(/\/$/,'');
    const session=await stripeClient().billingPortal.sessions.create({customer:billing.stripe_customer_id,return_url:`${base}/${locale}/business-pricing`});
    return Response.json({url:session.url},{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    console.error('billing-portal-failed',error instanceof Error?error.message:'unknown');
    return Response.json({error:'BILLING_PORTAL_UNAVAILABLE'},{status:503});
  }
}
