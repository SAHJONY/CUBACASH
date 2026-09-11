import { AGENTS } from '@/lib/agentic/registry';
import { localeOf } from '@/lib/i18n';

export default async function AgentsPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const rtl=locale==='ar';
  return <main className="shell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Agentic Command Network</small></a>
      <div className="navlinks"><a href={`/${locale}/dashboard`}>Command Center</a><a href={`/${locale}/remittances`}>Remittances</a></div>
      <a className="miniCta" href="/api/health">System Health</a>
    </nav>

    <section className="section">
      <div className="sectionHead">
        <div><span className="eyebrow">MULTI-AGENT CONTROL PLANE</span><h2>Agentic Command Network</h2></div>
        <p>A policy-gated specialist network for planning, research, marketplace operations, RFQs, remittances, compliance, fraud detection, reconciliation and customer operations. High-impact actions are separated from analysis and require the configured evidence and approval gates.</p>
      </div>
      <div className="previewGrid">
        <div><span>Specialist agents</span><strong>{AGENTS.length}</strong></div>
        <div><span>Operating mode</span><strong>POLICY-GATED</strong></div>
        <div><span>Regulated actions</span><strong>HUMAN GATE</strong></div>
        <div><span>Evidence policy</span><strong>FAIL-CLOSED</strong></div>
      </div>
    </section>

    <section className="section" style={{paddingTop:0}}>
      <div className="featureGrid">
        {AGENTS.map((agent,i)=><article className="feature" key={agent.id}>
          <div className="icon">{String(i+1).padStart(2,'0')}</div>
          <h3>{agent.name}</h3>
          <p>{agent.mission}</p>
          <div className="featureMeta">{agent.domain.toUpperCase()} · {agent.capabilities.length} CAPABILITIES</div>
        </article>)}
      </div>
    </section>

    <section className="policyBlock">
      <div><span className="eyebrow">EXECUTION PRINCIPLE</span><h2>Autonomy with hard boundaries</h2></div>
      <p>Agents may autonomously research, plan, rank, reconcile and prepare work inside their permissions. Material writes, regulated financial actions, sanctions-sensitive decisions and prohibited actions cannot be silently self-approved.</p>
    </section>

    <footer className="footer"><strong>mycubacash.com</strong><span>Agentic Command Network</span><span>v1</span></footer>
  </main>;
}
