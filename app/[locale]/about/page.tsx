import {localeOf} from '@/lib/i18n';

export default async function AboutPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';
  return <main className="shell premiumAppShell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav premiumNav"><a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Quiénes somos':'About us'}</small></a><div className="navlinks"><a href={`/${locale}/how-it-works`}>{es?'Cómo funciona':'How it works'}</a><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a><a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">{es?'IDENTIDAD DEL PROYECTO':'PROJECT IDENTITY'}</div><h1>MY CUBA CASH</h1><p className="heroLead">{es?'Una plataforma tecnológica operada por SAHJONY LLC para organizar solicitudes familiares y comerciales, comparar opciones publicadas y mantener referencias y seguimiento.':'A technology platform operated by SAHJONY LLC to organize family and business requests, compare published options and maintain references and tracking.'}</p></div></section>
    <section className="section"><div className="featureGrid">
      <article className="feature premiumCard"><h3>{es?'Lo que hacemos':'What we do'}</h3><p>{es?'Mostramos nuestra tarifa, el estado real de la red y las opciones publicadas; ayudamos a estructurar solicitudes y coordinar próximos pasos.':'We show our fee, the real network status and published options; we help structure requests and coordinate next steps.'}</p></article>
      <article className="feature premiumCard"><h3>{es?'Lo que no prometemos':'What we do not promise'}</h3><p>{es?'No garantizamos una entrega, tipo de cambio, proveedor o importe recibido antes de que estén confirmados.':'We do not guarantee delivery, an exchange rate, a provider or an amount received before confirmation.'}</p></article>
      <article className="feature premiumCard"><h3>{es?'Estado actual':'Current status'}</h3><p>{es?'La red pública de proveedores está en pre-lanzamiento mientras no existan proveedores verificados publicados.':'The public provider network is in pre-launch while no verified providers are listed.'}</p></article>
    </div></section>
    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">{es?'ALCANCE':'SCOPE'}</span><h2>{es?'Tecnología y coordinación con controles separados.':'Technology and coordination with separate controls.'}</h2></div><p>{es?'MY CUBA CASH no se presenta como banco. Cualquier movimiento de fondos debe ocurrir mediante el flujo autorizado aplicable y después de satisfacer identidad, sanciones, fraude, pago, corredor y controles de proveedor.':'MY CUBA CASH does not present itself as a bank. Any movement of funds must occur through the applicable authorized flow and after identity, sanctions, fraud, payment, corridor and provider controls are satisfied.'}</p></section>
  </main>;
}
