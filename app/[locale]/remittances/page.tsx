import { copy, localeOf } from '@/lib/i18n';

const capabilities=[
  ['Beneficiaries','Create and maintain recipients with identity, delivery-method and sanctions states.'],
  ['Send money','Create a remittance intent with corridor classification and fail-closed policy checks.'],
  ['Track transfer','Follow compliance, partner-processing, delivery and settlement states from one reference.'],
  ['Fees & FX','Attach partner quotes, fees, exchange rates and expected recipient amount without inventing pricing.'],
  ['Compliance status','See holds, evidence requirements, authorized-review requirements and policy versions.'],
  ['Reconciliation','Match partner settlement outcomes against expected amounts and preserve supporting evidence.']
];

export default async function Remittances({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const t=copy[locale];
  const rtl=locale==='ar';
  return <main className="shell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>{t.tag}</small></a>
      <div className="navlinks"><a href={`/${locale}/dashboard`}>{t.dashboard}</a><span>{t.market}</span><span>{t.rfq}</span><span>{t.trade}</span><span>{t.compliance}</span></div>
      <a className="miniCta" href="/api/auth/status">Auth status</a>
    </nav>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">REMITTANCE OPERATIONS</span><h2>Remittance Control Center</h2></div><p>Customer-facing orchestration for beneficiaries, transfer intents, compliance, partner routing, tracking and reconciliation. Live money movement and live FX/fees are only activated through configured authorized providers.</p></div>
      <div className="previewGrid">
        <div><span>Policy mode</span><strong>FAIL-CLOSED</strong></div>
        <div><span>Sanctions state</span><strong>EVIDENCE-BASED</strong></div>
        <div><span>Funds movement</span><strong>PARTNER-ROUTED</strong></div>
        <div><span>Audit trail</span><strong>PRESERVED</strong></div>
      </div>
    </section>

    <section className="section" style={{paddingTop:0}}>
      <div className="featureGrid">
        {capabilities.map((c,i)=><article className="feature" key={c[0]}><div className="icon">{String(i+1).padStart(2,'0')}</div><h3>{c[0]}</h3><p>{c[1]}</p><div className="featureMeta">CUSTOMER MODULE</div></article>)}
      </div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">TRANSFER PRINCIPLE</span><h2>Verify before routing</h2></div><p>Every remittance starts as an intent. The platform classifies the corridor, checks identity and sanctions state, identifies missing evidence, and only marks a transfer ready for a payment partner when the configured controls are satisfied.</p></section>
    <footer className="footer"><strong>mycubacash.com</strong><span>Remittance Control Center</span><span>v0.3</span></footer>
  </main>;
}
