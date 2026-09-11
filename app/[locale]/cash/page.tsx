import { copy, localeOf } from '@/lib/i18n';

const cards=[
  ['Pay Cash','Create a direct cash payment record between two private-sector businesses.'],
  ['Request Payment','The recipient can initiate a payment request and wait for both parties to confirm the handoff.'],
  ['Dual Confirmation','A transaction is not completed until both payer and payee independently confirm it.'],
  ['Community Trust','Participants can endorse or flag counterparties; community verification stays separate from legal remittance authorization.'],
  ['Receipts & Evidence','Attach transaction evidence to confirmations and preserve a traceable record.'],
  ['Disputes','Either participant can open a dispute, which moves the transaction into a disputed state for review.']
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
      <div className="sectionHead"><div><span className="eyebrow">COMMUNITY CASH LEDGER</span><h2>Direct cash. Dual confirmation. Permanent platform record.</h2></div><p>mycubacash records direct cash settlement between private-sector participants without taking custody of the cash. Each record preserves who paid, who received, amount, currency, purpose, confirmation state, evidence and disputes.</p></div>
      <div className="previewGrid">
        <div><span>Custody</span><strong>NONE</strong></div>
        <div><span>Completion</span><strong>DUAL CONFIRMATION</strong></div>
        <div><span>Trust</span><strong>COMMUNITY + POLICY</strong></div>
        <div><span>Records</span><strong>AUDITABLE</strong></div>
      </div>
    </section>

    <section className="section" style={{paddingTop:0}}>
      <div className="featureGrid">
        {cards.map(([title,description],i)=><article className="feature" key={title}><div className="icon">{String(i+1).padStart(2,'0')}</div><h3>{title}</h3><p>{description}</p><div className="featureMeta">CONTROLLED · EVIDENCE-FIRST</div></article>)}
      </div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">ROLE SEPARATION</span><h2>Community Verified ≠ Authorized Remittance Partner</h2></div><p>A trusted entrepreneur or business may participate in direct private-sector cash transactions and maintain a verified transaction history. Legal authority to accept and transmit remittance funds is a separate status and cannot be created by community votes alone.</p></section>
    <footer className="footer"><strong>mycubacash.com</strong><span>Community Cash Ledger</span><span>v0.5</span></footer>
  </main>;
}
