import { copy, localeOf } from '@/lib/i18n';
import { APP_COMMUNICATIONS, whatsappUrl } from '@/lib/communications';

const capabilities=[
  ['Buy','Private businesses and entrepreneurs can publish verified demand for goods, inventory, inputs and services.'],
  ['Sell','Suppliers and entrepreneurs can list goods and commercial offers for the private-sector network.'],
  ['Services','Independent service providers can offer logistics, professional, technical and operational services.'],
  ['Trust','Business profiles, community reputation, gold-star ratings and transaction history help counterparties evaluate one another.'],
  ['Business payments','Marketplace matches can move into BUSINESS remittance/payment intents with commercial-purpose evidence.'],
  ['Sofia matching','Sofia can collect the commercial request, identify the transaction context and route it into the documented marketplace workflow.']
] as const;

export default async function Marketplace({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const t=copy[locale];
  const rtl=locale==='ar';
  const channels=APP_COMMUNICATIONS;
  return <main className="shell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Private Sector Marketplace</small></a>
      <div className="navlinks"><a href={`/${locale}`}>Home</a><a href={`/${locale}/remittances`}>Remittances</a><a href={`/${locale}/delivery-providers`}>Delivery</a><a href={`/${locale}/dashboard`}>{t.dashboard}</a></div>
      <a className="miniCta" href={whatsappUrl(channels.whatsappPrimary.e164)}>WhatsApp Business Sofia</a>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">PRIVATE SECTOR + EMPRENDEDORES</div>
        <h1>Buy, sell and offer services inside one trusted private-sector network.</h1>
        <p className="heroLead">The marketplace connects private businesses, entrepreneurs, buyers, suppliers and service providers while keeping reputation, transaction history and business-payment workflows attached to the platform.</p>
        <p className="heroSub">Start a real marketplace request with Sofia on WhatsApp Business. Offers and business-payment workflows stay tied to mycubacash transaction records and verification controls.</p>
        <div className="actions"><a className="cta" href={whatsappUrl(channels.whatsappPrimary.e164)}>Start with Sofia</a><a className="ghost" href={`/${locale}/remittances#business`}>Business payments</a></div>
      </div>
      <aside className="commandPreview" aria-label="Marketplace overview">
        <div className="previewTop"><span className="liveDot"/> Marketplace <span className="previewTag">PRIVATE SECTOR</span></div>
        <div className="previewGrid">
          <div><span>Offer types</span><strong>BUY · SELL · SERVICE</strong></div>
          <div><span>Reputation</span><strong>PUBLIC + STARS</strong></div>
          <div><span>Payments</span><strong>BUSINESS FLOW</strong></div>
          <div><span>Intake</span><strong>SOFIA</strong></div>
        </div>
      </aside>
    </section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">MARKETPLACE OPERATING LAYER</span><h2>Built around real private-sector commerce</h2></div><p>Every marketplace participant keeps its own business identity and reputation. Commercial opportunities can progress from request to matching to documented business payment.</p></div>
      <div className="featureGrid">
        {capabilities.map(([title,description],i)=><article className="feature" key={title}><div className="icon">{String(i+1).padStart(2,'0')}</div><h3>{title}</h3><p>{description}</p><div className="featureMeta">PRIVATE-SECTOR NETWORK</div></article>)}
      </div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">TRUST RULE</span><h2>Reputation is earned, not purchased</h2></div><p>Businesses can pay for legitimate platform services and transaction workflows, while transaction history, disputes and gold-star ratings remain tied to actual platform activity.</p></section>
    <footer className="footer"><strong>mycubacash.com</strong><span>Private-Sector Marketplace · WhatsApp Business Sofia</span><span>v0.11</span></footer>
  </main>;
}
