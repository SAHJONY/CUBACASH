import {localeOf} from '@/lib/i18n';
import {APP_COMMUNICATIONS,whatsappUrl} from '@/lib/communications';

export default async function ContactPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';
  const support=APP_COMMUNICATIONS.whatsappPrimary;
  return <main className="shell premiumAppShell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav premiumNav"><a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Contacto y soporte':'Contact and support'}</small></a><div className="navlinks"><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a><a href={`/${locale}/how-it-works`}>{es?'Cómo funciona':'How it works'}</a><a href={`/${locale}/faq`}>FAQ</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">{es?'SOPORTE VISIBLE':'VISIBLE SUPPORT'}</div><h1>{es?'Pregunta antes de registrarte o enviar dinero.':'Ask before signing up or sending money.'}</h1><p className="heroLead">{es?'Nuestro canal público de soporte es WhatsApp Business. Puedes preguntar por tarifas, estado de la red y próximos pasos sin compartir credenciales sensibles.':'Our public support channel is WhatsApp Business. You can ask about fees, network status and next steps without sharing sensitive credentials.'}</p></div></section>
    <section className="section supportSection"><div className="supportCard"><div><strong>{support.label}</strong><span>{support.display}</span></div><a className="cta premiumCta" href={whatsappUrl(support.e164,es?'Hola, necesito ayuda con MY CUBA CASH. Antes de registrarme quiero confirmar tarifas y disponibilidad.':'Hello, I need help with MY CUBA CASH. Before signing up I want to confirm fees and availability.')}>{es?'Abrir conversación':'Open conversation'}</a></div></section>
    <section className="section"><div className="featureGrid">
      <article className="feature premiumCard"><h3>{es?'Sí puedes preguntar':'Safe to ask'}</h3><p>{es?'Tarifas, disponibilidad pública, funcionamiento, estado de una referencia y requisitos generales.':'Fees, public availability, how the service works, reference status and general requirements.'}</p></article>
      <article className="feature premiumCard"><h3>{es?'No compartas':'Do not share'}</h3><p>{es?'Contraseñas, códigos de un solo uso, credenciales de pago o documentos completos fuera del flujo seguro de la plataforma.':'Passwords, one-time codes, payment credentials or full documents outside the platform secure flow.'}</p></article>
      <article className="feature premiumCard"><h3>{es?'Verifica siempre':'Always verify'}</h3><p>{es?'Usa únicamente el número publicado aquí y confirma cualquier proveedor mediante su ID público dentro del directorio.':'Use only the number published here and confirm any provider by its public ID in the directory.'}</p></article>
    </div></section>
  </main>;
}
