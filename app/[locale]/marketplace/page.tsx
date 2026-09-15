import {localeOf} from '@/lib/i18n';
import {APP_COMMUNICATIONS,whatsappUrl} from '@/lib/communications';
import {supabaseServer} from '@/lib/supabase/server';

const MEDIA={
  marketplace:'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&fm=jpg&q=86&w=2600',
  family:'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&fm=jpg&q=84&w=2200',
  delivery:'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?auto=format&fit=crop&fm=jpg&q=84&w=2200'
} as const;

const copy={
  es:{badge:'MERCADO PRIVADO + EMPRENDEDORES',title:'Comercio privado diseñado para sentirse simple, premium y confiable.',lead:'Compra, vende y contrata servicios dentro de una red donde identidad comercial, historial y coordinación permanecen conectados.',sub:'Explora oportunidades públicas, publica desde tu negocio o pide a Sofia que coordine una contraparte sin exponer datos privados.',browse:'Explorar oportunidades',post:'Publicar oferta',sofia:'Pedir ayuda a Sofia',live:'MERCADO ACTIVO',buy:'COMPRAR',sell:'VENDER',service:'SERVICIOS',trust:'CONFIANZA',sectionTitle:'Oportunidades disponibles',sectionText:'Solo aparecen ofertas públicas que ya pasaron por el flujo de publicación. Los datos privados de contacto y pago permanecen ocultos.',empty:'Todavía no hay ofertas públicas disponibles. Publica una necesidad o pide a Sofia que encuentre una contraparte.',how:'CÓMO FUNCIONA',howText:'De oportunidad a transacción, sin perder el contexto.',rule:'REGLA DE CONFIANZA',ruleTitle:'La reputación se gana con actividad real',ruleText:'Calificaciones, disputas, historial y verificación permanecen ligados a actividad real. Pagar por un servicio de MY CUBA CASH nunca compra reputación.',verified:'NEGOCIO VERIFICADO',network:'RED PRIVADA',from:'Origen',to:'Destino',price:'Precio objetivo / solicitado',qty:'Cantidad',category:'Categoría',updated:'Actualizado',request:'Solicitar oportunidad',noPrice:'Precio a coordinar',home:'Inicio',remit:'Remesas',delivery:'Entrega',account:'Mi cuenta'},
  en:{badge:'PRIVATE SECTOR + ENTREPRENEURS',title:'Private commerce designed to feel simple, premium and trusted.',lead:'Buy, sell and hire services inside a network where business identity, history and coordination stay connected.',sub:'Browse public opportunities, publish from your business, or ask Sofia to coordinate a counterparty without exposing private data.',browse:'Browse opportunities',post:'Post an offer',sofia:'Ask Sofia to help',live:'LIVE MARKETPLACE',buy:'BUY',sell:'SELL',service:'SERVICES',trust:'TRUST',sectionTitle:'Available opportunities',sectionText:'Only public offers that passed the publication workflow appear here. Private contact and payment information stays hidden.',empty:'There are no public offers available yet. Post a requirement or ask Sofia to find a counterparty.',how:'HOW IT WORKS',howText:'From opportunity to transaction without losing context.',rule:'TRUST RULE',ruleTitle:'Reputation is earned through real activity',ruleText:'Ratings, disputes, history and verification remain tied to real platform activity. Paying MY CUBA CASH never buys reputation.',verified:'VERIFIED BUSINESS',network:'PRIVATE NETWORK',from:'Origin',to:'Destination',price:'Target / asking price',qty:'Quantity',category:'Category',updated:'Updated',request:'Request opportunity',noPrice:'Price to coordinate',home:'Home',remit:'Remittances',delivery:'Delivery',account:'My account'}
} as const;

export default async function Marketplace({params,searchParams}:{params:Promise<{locale:string}>,searchParams:Promise<{type?:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const l=locale==='es'?copy.es:copy.en;
  const channels=APP_COMMUNICATIONS;
  const query=await searchParams;
  const type=['BUY','SELL','SERVICE'].includes(String(query.type||'').toUpperCase())?String(query.type).toUpperCase():'';
  let offers:any[]=[];let unavailable=false;
  try{
    const supabase=await supabaseServer();
    let db=supabase.from('marketplace_public_directory').select('offer_id,offer_type,title,description,category,quantity,unit,currency,target_price,origin_country,destination_country,business_display_name,entrepreneur_friendly,verified_business,published_at,updated_at').order('verified_business',{ascending:false}).order('updated_at',{ascending:false}).limit(48);
    if(type) db=db.eq('offer_type',type);
    const {data,error}=await db;if(error) unavailable=true;else offers=data??[];
  }catch{unavailable=true;}

  const steps=locale==='es'?
    [['1','PUBLICA','Crea una necesidad, oferta o servicio desde tu negocio.'],['2','COMPARA','Evalúa precio, categoría, ruta y verificación.'],['3','COORDINA','Sofia ayuda con matching, preguntas y contexto.'],['4','DOCUMENTA','La operación continúa dentro del flujo MY CUBA CASH y conserva su historial.']]:
    [['1','POST','Create a requirement, offer or service from your business.'],['2','COMPARE','Evaluate price, category, route and verification.'],['3','COORDINATE','Sofia helps with matching, questions and context.'],['4','DOCUMENT','The deal continues inside MY CUBA CASH and keeps its history.']];

  const stories=locale==='es'?
    [
      {kicker:'COMERCIO REAL',title:'Negocios privados presentados con una experiencia de clase mundial',text:'Oportunidades con contexto, precio, ruta y verificación, sin publicar información privada innecesaria.',image:MEDIA.marketplace,alt:'Equipo de emprendedores privados trabajando.'},
      {kicker:'IMPACTO HUMANO',title:'La tecnología conecta la operación con la persona que importa',text:'El sistema conserva el contexto humano mientras protege privacidad, evidencia y controles.',image:MEDIA.family,alt:'Familia reunida en casa.'},
      {kicker:'ÚLTIMA MILLA',title:'Entrega competitiva con mejores opciones para el cliente',text:'Compara cobertura, disponibilidad, ETA y tarifas antes de coordinar el servicio.',image:MEDIA.delivery,alt:'Profesional coordinando una entrega.'}
    ]:
    [
      {kicker:'REAL COMMERCE',title:'Private businesses presented through a world-class experience',text:'Opportunities include context, price, route and verification without publishing unnecessary private information.',image:MEDIA.marketplace,alt:'Entrepreneurial team working together.'},
      {kicker:'HUMAN IMPACT',title:'Technology connects the transaction to the person who matters',text:'The system keeps the human context while protecting privacy, evidence and controls.',image:MEDIA.family,alt:'Family together at home.'},
      {kicker:'LAST MILE',title:'Competitive delivery gives customers better choices',text:'Compare coverage, availability, ETA and posted pricing before coordinating service.',image:MEDIA.delivery,alt:'Professional coordinating delivery.'}
    ];

  return <main className="shell cinematicShell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav premiumNav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>Private Sector Marketplace</small></a>
      <div className="navlinks"><a href={`/${locale}`}>{l.home}</a><a href={`/${locale}/remittances`}>{l.remit}</a><a href={`/${locale}/catalog`}>{locale==='es'?'Catálogo':'Catalog'}</a><a href={`/${locale}/delivery-providers`}>{l.delivery}</a><a href={`/${locale}/transactions`}>{l.account}</a></div>
      <a className="miniCta premiumCta" href={whatsappUrl(channels.whatsappPrimary.e164,locale==='es'?'Necesito ayuda con el marketplace de MY CUBA CASH.':'I need help with the MY CUBA CASH marketplace.')}>WhatsApp Business Sofia</a>
    </nav>

    <section className="cinematicHero">
      <img className="cinematicHeroMedia" src={MEDIA.marketplace} alt={locale==='es'?'Emprendedores privados trabajando.':'Private entrepreneurs working together.'}/><div className="cinematicHeroShade"/>
      <div className="cinematicHeroContent"><div className="eyebrow">{l.badge}</div><h1>{l.title}</h1><p className="heroLead">{l.lead}</p><p className="heroSub">{l.sub}</p>
        <div className="actions"><a className="cta premiumCta" href="#offers">{l.browse}</a><a className="glassCta" href={`/${locale}/marketplace/manage`}>{l.post}</a><a className="glassCta" href={whatsappUrl(channels.whatsappPrimary.e164,locale==='es'?'Quiero comprar, vender o contratar un servicio. Ayúdame a encontrar la mejor opción.':'I want to buy, sell or hire a service. Help me find the best option.')}>{l.sofia}</a></div>
        <div className="cinematicStats"><div><strong>{l.buy}</strong><span>Demand</span></div><div><strong>{l.sell}</strong><span>Supply</span></div><div><strong>{l.service}</strong><span>Providers</span></div><div><strong>{l.trust}</strong><span>History + stars</span></div></div>
      </div>
    </section>

    <section className="section cinematicStorySection"><div className="sectionHead"><div><span className="eyebrow">{locale==='es'?'PERSONAS REALES · COMERCIO REAL':'REAL PEOPLE · REAL COMMERCE'}</span><h2>{locale==='es'?'Una experiencia visual distinta para cada parte de la red.':'A distinct visual experience for every part of the network.'}</h2></div><p>{locale==='es'?'Marketplace, impacto humano y entrega usan contextos visuales distintos para que la aplicación se sienta editorial, premium y auténtica.':'Marketplace, human impact and delivery use distinct visual contexts so the application feels editorial, premium and authentic.'}</p></div>
      <div className="cinematicStoryGrid">{stories.map(story=><article className="cinematicStory" key={story.kicker}><img src={story.image} alt={story.alt} loading="lazy"/><div className="cinematicStoryShade"/><div className="cinematicStoryCopy"><span>{story.kicker}</span><h3>{story.title}</h3><p>{story.text}</p></div></article>)}</div>
    </section>

    <section className="section" id="offers"><div className="sectionHead"><div><span className="eyebrow">MARKETPLACE</span><h2>{l.sectionTitle}</h2></div><p>{l.sectionText}</p></div>
      <div className="actions" style={{marginBottom:28}}><a className={!type?'cta':'ghost'} href={`/${locale}/marketplace#offers`}>{locale==='es'?'Todas':'All'}</a><a className={type==='BUY'?'cta':'ghost'} href={`/${locale}/marketplace?type=BUY#offers`}>{l.buy}</a><a className={type==='SELL'?'cta':'ghost'} href={`/${locale}/marketplace?type=SELL#offers`}>{l.sell}</a><a className={type==='SERVICE'?'cta':'ghost'} href={`/${locale}/marketplace?type=SERVICE#offers`}>{l.service}</a></div>
      {unavailable?<div className="feature premiumCard"><h3>{locale==='es'?'Marketplace temporalmente no disponible':'Marketplace temporarily unavailable'}</h3><p>{locale==='es'?'Sofia puede ayudarte mientras restablecemos el directorio.':'Sofia can help while the directory is restored.'}</p></div>:!offers.length?<div className="feature premiumCard"><h3>{l.empty}</h3><div className="actions"><a className="cta" href={`/${locale}/marketplace/manage`}>{l.post}</a><a className="ghost" href={whatsappUrl(channels.whatsappPrimary.e164,locale==='es'?'Busca una contraparte para mi necesidad en el marketplace.':'Find a marketplace counterparty for my need.')}>{l.sofia}</a></div></div>:<div className="featureGrid">{offers.map(o=><article className="feature premiumCard" key={o.offer_id}><div className="icon">{o.offer_type==='BUY'?'B':o.offer_type==='SELL'?'S':'SV'}</div><div className="featureMeta">{o.offer_type} · {o.verified_business?l.verified:l.network}</div><h3>{o.title}</h3><p><strong>{o.business_display_name}</strong></p>{o.description&&<p>{o.description}</p>}{o.category&&<p><strong>{l.category}:</strong> {o.category}</p>}{o.quantity!==null&&<p><strong>{l.qty}:</strong> {o.quantity} {o.unit||''}</p>}<p><strong>{l.price}:</strong> {o.target_price!==null?`${Number(o.target_price).toLocaleString()} ${o.currency}`:l.noPrice}</p>{(o.origin_country||o.destination_country)&&<p><strong>{l.from}:</strong> {o.origin_country||'—'} · <strong>{l.to}:</strong> {o.destination_country||'—'}</p>}<p><small>{l.updated}: {new Date(o.updated_at).toLocaleDateString(locale==='es'?'es-US':'en-US')}</small></p><div className="actions"><a className="ghost" href={whatsappUrl(channels.whatsappPrimary.e164,locale==='es'?`Me interesa la oportunidad ${o.offer_id}: ${o.title}. Ayúdame a coordinar.`:`I'm interested in marketplace opportunity ${o.offer_id}: ${o.title}. Help me coordinate.`)}>{l.request}</a></div></article>)}</div>}
    </section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{l.how}</span><h2>{l.howText}</h2></div><p>{locale==='es'?'MY CUBA CASH mantiene identidad comercial, reputación y contexto unidos a la operación.':'MY CUBA CASH keeps business identity, reputation and transaction context attached to the operation.'}</p></div><div className="luxuryGrid">{steps.map(([n,t,d])=><article className="luxuryCard" key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></article>)}</div></section>

    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">{l.rule}</span><h2>{l.ruleTitle}</h2></div><p>{l.ruleText}</p></section>
    <footer className="footer premiumFooter"><strong>MY CUBA CASH</strong><span>Private-Sector Marketplace · WhatsApp Business Sofia</span><span>Commerce Network</span></footer>
  </main>;
}
