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
        <a href="#family">Family</a><a href="#business">Business</a><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/delivery-providers`}>Delivery</a><a href="#contact">Contact Sofia</a><a href="#controls">Trust & Controls</a>
      </div>
      <div className="navright"><div className="lang">{locales.map(l=><a key={l} href={`/${l}`}>{l.toUpperCase()}</a>)}</div><a className="miniCta" href={`/${locale}/dashboard`}>Command Center</a></div>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">FAMILY REMITTANCE · BUSINESS REMITTANCE · PRIVATE MARKETPLACE</div>
        <h1>Support families. Pay businesses. Connect private-sector commerce.</h1>
        <p className="heroLead">mycubacash is focused on family remittances, private-business payments, verified delivery services and a trusted marketplace for private businesses and entrepreneurs.</p>
        <p className="heroSub">Start with Sofia on WhatsApp Business. The application keeps the transaction reference, sender and receiver records, delivery coordination, receipts, confirmations and transaction history together.</p>
        <div className="actions"><a className="cta" href={whatsappUrl(channels.whatsappPrimary.e164)}>WhatsApp Business Sofia</a>{channels.phone.enabled&&<a className="ghost" href={`tel:${channels.phone.e164}`}>Call Sofia</a>}</div>
        <div className="trustbar"><span>✓ FAMILY + BUSINESS</span><span>✓ PRIVATE SECTOR + EMPRENDEDORES</span><span>✓ WHATSAPP BUSINESS{channels.phone.enabled?' · PHONE':''}</span></div>
      </div>
      <aside className="commandPreview" aria-label="Platform overview">
        <div className="previewTop"><span className="liveDot"/> mycubacash.com <span className="previewTag">REMITTANCE + COMMERCE OS</span></div>
        <div className="previewGrid">
          <div><span>Family</span><strong>PERSON BENEFICIARY</strong></div>
          <div><span>Business</span><strong>PRIVATE SECTOR</strong></div>
          <div><span>Delivery</span><strong>VERIFIED PROVIDERS</strong></div>
          <div><span>Sofia</span><strong>{channels.phone.enabled?'WHATSAPP BUSINESS + PHONE':'WHATSAPP BUSINESS'}</strong></div>
        </div>
        <div className="flow"><span>Contact</span><i>→</i><span>Transaction ID</span><i>→</i><span>Fulfillment</span><i>→</i><span>Confirmation</span></div>
      </aside>
    </section>

    <section className="section" id="family">
      <div className="sectionHead"><div><span className="eyebrow">01 · FAMILY</span><h2>Family remittance</h2></div><p>Person-to-person family support with beneficiary records, transfer tracking, confirmation history and evidence-aware routing.</p></div>
      <div className="featureGrid">
        <article className="feature"><div className="icon">01</div><h3>Family beneficiaries</h3><p>Create recipient profiles for relatives and other legitimate family beneficiaries.</p><div className="featureMeta">PERSON · IDENTITY · DELIVERY</div></article>
        <article className="feature"><div className="icon">02</div><h3>Send support</h3><p>Create a FAMILY intent, choose the corridor and delivery method, and track its state.</p><div className="featureMeta">INTENT · ROUTING · TRACKING</div></article>
        <article className="feature"><div className="icon">03</div><h3>Trusted history</h3><p>Keep an auditable history of recurring beneficiaries and completed outcomes.</p><div className="featureMeta">HISTORY · RECEIPTS · RECONCILIATION</div></article>
      </div>
    </section>

    <section className="section" id="business">
      <div className="sectionHead"><div><span className="eyebrow">02 · BUSINESS</span><h2>Private-business remittance</h2></div><p>Commercial payment intents tied to a sender business, business beneficiary, commercial purpose and appropriate review controls.</p></div>
      <div className="featureGrid">
        <article className="feature"><div className="icon">01</div><h3>Business counterparties</h3><p>Keep business recipient identity, registration and verification state separate from family beneficiaries.</p><div className="featureMeta">BUSINESS · KYB · COUNTERPARTY</div></article>
        <article className="feature"><div className="icon">02</div><h3>Commercial payments</h3><p>Create BUSINESS payment intents with source-of-funds and commercial-purpose context.</p><div className="featureMeta">PURPOSE · EVIDENCE · ROUTING</div></article>
        <article className="feature"><div className="icon">03</div><h3>Settlement controls</h3><p>Track processing, fees, settlement and reconciliation without fabricating live pricing.</p><div className="featureMeta">PAYMENT · SETTLEMENT · RECONCILIATION</div></article>
      </div>
    </section>

    <section className="section" id="marketplace">
      <div className="sectionHead"><div><span className="eyebrow">03 · MARKETPLACE</span><h2>Private-sector marketplace for businesses and entrepreneurs</h2></div><p>Businesses and emprendedores can publish BUY, SELL and SERVICE offers, build reputation and move matched opportunities into documented payment workflows.</p></div>
      <div className="featureGrid">
        <article className="feature"><div className="icon">01</div><h3>Buy</h3><p>Post demand for goods, inputs, inventory and services.</p><div className="featureMeta">DEMAND · RFQ · SOURCING</div></article>
        <article className="feature"><div className="icon">02</div><h3>Sell</h3><p>List products and commercial offers for verified private-sector buyers.</p><div className="featureMeta">OFFERS · PRODUCTS · SUPPLIERS</div></article>
        <article className="feature"><div className="icon">03</div><h3>Services</h3><p>Offer professional, technical, logistics and other legitimate private-sector services.</p><div className="featureMeta">SERVICES · TRUST · MATCHING</div></article>
      </div>
      <div className="actions"><a className="cta" href={`/${locale}/marketplace`}>Explore Marketplace</a></div>
    </section>

    <section className="section" id="contact">
      <div className="sectionHead"><div><span className="eyebrow">SOFIA · OFFICIAL COMMUNICATION CHANNELS</span><h2>Start and manage your transaction with Sofia</h2></div><p>Use the official mycubacash WhatsApp Business channels below. Sofia can collect sender and receiver information, transaction amount, payment preference, delivery request and receipt confirmation.</p></div>
      <div className="featureGrid">
        <article className="feature"><div className="icon">W</div><h3>{channels.whatsappPrimary.label}</h3><p><strong>{channels.whatsappPrimary.display}</strong></p><p>Primary WhatsApp Business channel for orders and transaction communication.</p><div className="actions"><a className="cta" href={whatsappUrl(channels.whatsappPrimary.e164)}>Open WhatsApp Business</a></div></article>
        <article className="feature"><div className="icon">W2</div><h3>{channels.whatsappSecondary.label}</h3><p><strong>{channels.whatsappSecondary.display}</strong></p><p>Secondary WhatsApp Business channel for transaction communication.</p><div className="actions"><a className="cta" href={whatsappUrl(channels.whatsappSecondary.e164)}>Open WhatsApp Business</a></div></article>
        {channels.phone.enabled&&<article className="feature"><div className="icon">P</div><h3>{channels.phone.label}</h3><p><strong>{channels.phone.display}</strong></p><p>Phone-call channel for Sofia-managed transaction intake and support.</p><div className="actions"><a className="cta" href={`tel:${channels.phone.e164}`}>Call Now</a></div></article>}
      </div>
    </section>

    <section className="section split">
      <div><span className="eyebrow">OPERATING MODEL</span><h2>Classify before moving forward</h2><p className="sectionCopy">Every payment request is classified by remittance type and corridor. Every marketplace offer is tied to a private-sector business identity and controlled publication state.</p></div>
      <div className="corridorTable">{corridorRows.map(([code,label])=><div className="corridorRow" key={code}><strong>{code}</strong><span>{label}</span></div>)}</div>
    </section>

    <section className="policyBlock" id="controls">
      <div><span className="eyebrow">TRUST + CONTROL</span><h2>Reputation helps discovery; evidence governs execution</h2></div>
      <p>Users can build public transaction history and gold-star reputation through actual platform activity. Community trust does not replace identity, business verification, current compliance evidence or applicable payment/remittance controls.</p>
    </section>

    <footer className="footer"><strong>mycubacash.com</strong><span>WhatsApp Business {channels.whatsappPrimary.display}{channels.phone.enabled?` · Phone ${channels.phone.display}`:''}</span><span>v0.11</span></footer>
  </main>;
}
