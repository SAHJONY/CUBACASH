import { localeOf } from '@/lib/i18n';

const methods=[
  {
    key:'automatic',
    es:'Pago automático de tarifa',
    en:'Automatic platform-fee payment',
    esBody:'Cuando exista un checkout activo, la aplicación mostrará el método disponible (por ejemplo tarjeta o ACH), el importe exacto y la referencia antes de pagar. No se considera disponible hasta que el proveedor de pagos esté realmente configurado.',
    enBody:'When an active checkout exists, the app will show the available method (for example card or ACH), the exact amount and reference before payment. It is not treated as available until the payment provider is actually configured.'
  },
  {
    key:'manual',
    es:'Pago manual con referencia',
    en:'Manual payment with reference',
    esBody:'Para cuentas aprobadas, mycubacash puede emitir una referencia de tarifa y aceptar evidencia de pago por un método permitido. El pago queda pendiente hasta que un revisor autorizado lo reconcilie y confirme.',
    enBody:'For approved accounts, mycubacash may issue a platform-fee reference and accept payment evidence through an allowed method. The payment remains pending until an authorized reviewer reconciles and confirms it.'
  },
  {
    key:'receipt',
    es:'Confirmación y recibo',
    en:'Confirmation and receipt',
    esBody:'La tarifa de mycubacash se registra separada del dinero principal entre participantes. Una vez confirmada, la tarifa queda marcada como pagada con su referencia y evidencia correspondiente.',
    enBody:'The mycubacash fee is recorded separately from principal exchanged between participants. Once confirmed, the fee is marked paid with its corresponding reference and evidence.'
  }
] as const;

export default async function PaymentsPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';

  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>{es?'Pagos a mycubacash':'Payments to mycubacash'}</small></a>
      <div className="navlinks">
        <a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a>
        <a href={`/${locale}/transactions`}>{es?'Transacciones':'Transactions'}</a>
        <a href={`/${locale}/auth`}>{es?'Entrar':'Sign in'}</a>
      </div>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">{es?'CÓMO COBRA MYCUBACASH':'HOW MYCUBACASH GETS PAID'}</div>
        <h1>{es?'El dinero principal va entre participantes. Nuestra tarifa se paga por separado.':'Principal moves between participants. Our platform fee is paid separately.'}</h1>
        <p className="heroLead">{es?'En operaciones directas entre negocios, mycubacash no toma custodia del dinero principal. La aplicación calcula y registra una tarifa de plataforma separada por el servicio, la coordinación, los controles y el registro transaccional.':'In direct business-to-business transactions, mycubacash does not take custody of principal. The app calculates and records a separate platform fee for the service, coordination, controls and transaction record.'}</p>
        <p className="heroSub">{es?'Nunca envíes dinero usando datos bancarios o instrucciones recibidas fuera de la aplicación o de un canal autorizado de mycubacash. Usa siempre la referencia de tarifa mostrada para tu operación.':'Never send money using banking details or instructions received outside the app or an authorized mycubacash channel. Always use the platform-fee reference shown for your transaction.'}</p>
        <div className="actions"><a className="cta" href={`/${locale}/fees`}>{es?'Ver tarifas':'View fees'}</a><a className="ghost" href={`/${locale}/transactions`}>{es?'Ver transacciones':'View transactions'}</a></div>
      </div>
    </section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'FLUJO DE COBRO':'COLLECTION FLOW'}</span><h2>{es?'Una tarifa separada, trazable y reconciliable.':'A separate, traceable and reconcilable fee.'}</h2></div><p>{es?'La tarifa nunca debe confundirse con el principal que pagan o reciben los participantes.':'The platform fee must never be confused with principal paid or received by participants.'}</p></div>
      <div className="featureGrid">
        <article className="feature"><div className="icon">1</div><h3>{es?'Se calcula la tarifa':'Fee is calculated'}</h3><p>{es?'La aplicación aplica la regla publicada para el producto y muestra el importe correspondiente.':'The app applies the published product rule and shows the corresponding amount.'}</p></article>
        <article className="feature"><div className="icon">2</div><h3>{es?'Se crea una referencia':'A reference is created'}</h3><p>{es?'La tarifa queda vinculada a una transacción o entidad concreta para evitar pagos sin identificar.':'The fee is linked to a specific transaction or entity to prevent unidentified payments.'}</p></article>
        <article className="feature"><div className="icon">3</div><h3>{es?'Se paga y se reconcilia':'Payment is reconciled'}</h3><p>{es?'El estado cambia a pagado únicamente después de una confirmación válida del proveedor de pagos o de una revisión manual autorizada.':'Status changes to paid only after valid payment-provider confirmation or authorized manual review.'}</p></article>
      </div>
    </section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'MÉTODOS':'METHODS'}</span><h2>{es?'Solo métodos presentados por la aplicación o autorizados por mycubacash.':'Only methods presented by the app or authorized by mycubacash.'}</h2></div></div>
      <div className="featureGrid">{methods.map(method=><article className="feature" key={method.key}><h3>{es?method.es:method.en}</h3><p>{es?method.esBody:method.enBody}</p></article>)}</div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">{es?'IMPORTANTE':'IMPORTANT'}</span><h2>{es?'No publicamos instrucciones bancarias sensibles en páginas públicas.':'We do not publish sensitive banking instructions on public pages.'}</h2></div><p>{es?'Cuando corresponda un pago manual, las instrucciones deben aparecer dentro de una sesión autenticada o ser emitidas por un canal autorizado, junto con la referencia exacta. La confirmación manual requiere revisión de un usuario autorizado de la plataforma.':'When a manual payment applies, instructions should appear in an authenticated session or be issued through an authorized channel together with the exact reference. Manual confirmation requires review by an authorized platform user.'}</p></section>

    <footer className="footer"><strong>mycubacash.com</strong><span>{es?'Tarifa separada del principal · Referencia obligatoria · Confirmación trazable':'Fee separate from principal · Reference required · Traceable confirmation'}</span><span><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a> · <a href={`/${locale}/terms`}>{es?'Términos':'Terms'}</a> · <a href={`/${locale}/privacy`}>{es?'Privacidad':'Privacy'}</a></span></footer>
  </main>;
}
