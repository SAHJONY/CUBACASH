import {APP_COMMUNICATIONS,whatsappUrl} from '@/lib/communications';
import {localeOf} from '@/lib/i18n';
import {stripeConfigured} from '@/lib/stripe';
import {supabaseServer} from '@/lib/supabase/server';
import CheckoutButton from './CheckoutButton';
import BillingPortalButton from './BillingPortalButton';

const plans=[
  {code:'PROVIDER_PRO',name:'Pro',price:29,items:100},
  {code:'PROVIDER_BUSINESS',name:'Business',price:99,items:500},
  {code:'PROVIDER_EXPORTER',name:'Exporter',price:299,items:2000}
] as const;

export default async function BusinessPricing({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<{checkout?:string}>}){
  const {locale:raw}=await params;const locale=localeOf(raw);const es=locale==='es';
  const query=await searchParams;
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  let membership:any=null,billing:any=null,owner=false;
  if(user){
    const [{data:m},{data:b},{data:p}]=await Promise.all([
      supabase.from('provider_memberships').select('*').eq('user_id',user.id).maybeSingle(),
      supabase.from('provider_billing_accounts').select('*').eq('user_id',user.id).maybeSingle(),
      supabase.from('profiles').select('role').eq('id',user.id).maybeSingle()
    ]);
    membership=m;billing=b;owner=p?.role==='platform_owner';
  }
  const freeActive=Boolean(membership?.founding_slot&&membership?.free_until&&new Date(membership.free_until).getTime()>Date.now());
  const support=APP_COMMUNICATIONS.whatsappPrimary;
  const checkoutReady=stripeConfigured();

  return <main className="shell premiumAppShell">
    <nav className="nav premiumNav"><a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Monetización comercial':'Business monetization'}</small></a><div className="navlinks"><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/providers/join`}>Founding 100</a><a href={`/${locale}/fees`}>{es?'Tarifas transaccionales':'Transaction fees'}</a></div></nav>

    <section className="hero"><div className="heroCopy"><span className="eyebrow">{es?'PLANES PARA PROVEEDORES':'SUPPLIER PLANS'}</span><h1>{es?'Paga por crecer, no por comprar reputación.':'Pay to grow—not to buy trust.'}</h1><p className="heroLead">{es?'Planes claros para publicar catálogo, promocionar ofertas y acceder a oportunidades comerciales. La identidad y la verificación nunca se venden.':'Clear plans to publish catalog, promote offers and access commercial opportunities. Identity and verification are never for sale.'}</p><p className="heroSub">{es?'Todos los cobros de plataforma se denominan en USD y permanecen separados del dinero principal de compradores, proveedores y remesas.':'All platform charges are denominated in USD and remain separate from buyer, supplier and remittance principal.'}</p></div></section>

    {query.checkout==='success'&&<section className="section"><div className="feature premiumCard"><h2>{es?'Pago recibido para procesamiento':'Payment received for processing'}</h2><p>{es?'El acceso se activa únicamente después de que el webhook firmado confirme el pago o la suscripción.':'Access activates only after the signed webhook confirms the payment or subscription.'}</p></div></section>}
    {query.checkout==='cancelled'&&<section className="section"><div className="feature premiumCard"><h2>{es?'Checkout cancelado':'Checkout cancelled'}</h2><p>{es?'No se registró ningún pago nuevo.':'No new payment was recorded.'}</p></div></section>}

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">FOUNDING 100</span><h2>{es?'La primera cohorte obtiene la mejor economía.':'The first cohort gets the best economics.'}</h2></div><p>{es?'Los primeros 100 proveedores activados y verificados reciben 12 meses sin mensualidad y 25% de descuento permanente después.':'The first 100 activated and verified suppliers receive 12 months with no subscription fee and a permanent 25% discount afterward.'}</p></div><div className="pricingFounder"><div><strong>$0</strong><span>{es?'por 12 meses':'for 12 months'}</span></div><div><strong>25%</strong><span>{es?'descuento permanente':'lifetime discount'}</span></div><a className="cta premiumCta" href={`/${locale}/providers/join`}>{es?'Solicitar verificación':'Apply for verification'}</a></div></section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'MENSUALIDAD':'MONTHLY'}</span><h2>{es?'Planes para cada etapa del proveedor.':'Plans for each supplier stage.'}</h2></div><p>{es?'La facturación comienza solo mediante Checkout confirmado. Los límites indicados se aplican al catálogo aprobado.':'Billing begins only through confirmed Checkout. Listed limits apply to approved catalog capacity.'}</p></div><div className="pricingGrid">{plans.map(plan=><article className={`pricingCard ${plan.code==='PROVIDER_BUSINESS'?'pricingCardFeatured':''}`} key={plan.code}><span className="eyebrow">{plan.name}</span><h3>${plan.price}<small>/{es?'mes':'month'}</small></h3><ul><li>{es?`Hasta ${plan.items} productos o servicios`:`Up to ${plan.items} products or services`}</li><li>{es?'Perfil comercial verificado':'Verified business profile'}</li><li>{es?'Publicación y gestión de catálogo':'Catalog publishing and management'}</li><li>{es?'Comisión de éxito: 2.5% cuando aplique':'2.5% success fee when applicable'}</li></ul><CheckoutButton offerCode={plan.code} locale={locale} label={owner?(es?'Acceso propietario $0':'Owner access $0'):freeActive?(es?'Incluido por fundador':'Included with founding benefit'):(es?'Elegir plan':'Choose plan')} disabled={!checkoutReady||owner||freeActive}/></article>)}</div></section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'INGRESOS ADICIONALES':'ADDITIONAL REVENUE'}</span><h2>{es?'Promoción, oportunidades y comercio.':'Promotion, opportunities and trade.'}</h2></div><p>{es?'Los add-ons no cambian el estado de verificación ni garantizan ventas.':'Add-ons never change verification status or guarantee sales.'}</p></div><div className="featureGrid"><article className="feature premiumCard"><h3>{es?'Proveedor destacado · 30 días':'Featured Supplier · 30 days'}</h3><p><strong>$49</strong></p><p>{es?'Visibilidad promocional temporal dentro del directorio, claramente identificada como destacada.':'Temporary promotional visibility in the directory, clearly identified as featured.'}</p><CheckoutButton offerCode="FEATURED_30D" locale={locale} label={es?'Comprar promoción':'Buy promotion'} disabled={!checkoutReady||owner}/></article><article className="feature premiumCard"><h3>{es?'Producto patrocinado · 7 días':'Sponsored Product · 7 days'}</h3><p><strong>$25</strong></p><p>{es?'Elige un artículo aprobado desde tu catálogo. No aumenta su calificación ni verificación.':'Choose an approved item from your catalog. Sponsorship does not increase its rating or verification.'}</p><a className="ghost" href={`/${locale}/catalog/sponsor`}>{es?'Elegir producto':'Choose product'}</a></article><article className="feature premiumCard"><h3>{es?'RFQ calificado aceptado':'Accepted qualified RFQ'}</h3><p><strong>$25</strong></p><p>{es?'Solo se factura después de que el proveedor acepta recibir la oportunidad validada.':'Charged only after the supplier accepts the validated opportunity.'}</p><a className="ghost" href={whatsappUrl(support.e164,es?'Quiero activar oportunidades RFQ para mi negocio.':'I want to activate RFQ opportunities for my business.')}>{es?'Activar RFQs':'Activate RFQs'}</a></article><article className="feature premiumCard"><h3>{es?'Servicios de comercio':'Trade services'}</h3><p><strong>{es?'Desde $500':'Starting at $500'}</strong></p><p>{es?'Sourcing, verificación comercial, documentación y coordinación logística bajo alcance cotizado.':'Sourcing, business verification, documentation and logistics coordination under a quoted scope.'}</p><a className="ghost" href={whatsappUrl(support.e164,es?'Necesito una cotización de servicios de comercio para mi empresa.':'I need a trade-services quote for my company.')}>{es?'Solicitar cotización':'Request quote'}</a></article></div></section>

    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">{es?'CONTROL DE COBRO':'PAYMENT CONTROL'}</span><h2>{es?'Ningún botón cobra sin configuración real.':'No button charges without live configuration.'}</h2>{billing?.stripe_customer_id&&<BillingPortalButton locale={locale}/>}</div><p>{owner?(es?'Tu cuenta propietaria conserva acceso interno sin costo.':'Your owner account retains free internal access.'):checkoutReady?(es?`Checkout está configurado. Estado actual: ${billing?.subscription_status??'sin suscripción activa'}.`:`Checkout is configured. Current status: ${billing?.subscription_status??'no active subscription'}.`):(es?'Los precios están publicados, pero Checkout permanece cerrado hasta configurar Stripe, sus productos, precios y webhook firmados.':'Prices are published, but Checkout stays closed until Stripe products, prices and the signed webhook are configured.')}</p></section>
  </main>;
}
