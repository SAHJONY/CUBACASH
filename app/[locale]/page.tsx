import { copy, localeOf, locales } from '@/lib/i18n';

export default async function LocaleHome({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const t=copy[locale];
  const rtl=locale==='ar';
  return <main className="shell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav">
      <div><div className="brand">{t.brand}</div><small>{t.tag}</small></div>
      <div className="navlinks"><span>{t.market}</span><span>{t.rfq}</span><span>{t.trade}</span><span>{t.compliance}</span><span>{t.ledger}</span></div>
      <div className="lang">{locales.map(l=><a key={l} href={`/${l}`}>{l.toUpperCase()}</a>)}</div>
    </nav>
    <section className="hero">
      <div>
        <div className="eyebrow">PRIVATE ECONOMY OS</div>
        <h1>mycubacash.com</h1>
        <p>{t.hero}</p>
        <a className="cta" href="/api/health">{t.cta}</a>
      </div>
      <aside className="panel">
        <div className="metric"><span>{t.status}</span><strong>FOUNDATION READY</strong></div>
        <div className="metric"><span>{t.corridors}</span><strong>5</strong></div>
        <div className="metric"><span>Languages</span><strong>ES · EN · FR · PT · AR</strong></div>
        <div className="metric"><span>Compliance</span><strong>FAIL-CLOSED</strong></div>
      </aside>
    </section>
    <section className="grid">
      <article className="card"><span className="badge">{t.private}</span><h3>{t.businesses}</h3><p>Business identity, KYB state, beneficial ownership, counterparties, catalogues and trusted operating profiles.</p></article>
      <article className="card"><span className="badge">{t.global}</span><h3>{t.market} + {t.rfq}</h3><p>Buyer demand, supplier offers, RFQs, sourcing, corridor routing, landed-cost preparation and opportunity management.</p></article>
      <article className="card"><span className="badge">{t.safe}</span><h3>{t.compliance}</h3><p>KYC/KYB, sanctions state, anomaly signals, U.S.-nexus controls, audit evidence and transaction decisioning.</p></article>
      <article className="card"><span className="badge">CU-CU</span><h3>Domestic Private Commerce</h3><p>Private-sector transactions inside Cuba with business, invoice, tax and counterparty evidence workflows.</p></article>
      <article className="card"><span className="badge">WORLD-CU</span><h3>Global Sourcing</h3><p>International suppliers, customs, logistics, banking-route readiness and private-sector import workflows.</p></article>
      <article className="card"><span className="badge">CU-WORLD</span><h3>Export & Market Access</h3><p>Private producers and service providers can structure export opportunities with evidence-backed compliance gates.</p></article>
    </section>
    <div className="notice">{t.notice}</div>
    <footer className="footer">mycubacash.com · Private Sector Economy Platform · v0.1</footer>
  </main>;
}
