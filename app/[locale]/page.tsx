import { localeOf, locales } from '@/lib/i18n';
import { APP_COMMUNICATIONS, whatsappUrl } from '@/lib/communications';
import { supabaseServer } from '@/lib/supabase/server';
import ShareAppButton from '@/components/ShareAppButton';

const MEDIA={
  hero:'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&fm=jpg&q=86&w=2600',
  family:'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&fm=jpg&q=84&w=2200',
  business:'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&fm=jpg&q=84&w=2200',
  service:'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&fm=jpg&q=84&w=2200'
} as const;

export const dynamic='force-dynamic';

export default async function LocaleHome({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const rtl=locale==='ar';
  const es=locale==='es';
  const channels=APP_COMMUNICATIONS;
  let providerCount:number|null=null;
  try{
    const supabase=await supabaseServer();
    const {count,error}=await supabase.from('delivery_provider_public_directory').select('public_provider_id',{count:'exact',head:true}).eq('verified',true);
    if(!error) providerCount=count??0;
  }catch{}
  const networkLive=(providerCount??0)>0;

  return <main className="shell premiumAppShell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav premiumNav appNav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Apoyo familiar claro y verificable':'Clear, verifiable family support'}</small></a>
      <div className="navlinks">
        <a href={`/${locale}/fees`}>{es?'Calcular costo':'Calculate cost'}</a>
        <a href={`/${locale}/how-it-works`}>{es?'Cómo funciona':'How it works'}</a>
        <a href={`/${locale}/delivery-providers`}>{es?'Red de entrega':'Delivery network'}</a>
        <a href={`/${locale}/faq`}>FAQ</a>
        <a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a>
      </div>
      <div className="navright"><div className="lang">{locales.map(l=><a key={l} href={`/${l}`}>{l.toUpperCase()}</a>)}</div><a className="miniCta premiumCta" href={`/${locale}/auth`}>{es?'Entrar':'Sign in'}</a></div>
    </nav>

    <section className="homeCinematicHero">
      <img className="homeHeroMedia" src={MEDIA.hero} alt={es?'Familia reunida y conectada.':'Family together and connected.'}/>
      <div className="homeHeroOverlay"/>
      <div className="homeHeroContent">
        <div className="eyebrow">{es?'APOYO FAMILIAR A CUBA · COSTOS ANTES DEL REGISTRO':'FAMILY SUPPORT TO CUBA · COSTS BEFORE SIGN-UP'}</div>
        <h1>{es?'Envía apoyo a Cuba con claridad desde el primer paso.':'Support family in Cuba with clarity from the first step.'}</h1>
        <p className="heroLead">{es?'Consulta la tarifa de MY CUBA CASH, entiende qué costos faltan por cotizar y verifica el estado de la red antes de crear una cuenta.':'See the MY CUBA CASH fee, understand which costs still require a quote and verify the network status before creating an account.'}</p>
        <p className="heroSub">{networkLive
          ?(es?`La red publica ${providerCount} proveedor${providerCount===1?'':'es'} verificado${providerCount===1?'':'s'}. Cada solicitud requiere confirmación final del proveedor y de los controles aplicables.`:`The directory currently lists ${providerCount} verified provider${providerCount===1?'':'s'}. Every request still requires final provider and control confirmation.`)
          :(es?'Pre-lanzamiento controlado: todavía no hay proveedores verificados publicados. Puedes consultar costos, entender el proceso y hablar con soporte, pero no presentamos una entrega como disponible hasta que exista una opción real y confirmada.':'Controlled pre-launch: no verified providers are publicly listed yet. You can review costs, understand the process and contact support, but we do not present delivery as available until a real option is confirmed.')}</p>
        <div className="actions">
          <a className="cta premiumCta heroPrimary" href={`/${locale}/fees`}>{es?'Calcular mi costo':'Calculate my cost'}</a>
          <a className="glassCta" href={`/${locale}/how-it-works`}>{es?'Ver cómo funciona':'See how it works'}</a>
          <a className="glassCta" href={whatsappUrl(channels.whatsappPrimary.e164,es?'Hola, quiero información sobre MY CUBA CASH. Aún no deseo enviar dinero.':'Hello, I want information about MY CUBA CASH. I am not ready to send money yet.')}>{es?'Hablar con soporte':'Talk to support'}</a>
          <ShareAppButton locale={locale} es={es}/>
        </div>
        <div className="heroTrustRail"><span>{es?'Tarifa familiar: 1.25%':'Family fee: 1.25%'}</span><span>{es?'$1 mínimo · $12 máximo':'$1 minimum · $12 maximum'}</span><span>{es?'Sin mover dinero al solicitar':'No money moves when requesting'}</span><span>{es?'Soporte humano disponible':'Human support available'}</span></div>
      </div>
    </section>

    <section className="experienceBand">
      <div className="experienceBandInner">
        <span>{networkLive?(es?'RED ACTIVA':'ACTIVE NETWORK'):(es?'ESTADO ACTUAL':'CURRENT STATUS')}</span>
        <strong>{networkLive
          ?(es?`${providerCount} proveedor${providerCount===1?'':'es'} verificado${providerCount===1?'':'s'} publicado${providerCount===1?'':'s'}.`:`${providerCount} verified provider${providerCount===1?'':'s'} listed.`)
          :(providerCount===0?(es?'Pre-lanzamiento · 0 proveedores verificados publicados.':'Pre-launch · 0 verified providers listed.'):(es?'La disponibilidad pública no pudo verificarse ahora.':'Public availability could not be verified right now.'))}</strong>
        <p>{es?'No envíes dinero basándote solo en una solicitud. Espera una cotización completa, un proveedor confirmado y el flujo autorizado aplicable.':'Do not send money based only on a request. Wait for a complete quote, a confirmed provider and the applicable authorized payment flow.'}</p>
      </div>
    </section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'EJEMPLO REAL DE NUESTRA TARIFA':'A CONCRETE FEE EXAMPLE'}</span><h2>{es?'Si solicitas $100, nuestra tarifa estimada es $1.25.':'For a $100 request, our estimated fee is $1.25.'}</h2></div><p>{es?'El proveedor, la entrega y el cambio de moneda no están incluidos hasta que aparezcan como costos separados y confirmados. Por eso no mostramos una cantidad final “recibida en Cuba” que todavía no podemos respaldar.':'Provider, delivery and foreign-exchange costs are not included until they are separately disclosed and confirmed. We therefore do not show a final amount “received in Cuba” that cannot yet be supported.'}</p></div>
      <div className="luxuryGrid">
        <article className="luxuryCard"><span>01</span><h3>$100.00</h3><p>{es?'Importe de la solicitud':'Request amount'}</p></article>
        <article className="luxuryCard"><span>02</span><h3>$1.25</h3><p>{es?'Tarifa MY CUBA CASH estimada':'Estimated MY CUBA CASH fee'}</p></article>
        <article className="luxuryCard"><span>03</span><h3>{es?'Pendiente':'Pending'}</h3><p>{es?'Proveedor, entrega y FX':'Provider, delivery and FX'}</p></article>
        <article className="luxuryCard"><span>04</span><h3>{es?'Sin compromiso':'No commitment'}</h3><p>{es?'Crear o calcular no mueve fondos':'Creating or calculating does not move funds'}</p></article>
      </div>
      <div className="actions" style={{marginTop:22}}><a className="cta premiumCta" href={`/${locale}/fees`}>{es?'Calcular otro importe':'Calculate another amount'}</a></div>
    </section>

    <section className="section editorialSection">
      <div className="sectionHead"><div><span className="eyebrow">{es?'DOS CAMINOS, SIN CONFUSIÓN':'TWO CLEAR PATHS'}</span><h2>{es?'Primero familia. Negocios por separado.':'Family first. Business in a separate flow.'}</h2></div><p>{es?'Cada cliente ve solo la información que necesita, sin mezclar remesas familiares con pagos comerciales.':'Each customer sees the information they need without mixing family support with commercial payments.'}</p></div>
      <div className="editorialGrid">
        <article className="editorialCard editorialLarge"><img src={MEDIA.family} alt={es?'Familia reunida en casa.':'Family together at home.'}/><div className="editorialShade"/><div className="editorialCopy"><span>01 · {es?'FAMILIAS':'FAMILIES'}</span><h3>{es?'Apoyo familiar a Cuba.':'Family support to Cuba.'}</h3><p>{es?'Calcula nuestra tarifa, revisa disponibilidad real y crea una solicitud solo cuando estés listo.':'Calculate our fee, review real availability and create a request only when ready.'}</p><a className="textLink" href={`/${locale}/start`}>{es?'Revisar sin registrarme':'Review before sign-up'} →</a></div></article>
        <article className="editorialCard"><img src={MEDIA.business} alt={es?'Emprendedores trabajando.':'Entrepreneurs working.'}/><div className="editorialShade"/><div className="editorialCopy"><span>02 · {es?'NEGOCIOS':'BUSINESS'}</span><h3>{es?'Pagos comerciales y marketplace.':'Commercial payments and marketplace.'}</h3><p>{es?'Un flujo separado para negocios privados, con propósito comercial y controles específicos.':'A separate private-business flow with commercial purpose and specific controls.'}</p><a className="textLink" href={`/${locale}/marketplace`}>{es?'Ver marketplace':'View marketplace'} →</a></div></article>
        <article className="editorialCard"><img src={MEDIA.service} alt={es?'Equipo de soporte coordinando.':'Support team coordinating.'}/><div className="editorialShade"/><div className="editorialCopy"><span>03 · SOFIA</span><h3>{es?'Una coordinadora digital, no una garantía.':'A digital coordinator, not a guarantee.'}</h3><p>{es?'Sofia ayuda a explicar opciones y próximos pasos. No aprueba proveedores, no mueve fondos y no reemplaza los controles humanos o regulatorios.':'Sofia helps explain options and next steps. She does not approve providers, move funds or replace human and regulatory controls.'}</p><a className="textLink" href={`/${locale}/sofia`}>{es?'Conocer a Sofia':'Meet Sofia'} →</a></div></article>
      </div>
    </section>

    <section className="section supportSection" id="contact">
      <div className="sectionHead"><div><span className="eyebrow">{es?'SOPORTE VISIBLE':'VISIBLE SUPPORT'}</span><h2>{es?'Habla con una persona antes de decidir.':'Talk with a person before deciding.'}</h2></div><p>{es?'Nunca compartas contraseñas, códigos de acceso ni credenciales de pago por WhatsApp.':'Never share passwords, access codes or payment credentials over WhatsApp.'}</p></div>
      <div className="supportCard"><div><strong>{channels.whatsappPrimary.label}</strong><span>{channels.whatsappPrimary.display}</span></div><a className="cta premiumCta" href={whatsappUrl(channels.whatsappPrimary.e164,es?'Hola, necesito información sobre tarifas, disponibilidad y el estado de pre-lanzamiento de MY CUBA CASH.':'Hello, I need information about MY CUBA CASH fees, availability and pre-launch status.')}>{es?'Abrir soporte por WhatsApp':'Open WhatsApp support'}</a></div>
    </section>

    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">{es?'IDENTIDAD + LÍMITES':'IDENTITY + LIMITS'}</span><h2>{es?'Una plataforma tecnológica operada por SAHJONY LLC.':'A technology platform operated by SAHJONY LLC.'}</h2></div><p>{es?'MY CUBA CASH no se presenta como banco ni promete una transferencia antes de confirmar un proveedor y el flujo autorizado aplicable. La solicitud inicial no mueve fondos. Identidad, sanciones, fraude, pago, corredor y controles de proveedor pueden detener o rechazar una operación.':'MY CUBA CASH does not present itself as a bank or promise a transfer before a provider and the applicable authorized flow are confirmed. An initial request does not move funds. Identity, sanctions, fraud, payment, corridor and provider controls may hold or reject an operation.'}</p></section>

    <footer className="footer premiumFooter">
      <strong>MY CUBA CASH</strong>
      <span><a href={`/${locale}/about`}>{es?'Quiénes somos':'About'}</a> · <a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a> · <a href={`/${locale}/faq`}>FAQ</a> · <a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a> · <a href={`/${locale}/privacy`}>{es?'Privacidad':'Privacy'}</a> · <a href={`/${locale}/terms`}>{es?'Términos':'Terms'}</a></span>
      <span>{es?'Precios visibles. Estado de red verificable. Sin promesas inventadas.':'Visible pricing. Verifiable network status. No invented promises.'}</span>
    </footer>
  </main>;
}
