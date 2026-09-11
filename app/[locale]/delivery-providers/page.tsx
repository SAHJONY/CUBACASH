import { supabaseServer } from '@/lib/supabase/server';
import { localeOf } from '@/lib/i18n';
import { APP_COMMUNICATIONS, whatsappUrl } from '@/lib/communications';

function formatTime(value:string|null){
  if(!value) return 'Flexible';
  const [h,m]=value.split(':');
  const date=new Date(2000,0,1,Number(h),Number(m));
  return date.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
}

export default async function DeliveryProviders({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const channels=APP_COMMUNICATIONS;
  let providers:any[]=[];
  let unavailable=false;
  try{
    const supabase=await supabaseServer();
    const {data,error}=await supabase
      .from('delivery_provider_public_directory')
      .select('public_provider_id,provider_kind,display_name,city,region,country_code,service_zones,service_area,work_days,work_start,work_end,transport_mode,verified')
      .eq('verified',true)
      .order('city',{ascending:true})
      .order('display_name',{ascending:true});
    if(error) unavailable=true;
    else providers=data??[];
  }catch{
    unavailable=true;
  }

  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Delivery Network</small></a>
      <div className="navlinks"><a href={`/${locale}/remittances`}>Remittances</a><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/dashboard`}>Dashboard</a></div>
      <a className="miniCta" href={whatsappUrl(channels.whatsappPrimary.e164)}>WhatsApp Business Sofia</a>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">VERIFIED PRIVATE-SECTOR DELIVERY NETWORK</div>
        <h1>Find a verified delivery provider by city, zone and schedule.</h1>
        <p className="heroLead">Every listed provider has a mycubacash identification number. Public profiles show operational coverage and working hours while keeping phone numbers, exact addresses and payment information private.</p>
        <div className="actions"><a className="cta" href={whatsappUrl(channels.whatsappPrimary.e164)}>Apply as a Delivery Provider</a><a className="ghost" href={whatsappUrl(channels.whatsappPrimary.e164)}>Request Delivery with Sofia</a></div>
      </div>
      <aside className="commandPreview" aria-label="Delivery directory privacy">
        <div className="previewTop"><span className="liveDot"/> Public Directory <span className="previewTag">PRIVACY-SAFE</span></div>
        <div className="previewGrid">
          <div><span>Public</span><strong>NAME + PROVIDER ID</strong></div>
          <div><span>Coverage</span><strong>CITY + ZONES</strong></div>
          <div><span>Schedule</span><strong>DAYS + HOURS</strong></div>
          <div><span>Private</span><strong>PHONE + EXACT ADDRESS</strong></div>
        </div>
      </aside>
    </section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">DELIVERY PROVIDERS</span><h2>Verified network directory</h2></div><p>Contact, onboarding and job coordination remain inside mycubacash and Sofia. The public directory intentionally does not expose provider phone numbers.</p></div>
      {unavailable?<p>The delivery directory is temporarily unavailable. Contact Sofia on WhatsApp Business for assistance.</p>:
      !providers.length?<div><p>No verified public delivery providers are listed yet.</p><div className="actions"><a className="cta" href={whatsappUrl(channels.whatsappPrimary.e164)}>Become the first verified provider in your area</a></div></div>:
      <div className="featureGrid">{providers.map((provider)=><article className="feature" key={provider.public_provider_id}>
        <div className="icon">D</div>
        <h3>{provider.display_name}</h3>
        <p><strong>ID:</strong> {provider.public_provider_id}</p>
        <p><strong>City:</strong> {[provider.city,provider.region,provider.country_code].filter(Boolean).join(', ')}</p>
        <p><strong>Zones:</strong> {provider.service_zones?.length?provider.service_zones.join(' · '):(provider.service_area||'Coverage available in profile')}</p>
        <p><strong>Days:</strong> {provider.work_days?.length?provider.work_days.join(' · '):'Flexible'}</p>
        <p><strong>Hours:</strong> {provider.work_start||provider.work_end?`${formatTime(provider.work_start)} – ${formatTime(provider.work_end)}`:'Flexible'}</p>
        {provider.transport_mode&&<p><strong>Transport:</strong> {provider.transport_mode}</p>}
        <div className="featureMeta">{provider.provider_kind==='INDIVIDUAL'?'INDEPENDENT PROVIDER':'PRIVATE BUSINESS'} · VERIFIED</div>
      </article>)}</div>}
    </section>

    <section className="policyBlock"><div><span className="eyebrow">SAFETY RULE</span><h2>Public identification without public contact exposure</h2></div><p>Customers choose providers through mycubacash using the provider ID, city, service zones and work schedule. Phone numbers, precise addresses, payment details and private verification records stay off the public profile.</p></section>
  </main>;
}
