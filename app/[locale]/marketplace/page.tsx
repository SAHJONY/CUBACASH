import {localeOf} from '@/lib/i18n';
import {APP_COMMUNICATIONS,whatsappUrl} from '@/lib/communications';
import {supabaseServer} from '@/lib/supabase/server';

const copy={
  es:{
    badge:'MERCADO PRIVADO + EMPRENDEDORES',title:'Compra, vende y contrata servicios dentro de una red privada más transparente.',lead:'Compara oportunidades reales, identifica negocios verificados y lleva cada solicitud desde el interés inicial hasta una transacción documentada dentro de mycubacash.',sub:'Puedes explorar ofertas públicas, publicar como negocio o pedirle a Sofia que busque y coordine la mejor opción para tu necesidad.',browse:'Explorar oportunidades',post:'Publicar oferta',sofia:'Pedir ayuda a Sofia',payments:'Pagos comerciales',live:'MERCADO ACTIVO',buy:'COMPRAR',sell:'VENDER',service:'SERVICIOS',trust:'CONFIANZA',sectionTitle:'Oportunidades disponibles',sectionText:'Solo aparecen aquí ofertas públicas que ya pasaron por el flujo de publicación de la plataforma. Los datos privados de contacto y pago no se muestran.',empty:'Todavía no hay ofertas públicas disponibles. Puedes publicar una necesidad o pedirle a Sofia que busque una contraparte.',how:'Cómo funciona',howText:'Un flujo simple para compradores, vendedores y prestadores de servicios.',rule:'REGLA DE CONFIANZA',ruleTitle:'La reputación se gana con actividad real',ruleText:'Las calificaciones, disputas, historial y estado de verificación permanecen vinculados a la actividad real de la plataforma. Pagar por un servicio de mycubacash no compra reputación.',verified:'NEGOCIO VERIFICADO',network:'RED PRIVADA',from:'Origen',to:'Destino',price:'Precio objetivo / solicitado',qty:'Cantidad',category:'Categoría',updated:'Actualizado',request:'Solicitar esta oportunidad',noPrice:'Precio a coordinar',home:'Inicio',remit:'Remesas',delivery:'Entrega',account:'Mi cuenta'},
  en:{
    badge:'PRIVATE SECTOR + ENTREPRENEURS',title:'Buy, sell and hire services inside a more transparent private-sector network.',lead:'Compare real opportunities, identify verified businesses and carry each request from first interest to a documented mycubacash transaction.',sub:'Browse public offers, publish as a business, or ask Sofia to source and coordinate the best option for your need.',browse:'Browse opportunities',post:'Post an offer',sofia:'Ask Sofia to help',payments:'Business payments',live:'LIVE MARKETPLACE',buy:'BUY',sell:'SELL',service:'SERVICES',trust:'TRUST',sectionTitle:'Available opportunities',sectionText:'Only public offers that have passed the platform publication workflow appear here. Private contact and payment information stays hidden.',empty:'There are no public offers available yet. Post a requirement or ask Sofia to find a counterparty.',how:'How it works',howText:'A simple flow for buyers, sellers and service providers.',rule:'TRUST RULE',ruleTitle:'Reputation is earned through real activity',ruleText:'Ratings, disputes, history and verification status remain tied to real platform activity. Paying mycubacash for a service never buys reputation.',verified:'VERIFIED BUSINESS',network:'PRIVATE NETWORK',from:'Origin',to:'Destination',price:'Target / asking price',qty:'Quantity',category:'Category',updated:'Updated',request:'Request this opportunity',noPrice:'Price to coordinate',home:'Home',remit:'Remittances',delivery:'Delivery',account:'My account'}
} as const;

export default async function Marketplace({params,searchParams}:{params:Promise<{locale:string}>,searchParams:Promise<{type?:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const l=locale==='es'?copy.es:copy.en;
  const channels=APP_COMMUNICATIONS;
  const query=await searchParams;
  const type=['BUY','SELL','SERVICE'].includes(String(query.type||'').toUpperCase())?String(query.type).toUpperCase():'';
  let offers:any[]=[];
  let unavailable=false;
  try{
    const supabase=await supabaseServer();
    let db=supabase.from('marketplace_public_directory')
      .select('offer_id,offer_type,title,description,category,quantity,unit,currency,target_price,origin_country,destination_country,business_display_name,entrepreneur_friendly,verified_business,published_at,updated_at')
      .order('verified_business',{ascending:false})
      .order('updated_at',{ascending:false})
      .limit(48);
    if(type) db=db.eq('offer_type',type);
    const {data,error}=await db;
    if(error) unavailable=true; else offers=data??[];
  }catch{unavailable=true;}

  const steps=locale==='es'?
    [['1','PUBLICA','El negocio publica una necesidad, una oferta o un servicio.'],['2','COMPARA','Clientes y negocios comparan precio, categoría, ruta y estado de verificación.'],['3','COORDINA','Sofia ayuda con preguntas, matching y contexto de la transacción.'],['4','DOCUMENTA','La operación pasa al flujo correspondiente de mycubacash y mantiene su historial.']]:
    [['1','POST','A business publishes a requirement, offer or service.'],['2','COMPARE','Customers and businesses compare price, category, route and verification state.'],['3','COORDINATE','Sofia helps with questions, matching and transaction context.'],['4','DOCUMENT','The deal moves into the appropriate mycubacash workflow and keeps its history.']];

  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Private Sector Marketplace</small></a>
      <div className="navlinks"><a href={`/${locale}`}>{l.home}</a><a href={`/${locale}/remittances`}>{l.remit}</a><a href={`/${locale}/delivery-providers`}>{l.delivery}</a><a href={`/${locale}/transactions`}>{l.account}</a></div>
      <a className="miniCta" href={whatsappUrl(channels.whatsappPrimary.e164,locale==='es'?'Necesito ayuda con el marketplace de mycubacash.':'I need help with the mycubacash marketplace.')}>WhatsApp Business Sofia</a>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">{l.badge}</div>
        <h1>{l.title}</h1>
        <p className="heroLead">{l.lead}</p><p className="heroSub">{l.sub}</p>
        <div className="actions"><a className="cta" href="#offers">{l.browse}</a><a className="ghost" href={`/${locale}/marketplace/manage`}>{l.post}</a><a className="ghost" href={whatsappUrl(channels.whatsappPrimary.e164,locale==='es'?'Quiero comprar, vender o contratar un servicio. Ayúdame a encontrar la mejor opción.':'I want to buy, sell or hire a service. Help me find the best option.')}>{l.sofia}</a></div>
      </div>
      <aside className="commandPreview" aria-label="Marketplace overview">
        <div className="previewTop"><span className="liveDot"/> {l.live} <span className="previewTag">PRIVATE SECTOR</span></div>
        <div className="previewGrid"><div><span>{l.buy}</span><strong>DEMAND</strong></div><div><span>{l.sell}</span><strong>SUPPLY</strong></div><div><span>{l.service}</span><strong>PROVIDERS</strong></div><div><span>{l.trust}</span><strong>HISTORY + STARS</strong></div></div>
      </aside>
    </section>

    <section className="section" id="offers">
      <div className="sectionHead"><div><span className="eyebrow">MARKETPLACE</span><h2>{l.sectionTitle}</h2></div><p>{l.sectionText}</p></div>
      <div className="actions" style={{marginBottom:24}}><a className={!type?'cta':'ghost'} href={`/${locale}/marketplace#offers`}>{locale==='es'?'Todas':'All'}</a><a className={type==='BUY'?'cta':'ghost'} href={`/${locale}/marketplace?type=BUY#offers`}>{l.buy}</a><a className={type==='SELL'?'cta':'ghost'} href={`/${locale}/marketplace?type=SELL#offers`}>{l.sell}</a><a className={type==='SERVICE'?'cta':'ghost'} href={`/${locale}/marketplace?type=SERVICE#offers`}>{l.service}</a></div>
      {unavailable?<div className="feature"><h3>{locale==='es'?'Marketplace temporalmente no disponible':'Marketplace temporarily unavailable'}</h3><p>{locale==='es'?'Sofia puede ayudarte mientras restablecemos el directorio.':'Sofia can help while the directory is restored.'}</p></div>:
      !offers.length?<div className="feature"><h3>{l.empty}</h3><div className="actions"><a className="cta" href={`/${locale}/marketplace/manage`}>{l.post}</a><a className="ghost" href={whatsappUrl(channels.whatsappPrimary.e164,locale==='es'?'Busca una contraparte para mi necesidad en el marketplace.':'Find a marketplace counterparty for my need.')}>{l.sofia}</a></div></div>:
      <div className="featureGrid">{offers.map(o=><article className="feature" key={o.offer_id}>
        <div className="icon">{o.offer_type==='BUY'?'B':o.offer_type==='SELL'?'S':'SV'}</div>
        <div className="featureMeta">{o.offer_type} · {o.verified_business?l.verified:l.network}</div>
        <h3>{o.title}</h3><p><strong>{o.business_display_name}</strong></p>{o.description&&<p>{o.description}</p>}
        {o.category&&<p><strong>{l.category}:</strong> {o.category}</p>}{o.quantity!==null&&<p><strong>{l.qty}:</strong> {o.quantity} {o.unit||''}</p>}
        <p><strong>{l.price}:</strong> {o.target_price!==null?`${Number(o.target_price).toLocaleString()} ${o.currency}`:l.noPrice}</p>
        {(o.origin_country||o.destination_country)&&<p><strong>{l.from}:</strong> {o.origin_country||'—'} · <strong>{l.to}:</strong> {o.destination_country||'—'}</p>}
        <p><small>{l.updated}: {new Date(o.updated_at).toLocaleDateString(locale==='es'?'es-US':'en-US')}</small></p>
        <div className="actions"><a className="ghost" href={whatsappUrl(channels.whatsappPrimary.e164,locale==='es'?`Me interesa la oportunidad ${o.offer_id}: ${o.title}. Ayúdame a coordinar.`:`I'm interested in marketplace opportunity ${o.offer_id}: ${o.title}. Help me coordinate.`)}>{l.request}</a></div>
      </article>)}</div>}
    </section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{l.how}</span><h2>{l.howText}</h2></div><p>{locale==='es'?'mycubacash mantiene la identidad comercial, la reputación y el contexto de la operación unidos a la plataforma.':'mycubacash keeps business identity, reputation and transaction context attached to the platform.'}</p></div><div className="featureGrid">{steps.map(([n,t,d])=><article className="feature" key={n}><div className="icon">{n}</div><h3>{t}</h3><p>{d}</p></article>)}</div></section>

    <section className="policyBlock"><div><span className="eyebrow">{l.rule}</span><h2>{l.ruleTitle}</h2></div><p>{l.ruleText}</p></section>
    <footer className="footer"><strong>mycubacash.com</strong><span>Private-Sector Marketplace · WhatsApp Business Sofia</span><span>Commerce Network</span></footer>
  </main>;
}
