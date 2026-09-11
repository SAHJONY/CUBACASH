import {supabaseServer} from '@/lib/supabase/server';
import {localeOf} from '@/lib/i18n';
import EvidenceForm from './EvidenceForm';

function nextStep(item:{transfer_status:string;compliance_state:string;sanctions_state:string;settlement_status:string}){
  if(item.sanctions_state==='BLOCKED'||item.compliance_state==='BLOCK') return 'This request cannot proceed. Contact support if you believe the status is incorrect.';
  if(item.compliance_state==='HOLD'||item.sanctions_state!=='CLEAR') return 'Review is still required. Keep your information current and submit any requested supporting information.';
  if(item.transfer_status==='PENDING_REVIEW'||item.transfer_status==='DRAFT') return 'Your request is awaiting review before it can be routed to an authorized provider.';
  if(item.transfer_status==='READY_FOR_PARTNER') return 'The request is ready for authorized-provider routing. Do not send funds outside instructions shown by mycubacash or Sofia.';
  if(['SUBMITTED','PROCESSING'].includes(item.transfer_status)) return 'Processing is underway. Track this page for the next verified status update.';
  if(item.transfer_status==='AVAILABLE') return 'Value is reported available. Follow the approved pickup, merchant or delivery instructions tied to this transaction.';
  if(item.transfer_status==='DELIVERED') return 'Delivery is reported complete. Keep receipts and confirmation records for your transaction history.';
  if(item.transfer_status==='FAILED') return 'Processing failed. Do not retry payment until mycubacash or the authorized provider gives a new instruction.';
  return 'Track this page for the next verified status update.';
}

export default async function TransactionDetail({params}:{params:Promise<{locale:string;reference:string}>}){
  const {locale:raw,reference}=await params;const locale=localeOf(raw);
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return <main className="shell"><section className="section"><h1>Transaction Details</h1><p>Sign in to view this transaction.</p><div className="actions"><a className="cta" href={`/${locale}/auth`}>Sign In</a></div></section></main>;

  const {data:item}=await supabase.from('remittance_intents').select('id,reference,remittance_type,purpose,origin_country,destination_country,send_currency,send_amount,receive_currency,expected_receive_amount,compliance_state,sanctions_state,risk_band,transfer_status,settlement_status,partner_code,partner_reference,created_at,updated_at').eq('reference',reference).single();
  if(!item) return <main className="shell"><section className="section"><h1>Transaction not found</h1><a className="cta" href={`/${locale}/transactions`}>Back to My Transactions</a></section></main>;

  const [{data:pref},{data:evidence}]=await Promise.all([
    supabase.from('remittance_customer_preferences').select('payment_preference,requested_fulfillment,delivery_requested,customer_notes,updated_at').eq('remittance_intent_id',item.id).maybeSingle(),
    supabase.from('remittance_customer_evidence').select('id,evidence_type,evidence_reference,customer_note,review_status,created_at,reviewed_at').eq('remittance_intent_id',item.id).order('created_at',{ascending:false})
  ]);
  const step=nextStep(item);

  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav"><a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Transaction Details</small></a><div className="navlinks"><a href={`/${locale}/transactions`}>My Transactions</a><a href={`/${locale}/fees`}>Fees</a><a href={`/${locale}/privacy`}>Privacy</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">TRANSACTION {item.transfer_status}</div><h1>{item.reference}</h1><p className="heroLead">{item.origin_country} → {item.destination_country} · {item.send_amount} {item.send_currency}</p></div></section>
    <section className="section" style={{maxWidth:980,margin:'0 auto'}}>
      <div className="featureGrid">
        <article className="feature"><h2>Current status</h2><p><strong>Transfer:</strong> {item.transfer_status}</p><p><strong>Review:</strong> {item.compliance_state}</p><p><strong>Sanctions:</strong> {item.sanctions_state}</p><p><strong>Settlement:</strong> {item.settlement_status}</p><div className="featureMeta">Updated {new Date(item.updated_at).toLocaleString()}</div></article>
        <article className="feature"><h2>What happens next</h2><p>{step}</p><p>Never treat a customer-submitted payment reference as verified until mycubacash or the authorized provider marks it reviewed.</p></article>
        <article className="feature"><h2>Your request</h2><p><strong>Purpose:</strong> {item.purpose}</p><p><strong>Fulfillment:</strong> {pref?.requested_fulfillment??'Not selected'}</p><p><strong>Payment preference:</strong> {pref?.payment_preference??'Not selected'}</p><p><strong>Delivery requested:</strong> {pref?.delivery_requested?'Yes':'No'}</p></article>
      </div>
      <div style={{marginTop:24}}><EvidenceForm remittanceIntentId={item.id}/></div>
      <section className="section" style={{paddingLeft:0,paddingRight:0}}><div className="sectionHead"><div><span className="eyebrow">CUSTOMER EVIDENCE</span><h2>Submitted references and notes</h2></div><p>These records are evidence for review, not proof of verified payment or settlement by themselves.</p></div>
        {!evidence?.length?<p>No evidence submitted yet.</p>:<div className="featureGrid">{evidence.map(e=><article className="feature" key={e.id}><h3>{e.evidence_type}</h3><p><strong>Reference:</strong> {e.evidence_reference}</p>{e.customer_note&&<p>{e.customer_note}</p>}<p><strong>Review:</strong> {e.review_status}</p><div className="featureMeta">Submitted {new Date(e.created_at).toLocaleString()}</div></article>)}</div>}
      </section>
      <div className="actions"><a className="cta" href={`/${locale}/transactions`}>Back to My Transactions</a><a className="ghost" href={`/${locale}#contact`}>Contact Sofia on WhatsApp Business</a></div>
    </section>
  </main>;
}
