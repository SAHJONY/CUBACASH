import { copy, localeOf } from '@/lib/i18n';

const modules = [
  {k:'Family Remittance',d:'Person-to-person family support, beneficiaries, partner routing, tracking and reconciliation.',s:'CORE'},
  {k:'Business Remittance',d:'Private-business payment intents with commercial purpose, counterparties and settlement evidence.',s:'CORE'},
  {k:'Private-Sector Marketplace',d:'Buy, sell and service offers for private businesses and entrepreneurs.',s:'CORE'},
  {k:'Community Cash Ledger',d:'Direct cash records, all-party confirmation, public transaction reputation, disputes and gold stars.',s:'READY'},
  {k:'Agentic Command Network',d:'AI orchestration for remittance, marketplace matching, compliance, fraud, support and reconciliation.',s:'READY'},
  {k:'Trust & Policy Engine',d:'Identity, KYB, sanctions state, fraud signals, evidence and decision controls.',s:'READY'}
] as const;

export default async function Dashboard({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const t=copy[locale];
  const rtl=locale==='ar';
  return <main className="shell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Family + Business Remittance</small></a>
      <div className="navlinks"><a href={`/${locale}`}>Home</a><a href={`/${locale}/remittances`}>Remittances</a><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/cash`}>Cash Ledger</a><a href={`/${locale}/agents`}>AI Agents</a></div>
      <a className="miniCta" href="/api/health">System Health</a>
    </nav>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">FAMILY · BUSINESS · PRIVATE MARKETPLACE</span><h2>{t.dashboard}</h2></div><p>Operational control plane for the three primary mycubacash jobs: family remittance, private-business remittance and a marketplace for private-sector businesses and entrepreneurs.</p></div>
      <div className="previewGrid">
        <div><span>Family</span><strong>REMITTANCE</strong></div>
        <div><span>Business</span><strong>PAYMENTS</strong></div>
        <div><span>Commerce</span><strong>MARKETPLACE</strong></div>
        <div><span>Controls</span><strong>FAIL-CLOSED</strong></div>
      </div>
    </section>

    <section className="section" style={{paddingTop:0}}>
      <div className="featureGrid">
        {modules.map((m,i)=><article className="feature" key={m.k}><div className="icon">{String(i+1).padStart(2,'0')}</div><h3>{m.k}</h3><p>{m.d}</p><div className="featureMeta">STATUS · {m.s}</div></article>)}
      </div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">CONTROL PRINCIPLE</span><h2>Trust and evidence before execution</h2></div><p>Community reputation can improve discovery and trust, but it never replaces identity, business verification, current compliance evidence or authorized provider controls where required.</p></section>
    <footer className="footer"><strong>mycubacash.com</strong><span>Family Remittance · Business Remittance · Private-Sector Marketplace</span><span>v0.6</span></footer>
  </main>;
}
