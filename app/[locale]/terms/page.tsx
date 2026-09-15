import {localeOf} from '@/lib/i18n';

export default async function TermsPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';
  const paragraphs=es?[
    'MY CUBA CASH es una marca y plataforma tecnológica operada por SAHJONY LLC. Organiza solicitudes, comparación, referencias, evidencia y coordinación; no se presenta como banco.',
    'Crear una cuenta, calcular una tarifa o guardar una solicitud no completa una transferencia, no autoriza un débito y no garantiza proveedor, entrega, tipo de cambio ni cantidad recibida.',
    'La tarifa de MY CUBA CASH y cualquier costo de proveedor, pago, entrega o cambio de moneda deben mostrarse por separado antes del compromiso cuando estén disponibles. La cotización final confirmada gobierna.',
    'No envíes fondos hasta recibir una referencia, una cotización completa, un proveedor confirmado y las instrucciones del flujo autorizado aplicable.',
    'Las solicitudes pueden permanecer pendientes, ponerse en espera, requerir evidencia adicional, rechazarse o cancelarse cuando no se satisfacen controles de identidad, sanciones, fraude, jurisdicción, pago o proveedor.',
    'Los proveedores y negocios participantes son independientes. Aparecer en la plataforma no les autoriza por sí solo a recibir o transmitir fondos fuera del flujo aprobado.',
    'No uses la plataforma para evadir sanciones, licencias, límites, verificaciones de identidad, controles antifraude u otras obligaciones. El abuso puede producir restricción de cuenta y preservación de evidencia.',
    'Para preguntas antes de aceptar estos términos, usa el canal oficial de soporte publicado en la página de contacto.'
  ]:[
    'MY CUBA CASH is a brand and technology platform operated by SAHJONY LLC. It organizes requests, comparison, references, evidence and coordination; it does not present itself as a bank.',
    'Creating an account, calculating a fee or saving a request does not complete a transfer, authorize a debit or guarantee a provider, delivery, exchange rate or amount received.',
    'The MY CUBA CASH fee and any provider, payment, delivery or foreign-exchange cost must be shown separately before commitment when available. The confirmed final quote governs.',
    'Do not send funds until you receive a reference, complete quote, confirmed provider and instructions for the applicable authorized flow.',
    'Requests may remain pending, be held, require more evidence, be rejected or be cancelled when identity, sanctions, fraud, jurisdiction, payment or provider controls are not satisfied.',
    'Participating providers and businesses are independent. Platform visibility alone does not authorize them to receive or transmit funds outside an approved flow.',
    'Do not use the platform to evade sanctions, licensing, limits, identity checks, anti-fraud controls or other obligations. Abuse may result in account restriction and evidence preservation.',
    'For questions before accepting these terms, use the official support channel on the contact page.'
  ];
  return <main className="shell premiumAppShell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav premiumNav"><a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Términos del cliente':'Customer terms'}</small></a><div className="navlinks"><a href={`/${locale}/privacy`}>{es?'Privacidad':'Privacy'}</a><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a><a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a></div></nav>
    <section className="section" style={{maxWidth:920,margin:'0 auto'}}><span className="eyebrow">{es?'TÉRMINOS DEL CLIENTE':'CUSTOMER TERMS'}</span><h1>{es?'Reglas claras para usar MY CUBA CASH':'Clear rules for using MY CUBA CASH'}</h1><div className="feature premiumCard" style={{display:'grid',gap:14}}>{paragraphs.map(p=><p key={p}>{p}</p>)}</div></section>
  </main>;
}
