import {localeOf} from '@/lib/i18n';

export default async function TermsPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params; const locale=localeOf(raw);
  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav"><a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>Terms</small></a><div className="navlinks"><a href={`/${locale}/privacy`}>Privacy</a><a href={`/${locale}/fees`}>Fees</a><a href={`/${locale}/auth`}>Account</a></div></nav>
    <section className="section" style={{maxWidth:900,margin:'0 auto'}}><span className="eyebrow">CUSTOMER TERMS</span><h1>Rules for using MY CUBA CASH</h1>
      <div className="feature" style={{display:'grid',gap:14}}>
        <p>Use MY CUBA CASH only for legitimate family support, private-business payments, marketplace activity and delivery coordination. Information submitted must be accurate and belong to transactions you are authorized to initiate.</p>
        <p>A transaction request is not a completed transfer. Requests may remain pending, be placed on hold, require additional evidence, be rejected or be cancelled when identity, sanctions, fraud, jurisdiction, payment, provider or other required controls are not satisfied.</p>
        <p>Do not use the platform to evade sanctions, licensing requirements, transaction limits, identity checks, fraud controls or other legal or provider requirements. Structuring or disguising transactions may result in a hold, rejection or account restriction.</p>
        <p>Delivery providers and private businesses are separate participants. Their platform role does not by itself authorize them to receive or transmit remittance funds for unrelated customers.</p>
        <p>Fees and material transaction terms should be shown before commitment when available. Third-party payment, delivery, FX or settlement provider terms may also apply.</p>
        <p>Accounts may be restricted for fraud, abuse, security risk, prohibited activity or repeated failure to satisfy verification requirements. Disputes and transaction evidence are preserved through the platform record.</p>
      </div>
    </section>
  </main>;
}
