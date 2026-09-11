import { supabaseServer } from '@/lib/supabase/server';
import { localeOf } from '@/lib/i18n';

function formatTime(value:string|null){
  if(!value) return 'Flexible';
  const [h,m]=value.split(':');
  const hour=Number(h);
  const suffix=hour>=12?'PM':'AM';
  const display=hour%12||12;
  return `${display}:${m} ${suffix}`;
}

export default async function DeliveryDirectory({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const supabase=await supabaseServer();
  const {data:providers,error}=await supabase
    .from('delivery_provider_public_directory')
    .select('user_id,provider_kind,display_name,city,region,country_code,service_area,work_days,work_start,work_end,transport_mode,verified,updated_at')
    .eq('verified',true)
    .order('city',{ascending:true});

  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Verified Delivery Network</small></a>
      <div className="navlinks"><a href={`/${locale}/remittances`}>Remittances</a><a href={`/${locale}/marketplace`}>Marketplace</a></div>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">VERIFIED PRIVATE-SECTOR DELIVERY</div>
        <h1>Find a verified delivery provider by city, zone and working hours.</h1>
        <p className="heroLead">Only approved public profile information is displayed. Phone numbers, exact street addresses, payment details and private verification data are never shown publicly.</p>
      </div>
    </section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">DELIVERY DIRECTORY</span><h2>Available providers</h2></div><p>Independent part-time providers and verified private businesses can appear here after verification and activation.</p></div>
      {error?<p>Unable to load the delivery directory.</p>:
      (providers??[]).length===0?<p>No verified delivery providers are publicly listed yet.</p>:
      <div className="featureGrid">{(providers??[]).map((provider)=><article className="feature" key={provider.user_id}>
        <div className="icon">D</div>
        <h3>{provider.display_name}</h3>
        <p><strong>Type:</strong> {provider.provider_kind==='INDIVIDUAL'?'Independent Delivery Provider':'Private Business Delivery Provider'}</p>
        <p><strong>City:</strong> {[provider.city,provider.region,provider.country_code].filter(Boolean).join(', ')}</p>
        <p><strong>Zones covered:</strong> {provider.service_area||'Not specified'}</p>
        <p><strong>Working days:</strong> {(provider.work_days??[]).length?(provider.work_days as string[]).join(', '):'Flexible'}</p>
        <p><strong>Hours:</strong> {provider.work_start||provider.work_end?`${formatTime(provider.work_start)} – ${formatTime(provider.work_end)}`:'Flexible'}</p>
        {provider.transport_mode&&<p><strong>Transport:</strong> {provider.transport_mode}</p>}
        <div className="featureMeta">VERIFIED · PHONE HIDDEN FOR SECURITY</div>
      </article>)}</div>}
    </section>
  </main>;
}
