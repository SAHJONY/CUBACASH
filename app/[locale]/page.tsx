import { localeOf, locales } from '@/lib/i18n';
import { APP_COMMUNICATIONS, whatsappUrl } from '@/lib/communications';

const MEDIA={
  hero:'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&fm=jpg&q=86&w=2600',
  family:'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&fm=jpg&q=84&w=2200',
  business:'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&fm=jpg&q=84&w=2200',
  service:'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&fm=jpg&q=84&w=2200'
} as const;

export default async function LocaleHome({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const rtl=locale==='ar';
  const channels=APP_COMMUNICATIONS;
  const es=locale==='es';

  return <main className="shell premiumAppShell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav premiumNav appNav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash</div><small>{es?'Familias · Negocios · Marketplace':'Families · Business · Marketplace'}</small></a>
      <div className="navlinks">
        <a href={`/${locale}/start`}>{es?'Enviar apoyo':'Send Support'}</a><a href={`/${locale}/transactions`}>{es?'Rastrear':'Track'}</a><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/delivery-providers`}>{es?'Entrega':'Delivery'}</a><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a>
      </div>
      <div className="navright"><div className="lang">{locales.map(l=><a key={l} href={`/${l}`}>{l.toUpperCase()}</a>)}</div><a className="miniCta premiumCta" href={`/${locale}/auth`}>{es?'Entrar':'Sign In'}</a></div>
    </nav>

    <section className="homeCinematicHero">
      <img className="homeHeroMedia" src={MEDIA.hero} alt={es?'Personas usando tecnología para mantenerse conectadas.':'People using technology to stay connected.'}/>
      <div className="homeHeroOverlay"/>
      <div className="homeHeroContent">
        <div className="eyebrow">{es?'REMESAS · NEGOCIOS · MARKETPLACE PRIVADO':'REMITTANCE · BUSINESS · PRIVATE MARKETPLACE'}</div>
        <h1>{es?'Mover valor debería sentirse simple.':'Moving value should feel simple.'}</h1>
        <p className="heroLead">{es?'Una experiencia premium para apoyar a tu familia, pagar negocios privados, coordinar entregas y seguir cada transacción desde un solo lugar.':'A premium experience to support family, pay private businesses, coordinate delivery and follow every transaction from one place.'}</p>
        <p className="heroSub">{es?'Crea tu solicitud, recibe una referencia mycubacash y continúa con transparencia, privacidad y asistencia de Sofia cuando la necesites.':'Create your request, receive a mycubacash reference and continue with transparency, privacy and Sofia assistance when you need it.'}</p>
        <div className="actions"><a className="cta premiumCta heroPrimary" href={`/${locale}/start`}>{es?'Iniciar transacción':'Start Transaction'}</a><a className="glassCta" href={`/${locale}/transactions`}>{es?'Rastrear transacción':'Track Transaction'}</a><a className="glassCta" href={whatsappUrl(channels.whatsappPrimary.e164)}>{es?'Hablar con Sofia':'Talk to Sofia'}</a></div>
        <div className="heroTrustRail"><span>{es?'Referencia única':'Unique reference'}</span><span>{es?'Privacidad primero':'Privacy first'}</span><span>{es?'Red privada verificada':'Verified private network'}</span><span>{es?'Entrega competitiva':'Competitive delivery'}</span></div>
      </div>
    </section>

    <section className="experienceBand">
      <div className="experienceBandInner"><span>{es?'UNA SOLA EXPERIENCIA':'ONE EXPERIENCE'}</span><strong>{es?'Familia. Comercio. Entrega. Confianza.':'Family. Commerce. Delivery. Trust.'}</strong><p>{es?'Sin convertir cada paso en un proceso técnico.':'Without turning every step into a technical process.'}</p></div>
    </section>

    <section className="section editorialSection">
      <div className="sectionHead"><div><span className="eyebrow">{es?'DISEÑADO ALREDEDOR DE PERSONAS':'DESIGNED AROUND PEOPLE'}</span><h2>{es?'Tres necesidades. Una plataforma.':'Three needs. One platform.'}</h2></div><p>{es?'Cada experiencia conserva su contexto, pero comparte la misma identidad de transacción, historial y capa de confianza.':'Each experience keeps its own context while sharing the same transaction identity, history and trust layer.'}</p></div>
      <div className="editorialGrid">
        <article className="editorialCard editorialLarge"><img src={MEDIA.family} alt={es?'Familia reunida en casa.':'Family together at home.'}/><div className="editorialShade"/><div className="editorialCopy"><span>01 · {es?'FAMILIA':'FAMILY'}</span><h3>{es?'Apoyo familiar con seguimiento claro.':'Family support with clear tracking.'}</h3><p>{es?'Agrega a tu receptor, crea la solicitud y sigue el estado con una referencia única.':'Add your receiver, create the request and track status with one unique reference.'}</p><a className="textLink" href={`/${locale}/start`}>{es?'Comenzar':'Start'} →</a></div></article>
        <article className="editorialCard"><img src={MEDIA.business} alt={es?'Equipo de emprendedores trabajando.':'Entrepreneurial team working together.'}/><div className="editorialShade"/><div className="editorialCopy"><span>02 · {es?'NEGOCIOS':'BUSINESS'}</span><h3>{es?'Pagos comerciales con contexto.':'Business payments with context.'}</h3><p>{es?'Contrapartes, propósito comercial y evidencia permanecen unidos al flujo.':'Counterparties, commercial purpose and evidence remain attached to the workflow.'}</p></div></article>
        <article className="editorialCard"><img src={MEDIA.service} alt={es?'Profesionales coordinando una operación.':'Professionals coordinating an operation.'}/><div className="editorialShade"/><div className="editorialCopy"><span>03 · MARKETPLACE</span><h3>{es?'Compra, vende y contrata con más confianza.':'Buy, sell and hire with more confidence.'}</h3><p>{es?'Descubre oportunidades y proveedores sin exponer datos privados innecesarios.':'Discover opportunities and providers without exposing unnecessary private information.'}</p><a className="textLink" href={`/${locale}/marketplace`}>{es?'Explorar':'Explore'} →</a></div></article>
      </div>
    </section>

    <section className="section productSection">
      <div className="sectionHead"><div><span className="eyebrow">{es?'FLUJO PREMIUM':'PREMIUM FLOW'}</span><h2>{es?'Todo lo importante, sin ruido.':'Everything important, without the noise.'}</h2></div><p>{es?'La interfaz muestra el próximo paso, el estado actual y la acción correcta sin obligarte a entender el backend.':'The interface shows the next step, current status and correct action without making you understand the backend.'}</p></div>
      <div className="luxuryGrid">
        <article className="luxuryCard"><span>01</span><h3>{es?'Crea':'Create'}</h3><p>{es?'Receptor, monto y contexto en un flujo guiado.':'Receiver, amount and context in one guided flow.'}</p></article>
        <article className="luxuryCard"><span>02</span><h3>{es?'Confirma':'Confirm'}</h3><p>{es?'Revisa tarifas y condiciones antes de continuar.':'Review fees and conditions before continuing.'}</p></article>
        <article className="luxuryCard"><span>03</span><h3>{es?'Coordina':'Coordinate'}</h3><p>{es?'Sofia ayuda con pagos, marketplace y entrega.':'Sofia assists with payment, marketplace and delivery.'}</p></article>
        <article className="luxuryCard"><span>04</span><h3>{es?'Rastrea':'Track'}</h3><p>{es?'Un solo ID mantiene cada parte conectada.':'One ID keeps every participant connected.'}</p></article>
      </div>
    </section>

    <section className="section spotlightSection">
      <div className="spotlightPanel"><div><span className="eyebrow">{es?'ENTREGA + ELECCIÓN':'DELIVERY + CHOICE'}</span><h2>{es?'Compara proveedores por valor, no por ruido.':'Compare providers by value, not noise.'}</h2><p>{es?'Cobertura, disponibilidad, ETA y tarifas publicadas pueden compararse sin exponer teléfonos, direcciones exactas o credenciales de pago.':'Coverage, availability, ETA and posted rates can be compared without exposing phones, exact addresses or payment credentials.'}</p></div><div className="actions"><a className="cta premiumCta" href={`/${locale}/delivery-providers`}>{es?'Comparar entregas':'Compare Delivery'}</a></div></div>
    </section>

    <section className="section supportSection" id="contact">
      <div className="sectionHead"><div><span className="eyebrow">SOFIA</span><h2>{es?'Asistencia humana cuando la necesitas.':'Human assistance when you need it.'}</h2></div><p>{es?'Sofia puede ayudar a completar datos, localizar una transacción, coordinar una entrega o responder preguntas del marketplace. Nunca compartas contraseñas ni códigos de acceso por WhatsApp.':'Sofia can help complete information, locate a transaction, coordinate delivery or answer marketplace questions. Never share passwords or login codes over WhatsApp.'}</p></div>
      <div className="supportCard"><div><strong>{channels.whatsappPrimary.label}</strong><span>{channels.whatsappPrimary.display}</span></div><a className="cta premiumCta" href={whatsappUrl(channels.whatsappPrimary.e164)}>{es?'Abrir WhatsApp Business':'Open WhatsApp Business'}</a></div>
    </section>

    <section className="section split cleanPricing"><div><span className="eyebrow">{es?'PRECIOS CLAROS':'CLEAR PRICING'}</span><h2>{es?'Conoce la tarifa antes de empezar.':'Know the fee before you start.'}</h2><p className="sectionCopy">{es?'Consulta la tarifa de plataforma publicada. Cargos separados de pago, FX, settlement o entrega pueden aplicar cuando se revelen para la ruta seleccionada.':'See the published platform fee. Separate payment, FX, settlement or delivery charges may apply when disclosed for the selected route.'}</p></div><div className="actions"><a className="glassCta" href={`/${locale}/fees`}>{es?'Ver tarifas':'View Fees'}</a></div></section>

    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">{es?'CONFIANZA + CONTROL':'TRUST + CONTROL'}</span><h2>{es?'La evidencia gobierna la ejecución.':'Evidence governs execution.'}</h2></div><p>{es?'Identidad, sanciones, fraude, corredor, pago y controles de proveedor permanecen separados de la reputación. Una solicitud puede quedar en espera o ser rechazada cuando los controles necesarios no se satisfacen.':'Identity, sanctions, fraud, corridor, payment and provider controls remain separate from reputation. A request can remain on hold or be rejected when required controls are not satisfied.'}</p></section>

    <footer className="footer premiumFooter"><strong>mycubacash</strong><span><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a> · <a href={`/${locale}/privacy`}>{es?'Privacidad':'Privacy'}</a> · <a href={`/${locale}/terms`}>{es?'Términos':'Terms'}</a></span><span>WhatsApp Business {channels.whatsappPrimary.display}</span></footer>
  </main>;
}
