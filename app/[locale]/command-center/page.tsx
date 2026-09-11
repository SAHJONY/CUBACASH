import { supabaseServer } from '@/lib/supabase/server';
import { localeOf } from '@/lib/i18n';

export default async function CommandCenter({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();

  if(!user){
    return <main className="shell"><section className="section"><h1>Owner Command Center</h1><p>Authentication required.</p></section></main>;
  }

  const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();
  if(profile?.role!=='platform_owner'){
    return <main className="shell"><section className="section"><h1>Owner Command Center</h1><p>Restricted to the application owner.</p></section></main>;
  }

  const [{data:senders,error:senderError},{data:intakes,error:intakeError}]=await Promise.all([
    supabase
      .from('remittance_sender_private')
      .select('remittance_intent_id,sender_full_name,sender_phone,sender_email,address_line1,address_line2,city,region,postal_code,country_code,captured_at')
      .order('captured_at',{ascending:false})
      .limit(250),
    supabase
      .from('sofia_order_intakes')
      .select('id,channel,sender_full_name,sender_phone,sender_country_code,beneficiary_full_name,beneficiary_phone,request_type,requested_amount,requested_currency,requested_fulfillment,payment_preference,payment_status,delivery_requested,intake_status,created_at')
      .order('created_at',{ascending:false})
      .limit(250)
  ]);

  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Owner Command Center</small></a>
      <div className="navlinks"><a href={`/${locale}/dashboard`}>Dashboard</a><a href={`/${locale}/remittances`}>Remittances</a></div>
    </nav>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">SOFIA · OWNER ONLY</span><h1>WhatsApp · Telegram · Phone Orders</h1></div><p>Sofia collects the customer request, sender and beneficiary details, preferred fulfillment, delivery request and how the customer wants to pay. Cash, Zelle and Cash App are recorded as customer payment preferences only; payment remains unverified until trusted evidence confirms it.</p></div>
      {intakeError?<p>Unable to load Sofia intake records.</p>:
      <div className="featureGrid">{(intakes??[]).map((item)=><article className="feature" key={item.id}>
        <div className="icon">{item.channel==='WHATSAPP'?'W':item.channel==='TELEGRAM'?'T':'P'}</div>
        <h3>{item.sender_full_name}</h3>
        <p><strong>Channel:</strong> {item.channel} · <strong>Phone:</strong> {item.sender_phone}</p>
        <p><strong>Request:</strong> {item.request_type}{item.requested_amount?` · ${item.requested_amount} ${item.requested_currency}`:''}</p>
        {item.beneficiary_full_name&&<p><strong>Beneficiary:</strong> {item.beneficiary_full_name}{item.beneficiary_phone?` · ${item.beneficiary_phone}`:''}</p>}
        <p><strong>Receiver choice:</strong> {item.requested_fulfillment??'UNDECIDED'} · <strong>Delivery:</strong> {item.delivery_requested?'YES':'NO'}</p>
        <p><strong>Payment preference:</strong> {item.payment_preference??'UNDECIDED'} · <strong>Payment status:</strong> {item.payment_status}</p>
        <div className="featureMeta">{item.intake_status} · {new Date(item.created_at).toLocaleString()}</div>
      </article>)}</div>}
    </section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">OWNER ONLY</span><h2>Sender Transaction Directory</h2></div><p>Private sender identity and contact snapshots captured for every customer-created remittance. This surface is restricted to the platform owner.</p></div>
      {senderError?<p>Unable to load private sender records.</p>:
      <div className="featureGrid">{(senders??[]).map((sender)=><article className="feature" key={sender.remittance_intent_id}>
        <div className="icon">S</div>
        <h3>{sender.sender_full_name}</h3>
        <p><strong>Phone:</strong> {sender.sender_phone}</p>
        {sender.sender_email&&<p><strong>Email:</strong> {sender.sender_email}</p>}
        <p><strong>Address:</strong> {[sender.address_line1,sender.address_line2,sender.city,sender.region,sender.postal_code,sender.country_code].filter(Boolean).join(', ')||'Not provided'}</p>
        <p><strong>Transaction ID:</strong> {sender.remittance_intent_id}</p>
        <div className="featureMeta">Captured {new Date(sender.captured_at).toLocaleString()}</div>
      </article>)}</div>}
    </section>
  </main>;
}
