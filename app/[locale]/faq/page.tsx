import {localeOf} from '@/lib/i18n';

const items=[
  ['¿MY CUBA CASH es un banco?','No. Es una plataforma tecnológica operada por SAHJONY LLC para organizar solicitudes, comparación, referencias y coordinación.'],
  ['¿Crear una solicitud mueve dinero?','No. Crear o guardar una solicitud no completa una transferencia ni autoriza un débito.'],
  ['¿Puedo enviar USD o stablecoins ahora?','No envíes USD, USDC ni otro activo hasta que exista una cotización completa, un proveedor verificado y un método autorizado dentro del flujo seguro de MY CUBA CASH.'],
  ['¿Cuánto cuesta una solicitud familiar?','La tarifa publicada de MY CUBA CASH es 1.25% del importe, con mínimo de $1 y máximo de $12. Otros costos se muestran por separado cuando exista una cotización real.'],
  ['¿Cuánto recibe mi familiar en Cuba?','No mostramos una cifra final hasta contar con tipo de cambio, proveedor, entrega y método de pago confirmados.'],
  ['¿Hay proveedores disponibles ahora?','El directorio público muestra el estado real. Si indica 0 proveedores, la red está en pre-lanzamiento y no hay una opción publicada para elegir.'],
  ['¿Quién es Sofia?','Sofia es la coordinadora digital de la plataforma. Explica opciones y próximos pasos; no aprueba proveedores, no mueve fondos y no reemplaza controles humanos o regulatorios.'],
  ['¿Por qué se necesita una cuenta?','Solo para guardar y proteger información del remitente, receptor y solicitud. Las tarifas, el proceso, la disponibilidad pública y el soporte son visibles sin cuenta.'],
  ['¿Qué nunca debo compartir por WhatsApp?','Contraseñas, códigos de acceso, credenciales de pago, documentos completos o información que la plataforma no haya solicitado mediante un flujo seguro.']
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
      '¿Crear una solicitud mueve dinero?':'Does creating a request move money?',
      '¿Puedo enviar USD o stablecoins ahora?':'Can I send USD or stablecoins now?',
      '¿Cuánto cuesta una solicitud familiar?':'What does a family-support request cost?',
      '¿Cuánto recibe mi familiar en Cuba?':'How much will my family receive in Cuba?',
      '¿Hay proveedores disponibles ahora?':'Are providers available now?',
      '¿Quién es Sofia?':'Who is Sofia?',
      '¿Por qué se necesita una cuenta?':'Why is an account needed?',
      '¿Qué nunca debo compartir por WhatsApp?':'What should I never share over WhatsApp?'
    } as Record<string,string>)[question]}</h3><p>{es?answer:({
      'No. Es una plataforma tecnológica operada por SAHJONY LLC para organizar solicitudes, comparación, referencias y coordinación.':'No. It is a technology platform operated by SAHJONY LLC to organize requests, comparison, references and coordination.',
      'No. Crear o guardar una solicitud no completa una transferencia ni autoriza un débito.':'No. Creating or saving a request does not complete a transfer or authorize a debit.',
      'No envíes USD, USDC ni otro activo hasta que exista una cotización completa, un proveedor verificado y un método autorizado dentro del flujo seguro de MY CUBA CASH.':'Do not send USD, USDC or another asset until a complete quote, a verified provider and an authorized method are available inside the secure MY CUBA CASH flow.',
      'La tarifa publicada de MY CUBA CASH es 1.25% del importe, con mínimo de $1 y máximo de $12. Otros costos se muestran por separado cuando exista una cotización real.':'The published MY CUBA CASH fee is 1.25% of the amount, with a $1 minimum and $12 cap. Other costs are shown separately when a real quote exists.',
      'No mostramos una cifra final hasta contar con tipo de cambio, proveedor, entrega y método de pago confirmados.':'We do not show a final amount until the exchange rate, provider, delivery and payment method are confirmed.',
      'El directorio público muestra el estado real. Si indica 0 proveedores, la red está en pre-lanzamiento y no hay una opción publicada para elegir.':'The public directory shows the real status. If it shows 0 providers, the network is in pre-launch and there is no published option to choose.',
      'Sofia es la coordinadora digital de la plataforma. Explica opciones y próximos pasos; no aprueba proveedores, no mueve fondos y no reemplaza controles humanos o regulatorios.':'Sofia is the platform digital coordinator. She explains options and next steps; she does not approve providers, move funds or replace human and regulatory controls.',
      'Solo para guardar y proteger información del remitente, receptor y solicitud. Las tarifas, el proceso, la disponibilidad pública y el soporte son visibles sin cuenta.':'Only to save and protect sender, receiver and request information. Fees, process, public availability and support are visible without an account.',
      'Contraseñas, códigos de acceso, credenciales de pago, documentos completos o información que la plataforma no haya solicitado mediante un flujo seguro.':'Passwords, access codes, payment credentials, full documents or information the platform has not requested through a secure flow.'
    } as Record<string,string>)[answer]}</p></article>)}</div></section>
  </main>;
}
