import {localeOf} from '@/lib/i18n';
import {APP_COMMUNICATIONS,whatsappUrl} from '@/lib/communications';

export default async function HowItWorksPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';
  const support=APP_COMMUNICATIONS.whatsappPrimary;
  return <main className="shell premiumAppShell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav premiumNav"><a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Cómo funciona':'How it works'}</small></a><div className="navlinks"><a href={`/${locale}/quick-start`}>{es?'Guía rápida':'Quick start'}</a><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a><a href={`/${locale}/delivery-providers`}>{es?'Disponibilidad':'Availability'}</a><a href={`/${locale}/faq`}>FAQ</a><a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">{es?'PROCESO CLARO':'CLEAR PROCESS'}</div><h1>{es?'Primero entiendes el costo. Después decides.':'Understand the cost first. Then decide.'}</h1><p className="heroLead">{es?'MY CUBA CASH organiza solicitudes y comparación. Crear una solicitud no mueve dinero ni garantiza una entrega.':'MY CUBA CASH organizes requests and comparison. Creating a request does not move money or guarantee delivery.'}</p><div className="actions"><a className="cta premiumCta" href={`/${locale}/quick-start`}>{es?'Abrir guía rápida segura':'Open safe quick-start guide'}</a></div></div></section>
    <section className="section"><div className="luxuryGrid">
      <article className="luxuryCard"><span>01</span><h3>{es?'Calcula':'Calculate'}</h3><p>{es?'Consulta la tarifa pública de MY CUBA CASH sin registrarte.':'Review the public MY CUBA CASH fee without signing up.'}</p></article>
      <article className="luxuryCard"><span>02</span><h3>{es?'Verifica':'Verify'}</h3><p>{es?'Comprueba si existen proveedores verificados, con precio y disponibilidad publicados.':'Check whether verified providers have published price and availability.'}</p></article>
      <article className="luxuryCard"><span>03</span><h3>{es?'Solicita':'Request'}</h3><p>{es?'Crea una cuenta solo para proteger y guardar los datos de tu solicitud.':'Create an account only to protect and save request data.'}</p></article>
      <article className="luxuryCard"><span>04</span><h3>{es?'Confirma':'Confirm'}</h3><p>{es?'Revisa el costo total, proveedor, método autorizado y controles antes de enviar fondos.':'Review total cost, provider, authorized method and controls before sending funds.'}</p></article>
    </div></section>
    <section className="section"><div className="sectionHead"><div><span className="eyebrow">SOFIA</span><h2>{es?'Sofia es una coordinadora digital.':'Sofia is a digital coordinator.'}</h2></div><p>{es?'Ayuda a explicar opciones, reunir información y coordinar próximos pasos. No es un banco, no aprueba proveedores, no mueve fondos y no sustituye la revisión humana o regulatoria.':'She helps explain options, collect information and coordinate next steps. She is not a bank, does not approve providers, does not move funds and does not replace human or regulatory review.'}</p></div></section>
    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'EJEMPLO':'EXAMPLE'}</span><h2>{es?'Solicitud familiar de $100.':'A $100 family-support request.'}</h2></div></div><div className="featureGrid">
      <article className="feature premiumCard"><h3>$1.25</h3><p>{es?'Tarifa estimada de MY CUBA CASH.':'Estimated MY CUBA CASH fee.'}</p></article>
      <article className="feature premiumCard"><h3>{es?'Por cotizar':'To be quoted'}</h3><p>{es?'Proveedor, entrega, pago y cambio de moneda.':'Provider, delivery, payment and foreign exchange.'}</p></article>
      <article className="feature premiumCard"><h3>{es?'Sin fondos movidos':'No funds moved'}</h3><p>{es?'Calcular o solicitar no completa una transferencia.':'Calculating or requesting does not complete a transfer.'}</p></article>
    </div></section>
    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">{es?'REGLA DE SEGURIDAD':'SAFETY RULE'}</span><h2>{es?'No pagues con información incompleta.':'Do not pay with incomplete information.'}</h2></div><p>{es?'Espera una cotización completa, un proveedor verificado visible, una referencia de transacción y las instrucciones del flujo autorizado. Nunca compartas contraseñas, códigos de acceso o credenciales de pago por WhatsApp.':'Wait for a complete quote, a visible verified provider, a transaction reference and instructions for the authorized flow. Never share passwords, access codes or payment credentials over WhatsApp.'}</p></section>
    <section className="section supportSection"><div className="supportCard"><div><strong>{es?'Soporte humano por WhatsApp Business':'Human support on WhatsApp Business'}</strong><span>{support.display}</span></div><a className="cta premiumCta" href={whatsappUrl(support.e164,es?'Hola, quiero entender cómo funciona MY CUBA CASH antes de crear una cuenta.':'Hello, I want to understand how MY CUBA CASH works before creating an account.')}>{es?'Hacer una pregunta':'Ask a question'}</a></div></section>
  </main>;
}
