import {localeOf} from '@/lib/i18n';
import FeeCalculator from './FeeCalculator';

const rows=[
  {product:'Family remittance',payer:'Sender',rate:'1.25%',min:'$1.00',max:'$12.00',note:'For eligible family support transaction requests.'},
  {product:'Business remittance',payer:'Sender',rate:'1.75%',min:'$5.00',max:'$250.00',note:'For private-business payment requests with commercial purpose.'},
  {product:'Marketplace success fee',payer:'Seller',rate:'2.50%',min:'$2.00',max:'$500.00',note:'Applied when a marketplace transaction reaches the applicable fee-triggering stage.'},
  {product:'Cash transaction record',payer:'Requestor',rate:'0.75%',min:'$0.50',max:'$20.00',note:'For eligible platform cash-ledger transaction records and controls.'}
] as const;

export default async function FeesPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params; const locale=localeOf(raw);
  const es=locale==='es';
  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav"><a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>{es?'Tarifas y precios':'Fees & Pricing'}</small></a><div className="navlinks"><a href={`/${locale}/start`}>{es?'Iniciar transacción':'Start Transaction'}</a><a href={`/${locale}/payments`}>{es?'Cómo pagarnos':'How to Pay Us'}</a><a href={`/${locale}/transactions`}>{es?'Rastrear':'Track'}</a><a href={`/${locale}/privacy`}>{es?'Privacidad':'Privacy'}</a><a href={`/${locale}/terms`}>{es?'Términos':'Terms'}</a></div></nav>

    <section className="hero"><div className="heroCopy"><div className="eyebrow">{es?'PRECIOS TRANSPARENTES':'TRANSPARENT PRICING'}</div><h1>{es?'Conoce la tarifa de mycubacash antes de confirmar.':'Know the mycubacash platform fee before you commit.'}</h1><p className="heroLead">{es?'Sin tarifas ocultas de mycubacash. El porcentaje, mínimo y máximo aplicables se muestran antes de continuar.':'No hidden mycubacash platform fee. The applicable percentage, minimum and maximum are disclosed before the transaction proceeds.'}</p><p className="heroSub">{es?'Cargos separados de pago, liquidación, cambio de divisas, entrega o proveedor autorizado pueden aplicar según el corredor y servicio seleccionado. Cuando se conocen, se muestran por separado antes del compromiso.':'Separate third-party payment, settlement, foreign-exchange, delivery or authorized-provider charges may apply depending on the corridor and service selected. When known, those charges are shown separately before commitment.'}</p><div className="actions"><a className="cta" href={`/${locale}/start`}>{es?'Iniciar una transacción':'Start a Transaction'}</a><a className="ghost" href={`/${locale}/payments`}>{es?'Cómo pagar la tarifa':'How to pay the fee'}</a></div></div></section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'TARIFARIO PUBLICADO':'PUBLISHED FEE SCHEDULE'}</span><h2>{es?'Precios simples por porcentaje con límites.':'Simple percentage pricing with caps'}</h2></div><p>{es?'La tarifa se calcula sobre el importe de la transacción y luego se limita por el mínimo y máximo publicados para ese producto.':'The fee is calculated from the transaction amount, then bounded by the published minimum and maximum for that product.'}</p></div>
      <div className="featureGrid">{rows.map(row=><article className="feature" key={row.product}><div className="eyebrow">{row.product.toUpperCase()}</div><h3 style={{fontSize:'2rem',margin:'8px 0'}}>{row.rate}</h3><p><strong>{es?'Pagador':'Payer'}:</strong> {row.payer}</p><p><strong>{es?'Mínimo':'Minimum'}:</strong> {row.min} · <strong>{es?'Máximo':'Maximum'}:</strong> {row.max}</p><p>{row.note}</p></article>)}</div>
    </section>

    <section className="section"><FeeCalculator/></section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'CÓMO FUNCIONA':'HOW IT WORKS'}</span><h2>{es?'Qué debe esperar el cliente.':'What customers should expect'}</h2></div><p>{es?'La tarifa se muestra antes de que el cliente confirme el paso correspondiente.':'Pricing is disclosed before the customer commits to the applicable transaction step.'}</p></div>
      <div className="featureGrid">
        <article className="feature"><div className="icon">1</div><h3>{es?'Ingresa el importe':'Enter the amount'}</h3><p>{es?'Elige el tipo de transacción, corredor, importe, preferencia de pago y necesidades de entrega.':'Choose the transaction type, corridor, amount, payment preference and delivery needs.'}</p></article>
        <article className="feature"><div className="icon">2</div><h3>{es?'Revisa la tarifa':'Review the fee'}</h3><p>{es?'mycubacash muestra la tarifa de plataforma y cualquier costo conocido revelado por separado antes de confirmar.':'mycubacash shows the platform fee and any separately disclosed known costs before commitment.'}</p></article>
        <article className="feature"><div className="icon">3</div><h3>{es?'Paga la tarifa con su referencia':'Pay the fee with its reference'}</h3><p>{es?'El principal puede pagarse entre participantes cuando corresponda. La tarifa de mycubacash se cobra y reconcilia por separado usando la referencia de la operación.':'Principal may be paid between participants when applicable. The mycubacash fee is collected and reconciled separately using the transaction reference.'}</p></article>
      </div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">{es?'IMPORTANTE':'IMPORTANT'}</span><h2>{es?'La tarifa de plataforma no es lo mismo que el dinero principal de la operación.':'Platform fee is not the same as transaction principal.'}</h2></div><p>{es?'En operaciones directas, mycubacash puede registrar y coordinar la transacción sin tomar custodia del principal. La tarifa de mycubacash es un cobro separado. Un procesador de pagos, socio de liquidación, proveedor FX, proveedor de entrega u otro proveedor autorizado también puede cobrar por separado cuando aplique.':'In direct transactions, mycubacash may record and coordinate the transaction without taking custody of principal. The mycubacash fee is a separate charge. A payment processor, settlement partner, FX provider, delivery provider or other authorized service provider may also charge separately when applicable.'}</p></section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'PAGOS A MYCUBACASH':'PAYMENTS TO MYCUBACASH'}</span><h2>{es?'Una referencia separada para nuestra tarifa.':'A separate reference for our fee.'}</h2></div><p>{es?'Consulta la página de pagos para ver cómo se identifica, paga, revisa y confirma la tarifa de plataforma.':'See the payments page for how the platform fee is identified, paid, reviewed and confirmed.'}</p></div><div className="actions"><a className="cta" href={`/${locale}/payments`}>{es?'Ver cómo pagarnos':'See how to pay us'}</a></div></section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">FAQ</span><h2>{es?'Preguntas de precios':'Pricing questions'}</h2></div></div><div className="featureGrid">
      <article className="feature"><h3>{es?'¿Puede la tarifa superar el máximo?':'Can the platform fee exceed the maximum?'}</h3><p>{es?'No. Bajo el tarifario publicado, la tarifa de mycubacash queda limitada al máximo indicado para ese producto.':'No. Under the published default schedule, the mycubacash platform fee is capped at the maximum shown for that product.'}</p></article>
      <article className="feature"><h3>{es?'¿Puede otro proveedor cobrar aparte?':'Can another provider charge separately?'}</h3><p>{es?'Sí. Proveedores de pago, FX, liquidación o entrega pueden tener cargos separados cuando correspondan y sean revelados.':'Yes. Payment, FX, settlement or delivery providers may have separate disclosed charges when applicable.'}</p></article>
      <article className="feature"><h3>{es?'¿Crear una solicitud mueve dinero?':'Does creating a request move money?'}</h3><p>{es?'No. Una solicitud crea un registro para revisión. Cualquier movimiento de fondos ocurre solo mediante el flujo autorizado aplicable después de satisfacer los controles requeridos.':'No. A request creates a transaction record for review. Funds movement occurs only through the applicable authorized workflow after required controls are satisfied.'}</p></article>
    </div></section>

    <footer className="footer"><strong>mycubacash.com</strong><span>{es?'Precios transparentes · Tarifas de plataforma en USD':'Transparent platform pricing · USD fee schedule'}</span><span><a href={`/${locale}/payments`}>{es?'Pagos':'Payments'}</a> · <a href={`/${locale}/terms`}>{es?'Términos':'Terms'}</a> · <a href={`/${locale}/privacy`}>{es?'Privacidad':'Privacy'}</a></span></footer>
  </main>;
}
