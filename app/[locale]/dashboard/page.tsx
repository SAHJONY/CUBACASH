import { copy, localeOf } from '@/lib/i18n';

const modules = [
  {k:'Application Brain',d:'Executive orchestration across remittance, marketplace, trust, reliability, improvement and growth.',s:'BRAIN'},
  {k:'Family Remittance',d:'Person-to-person family support, beneficiaries, partner routing, tracking and reconciliation.',s:'CORE'},
  {k:'Business Remittance',d:'Private-business payment intents with commercial purpose, counterparties and settlement evidence.',s:'CORE'},
  {k:'Approved Crypto Routing',d:'USDC, USDT, BTC and ETH preferences routed only through approved networks and appropriately authorized providers. Platform revenue remains USD-only.',s:'PARTNER-GATED'},
  {k:'Private-Sector Marketplace',d:'Buy, sell and service offers for private businesses and entrepreneurs.',s:'CORE'},
  {k:'Community Cash Ledger',d:'Direct cash records, all-party confirmation, public transaction reputation, disputes and gold stars.',s:'READY'},
  {k:'Self-Healing Engine',d:'Detects degradation, retries only idempotent work, quarantines failing adapters and escalates material incidents.',s:'POLICY-GATED'},
  {k:'Self-Improvement Engine',d:'Turns KPI gaps into bounded experiments with guardrails, evidence and rollback discipline.',s:'POLICY-GATED'},
  {k:'Autonomous Growth Engine',d:'Uses first-party marketplace and remittance intent signals for qualification, matching, nurturing and conversion.',s:'CONSENT-GATED'},
  {k:'Trust & Policy Engine',d:'Identity, KYB, sanctions state, fraud signals, evidence and decision controls.',s:'FAIL-CLOSED'}
] as const;

export default async function Dashboard({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const t=copy[locale];
  const rtl=locale==='ar';
  return <main className="shell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Family + Business Remittance</small></a>
      <div className="navlinks"><a href={`/${locale}`}>Home</a><a href={`/${locale}/remittances`}>Remittances</a><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/cash`}>Cash Ledger</a><a href={`/${locale}/agents`}>AI Agents</a><a href={`/${locale}/autonomy`}>Autonomy</a></div>
      <a className="miniCta" href="/api/health">System Health</a>
    </nav>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">FAMILY · BUSINESS · PRIVATE MARKETPLACE</span><h2>{t.dashboard}</h2></div><p>Operational control plane for the primary mycubacash jobs, coordinated by an application brain with bounded self-healing, self-improvement, autonomous growth and partner-gated crypto routing.</p></div>
      <div className="previewGrid">
        <div><span>Brain</span><strong>ORCHESTRATED</strong></div>
        <div><span>Crypto</span><strong>PARTNER-ROUTED</strong></div>
        <div><span>Revenue</span><strong>USD ONLY</strong></div>
        <div><span>Controls</span><strong>FAIL-CLOSED</strong></div>
      </div>
    </section>

    <section className="section" style={{paddingTop:0}}>
      <div className="featureGrid">
        {modules.map((m,i)=><article className="feature" key={m.k}><div className="icon">{String(i+1).padStart(2,'0')}</div><h3>{m.k}</h3><p>{m.d}</p><div className="featureMeta">STATUS · {m.s}</div></article>)}
      </div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">AUTONOMY PRINCIPLE</span><h2>Models propose. Policy authorizes. Evidence promotes.</h2></div><p>Safe reversible recovery can be automated. Material configuration, pricing, regulated actions, binding partner commitments, crypto settlement and unconsented external outreach stay behind explicit policy or approval gates.</p></section>
    <footer className="footer"><strong>mycubacash.com</strong><span>Family Remittance · Business Remittance · Private-Sector Marketplace</span><span>v0.8</span></footer>
  </main>;
}
