import {localeOf} from '@/lib/i18n';
import {APP_COMMUNICATIONS,whatsappUrl} from '@/lib/communications';

const benefits=[
  {es:'Alertas de disponibilidad',en:'Availability alerts',noteEs:'Avisos cuando un proveedor verificado cambia disponibilidad, corredores o condiciones públicas.',noteEn:'Alerts when a verified provider changes availability, corridors, or public conditions.'},
  {es:'Tarifas con total transparencia',en:'Fees with total transparency',noteEs:'Desglose claro entre la tarifa de MY CUBA CASH y los costos del proveedor, sin sorpresas.',noteEn:'A clear split between the MY CUBA CASH fee and provider costs, no surprises.'},
  {es:'Guías paso a paso',en:'Step-by-step guides',noteEs:'Cómo elegir proveedor, qué documentos pedir y cómo verificar una entrega antes de mover dinero.',noteEn:'How to choose a provider, which documents to request, and how to verify a delivery before moving money.'},
  {es:'Historias de la comunidad',en:'Community stories',noteEs:'Experiencias reales de miembros que ya enviaron: qué funcionó y qué evitar.',noteEn:'Real member experiences from people who already sent: what worked and what to avoid.'},
] as const;

const rules=[
  {es:'Cero ofertas informales',en:'Zero informal offers',noteEs:'La comunidad no es un mercado de transferencias entre personas. No se permiten ofertas de envío, tasas callejeras ni intermediarios.',noteEn:'The community is not a person-to-person transfer market. No send offers, street rates, or intermediaries allowed.'},
  {es:'Nunca compartas credenciales',en:'Never share credentials',noteEs:'Sin contraseñas, códigos de un solo uso ni datos de pago en el grupo. Las verificaciones solo ocurren en el flujo seguro de la plataforma.',noteEn:'No passwords, one-time codes, or payment data in the group. Verification only happens inside the platform secure flow.'},
  {es:'Respeto y temas claros',en:'Respect and clear topics',noteEs:'Conversación sobre envíos a Cuba: proveedores, tarifas, entregas y dudas del proceso. Sin spam, sin estafas, sin ataques.',noteEn:'Conversation about sending to Cuba: providers, fees, deliveries, and process questions. No spam, no scams, no attacks.'},
  {es:'Verifica antes de actuar',en:'Verify before acting',noteEs:'Nadie de la comunidad puede pedirte dinero ni representarnos. Confirma todo por el canal oficial publicado en Contacto.',noteEn:'No community member can ask you for money or represent us. Confirm everything through the official channel published on Contact.'},
] as const;

export default async function CommunityPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';
  const support=APP_COMMUNICATIONS.whatsappPrimary;
  const joinMsg=es?'Hola, quiero unirme a la comunidad MY CUBA CASH. Me comprometo a respetar las reglas del grupo.':'Hello, I want to join the MY CUBA CASH community. I agree to respect the group rules.';
  return <main className="shell premiumAppShell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav premiumNav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Comunidad':'Community'}</small></a>
      <div className="navlinks"><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a><a href={`/${locale}/how-it-works`}>{es?'Cómo funciona':'How it works'}</a><a href={`/${locale}/delivery-providers`}>{es?'Proveedores':'Providers'}</a><a href={`/${locale}/faq`}>FAQ</a><a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a></div>
    </nav>

    <section className="hero"><div className="heroCopy">
      <div className="eyebrow">{es?'GRUPO OFICIAL DE LA COMUNIDAD':'OFFICIAL COMMUNITY GROUP'}</div>
      <h1>{es?'La comunidad de quienes envían a Cuba.':'The community for people who send to Cuba.'}</h1>
      <p className="heroLead">{es?'Un espacio para estar al día con proveedores verificados, tarifas transparentes y experiencias reales de envío. La comunidad no mueve dinero: informa, acompaña y protege.':'A space to stay current on verified providers, transparent fees, and real sending experiences. The community moves no money: it informs, supports, and protects.'}</p>
      <p className="heroSub">{es?'Participar en la comunidad es gratis. Crear una solicitud tampoco mueve dinero: tú pagas al proveedor directamente y MY CUBA CASH nunca toca tus fondos.':'Joining the community is free. Creating a request moves no money either: you pay the provider directly and MY CUBA CASH never touches your funds.'}</p>
      <div className="actions"><a className="cta premiumCta" href={whatsappUrl(support.e164,joinMsg)}>{es?'Unirme a la comunidad':'Join the community'}</a><a className="ghost" href={`/${locale}/how-it-works`}>{es?'Entender el proceso':'Understand the process'}</a></div>
    </div></section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'QUÉ RECIBES':'WHAT YOU GET'}</span><h2>{es?'Información útil, sin ruido.':'Useful information, no noise.'}</h2></div><p>{es?'Lo que comparten los miembros y el equipo de MY CUBA CASH en la comunidad.':'What members and the MY CUBA CASH team share in the community.'}</p></div>
      <div className="featureGrid">{benefits.map(b=><article className="feature premiumCard" key={b.en}><div className="eyebrow">{es?b.es.toUpperCase():b.en.toUpperCase()}</div><p>{es?b.noteEs:b.noteEn}</p></article>)}</div>
    </section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'REGLAS DEL GRUPO':'GROUP RULES'}</span><h2>{es?'Cuatro reglas que mantienen la comunidad segura.':'Four rules that keep the community safe.'}</h2></div><p>{es?'Al unirte aceptas estas reglas. Quien las rompa sale del grupo sin aviso.':'By joining you accept these rules. Anyone who breaks them leaves the group without warning.'}</p></div>
      <div className="luxuryGrid">{rules.map((r,i)=><article className="luxuryCard" key={r.en}><span>{i+1}</span><h3>{es?r.es:r.en}</h3><p>{es?r.noteEs:r.noteEn}</p></article>)}</div>
    </section>

    <section className="section supportSection"><div className="supportCard"><div><strong>{es?'Solicita tu acceso':'Request your access'}</strong><span>{es?'Escríbenos por WhatsApp Business y te agregamos a la comunidad.':'Message us on WhatsApp Business and we will add you to the community.'}</span></div><a className="cta premiumCta" href={whatsappUrl(support.e164,joinMsg)}>{es?'Abrir conversación':'Open conversation'}</a></div></section>

    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">{es?'IMPORTANTE':'IMPORTANT'}</span><h2>{es?'La comunidad no mueve dinero.':'The community moves no money.'}</h2></div><p>{es?'MY CUBA CASH es una plataforma tecnológica operada por SAHJONY LLC. La comunidad es un espacio de información y acompañamiento: no procesa pagos, no ofrece transferencias informales y no está afiliada a ningún proveedor. Los proveedores publicados se presentan con fines informativos; debes verificar sus tarifas y condiciones en vivo.':'MY CUBA CASH is a technology platform operated by SAHJONY LLC. The community is a space for information and support: it processes no payments, offers no informal transfers, and is not affiliated with any provider. Published providers are presented for informational purposes; you must verify their live rates and conditions.'}</p></section>

    <footer className="footer premiumFooter"><strong>MY CUBA CASH</strong><span><a href={`/${locale}/about`}>{es?'Quiénes somos':'About'}</a> · <a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a> · <a href={`/${locale}/terms`}>{es?'Términos':'Terms'}</a> · <a href={`/${locale}/privacy`}>{es?'Privacidad':'Privacy'}</a></span><span>{es?'Comunidad oficial':'Official community'}</span></footer>
  </main>;
}
