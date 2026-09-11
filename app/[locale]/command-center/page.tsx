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

  const {data:senders,error}=await supabase
    .from('remittance_sender_private')
    .select('remittance_intent_id,sender_full_name,sender_phone,sender_email,address_line1,address_line2,city,region,postal_code,country_code,captured_at')
    .order('captured_at',{ascending:false})
    .limit(250);

  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Owner Command Center</small></a>
      <div className="navlinks"><a href={`/${locale}/dashboard`}>Dashboard</a><a href={`/${locale}/remittances`}>Remittances</a></div>
    </nav>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">OWNER ONLY</span><h1>Sender Transaction Directory</h1></div><p>Private sender identity and contact snapshots captured for every customer-created remittance. This surface is restricted to the platform owner.</p></div>
      {error?<p>Unable to load private sender records.</p>:
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
