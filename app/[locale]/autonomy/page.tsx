import { localeOf } from '@/lib/i18n';

const engines=[
  ['Application Brain','Coordinates specialist agents and produces policy-gated next actions from current evidence.','ORCHESTRATOR'],
  ['Self-Healing Reliability','Detects failures, retries bounded idempotent work, quarantines failing adapters and escalates critical incidents.','AUTO-SAFE'],
  ['Self-Improvement','Measures KPI gaps, proposes experiments, enforces guardrails and promotes only validated winners.','EXPERIMENT-GATED'],
  ['Autonomous Growth','Scores first-party intent, matches marketplace demand, nurtures opted-in prospects and routes qualified opportunities.','CONSENT-GATED']
] as const;

export default async function Autonomy({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params; const locale=localeOf(raw); const rtl=locale==='ar';
  return <main className="shell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Application Brain</small></a>
      <div className="navlinks"><a href={`/${locale}/dashboard`}>Command Center</a><a href={`/${locale}/remittances`}>Remittances</a><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/agents`}>Agents</a></div>
      <a className="miniCta" href="/api/autonomy">Autonomy API</a>
    </nav>
    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">AUTONOMOUS OPERATING SYSTEM</span><h2>Brain, resilience, learning and growth</h2></div><p>The application can continuously reason about operations and growth, but autonomy remains bounded by reversibility, evidence, customer consent and regulatory controls.</p></div>
      <div className="previewGrid">
        <div><span>Safe repair</span><strong>AUTOMATABLE</strong></div>
        <div><span>Material change</span><strong>APPROVAL</strong></div>
        <div><span>Sales</span><strong>CONSENT-AWARE</strong></div>
        <div><span>Regulated action</span><strong>HUMAN/POLICY GATE</strong></div>
      </div>
    </section>
    <section className="section" style={{paddingTop:0}}><div className="featureGrid">{engines.map(([n,d,s],i)=><article className="feature" key={n}><div className="icon">{String(i+1).padStart(2,'0')}</div><h3>{n}</h3><p>{d}</p><div className="featureMeta">{s}</div></article>)}</div></section>
    <section className="policyBlock"><div><span className="eyebrow">CORE DOCTRINE</span><h2>Models propose. Policy authorizes. Evidence promotes.</h2></div><p>No autonomous engine can clear sanctions, approve its own regulated transaction, create binding partner obligations, change material pricing or send marketing to an opted-out user.</p></section>
    <footer className="footer"><strong>mycubacash.com</strong><span>Autonomous Operating System</span><span>v0.7</span></footer>
  </main>;
}
