import {localeOf} from '@/lib/i18n';

export default async function FeesPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params; const locale=localeOf(raw);
  const rows=[
    ['Family remittance','Sender','1.25%','$1.00','$12.00'],
    ['Business remittance','Sender','1.75%','$5.00','$250.00'],
    ['Marketplace success fee','Seller','2.50%','$2.00','$500.00'],
    ['Cash ledger','Requestor','0.75%','$0.50','$20.00']
  ];
  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav"><a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Fees & Pricing</small></a><div className="navlinks"><a href={`/${locale}/start`}>Start Transaction</a><a href={`/${locale}/transactions`}>Track</a><a href={`/${locale}/privacy`}>Privacy</a><a href={`/${locale}/terms`}>Terms</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">CLEAR PRICING</div><h1>Know the mycubacash platform fee before you proceed.</h1><p className="heroLead">Platform fees are percentage-based, disclosed in USD and subject to the minimum and maximum shown below. A transaction may also have separate third-party payment, settlement, FX, delivery or provider costs when applicable; those are shown before commitment when available.</p></div></section>
    <section className="section"><div className="corridorTable">{rows.map(([product,payer,rate,min,max])=><div className="corridorRow" key={product}><strong>{product}</strong><span>{rate} · payer: {payer} · min {min} · max {max}</span></div>)}</div>
      <p className="sectionCopy">Creating a transaction request does not itself move funds. Final pricing and settlement availability depend on the corridor, transaction type, payment method, delivery needs and appropriately authorized providers.</p></section>
  </main>;
}
