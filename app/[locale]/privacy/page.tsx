import {localeOf} from '@/lib/i18n';

export default async function PrivacyPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';
  const paragraphs=es?[
    'MY CUBA CASH, operada por SAHJONY LLC, usa datos de cuenta, remitente, receptor, negocio, solicitud, entrega y soporte para prestar el servicio solicitado, proteger la plataforma, resolver disputas y satisfacer verificaciones aplicables.',
    'Los perfiles públicos excluyen teléfonos privados, direcciones exactas, datos de pago y evidencia privada de verificación. La información sensible queda restringida a flujos operativos autorizados.',
    'Nunca compartas contraseñas, códigos de un solo uso o credenciales de pago con proveedores, receptores o Sofia. El soporte no debe pedir tu contraseña.',
    'Los registros de solicitud, auditoría y evidencia pueden conservarse cuando sean necesarios para seguridad, prevención de fraude, disputas, obligaciones aplicables o mantenimiento legítimo de registros.',
    'Las tarifas, disponibilidad pública, preguntas frecuentes y soporte pueden consultarse sin cuenta. Solo solicitamos una cuenta para proteger y guardar información vinculada a una solicitud.',
    'Para una pregunta o solicitud de privacidad, usa el canal oficial de contacto. Podemos exigir verificación de identidad antes de entregar, corregir o eliminar información vinculada a una cuenta.'
  ]:[
    'MY CUBA CASH, operated by SAHJONY LLC, uses account, sender, receiver, business, request, delivery and support data to provide requested services, protect the platform, resolve disputes and satisfy applicable checks.',
    'Public profiles exclude private phone numbers, exact addresses, payment data and private verification evidence. Sensitive information is restricted to authorized operational flows.',
    'Never share passwords, one-time codes or payment credentials with providers, receivers or Sofia. Support should not ask for your password.',
    'Request, audit and evidence records may be retained when needed for security, fraud prevention, disputes, applicable obligations or legitimate recordkeeping.',
    'Fees, public availability, FAQs and support can be reviewed without an account. We request an account only to protect and save information tied to a request.',
    'For a privacy question or request, use the official contact channel. Identity verification may be required before account-linked information is released, corrected or deleted.'
  ];
  return <main className="shell premiumAppShell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav premiumNav"><a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Privacidad':'Privacy'}</small></a><div className="navlinks"><a href={`/${locale}/terms`}>{es?'Términos':'Terms'}</a><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a><a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a></div></nav>
    <section className="section" style={{maxWidth:920,margin:'0 auto'}}><span className="eyebrow">{es?'AVISO DE PRIVACIDAD':'PRIVACY NOTICE'}</span><h1>{es?'Cómo manejamos la información del cliente':'How we handle customer information'}</h1><div className="feature premiumCard" style={{display:'grid',gap:14}}>{paragraphs.map(p=><p key={p}>{p}</p>)}</div></section>
  </main>;
}
