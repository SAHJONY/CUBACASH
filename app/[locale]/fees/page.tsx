import {localeOf} from '@/lib/i18n';
import FeeCalculator from './FeeCalculator';

const rows=[
  {product:'Family remittance',payer:'Sender',rate:'1.25%',min:'$1.00',max:'$12.00',note:'For eligible family support transaction requests.'},
  {product:'Business remittance',payer:'Sender',rate:'1.75%',min:'$5.00',max:'$250.00',note:'For private-business payment requests with commercial purpose.'},
  {product:'Marketplace success fee',payer:'Seller',rate:'2.50%',min:'$2.00',max:'$500.00',note:'Applied when a marketplace transaction reaches the applicable fee-triggering stage.'},
  {product:'Cash transaction record',payer:'Requestor',rate:'0.75%',min:'$0.50',max:'$20.00',note:'For eligible platform cash-ledger transaction records and controls.'}
] as const;

export default async function FeesPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params; const locale=localeOf(raw);
  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav"><a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Fees & Pricing</small></a><div className="navlinks"><a href={`/${locale}/start`}>Start Transaction</a><a href={`/${locale}/transactions`}>Track</a><a href={`/${locale}/privacy`}>Privacy</a><a href={`/${locale}/terms`}>Terms</a></div></nav>

    <section className="hero"><div className="heroCopy"><div className="eyebrow">TRANSPARENT PRICING</div><h1>Know the mycubacash platform fee before you commit.</h1><p className="heroLead">No hidden mycubacash platform fee. The applicable percentage, minimum and maximum are disclosed before the transaction proceeds.</p><p className="heroSub">Separate third-party payment, settlement, foreign-exchange, delivery or authorized-provider charges may apply depending on the corridor and service selected. When known, those charges are shown separately before commitment.</p><div className="actions"><a className="cta" href={`/${locale}/start`}>Start a Transaction</a><a className="ghost" href={`/${locale}/transactions`}>Track a Transaction</a></div></div></section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">PUBLISHED FEE SCHEDULE</span><h2>Simple percentage pricing with caps</h2></div><p>The fee is calculated from the transaction amount, then bounded by the published minimum and maximum for that product.</p></div>
      <div className="featureGrid">{rows.map(row=><article className="feature" key={row.product}><div className="eyebrow">{row.product.toUpperCase()}</div><h3 style={{fontSize:'2rem',margin:'8px 0'}}>{row.rate}</h3><p><strong>Payer:</strong> {row.payer}</p><p><strong>Minimum:</strong> {row.min} · <strong>Maximum:</strong> {row.max}</p><p>{row.note}</p></article>)}</div>
    </section>

    <section className="section"><FeeCalculator/></section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">HOW IT WORKS</span><h2>What customers should expect</h2></div><p>Pricing is disclosed before the customer commits to the applicable transaction step.</p></div>
      <div className="featureGrid">
        <article className="feature"><div className="icon">1</div><h3>Enter the amount</h3><p>Choose the transaction type, corridor, amount, payment preference and delivery needs.</p></article>
        <article className="feature"><div className="icon">2</div><h3>Review the fee</h3><p>mycubacash shows the platform fee and any separately disclosed known costs before commitment.</p></article>
        <article className="feature"><div className="icon">3</div><h3>Proceed only when ready</h3><p>Creating a request does not itself move funds. Required identity, sanctions, payment, corridor and authorized-provider controls still apply.</p></article>
      </div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">IMPORTANT</span><h2>Platform fee is not the same as total settlement cost</h2></div><p>The mycubacash platform fee is the amount charged by mycubacash for the applicable product. A payment processor, settlement partner, FX provider, delivery provider or other authorized service provider may charge a separate amount. Those costs are not included in the calculator unless explicitly identified. Final settlement availability also depends on the transaction corridor, service type and required controls.</p></section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">FAQ</span><h2>Pricing questions</h2></div></div><div className="featureGrid">
      <article className="feature"><h3>Can the platform fee exceed the maximum?</h3><p>No. Under the published default schedule, the mycubacash platform fee is capped at the maximum shown for that product.</p></article>
      <article className="feature"><h3>Can another provider charge separately?</h3><p>Yes. Payment, FX, settlement or delivery providers may have separate disclosed charges when applicable.</p></article>
      <article className="feature"><h3>Does creating a request move money?</h3><p>No. A request creates a transaction record for review. Funds movement occurs only through the applicable authorized workflow after required controls are satisfied.</p></article>
    </div></section>

    <footer className="footer"><strong>mycubacash.com</strong><span>Transparent platform pricing · USD fee schedule</span><span><a href={`/${locale}/terms`}>Terms</a> · <a href={`/${locale}/privacy`}>Privacy</a></span></footer>
  </main>;
}
