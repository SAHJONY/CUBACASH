import { localeOf, locales } from '@/lib/i18n';
import { APP_COMMUNICATIONS, whatsappUrl } from '@/lib/communications';
import ShareAppButton from '@/components/ShareAppButton';

const MEDIA={
  hero:'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&fm=jpg&q=86&w=2600',
  family:'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&fm=jpg&q=84&w=2200',
  business:'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&fm=jpg&q=84&w=2200',
  service:'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&fm=jpg&q=84&w=2200'
} as const;

export default async function LocaleHome({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const rtl=locale==='ar';
  const channels=APP_COMMUNICATIONS;
  const es=locale==='es';

  return <main className="shell premiumAppShell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav premiumNav appNav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Familias · Negocios · Marketplace':'Families · Business · Marketplace'}</small></a>
      <div className="navlinks">
        <a href={`/${locale}/start`}>{es?'Enviar apoyo':'Send Support'}</a><a href={`/${locale}/transactions`}>{es?'Rastrear':'Track'}</a><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/delivery-providers`}>{es?'Entrega':'Delivery'}</a><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a>
      </div>
      <div className="navright"><div className="lang">{locales.map(l=><a key={l} href={`/${l}`}>{l.toUpperCase()}</a>)}</div><a className="miniCta premiumCta" href={`/${locale}/auth`}>{es?'Entrar':'Sign In'}</a></div>
    </nav>

    <section className="homeCinematicHero">
      <img className="homeHeroMedia" src={MEDIA.hero} alt={es?'Personas usando tecnología para mantenerse conectadas.':'People using technology to stay connected.'}/>
      <div className="homeHeroOverlay"/>
      <div className="homeHeroContent">
        <div className="eyebrow">{es?'LIQUIDEZ LOCAL · REMESAS · SERVICIOS':'LOCAL LIQUIDITY · REMITTANCE · SERVICES'}</div>
        <h1>{es?'Hacemos que la liquidez local compita por ti.':'We make local liquidity compete for you.'}</h1>
        <p className="heroLead">{es?'MY CUBA CASH conecta tu necesidad con proveedores verificados que compiten en disponibilidad, velocidad, cobertura y costo total para darte una mejor opción de cumplimiento local.':'MY CUBA CASH connects your need with verified providers that compete on availability, speed, coverage and total cost to give you a better local fulfillment option.'}</p>
        <p className="heroSub">{es?'Tú ves las opciones. Sofia coordina. La plataforma mantiene la referencia, la evidencia y el seguimiento. Los controles de identidad, riesgo y cumplimiento permanecen separados y activos.':'You see the options. Sofia coordinates. The platform keeps the reference, evidence and tracking. Identity, risk and compliance controls remain separate and active.'}</p>
        <div className="actions"><a className="cta premiumCta heroPrimary" href={`/${locale}/start`}>{es?'Iniciar solicitud':'Start Request'}</a><a className="glassCta" href={`/${locale}/delivery-providers`}>{es?'Comparar proveedores':'Compare Providers'}</a><a className="glassCta" href={whatsappUrl(channels.whatsappPrimary.e164)}>{es?'Hablar con Sofia':'Talk to Sofia'}</a><ShareAppButton locale={locale} es={es}/></div>
        <div className="heroTrustRail"><span>{es?'Liquidez disponible':'Available liquidity'}</span><span>{es?'Precio competitivo':'Competitive pricing'}</span><span>{es?'Cumplimiento local rápido':'Fast local fulfillment'}</span><span>{es?'Reputación verificable':'Verifiable reputation'}</span></div>
      </div>
    </section>

    <section className="experienceBand">
      <div className="experienceBandInner"><span>{es?'TESIS DEL PRODUCTO':'PRODUCT THESIS'}</span><strong>{es?'La mejor opción local debe ganar al cliente.':'The best local option should win the customer.'}</strong><p>{es?'La plataforma organiza competencia entre proveedores, no dependencia de un solo canal.':'The platform organizes provider competition instead of dependence on one channel.'}</p></div>
    </section>

    <section className="section editorialSection">
      <div className="sectionHead"><div><span className="eyebrow">{es?'RED DISTRIBUIDA DE CUMPLIMIENTO':'DISTRIBUTED FULFILLMENT NETWORK'}</span><h2>{es?'Oferta local que compite por velocidad, precio y confianza.':'Local supply competing on speed, price and trust.'}</h2></div><p>{es?'Cada proveedor conserva su operación y disponibilidad. MY CUBA CASH aporta descubrimiento, comparación, referencia de transacción, reputación, evidencia y coordinación.':'Each provider keeps its own operations and availability. MY CUBA CASH adds discovery, comparison, transaction reference, reputation, evidence and coordination.'}</p></div>
      <div className="editorialGrid">
        <article className="editorialCard editorialLarge"><img src={MEDIA.family} alt={es?'Familia reunida en casa.':'Family together at home.'}/><div className="editorialShade"/><div className="editorialCopy"><span>01 · {es?'DEMANDA':'DEMAND'}</span><h3>{es?'El cliente dice qué necesita.':'The customer says what they need.'}</h3><p>{es?'Monto, destino, velocidad y método de cumplimiento entran una sola vez.':'Amount, destination, speed and fulfillment method are entered once.'}</p><a className="textLink" href={`/${locale}/start`}>{es?'Crear solicitud':'Create request'} →</a></div></article>
        <article className="editorialCard"><img src={MEDIA.business} alt={es?'Equipo de emprendedores trabajando.':'Entrepreneurial team working together.'}/><div className="editorialShade"/><div className="editorialCopy"><span>02 · {es?'COMPETENCIA':'COMPETITION'}</span><h3>{es?'Los proveedores compiten por valor total.':'Providers compete on total value.'}</h3><p>{es?'Disponibilidad, ETA, cobertura, condiciones y tarifas publicadas permiten comparar sin exponer datos privados innecesarios.':'Availability, ETA, coverage, conditions and posted pricing make comparison possible without exposing unnecessary private data.'}</p></div></article>
        <article className="editorialCard"><img src={MEDIA.service} alt={es?'Profesionales coordinando una operación.':'Professionals coordinating an operation.'}/><div className="editorialShade"/><div className="editorialCopy"><span>03 · {es?'CUMPLIMIENTO':'FULFILLMENT'}</span><h3>{es?'El proveedor elegido confirma y cumple localmente.':'The selected provider confirms and fulfills locally.'}</h3><p>{es?'La selección permanece solicitada hasta confirmación; después, la evidencia y el historial alimentan la reputación de la red.':'Selection remains requested until confirmation; afterward, evidence and history feed the network reputation.'}</p><a className="textLink" href={`/${locale}/delivery-providers`}>{es?'Ver red':'View network'} →</a></div></article>
      </div>
    </section>

    <section className="section productSection">
      <div className="sectionHead"><div><span className="eyebrow">{es?'MOTOR DE VALOR':'VALUE ENGINE'}</span><h2>{es?'No gana el proveedor más grande. Gana la mejor opción disponible.':'The biggest provider does not win. The best available option does.'}</h2></div><p>{es?'El objetivo es minimizar fricción y costo total mientras se mejora disponibilidad, velocidad y confiabilidad dentro de los controles aplicables.':'The goal is to reduce friction and total cost while improving availability, speed and reliability within applicable controls.'}</p></div>
      <div className="luxuryGrid">
        <article className="luxuryCard"><span>01</span><h3>{es?'Disponibilidad':'Availability'}</h3><p>{es?'Quién puede cumplir ahora y en la zona correcta.':'Who can fulfill now in the right area.'}</p></article>
        <article className="luxuryCard"><span>02</span><h3>{es?'Costo total':'Total cost'}</h3><p>{es?'Tarifa publicada y cargos relevantes antes de elegir.':'Posted pricing and relevant charges before choosing.'}</p></article>
        <article className="luxuryCard"><span>03</span><h3>{es?'Velocidad':'Speed'}</h3><p>{es?'Xpress, 1–3 horas, mismo día o flexible según capacidad real publicada.':'Xpress, 1–3 hour, same day or flexible based on posted real capacity.'}</p></article>
        <article className="luxuryCard"><span>04</span><h3>{es?'Confianza':'Trust'}</h3><p>{es?'Confirmaciones, evidencia, historial y reputación mejoran cada próxima selección.':'Confirmations, evidence, history and reputation improve every next selection.'}</p></article>
      </div>
    </section>

    <section className="section spotlightSection">
      <div className="spotlightPanel"><div><span className="eyebrow">{es?'SOFIA + ENRUTAMIENTO':'SOFIA + ROUTING'}</span><h2>{es?'Sofia coordina. La red compite. El cliente elige.':'Sofia coordinates. The network competes. The customer chooses.'}</h2><p>{es?'Sofia puede ayudar a estructurar la solicitud, explicar diferencias entre opciones y coordinar el siguiente paso, sin autoaprobar estados sensibles ni alterar controles de confianza o cumplimiento.':'Sofia can help structure the request, explain differences between options and coordinate the next step without self-approving sensitive states or altering trust or compliance controls.'}</p></div><div className="actions"><a className="cta premiumCta" href={`/${locale}/sofia`}>{es?'Abrir Sofia':'Open Sofia'}</a></div></div>
    </section>

    <section className="section supportSection" id="contact">
      <div className="sectionHead"><div><span className="eyebrow">{es?'MÁS RÁPIDO · MÁS CLARO · MÁS ACCESIBLE':'FASTER · CLEARER · MORE ACCESSIBLE'}</span><h2>{es?'Construido para personas y pequeños negocios que necesitan mejores opciones.':'Built for people and small businesses that need better options.'}</h2></div><p>{es?'Nuestro objetivo es competir mediante mejor servicio, menor fricción y proveedores locales más eficientes, manteniendo trazabilidad y controles separados de la experiencia comercial.':'Our goal is to compete through better service, lower friction and more efficient local providers while keeping traceability and controls separate from the commercial experience.'}</p></div>
      <div className="supportCard"><div><strong>{channels.whatsappPrimary.label}</strong><span>{channels.whatsappPrimary.display}</span></div><a className="cta premiumCta" href={whatsappUrl(channels.whatsappPrimary.e164)}>{es?'Abrir WhatsApp Business':'Open WhatsApp Business'}</a></div>
    </section>

    <section className="section split cleanPricing"><div><span className="eyebrow">{es?'PRECIOS CLAROS':'CLEAR PRICING'}</span><h2>{es?'Compara antes de elegir.':'Compare before you choose.'}</h2><p className="sectionCopy">{es?'Consulta la tarifa de plataforma publicada y los costos de proveedor disponibles para la opción seleccionada. Cargos separados de pago, FX o settlement pueden aplicar cuando correspondan y se revelen.':'See the published platform fee and available provider costs for the selected option. Separate payment, FX or settlement charges may apply when relevant and disclosed.'}</p></div><div className="actions"><a className="glassCta" href={`/${locale}/fees`}>{es?'Ver tarifas':'View Fees'}</a></div></section>

    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">{es?'CONFIANZA + CONTROL':'TRUST + CONTROL'}</span><h2>{es?'Competencia en el servicio. Disciplina en los controles.':'Competition in service. Discipline in controls.'}</h2></div><p>{es?'Identidad, sanciones, fraude, corredor, pago y controles de proveedor permanecen separados de la reputación comercial. Una solicitud puede quedar en espera o ser rechazada cuando los controles necesarios no se satisfacen.':'Identity, sanctions, fraud, corridor, payment and provider controls remain separate from commercial reputation. A request can remain on hold or be rejected when required controls are not satisfied.'}</p></section>

    <footer className="footer premiumFooter"><strong>MY CUBA CASH</strong><span><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a> · <a href={`/${locale}/privacy`}>{es?'Privacidad':'Privacy'}</a> · <a href={`/${locale}/terms`}>{es?'Términos':'Terms'}</a></span><span>{es?'La liquidez local compite por el cliente.':'Local liquidity competes for the customer.'}</span></footer>
  </main>;
}
