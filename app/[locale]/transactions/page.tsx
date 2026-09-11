import {supabaseServer} from '@/lib/supabase/server';
import {localeOf} from '@/lib/i18n';

function customerStatus(transfer:string,review:string,sanctions:string){
  if(sanctions==='BLOCKED'||review==='BLOCK') return 'Blocked';
  if(review==='HOLD'||sanctions!=='CLEAR') return 'Needs review';
  if(['PENDING_REVIEW','DRAFT'].includes(transfer)) return 'Under review';
  if(transfer==='READY_FOR_PARTNER') return 'Ready for provider';
  if(['SUBMITTED','PROCESSING'].includes(transfer)) return 'Processing';
  if(transfer==='AVAILABLE') return 'Ready for receiver';
  if(transfer==='DELIVERED') return 'Delivered';
  if(transfer==='FAILED') return 'Needs attention';
  return transfer.replaceAll('_',' ');
}

export default async function TransactionsPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;const locale=localeOf(raw);
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return <main className="shell"><section className="section"><h1>My Transactions</h1><p>Sign in to view your transaction history.</p><div className="actions"><a className="cta" href={`/${locale}/auth`}>Sign In / Create Account</a></div></section></main>;
  const {data,error}=await supabase.from('remittance_intents').select('id,reference,remittance_type,purpose,origin_country,destination_country,send_currency,send_amount,receive_currency,expected_receive_amount,compliance_state,sanctions_state,risk_band,transfer_status,settlement_status,created_at,updated_at').order('created_at',{ascending:false}).limit(100);

  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav"><a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>My Transactions</small></a><div className="navlinks"><a href={`/${locale}/start`}>Start Transaction</a><a href={`/${locale}/fees`}>Fees</a><a href={`/${locale}/privacy`}>Privacy</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">TRANSACTION TRACKING</div><h1>Know what is happening and what to do next.</h1><p className="heroLead">Each request has a permanent mycubacash reference, customer-readable status and a detail page for submitting supporting information.</p></div></section>
    <section className="section">
      {error?<p>Unable to load your transactions right now.</p>:!data?.length?<div className="feature"><h2>No transactions yet</h2><p>Create your first family support request to receive a mycubacash transaction reference.</p><div className="actions"><a className="cta" href={`/${locale}/start`}>Start Transaction</a></div></div>:
      <div className="featureGrid">{data.map(item=><article className="feature" key={item.id}><div className="icon">{item.remittance_type==='BUSINESS'?'B':'F'}</div><h3>{item.reference}</h3><p><strong>{item.remittance_type}</strong> · {item.origin_country} → {item.destination_country}</p><p><strong>Amount:</strong> {item.send_amount} {item.send_currency}</p><p><strong>Customer status:</strong> {customerStatus(item.transfer_status,item.compliance_state,item.sanctions_state)}</p><p><strong>Settlement:</strong> {item.settlement_status}</p><div className="actions"><a className="cta" href={`/${locale}/transactions/${item.reference}`}>View Details / Next Step</a></div><div className="featureMeta">Updated {new Date(item.updated_at).toLocaleString()}</div></article>)}</div>}
    </section>
  </main>;
}
