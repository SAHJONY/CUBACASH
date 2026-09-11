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

const crypto=[
  ['USDC','Ethereum · Solana'],
  ['USDT','Ethereum · Solana'],
  ['BTC','Bitcoin'],
  ['ETH','Ethereum']
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
        <p className="heroSub">Fiat and approved crypto can be offered as funding or settlement preferences where an appropriately authorized provider supports the corridor. mycubacash does not take custody of crypto; platform revenue remains USD-denominated.</p>
        <div className="actions"><a className="cta" href="#family">Family remittance</a><a className="ghost" href="#business">Business remittance</a></div>
      </div>
      <aside className="commandPreview" aria-label="Remittance overview">
        <div className="previewTop"><span className="liveDot"/> Remittance Control <span className="previewTag">FAIL-CLOSED</span></div>
        <div className="previewGrid">
          <div><span>Primary flows</span><strong>FAMILY + BUSINESS</strong></div>
          <div><span>Funding options</span><strong>FIAT + APPROVED CRYPTO</strong></div>
          <div><span>Funds movement</span><strong>PARTNER-ROUTED</strong></div>
          <div><span>Platform fees</span><strong>USD ONLY</strong></div>
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

    <section className="section" id="crypto">
      <div className="sectionHead"><div><span className="eyebrow">APPROVED CRYPTO</span><h2>Partner-routed digital-asset options</h2></div><p>Only approved asset/network combinations are supported. Customer choice is a routing preference, not compliance clearance or authorization to transmit funds.</p></div>
      <div className="featureGrid">{crypto.map(([asset,networks],i)=><article className="feature" key={asset}><div className="icon">C{String(i+1).padStart(2,'0')}</div><h3>{asset}</h3><p>{networks}</p><div className="featureMeta">AUTHORIZED PROVIDER REQUIRED</div></article>)}</div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">CORE RULE</span><h2>Funding preference never overrides compliance</h2></div><p>Family and business classification, sanctions state, identity/KYB, corridor controls, approved crypto asset/network policy and authorized-provider eligibility all remain separate gates. Crypto never bypasses them.</p></section>
    <footer className="footer"><strong>mycubacash.com</strong><span>Family + Business Remittance · Fiat + Approved Crypto</span><span>v0.8</span></footer>
  </main>;
}
