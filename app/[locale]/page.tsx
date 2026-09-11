import { localeOf, locales } from '@/lib/i18n';
import { APP_COMMUNICATIONS, whatsappUrl } from '@/lib/communications';

const corridorRows = [
  ['FAMILY','Family support to person beneficiaries'],
  ['BUSINESS','Private-business payments with commercial purpose'],
  ['MARKETPLACE','Buy, sell and service offers for private businesses and entrepreneurs'],
  ['CU-CU / WORLD-CU','Domestic and international-to-Cuba routing'],
  ['CU-WORLD / CU-US','Outbound and U.S.-nexus flows with additional controls']
] as const;

export default async function LocaleHome({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const rtl=locale==='ar';
  const channels=APP_COMMUNICATIONS;

  return <main className="shell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Family · Business · Marketplace</small></a>
      <div className="navlinks">
        <a href={`/${locale}/start`}>Send Support</a><a href={`/${locale}/transactions`}>Track</a><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/delivery-providers`}>Delivery</a><a href={`/${locale}/fees`}>Fees</a><a href="#contact">Sofia</a>
      </div>
      <div className="navright"><div className="lang">{locales.map(l=><a key={l} href={`/${l}`}>{l.toUpperCase()}</a>)}</div><a className="miniCta" href={`/${locale}/auth`}>Sign In</a></div>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">FAMILY REMITTANCE · BUSINESS REMITTANCE · PRIVATE MARKETPLACE</div>
        <h1>Support families. Pay businesses. Track every transaction.</h1>
        <p className="heroLead">mycubacash brings family remittance requests, private-business payments, verified delivery services and private-sector commerce into one traceable platform.</p>
        <p className="heroSub">Create a customer account, start a transaction request, receive a mycubacash reference and track its review and fulfillment status. Sofia remains available on WhatsApp Business for assisted service.</p>
        <div className="actions"><a className="cta" href={`/${locale}/start`}>Start Transaction</a><a className="ghost" href={`/${locale}/transactions`}>Track Transaction</a><a className="ghost" href={whatsappUrl(channels.whatsappPrimary.e164)}>WhatsApp Business Sofia</a></div>
        <div className="trustbar"><span>✓ TRANSACTION REFERENCES</span><span>✓ PRIVATE-SECTOR NETWORK</span><span>✓ FAIL-CLOSED REVIEW</span></div>
      </div>
      <aside className="commandPreview" aria-label="Customer transaction flow">
        <div className="previewTop"><span className="liveDot"/> mycubacash.com <span className="previewTag">TRANSACTION OS</span></div>
        <div className="previewGrid">
          <div><span>Start</span><strong>ACCOUNT + RECEIVER</strong></div>
          <div><span>Review</span><strong>IDENTITY + CONTROLS</strong></div>
          <div><span>Fulfillment</span><strong>BUSINESS + DELIVERY</strong></div>
          <div><span>Track</span><strong>REFERENCE + STATUS</strong></div>
        </div>
        <div className="flow"><span>Request</span><i>→</i><span>Transaction ID</span><i>→</i><span>Review</span><i>→</i><span>Confirmation</span></div>
      </aside>
    </section>

    <section className="section" id="family">
      <div className="sectionHead"><div><span className="eyebrow">01 · FAMILY</span><h2>Family remittance</h2></div><p>Person-to-person family support with beneficiary records, transaction tracking, confirmation history and evidence-aware routing.</p></div>
      <div className="featureGrid">
        <article className="feature"><div className="icon">01</div><h3>Add your receiver</h3><p>Create a private recipient record for a legitimate family beneficiary.</p><div className="featureMeta">PERSON · IDENTITY · DELIVERY</div></article>
        <article className="feature"><div className="icon">02</div><h3>Create the request</h3><p>Enter sender information, amount, corridor, purpose and source-of-funds context.</p><div className="featureMeta">REQUEST · REVIEW · REFERENCE</div></article>
        <article className="feature"><div className="icon">03</div><h3>Track the result</h3><p>Follow the transaction status from pending review through fulfillment and settlement.</p><div className="featureMeta">STATUS · HISTORY · RECONCILIATION</div></article>
      </div>
      <div className="actions"><a className="cta" href={`/${locale}/start`}>Start Family Transaction</a></div>
    </section>

    <section className="section" id="business">
      <div className="sectionHead"><div><span className="eyebrow">02 · BUSINESS</span><h2>Private-business payments</h2></div><p>Commercial payment requests tied to legitimate private businesses, counterparties, commercial purpose and appropriate review controls.</p></div>
      <div className="featureGrid">
        <article className="feature"><div className="icon">01</div><h3>Business counterparties</h3><p>Keep business recipient identity, registration and verification state separate from family beneficiaries.</p><div className="featureMeta">BUSINESS · KYB · COUNTERPARTY</div></article>
        <article className="feature"><div className="icon">02</div><h3>Commercial purpose</h3><p>Document the reason for payment, supporting evidence and transaction economics.</p><div className="featureMeta">PURPOSE · EVIDENCE · ROUTING</div></article>
        <article className="feature"><div className="icon">03</div><h3>Controlled settlement</h3><p>Funds movement remains tied to appropriately authorized payment or remittance infrastructure where required.</p><div className="featureMeta">PAYMENT · SETTLEMENT · RECONCILIATION</div></article>
      </div>
    </section>

    <section className="section" id="marketplace">
      <div className="sectionHead"><div><span className="eyebrow">03 · MARKETPLACE</span><h2>Private-sector marketplace</h2></div><p>Businesses and entrepreneurs can create BUY, SELL and SERVICE opportunities, build reputation and move matched opportunities into documented payment workflows.</p></div>
      <div className="featureGrid">
        <article className="feature"><div className="icon">01</div><h3>Buy</h3><p>Request goods, inputs, inventory and services from verified private-sector participants.</p><div className="featureMeta">DEMAND · RFQ · SOURCING</div></article>
        <article className="feature"><div className="icon">02</div><h3>Sell</h3><p>Publish commercial offers for legitimate private-sector buyers.</p><div className="featureMeta">OFFERS · PRODUCTS · SUPPLIERS</div></article>
        <article className="feature"><div className="icon">03</div><h3>Services</h3><p>Offer professional, technical, logistics and other legitimate private-sector services.</p><div className="featureMeta">SERVICES · TRUST · MATCHING</div></article>
      </div>
      <div className="actions"><a className="cta" href={`/${locale}/marketplace`}>Explore Marketplace</a></div>
    </section>

    <section className="section" id="contact">
      <div className="sectionHead"><div><span className="eyebrow">SOFIA · ASSISTED SERVICE</span><h2>Need help? Continue on WhatsApp Business.</h2></div><p>Sofia can help collect transaction information and coordinate next steps. Never send your account password or one-time login codes through WhatsApp Business.</p></div>
      <div className="featureGrid">
        <article className="feature"><div className="icon">W</div><h3>{channels.whatsappPrimary.label}</h3><p><strong>{channels.whatsappPrimary.display}</strong></p><p>Primary assisted-service channel for mycubacash customer communication.</p><div className="actions"><a className="cta" href={whatsappUrl(channels.whatsappPrimary.e164)}>Open WhatsApp Business</a></div></article>
        <article className="feature"><div className="icon">W2</div><h3>{channels.whatsappSecondary.label}</h3><p><strong>{channels.whatsappSecondary.display}</strong></p><p>Secondary WhatsApp Business channel.</p><div className="actions"><a className="cta" href={whatsappUrl(channels.whatsappSecondary.e164)}>Open WhatsApp Business</a></div></article>
        {channels.phone.enabled&&<article className="feature"><div className="icon">P</div><h3>{channels.phone.label}</h3><p><strong>{channels.phone.display}</strong></p><p>Inbound Sofia voice support.</p><div className="actions"><a className="cta" href={`tel:${channels.phone.e164}`}>Call Sofia</a></div></article>}
      </div>
    </section>

    <section className="section split"><div><span className="eyebrow">CLEAR PRICING</span><h2>Published mycubacash platform fees</h2><p className="sectionCopy">See the active platform fee schedule before starting a transaction. Separate payment, FX, settlement or delivery provider costs may apply when disclosed for the selected route.</p></div><div className="actions"><a className="cta" href={`/${locale}/fees`}>View Fees</a></div></section>

    <section className="policyBlock" id="controls"><div><span className="eyebrow">TRUST + CONTROL</span><h2>Evidence governs execution</h2></div><p>Identity, sanctions, fraud, corridor, payment and provider controls remain separate from reputation. A transaction request can remain on hold or be rejected when required controls are not satisfied.</p></section>

    <footer className="footer"><strong>mycubacash.com</strong><span><a href={`/${locale}/fees`}>Fees</a> · <a href={`/${locale}/privacy`}>Privacy</a> · <a href={`/${locale}/terms`}>Terms</a></span><span>WhatsApp Business {channels.whatsappPrimary.display}</span></footer>
  </main>;
}
