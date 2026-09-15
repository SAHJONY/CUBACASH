import {randomBytes} from 'node:crypto';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {supabaseServer} from '@/lib/supabase/server';
import {getMonetizationOffer} from '@/lib/monetization';
import {stripeClient} from '@/lib/stripe';

export const dynamic='force-dynamic';

function json(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}

export async function POST(req:Request){
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return json({error:'UNAUTHORIZED'},401);
  const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
  if(profile?.role==='platform_owner') return json({error:'OWNER_ACCESS_IS_FREE'},409);

  let body:Record<string,unknown>;
  try{body=await req.json()}catch{return json({error:'INVALID_JSON'},400)}
  const offer=getMonetizationOffer(body.offerCode);
  if(!offer) return json({error:'INVALID_OFFER'},400);

  const {data:membership}=await supabase.from('provider_memberships').select('business_id,status,identity_status,founding_slot,free_until').eq('user_id',user.id).maybeSingle();
  if(!membership) return json({error:'PROVIDER_MEMBERSHIP_REQUIRED'},403);
  if(membership.status!=='ACTIVE'||membership.identity_status!=='VERIFIED') return json({error:'VERIFIED_PROVIDER_REQUIRED'},403);

  let targetId='';
  if(offer.code==='SPONSORED_7D'){
    targetId=String(body.targetId??'');
    const {data:item}=await supabase.from('provider_catalog_items').select('id').eq('id',targetId).eq('provider_user_id',user.id).eq('review_status','APPROVED').maybeSingle();
    if(!item) return json({error:'APPROVED_CATALOG_ITEM_REQUIRED'},400);
  }

  const foundingFree=Boolean(membership.founding_slot&&membership.free_until&&new Date(membership.free_until).getTime()>Date.now());
  if(offer.mode==='subscription'&&foundingFree) return json({error:'FOUNDING_BENEFIT_ACTIVE',freeUntil:membership.free_until},409);

  const {data:billingEntitlement}=await supabase.from('provider_billing_accounts').select('subscription_status,current_period_end').eq('user_id',user.id).maybeSingle();
  const subscriptionActive=Boolean(
    billingEntitlement&&
    ['ACTIVE','TRIALING'].includes(billingEntitlement.subscription_status)&&
    (!billingEntitlement.current_period_end||new Date(billingEntitlement.current_period_end).getTime()>Date.now())
  );
  if(offer.mode==='subscription'&&subscriptionActive) return json({error:'SUBSCRIPTION_ALREADY_ACTIVE'},409);

  if(offer.mode==='payment'){
    if(!foundingFree&&!subscriptionActive) return json({error:'ACTIVE_PLAN_REQUIRED'},402);
  }

  const priceId=process.env[offer.priceEnv]?.trim();
  if(!priceId?.startsWith('price_')) return json({error:'CHECKOUT_NOT_CONFIGURED'},503);
  const foundingCoupon=membership.founding_slot?process.env.STRIPE_FOUNDING_COUPON_ID?.trim():null;
  if(offer.mode==='subscription'&&membership.founding_slot&&!foundingCoupon) return json({error:'FOUNDING_DISCOUNT_NOT_CONFIGURED'},503);

  try{
    const stripe=stripeClient();
    const admin=supabaseAdmin();
    const {data:billing}=await admin.from('provider_billing_accounts').select('stripe_customer_id').eq('user_id',user.id).maybeSingle();
    let customerId=billing?.stripe_customer_id??null;
    if(!customerId){
      const customer=await stripe.customers.create({email:user.email??undefined,metadata:{app_user_id:user.id}});
      customerId=customer.id;
      await admin.from('provider_billing_accounts').upsert({user_id:user.id,stripe_customer_id:customerId,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    }

    const base=(process.env.NEXT_PUBLIC_SITE_URL?.trim()||new URL(req.url).origin).replace(/\/$/,'');
    const locale=String(body.locale??'es').toLowerCase()==='en'?'en':'es';
    const common={app_user_id:user.id,business_id:membership.business_id??'',offer_code:offer.code,target_id:targetId};
    const integrationIdentifier=`mycubacash_${randomBytes(4).toString('hex')}`;
    const session=await stripe.checkout.sessions.create({
      mode:offer.mode,
      customer:customerId,
      client_reference_id:user.id,
      line_items:[{price:priceId,quantity:1}],
      success_url:`${base}/${locale}/business-pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:`${base}/${locale}/business-pricing?checkout=cancelled`,
      metadata:common,
      integration_identifier:integrationIdentifier,
      ...(offer.mode==='subscription'?{
        discounts:foundingCoupon?[{coupon:foundingCoupon}]:undefined,
        subscription_data:{metadata:common}
      }:{payment_intent_data:{metadata:common}})
    });

    if(offer.mode==='payment') await admin.from('monetization_purchases').insert({user_id:user.id,business_id:membership.business_id,offer_code:offer.code,stripe_checkout_session_id:session.id,status:'PENDING',metadata:targetId?{target_id:targetId}:{}});
    if(!session.url) return json({error:'CHECKOUT_URL_MISSING'},502);
    return json({url:session.url});
  }catch(error){
    console.error('billing-checkout-failed',error instanceof Error?error.message:'unknown');
    return json({error:'CHECKOUT_UNAVAILABLE'},503);
  }
}
