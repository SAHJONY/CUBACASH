export type MonetizationOffer={
  code:string;
  mode:'subscription'|'payment';
  priceEnv:string;
  planCode?:string;
};

export const MONETIZATION_OFFERS:Record<string,MonetizationOffer>={
  PROVIDER_PRO:{code:'PROVIDER_PRO',mode:'subscription',priceEnv:'STRIPE_PRICE_PROVIDER_PRO',planCode:'PROVIDER_PRO'},
  PROVIDER_BUSINESS:{code:'PROVIDER_BUSINESS',mode:'subscription',priceEnv:'STRIPE_PRICE_PROVIDER_BUSINESS',planCode:'PROVIDER_BUSINESS'},
  PROVIDER_EXPORTER:{code:'PROVIDER_EXPORTER',mode:'subscription',priceEnv:'STRIPE_PRICE_PROVIDER_EXPORTER',planCode:'PROVIDER_EXPORTER'},
  FEATURED_30D:{code:'FEATURED_30D',mode:'payment',priceEnv:'STRIPE_PRICE_FEATURED_30D'},
  SPONSORED_7D:{code:'SPONSORED_7D',mode:'payment',priceEnv:'STRIPE_PRICE_SPONSORED_7D'}
};

export function getMonetizationOffer(code:unknown){
  return MONETIZATION_OFFERS[String(code??'').trim().toUpperCase()]??null;
}
