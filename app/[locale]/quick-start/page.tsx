import {localeOf} from '@/lib/i18n';
import {APP_COMMUNICATIONS,whatsappUrl} from '@/lib/communications';

const stepsEs=[
  ['Consulta el costo','Revisa la tarifa pública de MY CUBA CASH antes de crear una cuenta. Para una solicitud familiar de $100, la tarifa estimada de plataforma es $1.25.'],
  ['Verifica disponibilidad','Consulta el directorio público. Si muestra 0 proveedores verificados, no existe una opción de entrega publicada y la red continúa en pre-lanzamiento.'],
  ['Prepara tu solicitud','Puedes revisar el proceso sin registrarte. La cuenta solo se solicita para guardar y proteger los datos de una solicitud.'],
  ['Espera una cotización completa','No envíes dinero hasta ver proveedor, método autorizado, entrega, tipo de cambio, costo total y referencia de transacción confirmados.'],
  ['Confirma por el canal seguro','Sigue únicamente las instrucciones mostradas dentro del flujo autorizado de MY CUBA CASH. Crear una solicitud no mueve fondos ni garantiza una entrega.']
] as const;

const stepsEn=[
  ['Review the cost','See the public MY CUBA CASH fee before creating an account. For a $100 family-support request, the estimated platform fee is $1.25.'],
  ['Check availability','Review the public directory. If it shows 0 verified providers, no delivery option is publicly available and the network remains in pre-launch.'],
  ['Prepare your request','You can review the process without signing up. An account is only required to save and protect request information.'],
  ['Wait for a complete quote','Do not send money until the provider, authorized method, delivery, exchange rate, total cost and transaction reference are confirmed.'],
  ['Confirm through the secure flow','Follow only the instructions displayed inside the authorized MY CUBA CASH flow. Creating a request does not move funds or guarantee delivery.']
] as const;

export default async function QuickStartPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';
  const support=APP_COMMUNICATIONS.whatsappPrimary;
  const steps=es?stepsEs:stepsEn;

  return <main className="shell premiumAppShell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav premiumNav">
      <a href={`/${locale}`} className="brandwrap">
        <div className="brand">MY CUBA CASH</div>
        <small>{es?'Guía rápida':'Quick-start guide'}</small>
      </a>
      <div className="navlinks">
        <a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a>
        <a href={`/${locale}/how-it-works`}>{es?'Cómo funciona':'How it works'}</a>
        <a href={`/${locale}/delivery-providers`}>{es?'Disponibilidad':'Availability'}</a>
        <a href={`/${locale}/faq`}>FAQ</a>
        <a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a>
      </div>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">{es?'INICIO RÁPIDO · PRE-LANZAMIENTO':'QUICK START · PRE-LAUNCH'}</div>
        <h1>{es?'Infórmate primero. Envía fondos solo cuando todo esté confirmado.':'Understand first. Send funds only after everything is confirmed.'}</h1>
        <p className="heroLead">{es
          ?'Esta guía explica lo que puedes hacer hoy y lo que todavía no debes hacer. MY CUBA CASH no presenta una wallet, conversión o entrega como activa sin un proveedor y un flujo autorizado confirmados.'
          :'This guide explains what you can do today and what you should not do yet. MY CUBA CASH does not present a wallet, conversion or delivery as active without a confirmed provider and authorized flow.'}</p>
      </div>
    </section>

    <section className="section">
      <div className="luxuryGrid">
        {steps.map(([title,description],index)=><article className="luxuryCard" key={title}>
          <span>{String(index+1).padStart(2,'0')}</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </article>)}
      </div>
    </section>

    <section className="policyBlock premiumPolicy">
      <div>
        <span className="eyebrow">{es?'REGLA DE SEGURIDAD':'SAFETY RULE'}</span>
        <h2>{es?'No envíes USD, USDC ni otro activo a direcciones recibidas por mensajes.':'Do not send USD, USDC or any other asset to addresses received in messages.'}</h2>
      </div>
      <p>{es
        ?'Durante el pre-lanzamiento, ninguna dirección de wallet, cuenta bancaria, tasa CUP, plazo de entrega o proveedor debe considerarse autorizado salvo que aparezca dentro del flujo seguro con una cotización completa y verificable. Nunca compartas contraseñas, códigos de acceso o documentos completos por WhatsApp o Telegram.'
        :'During pre-launch, no wallet address, bank account, CUP rate, delivery time or provider should be treated as authorized unless it appears inside the secure flow with a complete, verifiable quote. Never share passwords, access codes or full documents through WhatsApp or Telegram.'}</p>
    </section>

    <section className="section">
      <div className="sectionHead">
        <div>
          <span className="eyebrow">{es?'LO QUE ESTÁ DISPONIBLE HOY':'WHAT IS AVAILABLE TODAY'}</span>
          <h2>{es?'Información pública antes del registro.':'Public information before sign-up.'}</h2>
        </div>
        <p>{es
          ?'Puedes revisar nuestra tarifa, el funcionamiento, la disponibilidad real y contactar soporte. Esto no representa aceptación de una operación ni autorización para enviar fondos.'
          :'You can review our fee, process, real availability and contact support. This does not represent acceptance of a transaction or authorization to send funds.'}</p>
      </div>
      <div className="actions">
        <a className="cta premiumCta" href={`/${locale}/fees`}>{es?'Calcular tarifa':'Calculate fee'}</a>
        <a className="glassCta" href={`/${locale}/delivery-providers`}>{es?'Ver disponibilidad':'Check availability'}</a>
        <a className="glassCta" href={`/${locale}/start`}>{es?'Preparar solicitud':'Prepare request'}</a>
      </div>
    </section>

    <section className="section supportSection">
      <div className="supportCard">
        <div>
          <strong>{es?'Soporte humano por WhatsApp Business':'Human support on WhatsApp Business'}</strong>
          <span>{support.display}</span>
        </div>
        <a className="cta premiumCta" href={whatsappUrl(support.e164,es
          ?'Hola, quiero confirmar el proceso seguro de MY CUBA CASH antes de crear una solicitud.'
          :'Hello, I want to confirm the safe MY CUBA CASH process before creating a request.')}>
          {es?'Confirmar con soporte':'Confirm with support'}
        </a>
      </div>
    </section>
  </main>;
}
