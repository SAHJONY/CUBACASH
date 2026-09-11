import { copy, localeOf } from '@/lib/i18n';

const family=[
  ['Family beneficiaries','Manage people receiving family support with identity and delivery-method state.'],
  ['Send family support','Create a FAMILY remittance intent for a person beneficiary.'],
  ['Track delivery','Follow review, partner processing, availability, delivery and settlement from one reference.'],
  ['Family history','Preserve recurring-recipient history without letting history override hard compliance controls.']
] as const;

const business=[
  ['Business beneficiary','Register a business recipient separately from a family beneficiary.'],
  ['Business payment','Create a BUSINESS remittance intent tied to an owned sender business and commercial purpose.'],
  ['Invoice / purpose evidence','Keep commercial purpose, supporting evidence and counterparty state attached to the transfer record.'],
  ['Business reconciliation','Match provider settlement, fees and delivered amount against the expected commercial payment.']
] as const;

export default async function Remittances({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const t=copy[locale];
  const rtl=locale==='ar';
  return <main className="shell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>{t.tag}</small></a>
      <div className="navlinks"><a href={`/${locale}/dashboard`}>{t.dashboard}</a><a href={`/${locale}/cash`}>Cash Ledger</a><a href={`/${locale}/agents`}>AI Agents</a><span>{t.compliance}</span></div>
      <a className="miniCta" href="/api/auth/status">Account status</a>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">FAMILY + BUSINESS REMITTANCE OS</div>
        <h1>Send support. Pay businesses. Keep every transfer traceable.</h1>
        <p className="heroLead">mycubacash separates family remittances from private-business payments so each flow can use the right beneficiary, evidence, compliance and partner route.</p>
        <p className="heroSub">The platform orchestrates the customer experience, records and controls. Actual funds movement is activated only through appropriately authorized providers for the applicable corridor.</p>
        <div className="actions"><a className="cta" href="#family">Family remittance</a><a className="ghost" href="#business">Business remittance</a></div>
      </div>
      <aside className="commandPreview" aria-label="Remittance overview">
        <div className="previewTop"><span className="liveDot"/> Remittance Control <span className="previewTag">FAIL-CLOSED</span></div>
        <div className="previewGrid">
          <div><span>Primary flows</span><strong>FAMILY + BUSINESS</strong></div>
          <div><span>Funds movement</span><strong>PARTNER-ROUTED</strong></div>
          <div><span>Customer clearance</span><strong>NOT SELF-ASSERTED</strong></div>
          <div><span>Audit trail</span><strong>PRESERVED</strong></div>
        </div>
      </aside>
    </section>

    <section className="section" id="family">
      <div className="sectionHead"><div><span className="eyebrow">FAMILY REMITTANCE</span><h2>Person-to-person family support</h2></div><p>Designed for legitimate family support to a person beneficiary. The beneficiary must be a person, and the intent remains pending review until trusted controls are satisfied.</p></div>
      <div className="featureGrid">{family.map(([title,description],i)=><article className="feature" key={title}><div className="icon">F{String(i+1).padStart(2,'0')}</div><h3>{title}</h3><p>{description}</p><div className="featureMeta">FAMILY FLOW</div></article>)}</div>
    </section>

    <section className="section" id="business">
      <div className="sectionHead"><div><span className="eyebrow">BUSINESS REMITTANCE</span><h2>Private-business payments</h2></div><p>Designed for legitimate commercial payments. A business payment is tied to an owned sender business, a business beneficiary, a commercial purpose and the applicable evidence and review requirements.</p></div>
      <div className="featureGrid">{business.map(([title,description],i)=><article className="feature" key={title}><div className="icon">B{String(i+1).padStart(2,'0')}</div><h3>{title}</h3><p>{description}</p><div className="featureMeta">BUSINESS FLOW</div></article>)}</div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">CORE RULE</span><h2>Family and business are never silently mixed</h2></div><p>Each transfer is explicitly classified as FAMILY or BUSINESS before routing. Customer input cannot mark sanctions evidence, authorized review or compliance clearance as complete. Trusted evidence and authorized review determine whether an intent may advance to an authorized partner.</p></section>
    <footer className="footer"><strong>mycubacash.com</strong><span>Family + Business Remittance Platform</span><span>v0.6</span></footer>
  </main>;
}
