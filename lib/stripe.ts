import 'server-only';
import Stripe from 'stripe';

let client:Stripe|null=null;

export function stripeClient(){
  const key=process.env.STRIPE_SECRET_KEY?.trim();
  if(!key) throw new Error('STRIPE_NOT_CONFIGURED');
  if(!client) client=new Stripe(key,{apiVersion:'2026-07-29.dahlia',typescript:true});
  return client;
}

export function stripeConfigured(){
  return [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_PROVIDER_PRO',
    'STRIPE_PRICE_PROVIDER_BUSINESS',
    'STRIPE_PRICE_PROVIDER_EXPORTER',
    'STRIPE_PRICE_FEATURED_30D',
    'STRIPE_PRICE_SPONSORED_7D',
    'STRIPE_FOUNDING_COUPON_ID'
  ].every(name=>Boolean(process.env[name]?.trim()));
}
