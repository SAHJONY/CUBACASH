import { copy, localeOf } from '@/lib/i18n';

const cards=[
  ['Pay Cash','Create a direct cash payment record between two private-sector businesses.'],
  ['Request Payment','The recipient can initiate a payment request and wait for all required parties to confirm the handoff.'],
  ['All-Party Confirmation','A transaction is not completed until every required participant independently confirms it.'],
  ['Gold Stars','After a completed transaction, participants can rate counterparties from 1 to 5 gold stars. Ratings are transaction-backed and cannot be self-awarded.'],
  ['Community Trust','Participants can endorse or flag counterparties; community verification stays separate from legal remittance authorization.'],
  ['Receipts & Evidence','Attach transaction evidence to confirmations and preserve a traceable record.'],
  ['Disputes','Any eligible participant can open a dispute, which keeps the transaction history visible and moves the record into review.']
] as const;

export default async function CashLedger({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const t=copy[locale];
  const rtl=locale==='ar';
  return <main className="shell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>{t.tag}</small></a>
      <div className="navlinks"><a href={`/${locale}/dashboard`}>Command Center</a><a href={`/${locale}/agents`}>AI Agents</a><a href={`/${locale}/remittances`}>Remittances</a><span>Cash Ledger</span></div>
      <a className="miniCta" href="/api/health">System Health</a>
    </nav>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">COMMUNITY CASH LEDGER</span><h2>Direct cash. All-party confirmation. Public reputation.</h2></div><p>mycubacash records direct cash settlement between private-sector participants without taking custody of the cash. Each record preserves who paid, who received, amount, currency, purpose, confirmation state, public status history, evidence, disputes and transaction-backed reputation.</p></div>
      <div className="previewGrid">
        <div><span>Custody</span><strong>NONE</strong></div>
        <div><span>Completion</span><strong>ALL REQUIRED PARTIES</strong></div>
        <div><span>Reputation</span><strong>★★★★★</strong></div>
        <div><span>Records</span><strong>AUDITABLE</strong></div>
      </div>
    </section>

    <section className="section" style={{paddingTop:0}}>
      <div className="featureGrid">
        {cards.map(([title,description],i)=><article className="feature" key={title}><div className="icon">{String(i+1).padStart(2,'0')}</div><h3>{title}</h3><p>{description}</p><div className="featureMeta">CONTROLLED · EVIDENCE-FIRST</div></article>)}
      </div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">REPUTATION PRINCIPLE</span><h2>Gold stars must come from real completed transactions</h2></div><p>Only a participating business may rate another participating business after the transaction is completed. Self-ratings are prohibited, and each rater/target pair gets one rating per transaction. Public star averages therefore reflect transaction-backed community history rather than unverified popularity.</p></section>
    <footer className="footer"><strong>mycubacash.com</strong><span>Community Cash Ledger</span><span>v0.6</span></footer>
  </main>;
}
