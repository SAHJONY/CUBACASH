import Stripe from 'stripe';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {stripeClient} from '@/lib/stripe';

export const dynamic='force-dynamic';

function json(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}

export async function POST(req:Request){
  const signature=req.headers.get('stripe-signature');
  const secret=process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if(!signature||!secret) return json({error:'WEBHOOK_NOT_CONFIGURED'},503);

  let event:Stripe.Event;
  try{event=stripeClient().webhooks.constructEvent(await req.text(),signature,secret)}
  catch{return json({error:'INVALID_SIGNATURE'},400)}

  try{
    const admin=supabaseAdmin();
    const {error:claimError}=await admin.from('billing_webhook_events').insert({stripe_event_id:event.id,event_type:event.type,status:'PROCESSING'});
    if(claimError?.code==='23505') return json({received:true,duplicate:true});
    if(claimError) throw claimError;

    if(event.type==='checkout.session.completed'){
      const session=event.data.object as Stripe.Checkout.Session;
      const userId=session.metadata?.app_user_id;
      const offerCode=session.metadata?.offer_code;
      if(userId&&offerCode&&session.mode==='payment'){
        const expiresAt=offerCode==='FEATURED_30D'?new Date(Date.now()+30*86400000).toISOString():offerCode==='SPONSORED_7D'?new Date(Date.now()+7*86400000).toISOString():null;
        await admin.from('monetization_purchases').update({status:'PAID',stripe_payment_intent_id:typeof session.payment_intent==='string'?session.payment_intent:null,amount_paid:session.amount_total==null?null:session.amount_total/100,currency:String(session.currency??'usd').toUpperCase(),purchased_at:new Date().toISOString(),entitlement_expires_at:expiresAt,updated_at:new Date().toISOString()}).eq('stripe_checkout_session_id',session.id).eq('user_id',userId);
        if(offerCode==='FEATURED_30D') await admin.from('delivery_provider_public_directory').update({featured_until:expiresAt,updated_at:new Date().toISOString()}).eq('user_id',userId);
        if(offerCode==='SPONSORED_7D'&&session.metadata?.target_id) await admin.from('provider_catalog_items').update({sponsored_until:expiresAt,updated_at:new Date().toISOString()}).eq('id',session.metadata.target_id).eq('provider_user_id',userId);
      }
    }

    if(event.type==='customer.subscription.created'||event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'){
      const subscription=event.data.object as Stripe.Subscription;
      const userId=subscription.metadata?.app_user_id;
      const offerCode=subscription.metadata?.offer_code;
      if(userId){
        const item=subscription.items.data[0];
        const periodEnd=item?.current_period_end?new Date(item.current_period_end*1000).toISOString():null;
        await admin.from('provider_billing_accounts').upsert({user_id:userId,stripe_customer_id:typeof subscription.customer==='string'?subscription.customer:subscription.customer.id,stripe_subscription_id:subscription.id,active_plan_code:offerCode??null,subscription_status:subscription.status.toUpperCase(),current_period_end:periodEnd,cancel_at_period_end:subscription.cancel_at_period_end,updated_at:new Date().toISOString()},{onConflict:'user_id'});
        await admin.from('delivery_provider_profiles').update({updated_at:new Date().toISOString()}).eq('user_id',userId);
      }
    }

    await admin.from('billing_webhook_events').update({status:'PROCESSED',processed_at:new Date().toISOString()}).eq('stripe_event_id',event.id);
    return json({received:true});
  }catch(error){
    console.error('billing-webhook-processing-failed',event.id,error instanceof Error?error.message:'unknown');
    try{await supabaseAdmin().from('billing_webhook_events').delete().eq('stripe_event_id',event.id)}catch{}
    return json({error:'WEBHOOK_PROCESSING_FAILED'},500);
  }
}
