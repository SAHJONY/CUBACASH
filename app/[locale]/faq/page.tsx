import {localeOf} from '@/lib/i18n';

const items=[
  ['¿MY CUBA CASH es un banco?','No. Es una plataforma tecnológica operada por SAHJONY LLC para organizar solicitudes, comparación, referencias y coordinación.'],
  ['¿SAHJONY LLC aparece aquí como transmisor de dinero con licencia?','No. Este sitio no publica ni afirma una licencia de transmisor de dinero para SAHJONY LLC. Cuando una actividad regulada requiera transmisión, custodia, cambio de moneda o liquidación, debe ejecutarse mediante un proveedor debidamente autorizado y el flujo aplicable.'],
  ['¿Crear una solicitud mueve dinero?','No. Crear o guardar una solicitud no completa una transferencia ni autoriza un débito.'],
  ['¿Puedo enviar USD o stablecoins ahora?','No envíes USD, USDC ni otro activo hasta que exista una cotización completa, un proveedor verificado y un método autorizado dentro del flujo seguro de MY CUBA CASH.'],
  ['¿Cuánto cuesta una solicitud familiar?','La tarifa publicada de MY CUBA CASH es 1.25% del importe, con mínimo de $1 y máximo de $12. Otros costos se muestran por separado cuando exista una cotización real.'],
  ['¿Cuánto recibe mi familiar en Cuba?','No mostramos una cifra final hasta contar con tipo de cambio, proveedor, entrega y método de pago confirmados.'],
  ['¿Hay proveedores disponibles ahora?','El directorio público muestra el estado real. Si indica 0 proveedores, la red está en pre-lanzamiento y no hay una opción publicada para elegir.'],
  ['¿Quién es Sofia?','Sofia es la coordinadora digital de la plataforma. Explica opciones y próximos pasos; no aprueba proveedores, no mueve fondos y no reemplaza controles humanos o regulatorios.'],
  ['¿Por qué se necesita una cuenta?','Solo para guardar y proteger información del remitente, receptor y solicitud. Las tarifas, el proceso, la disponibilidad pública y el soporte son visibles sin cuenta.'],
  ['¿Qué nunca debo compartir por WhatsApp?','Contraseñas, códigos de acceso, credenciales de pago, documentos completos o información que la plataforma no haya solicitado mediante un flujo seguro.'],
  ['¿Quién opera MY CUBA CASH?','MY CUBA CASH es operada por SAHJONY LLC. Juan Gonzalez es Chairman and owner of SAHJONY LLC, y Sofia Smith, Executive Manager of SAHJONY LLC, es el frente de concierge: coordina solicitudes y explica opciones y próximos pasos.'],
  ['¿Cuál es la tarifa completa de la plataforma?','Remesa familiar: 1.25% del importe (mínimo $1, máximo $12). Pagos de negocios: 1.75%. Marketplace: 2.50% cobrado al vendedor. Piloto concierge MIPYME: $25 por pago coordinado al proveedor. Otros costos del proveedor o la entrega se muestran por separado cuando exista una cotización real.'],
  ['¿Cómo funciona el servicio concierge?','Es coordinación hecha contigo: ayudamos a organizar el pago, el proveedor y los documentos paso a paso, y el cliente paga directamente al banco o proveedor. Nunca tomamos custodia de tu dinero. El piloto concierge MIPYME tiene una tarifa fija de $25 por pago coordinado.'],
  ['¿Quién toca mi dinero en MY CUBA CASH?','Nadie en la plataforma. MY CUBA CASH nunca toma custodia del principal: el cliente paga directamente al banco, proveedor o prestador del servicio. Si un pago requiere transmisión regulada, se ejecuta mediante un proveedor debidamente autorizado y el flujo aplicable.'],
  ['¿Qué significa que la plataforma esté en beta?','Que funciona con proveedores reales verificados y costos visibles, pero la red pública está en pre-lanzamiento: la disponibilidad, las funciones y los tiempos pueden cambiar, y algunas opciones aparecen como no disponibles hasta ser confirmadas.']
] as const;

export default async function FaqPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';
  return <main className="shell premiumAppShell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav premiumNav"><a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>FAQ</small></a><div className="navlinks"><a href={`/${locale}/quick-start`}>{es?'Guía rápida':'Quick start'}</a><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a><a href={`/${locale}/how-it-works`}>{es?'Cómo funciona':'How it works'}</a><a href={`/${locale}/delivery-providers`}>{es?'Disponibilidad':'Availability'}</a><a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">{es?'PREGUNTAS FRECUENTES':'FREQUENTLY ASKED QUESTIONS'}</div><h1>{es?'Respuestas directas antes de registrarte.':'Direct answers before you sign up.'}</h1><p className="heroLead">{es?'Si una respuesta depende de un proveedor, precio o autorización todavía no confirmados, lo decimos claramente.':'When an answer depends on a provider, price or authorization that is not yet confirmed, we say so clearly.'}</p></div></section>
    <section className="section"><div className="featureGrid">{items.map(([question,answer])=><article className="feature premiumCard" key={question}><h3>{es?question:({
      '¿MY CUBA CASH es un banco?':'Is MY CUBA CASH a bank?',
      '¿SAHJONY LLC aparece aquí como transmisor de dinero con licencia?':'Does this site present SAHJONY LLC as a licensed money transmitter?',
      '¿Crear una solicitud mueve dinero?':'Does creating a request move money?',
      '¿Puedo enviar USD o stablecoins ahora?':'Can I send USD or stablecoins now?',
      '¿Cuánto cuesta una solicitud familiar?':'What does a family-support request cost?',
      '¿Cuánto recibe mi familiar en Cuba?':'How much will my family receive in Cuba?',
      '¿Hay proveedores disponibles ahora?':'Are providers available now?',
      '¿Quién es Sofia?':'Who is Sofia?',
      '¿Por qué se necesita una cuenta?':'Why is an account needed?',
      '¿Qué nunca debo compartir por WhatsApp?':'What should I never share over WhatsApp?',
      '¿Quién opera MY CUBA CASH?':'Who operates MY CUBA CASH?',
      '¿Cuál es la tarifa completa de la plataforma?':'What is the platform’s full fee schedule?',
      '¿Cómo funciona el servicio concierge?':'How does the concierge service work?',
      '¿Quién toca mi dinero en MY CUBA CASH?':'Who touches my money in MY CUBA CASH?',
      '¿Qué significa que la plataforma esté en beta?':'What does it mean that the platform is in beta?'
    } as Record<string,string>)[question]}</h3><p>{es?answer:({
      'No. Es una plataforma tecnológica operada por SAHJONY LLC para organizar solicitudes, comparación, referencias y coordinación.':'No. It is a technology platform operated by SAHJONY LLC to organize requests, comparison, references and coordination.',
      'No. Este sitio no publica ni afirma una licencia de transmisor de dinero para SAHJONY LLC. Cuando una actividad regulada requiera transmisión, custodia, cambio de moneda o liquidación, debe ejecutarse mediante un proveedor debidamente autorizado y el flujo aplicable.':'No. This site does not publish or claim a money-transmitter license for SAHJONY LLC. When regulated activity requires money transmission, custody, currency exchange or settlement, it must be performed through an appropriately authorized provider and the applicable flow.',
      'No. Crear o guardar una solicitud no completa una transferencia ni autoriza un débito.':'No. Creating or saving a request does not complete a transfer or authorize a debit.',
      'No envíes USD, USDC ni otro activo hasta que exista una cotización completa, un proveedor verificado y un método autorizado dentro del flujo seguro de MY CUBA CASH.':'Do not send USD, USDC or another asset until a complete quote, a verified provider and an authorized method are available inside the secure MY CUBA CASH flow.',
      'La tarifa publicada de MY CUBA CASH es 1.25% del importe, con mínimo de $1 y máximo de $12. Otros costos se muestran por separado cuando exista una cotización real.':'The published MY CUBA CASH fee is 1.25% of the amount, with a $1 minimum and $12 cap. Other costs are shown separately when a real quote exists.',
      'No mostramos una cifra final hasta contar con tipo de cambio, proveedor, entrega y método de pago confirmados.':'We do not show a final amount until the exchange rate, provider, delivery and payment method are confirmed.',
      'El directorio público muestra el estado real. Si indica 0 proveedores, la red está en pre-lanzamiento y no hay una opción publicada para elegir.':'The public directory shows the real status. If it shows 0 providers, the network is in pre-launch and there is no published option to choose.',
      'Sofia es la coordinadora digital de la plataforma. Explica opciones y próximos pasos; no aprueba proveedores, no mueve fondos y no reemplaza controles humanos o regulatorios.':'Sofia is the platform digital coordinator. She explains options and next steps; she does not approve providers, move funds or replace human and regulatory controls.',
      'Solo para guardar y proteger información del remitente, receptor y solicitud. Las tarifas, el proceso, la disponibilidad pública y el soporte son visibles sin cuenta.':'Only to save and protect sender, receiver and request information. Fees, process, public availability and support are visible without an account.',
      'Contraseñas, códigos de acceso, credenciales de pago, documentos completos o información que la plataforma no haya solicitado mediante un flujo seguro.':'Passwords, access codes, payment credentials, full documents or information the platform has not requested through a secure flow.',
      'MY CUBA CASH es operada por SAHJONY LLC. Juan Gonzalez es Chairman and owner of SAHJONY LLC, y Sofia Smith, Executive Manager of SAHJONY LLC, es el frente de concierge: coordina solicitudes y explica opciones y próximos pasos.':'MY CUBA CASH is operated by SAHJONY LLC. Juan Gonzalez is Chairman and owner of SAHJONY LLC, and Sofia Smith, Executive Manager of SAHJONY LLC, is the concierge front: she coordinates requests and explains options and next steps.',
      'Remesa familiar: 1.25% del importe (mínimo $1, máximo $12). Pagos de negocios: 1.75%. Marketplace: 2.50% cobrado al vendedor. Piloto concierge MIPYME: $25 por pago coordinado al proveedor. Otros costos del proveedor o la entrega se muestran por separado cuando exista una cotización real.':'Family remittance: 1.25% of the amount ($1 minimum, $12 maximum). Business payments: 1.75%. Marketplace: 2.50% charged to the seller. MIPYME concierge pilot: $25 per coordinated supplier payment. Other provider or delivery costs are shown separately when a real quote exists.',
      'Es coordinación hecha contigo: ayudamos a organizar el pago, el proveedor y los documentos paso a paso, y el cliente paga directamente al banco o proveedor. Nunca tomamos custodia de tu dinero. El piloto concierge MIPYME tiene una tarifa fija de $25 por pago coordinado.':'It is done-with-you coordination: we help organize the payment, the provider and the documents step by step, and the customer pays the bank or provider directly. We never take custody of your money. The MIPYME concierge pilot has a flat $25 fee per coordinated payment.',
      'Nadie en la plataforma. MY CUBA CASH nunca toma custodia del principal: el cliente paga directamente al banco, proveedor o prestador del servicio. Si un pago requiere transmisión regulada, se ejecuta mediante un proveedor debidamente autorizado y el flujo aplicable.':'Nobody on the platform. MY CUBA CASH never takes custody of the principal: the customer pays the bank, provider or service provider directly. When a payment requires regulated transmission, it is executed through an appropriately authorized provider and the applicable flow.',
      'Que funciona con proveedores reales verificados y costos visibles, pero la red pública está en pre-lanzamiento: la disponibilidad, las funciones y los tiempos pueden cambiar, y algunas opciones aparecen como no disponibles hasta ser confirmadas.':'That it works with real verified providers and visible costs, but the public network is in pre-launch: availability, features and timelines may change, and some options appear as unavailable until confirmed.'
    } as Record<string,string>)[answer]}</p></article>)}</div></section>
  </main>;
}
