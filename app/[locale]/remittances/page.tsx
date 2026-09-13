import { copy, localeOf } from '@/lib/i18n';

const family=[
  ['Family beneficiaries','Manage people receiving family support with identity and delivery-method state.'],
  ['Send family support','Create a FAMILY remittance intent for a person beneficiary.'],
  ['Receiver choice','Where supported, the beneficiary can choose an eligible cash payout route or approved private-sector goods and services.'],
  ['Track delivery','Follow review, partner processing, availability, delivery and settlement from one reference.']
] as const;

const business=[
  ['Business beneficiary','Register a business recipient separately from a family beneficiary.'],
  ['Business payment','Create a BUSINESS remittance intent tied to an owned sender business and commercial purpose.'],
  ['Invoice / purpose evidence','Keep commercial purpose, supporting evidence and counterparty state attached to the transfer record.'],
  ['Business reconciliation','Match provider settlement, fees and delivered amount against the expected commercial payment.']
] as const;

const delivery=[
  ['Independent delivery provider','A single person may register for delivery work, including part-time availability, without becoming a remittance intermediary.'],
  ['Private-business delivery provider','A verified private-sector business can register its delivery service separately from its merchant role.'],
  ['Multi-role account','The same account may be a customer, family beneficiary and independent delivery provider. Each role keeps separate permissions.'],
  ['Beneficiary rights stay intact','A delivery provider who is personally receiving family support can receive their own FAMILY remittance like any other eligible beneficiary.']
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
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{t.tag}</small></a>
      <div className="navlinks"><a href={`/${locale}/dashboard`}>{t.dashboard}</a><a href={`/${locale}/cash`}>Cash Ledger</a><a href={`/${locale}/agents`}>AI Agents</a><span>{t.compliance}</span></div>
      <a className="miniCta" href="/api/auth/status">Account status</a>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">FAMILY + BUSINESS + DELIVERY NETWORK</div>
        <h1>Send support. Pay businesses. Deliver to family. Keep every role traceable.</h1>
        <p className="heroLead">MY CUBA CASH separates family remittances, private-business payments and delivery-provider activity so one person can hold multiple legitimate roles without those permissions bleeding into one another.</p>
        <p className="heroSub">Fiat and approved crypto can be offered as funding or settlement preferences where an appropriately authorized provider supports the corridor. Delivery-provider status never authorizes a person or business to transmit remittance funds for others.</p>
        <div className="actions"><a className="cta" href="#family">Family remittance</a><a className="ghost" href="#delivery">Delivery providers</a></div>
      </div>
      <aside className="commandPreview" aria-label="Remittance overview">
        <div className="previewTop"><span className="liveDot"/> Remittance Control <span className="previewTag">ROLE-SEPARATED</span></div>
        <div className="previewGrid">
          <div><span>Primary flows</span><strong>FAMILY + BUSINESS</strong></div>
          <div><span>Delivery providers</span><strong>INDIVIDUAL + BUSINESS</strong></div>
          <div><span>Funds movement</span><strong>AUTHORIZED ROUTE ONLY</strong></div>
          <div><span>Platform fees</span><strong>USD ONLY</strong></div>
        </div>
      </aside>
    </section>

    <section className="section" id="family">
      <div className="sectionHead"><div><span className="eyebrow">FAMILY REMITTANCE</span><h2>Person-to-person family support</h2></div><p>Designed for legitimate family support to a person beneficiary. A beneficiary may also hold another platform role, including independent delivery provider, without changing the rules that apply to the FAMILY remittance.</p></div>
      <div className="featureGrid">{family.map(([title,description],i)=><article className="feature" key={title}><div className="icon">F{String(i+1).padStart(2,'0')}</div><h3>{title}</h3><p>{description}</p><div className="featureMeta">FAMILY FLOW</div></article>)}</div>
    </section>

    <section className="section" id="delivery">
      <div className="sectionHead"><div><span className="eyebrow">DELIVERY PROVIDERS</span><h2>Part-time individuals and private businesses</h2></div><p>Verified private-sector individuals and businesses can maintain delivery profiles, service areas and availability. Their delivery role is operational only; it does not create remittance, cash-handling or money-transmission authority.</p></div>
      <div className="featureGrid">{delivery.map(([title,description],i)=><article className="feature" key={title}><div className="icon">D{String(i+1).padStart(2,'0')}</div><h3>{title}</h3><p>{description}</p><div className="featureMeta">SEPARATE ROLE + PERMISSIONS</div></article>)}</div>
    </section>

    <section className="section" id="business">
      <div className="sectionHead"><div><span className="eyebrow">BUSINESS REMITTANCE</span><h2>Private-business payments</h2></div><p>Designed for legitimate commercial payments. A business payment is tied to an owned sender business, a business beneficiary, a commercial purpose and the applicable evidence and review requirements.</p></div>
      <div className="featureGrid">{business.map(([title,description],i)=><article className="feature" key={title}><div className="icon">B{String(i+1).padStart(2,'0')}</div><h3>{title}</h3><p>{description}</p><div className="featureMeta">BUSINESS FLOW</div></article>)}</div>
    </section>

    <section className="section" id="crypto">
      <div className="sectionHead"><div><span className="eyebrow">APPROVED CRYPTO</span><h2>Partner-routed digital-asset options</h2></div><p>Only approved asset/network combinations are supported. Customer choice is a routing preference, not compliance clearance or authorization to transmit funds.</p></div>
      <div className="featureGrid">{crypto.map(([asset,networks],i)=><article className="feature" key={asset}><div className="icon">C{String(i+1).padStart(2,'0')}</div><h3>{asset}</h3><p>{networks}</p><div className="featureMeta">AUTHORIZED PROVIDER REQUIRED</div></article>)}</div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">CORE RULE</span><h2>One account can have many roles, but authority never transfers between roles</h2></div><p>A delivery provider may receive their own family remittance as a beneficiary. That does not authorize them to receive or transmit remittance funds on behalf of unrelated customers. Family/business classification, identity/KYB, sanctions state, corridor controls and authorized-provider eligibility remain separate gates.</p></section>
    <footer className="footer"><strong>MY CUBA CASH</strong><span>Family + Business Remittance · Private-Sector Delivery Network</span><span>v0.9</span></footer>
  </main>;
}
