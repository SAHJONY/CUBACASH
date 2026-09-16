import {localeOf} from '@/lib/i18n';
import FeeCalculator from './FeeCalculator';

const rows=[
  {es:'Apoyo familiar',en:'Family support',payerEs:'Remitente',payerEn:'Sender',rate:'1.25%',min:'$1.00',max:'$12.00',noteEs:'Para solicitudes elegibles de apoyo familiar.',noteEn:'For eligible family-support requests.'},
  {es:'Pago comercial',en:'Business payment',payerEs:'Remitente',payerEn:'Sender',rate:'1.75%',min:'$5.00',max:'$250.00',noteEs:'Para solicitudes de negocios privados con propósito comercial.',noteEn:'For private-business requests with commercial purpose.'},
  {es:'Comisión de éxito del marketplace',en:'Marketplace success fee',payerEs:'Vendedor',payerEn:'Seller',rate:'2.50%',min:'$2.00',max:'$500.00',noteEs:'Al alcanzar la etapa aplicable que activa la comisión.',noteEn:'When a marketplace transaction reaches the applicable fee-triggering stage.'},
  {es:'Registro de efectivo',en:'Cash transaction record',payerEs:'Solicitante',payerEn:'Requestor',rate:'0.75%',min:'$0.50',max:'$20.00',noteEs:'Para registros y controles elegibles de la plataforma.',noteEn:'For eligible platform recordkeeping and transaction controls.'},
  {es:'Conserjería de envío',en:'Send concierge',payerEs:'Remitente',payerEn:'Sender',rate:'$4.00',min:'$4.00',max:'$4.00',noteEs:'Acompañamiento hecho contigo por WhatsApp: elegimos el proveedor, llenamos los formularios, coordinamos con tu familia y seguimos el envío hasta la entrega confirmada. Tú pagas al proveedor directamente; nunca tocamos tu dinero.',noteEn:'Done-with-you WhatsApp support: we pick the provider, complete the forms, coordinate with your family and track until confirmed delivery. You pay the provider directly; we never touch your money.'},
] as const;

export default async function FeesPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';
  return <main className="shell premiumAppShell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav premiumNav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Tarifas públicas':'Public pricing'}</small></a>
      <div className="navlinks"><a href={`/${locale}/how-it-works`}>{es?'Cómo funciona':'How it works'}</a><a href={`/${locale}/delivery-providers`}>{es?'Disponibilidad':'Availability'}</a><a href={`/${locale}/faq`}>FAQ</a><a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a></div>
    </nav>

    <section className="hero"><div className="heroCopy">
      <div className="eyebrow">{es?'PRECIOS ANTES DEL REGISTRO':'PRICING BEFORE SIGN-UP'}</div>
      <h1>{es?'Calcula nuestra tarifa sin crear una cuenta.':'Calculate our fee without creating an account.'}</h1>
      <p className="heroLead">{es?'El porcentaje, el mínimo y el máximo de MY CUBA CASH son públicos. Nunca confundimos nuestra tarifa con el importe que recibirá la persona en Cuba.':'The MY CUBA CASH percentage, minimum and maximum are public. We never confuse our fee with what a receiver in Cuba will obtain.'}</p>
      <p className="heroSub">{es?'Los costos de proveedor, entrega, método de pago y cambio de moneda no se conocen hasta que exista una opción real. Se muestran por separado antes de cualquier compromiso.':'Provider, delivery, payment-method and foreign-exchange costs are unknown until a real option exists. They are shown separately before any commitment.'}</p>
      <div className="actions"><a className="cta premiumCta" href="#calculator">{es?'Calcular ahora':'Calculate now'}</a><a className="ghost" href={`/${locale}/how-it-works`}>{es?'Entender el proceso':'Understand the process'}</a></div>
    </div></section>

    <section className="section" id="calculator"><FeeCalculator es={es}/></section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'TARIFARIO PUBLICADO':'PUBLISHED FEE SCHEDULE'}</span><h2>{es?'Porcentaje simple con mínimo y máximo.':'Simple percentages with minimums and caps.'}</h2></div><p>{es?'La tarifa se calcula sobre el importe de la solicitud y se limita por los valores publicados.':'The fee is calculated from the request amount and bounded by the published values.'}</p></div>
      <div className="featureGrid">{rows.map(row=><article className="feature premiumCard" key={row.en}><div className="eyebrow">{es?row.es.toUpperCase():row.en.toUpperCase()}</div><h3 style={{fontSize:'2rem',margin:'8px 0'}}>{row.rate}</h3><p><strong>{es?'Pagador':'Payer'}:</strong> {es?row.payerEs:row.payerEn}</p><p><strong>{es?'Mínimo':'Minimum'}:</strong> {row.min} · <strong>{es?'Máximo':'Maximum'}:</strong> {row.max}</p><p>{es?row.noteEs:row.noteEn}</p></article>)}</div>
    </section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'EJEMPLO DE $100':'$100 EXAMPLE'}</span><h2>{es?'Lo que sabemos y lo que falta.':'What is known and what is still pending.'}</h2></div></div>
      <div className="luxuryGrid">
        <article className="luxuryCard"><span>1</span><h3>$100.00</h3><p>{es?'Importe solicitado':'Requested amount'}</p></article>
        <article className="luxuryCard"><span>2</span><h3>$1.25</h3><p>{es?'Tarifa familiar estimada de MY CUBA CASH':'Estimated MY CUBA CASH family fee'}</p></article>
        <article className="luxuryCard"><span>3</span><h3>{es?'Pendiente':'Pending'}</h3><p>{es?'Tipo de cambio, entrega y proveedor':'Exchange rate, delivery and provider'}</p></article>
        <article className="luxuryCard"><span>4</span><h3>{es?'No cotizado':'Not quoted'}</h3><p>{es?'Importe final que recibe la familia':'Final amount the family receives'}</p></article>
      </div>
    </section>

    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">{es?'IMPORTANTE':'IMPORTANT'}</span><h2>{es?'Calcular o crear una solicitud no mueve dinero.':'Calculating or creating a request does not move money.'}</h2></div><p>{es?'MY CUBA CASH es una plataforma tecnológica operada por SAHJONY LLC. No envíes fondos hasta recibir una cotización completa, la confirmación del proveedor y las instrucciones del flujo autorizado aplicable.':'MY CUBA CASH is a technology platform operated by SAHJONY LLC. Do not send funds until you receive a complete quote, provider confirmation and instructions for the applicable authorized flow.'}</p></section>

    <footer className="footer premiumFooter"><strong>MY CUBA CASH</strong><span><a href={`/${locale}/about`}>{es?'Quiénes somos':'About'}</a> · <a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a> · <a href={`/${locale}/terms`}>{es?'Términos':'Terms'}</a> · <a href={`/${locale}/privacy`}>{es?'Privacidad':'Privacy'}</a></span><span>{es?'Tarifas de plataforma en USD':'Platform fees in USD'}</span></footer>
  </main>;
}
