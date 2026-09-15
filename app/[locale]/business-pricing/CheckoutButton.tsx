'use client';

import {useState} from 'react';

const messages:Record<string,{es:string;en:string}>={
  PROVIDER_MEMBERSHIP_REQUIRED:{es:'Primero solicita membresía de proveedor.',en:'Apply for provider membership first.'},
  VERIFIED_PROVIDER_REQUIRED:{es:'La cuenta debe estar verificada antes de pagar.',en:'Your provider account must be verified before payment.'},
  FOUNDING_BENEFIT_ACTIVE:{es:'Tu periodo fundador gratuito sigue activo.',en:'Your free founding period is still active.'},
  FOUNDING_DISCOUNT_NOT_CONFIGURED:{es:'El descuento fundador aún no está configurado; no se realizará ningún cobro.',en:'The founding discount is not configured yet; no charge will be made.'},
  ACTIVE_PLAN_REQUIRED:{es:'Necesitas un plan activo antes de comprar promociones.',en:'You need an active plan before purchasing promotions.'},
  APPROVED_CATALOG_ITEM_REQUIRED:{es:'Selecciona un producto aprobado de tu catálogo.',en:'Select an approved item from your catalog.'},
  SUBSCRIPTION_ALREADY_ACTIVE:{es:'Ya tienes una suscripción activa; adminístrala desde el portal de facturación.',en:'You already have an active subscription; manage it from the billing portal.'},
  CHECKOUT_NOT_CONFIGURED:{es:'Checkout todavía no está habilitado para esta oferta.',en:'Checkout is not enabled for this offer yet.'},
  OWNER_ACCESS_IS_FREE:{es:'La cuenta propietaria tiene acceso gratuito.',en:'The owner account has free access.'}
};

export default function CheckoutButton({offerCode,locale,label,disabled=false,targetId}:{offerCode:string;locale:string;label:string;disabled?:boolean;targetId?:string}){
  const es=locale==='es';
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  async function checkout(){
    setBusy(true);setMessage('');
    const res=await fetch('/api/billing/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({offerCode,locale,targetId})});
    const body=await res.json().catch(()=>({}));
    if(res.status===401){location.href=`/${locale}/auth?next=/${locale}/business-pricing`;return;}
    if(res.ok&&body.url){location.href=body.url;return;}
    const copy=messages[body.error];
    setMessage(copy?(es?copy.es:copy.en):(es?'No se pudo abrir el checkout.':'Unable to open checkout.'));
    setBusy(false);
  }
  return <><button className="cta premiumCta" type="button" disabled={disabled||busy} onClick={checkout}>{busy?(es?'Abriendo checkout…':'Opening checkout…'):label}</button>{message&&<p className="checkoutMessage" role="status">{message}</p>}</>;
}
