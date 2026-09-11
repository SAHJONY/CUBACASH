import { copy, localeOf, locales } from '@/lib/i18n';

const corridorRows = [
  ['CU-CU','Private commerce inside Cuba'],
  ['CU-WORLD','Private-sector exports from Cuba'],
  ['WORLD-CU','Imports and sourcing into Cuba'],
  ['CU-US','U.S.-nexus workflow with special controls'],
  ['WORLD-WORLD','International private-sector trade']
] as const;

export default async function LocaleHome({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const t=copy[locale];
  const rtl=locale==='ar';
  return <main className="shell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">{t.brand}</div><small>{t.tag}</small></a>
      <div className="navlinks">
        <a href="#network">{t.businesses}</a><a href="#commerce">{t.market}</a><a href="#trade">{t.trade}</a><a href="#controls">{t.compliance}</a>
      </div>
      <div className="navright"><div className="lang">{locales.map(l=><a key={l} href={`/${l}`}>{l.toUpperCase()}</a>)}</div><a className="miniCta" href={`/${locale}/dashboard`}>{t.dashboard}</a></div>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">PRIVATE SECTOR ECONOMY OS</div>
        <h1>{t.brand}</h1>
        <p className="heroLead">{t.hero}</p>
        <p className="heroSub">{t.subhero}</p>
        <div className="actions"><a className="cta" href={`/${locale}/dashboard`}>{t.cta}</a><a className="ghost" href="#platform">{t.secondary}</a></div>
        <div className="trustbar"><span>✓ {t.private}</span><span>✓ ES · EN · FR · PT · AR</span><span>✓ {t.safe}</span></div>
      </div>
      <aside className="commandPreview" aria-label="Platform overview">
        <div className="previewTop"><span className="liveDot"/> mycubacash.com <span className="previewTag">CONTROL PLANE</span></div>
        <div className="previewGrid">
          <div><span>{t.status}</span><strong>READY</strong></div>
          <div><span>{t.corridors}</span><strong>5</strong></div>
          <div><span>{t.orchestration}</span><strong>FAIL-CLOSED</strong></div>
          <div><span>{t.evidence}</span><strong>SOURCE-BOUND</strong></div>
        </div>
        <div className="flow"><span>Identity</span><i>→</i><span>Trade</span><i>→</i><span>Policy</span><i>→</i><span>Evidence</span></div>
      </aside>
    </section>

    <section className="section" id="platform">
      <div className="sectionHead"><div><span className="eyebrow">ONE OPERATING LAYER</span><h2>Private economy infrastructure</h2></div><p>Built to coordinate real businesses, real demand, real supply, traceable workflows and evidence-backed controls.</p></div>
      <div className="featureGrid">
        <article className="feature" id="network"><div className="icon">01</div><h3>{t.networkTitle}</h3><p>{t.networkBody}</p><div className="featureMeta">KYB · Ownership · Counterparties · Profiles</div></article>
        <article className="feature" id="commerce"><div className="icon">02</div><h3>{t.commerceTitle}</h3><p>{t.commerceBody}</p><div className="featureMeta">Demand · Offers · RFQs · Sourcing</div></article>
        <article className="feature" id="trade"><div className="icon">03</div><h3>{t.tradeTitle}</h3><p>{t.tradeBody}</p><div className="featureMeta">Logistics · Documents · Landed Cost · Workflow</div></article>
        <article className="feature" id="controls"><div className="icon">04</div><h3>{t.controlsTitle}</h3><p>{t.controlsBody}</p><div className="featureMeta">KYC/KYB · Sanctions · Fraud · Audit</div></article>
      </div>
    </section>

    <section className="section split">
      <div><span className="eyebrow">TRADE ROUTING</span><h2>Five corridor model</h2><p className="sectionCopy">Every transaction intent is classified before controls are evaluated. No corridor is treated as universally equivalent.</p></div>
      <div className="corridorTable">{corridorRows.map(([code,label])=><div className="corridorRow" key={code}><strong>{code}</strong><span>{label}</span></div>)}</div>
    </section>

    <section className="policyBlock">
      <div><span className="eyebrow">POLICY ORCHESTRATION</span><h2>Controls without fabricated certainty</h2></div>
      <p>{t.policyNotice}</p>
    </section>

    <footer className="footer"><strong>mycubacash.com</strong><span>Private Sector Economy Platform</span><span>v0.2</span></footer>
  </main>;
}
