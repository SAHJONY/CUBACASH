import { copy, localeOf } from '@/lib/i18n';

const modules = [
  {k:'Business Network',d:'Business profiles, ownership, counterparties and operating identity.',s:'READY'},
  {k:'Marketplace',d:'Buyer demand, supplier offers and opportunity discovery.',s:'READY'},
  {k:'RFQ Desk',d:'Structured requirements, supplier responses and sourcing workflow.',s:'READY'},
  {k:'Trade Corridors',d:'CU-CU, CU-WORLD, WORLD-CU, CU-US and WORLD-WORLD routing.',s:'READY'},
  {k:'Policy Engine',d:'KYC/KYB, sanctions state, fraud signals, evidence and decision controls.',s:'READY'},
  {k:'Operations Ledger',d:'Traceable transaction intents, workflow state and audit evidence.',s:'READY'}
] as const;

export default async function Dashboard({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const t=copy[locale];
  const rtl=locale==='ar';
  return <main className="shell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>{t.tag}</small></a>
      <div className="navlinks"><a href={`/${locale}`}>Home</a><span>{t.market}</span><span>{t.rfq}</span><span>{t.trade}</span><span>{t.compliance}</span></div>
      <a className="miniCta" href="/api/health">System Health</a>
    </nav>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">PRIVATE ECONOMY COMMAND CENTER</span><h2>{t.dashboard}</h2></div><p>Operational shell for the standalone mycubacash.com platform. Modules are wired as product domains without fabricated customer, transaction or counterparty data.</p></div>
      <div className="previewGrid">
        <div><span>Platform</span><strong>ONLINE</strong></div>
        <div><span>Policy mode</span><strong>FAIL-CLOSED</strong></div>
        <div><span>Corridors</span><strong>5</strong></div>
        <div><span>Data policy</span><strong>EVIDENCE-FIRST</strong></div>
      </div>
    </section>

    <section className="section" style={{paddingTop:0}}>
      <div className="featureGrid">
        {modules.map((m,i)=><article className="feature" key={m.k}><div className="icon">{String(i+1).padStart(2,'0')}</div><h3>{m.k}</h3><p>{m.d}</p><div className="featureMeta">STATUS · {m.s}</div></article>)}
      </div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">CONTROL PRINCIPLE</span><h2>Evidence before execution</h2></div><p>{t.policyNotice}</p></section>
    <footer className="footer"><strong>mycubacash.com</strong><span>Private Sector Economy Command Center</span><span>v0.2</span></footer>
  </main>;
}
