import { copy, localeOf } from '@/lib/i18n';

const capabilities=[
  ['Buy','Private businesses and entrepreneurs can publish verified demand for goods, inventory, inputs and services.'],
  ['Sell','Suppliers and entrepreneurs can list goods and commercial offers for the private-sector network.'],
  ['Services','Independent service providers can offer logistics, professional, technical and operational services.'],
  ['Trust','Business profiles, community reputation, gold-star ratings and transaction history help counterparties evaluate one another.'],
  ['Business payments','Marketplace matches can move into BUSINESS remittance/payment intents with commercial-purpose evidence.'],
  ['AI matching','The Agentic Command Network can rank buyer/seller/service-provider fit using verified marketplace and trust data.']
] as const;

export default async function Marketplace({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const t=copy[locale];
  const rtl=locale==='ar';
  return <main className="shell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Private Sector Marketplace</small></a>
      <div className="navlinks"><a href={`/${locale}/dashboard`}>{t.dashboard}</a><a href={`/${locale}/remittances`}>Remittances</a><a href={`/${locale}/cash`}>Cash Ledger</a><a href={`/${locale}/agents`}>AI Agents</a></div>
      <a className="miniCta" href="/api/marketplace">Marketplace API</a>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">PRIVATE SECTOR + EMPRENDEDORES</div>
        <h1>Buy, sell and offer services inside one trusted private-sector network.</h1>
        <p className="heroLead">The marketplace connects private businesses, entrepreneurs, buyers, suppliers and service providers while keeping reputation, transaction history and business-payment workflows attached to the platform.</p>
        <p className="heroSub">Offers begin in DRAFT and cannot be self-activated by ordinary users. Marketplace activity stays separate from regulated remittance-partner authorization.</p>
        <div className="actions"><a className="cta" href="/api/marketplace">Browse offers</a><a className="ghost" href={`/${locale}/remittances#business`}>Business payments</a></div>
      </div>
      <aside className="commandPreview" aria-label="Marketplace overview">
        <div className="previewTop"><span className="liveDot"/> Marketplace <span className="previewTag">PRIVATE SECTOR</span></div>
        <div className="previewGrid">
          <div><span>Offer types</span><strong>BUY · SELL · SERVICE</strong></div>
          <div><span>Reputation</span><strong>PUBLIC + STARS</strong></div>
          <div><span>Payments</span><strong>BUSINESS FLOW</strong></div>
          <div><span>AI</span><strong>MATCHING</strong></div>
        </div>
      </aside>
    </section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">MARKETPLACE OPERATING LAYER</span><h2>Built around real private-sector commerce</h2></div><p>Every marketplace participant keeps its own business identity and reputation. Commercial opportunities can progress from listing to matching to documented business payment.</p></div>
      <div className="featureGrid">
        {capabilities.map(([title,description],i)=><article className="feature" key={title}><div className="icon">{String(i+1).padStart(2,'0')}</div><h3>{title}</h3><p>{description}</p><div className="featureMeta">PRIVATE-SECTOR NETWORK</div></article>)}
      </div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">TRUST RULE</span><h2>Reputation is earned, not purchased</h2></div><p>Businesses can pay for tools, visibility and premium capabilities, but transaction history, disputes and gold-star ratings remain tied to actual platform activity and cannot be converted into remittance authorization.</p></section>
    <footer className="footer"><strong>mycubacash.com</strong><span>Family Remittance · Business Remittance · Private-Sector Marketplace</span><span>v0.6</span></footer>
  </main>;
}
