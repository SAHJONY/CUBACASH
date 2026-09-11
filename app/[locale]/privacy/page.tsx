import {localeOf} from '@/lib/i18n';

export default async function PrivacyPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params; const locale=localeOf(raw);
  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav"><a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Privacy</small></a><div className="navlinks"><a href={`/${locale}/terms`}>Terms</a><a href={`/${locale}/fees`}>Fees</a><a href={`/${locale}/auth`}>Account</a></div></nav>
    <section className="section" style={{maxWidth:900,margin:'0 auto'}}><span className="eyebrow">PRIVACY NOTICE</span><h1>How mycubacash handles customer information</h1>
      <div className="feature" style={{display:'grid',gap:14}}>
        <p>mycubacash uses account, sender, receiver, business, transaction, delivery and support information to provide the requested service, maintain transaction records, protect the platform, resolve disputes and satisfy applicable verification and compliance requirements.</p>
        <p>Public delivery profiles intentionally exclude phone numbers, exact addresses, payment information and private verification evidence. Sender and receiver contact information is restricted to authorized operational workflows.</p>
        <p>Passwords and one-time account codes should never be shared with delivery providers, businesses, receivers or Sofia. mycubacash personnel and automated assistants should not ask for your account password.</p>
        <p>Transaction and audit records may be retained when needed for security, dispute resolution, fraud prevention, legal obligations or legitimate business recordkeeping. Access to sensitive operational data is role-restricted.</p>
        <p>For privacy questions or requests, use the official mycubacash support channel shown on the homepage. Identity verification may be required before releasing, correcting or deleting account-linked information.</p>
      </div>
    </section>
  </main>;
}
