import { supabaseServer } from '@/lib/supabase/server';
import { localeOf } from '@/lib/i18n';
import { APP_COMMUNICATIONS, whatsappUrl } from '@/lib/communications';
import GeoOperationsMap,{type GeoProvider} from '@/components/GeoOperationsMap';

function formatTime(value:string|null){
  if(!value) return 'Flexible';
  const [h,m]=value.split(':');
  const date=new Date(2000,0,1,Number(h),Number(m));
  return date.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
}

function money(value:number|null|undefined,currency:string){
  if(value===null||value===undefined) return null;
  try{return new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:2}).format(Number(value));}
  catch{return `${Number(value).toFixed(2)} ${currency}`;}
}

function etaLabel(min:number|null|undefined,max:number|null|undefined){
  if(min==null&&max==null) return null;
  if(min!=null&&max!=null) return `${min}–${max} min`;
  return min!=null?`From ${min} min`:`Up to ${max} min`;
}

function providerPriceLabel(provider:any){
  const currency=provider.fee_currency||'USD';
  const base=money(provider.base_fee,currency);
  const perKm=money(provider.per_km_fee,currency);
  if(provider.pricing_model==='FLAT'&&base) return `${base} flat`;
  if(provider.pricing_model==='PER_DISTANCE'&&perKm) return `${perKm}/km`;
  if(provider.pricing_model==='HYBRID') return [base&&`${base} base`,perKm&&`${perKm}/km`].filter(Boolean).join(' + ')||'Quote required';
  return 'Quote required';
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
      .select('public_provider_id,provider_kind,display_name,city,region,country_code,service_zones,service_area,work_days,work_start,work_end,transport_mode,verified,pricing_model,fee_currency,base_fee,per_km_fee,minimum_fee,maximum_fee,pricing_notes,pricing_updated_at,public_latitude,public_longitude,location_precision,estimated_eta_min_minutes,estimated_eta_max_minutes,accepting_jobs')
      .eq('verified',true)
      .order('accepting_jobs',{ascending:false})
      .order('city',{ascending:true})
      .order('base_fee',{ascending:true,nullsFirst:false})
      .order('display_name',{ascending:true});
    if(error) unavailable=true;
    else providers=data??[];
  }catch{
    unavailable=true;
  }

  const geoProviders:GeoProvider[]=providers
    .filter(p=>p.public_latitude!=null&&p.public_longitude!=null)
    .map(p=>({id:p.public_provider_id,name:p.display_name,city:p.city,region:p.region,country:p.country_code,latitude:Number(p.public_latitude),longitude:Number(p.public_longitude),precision:p.location_precision,acceptingJobs:p.accepting_jobs,priceLabel:providerPriceLabel(p),etaLabel:etaLabel(p.estimated_eta_min_minutes,p.estimated_eta_max_minutes)}));

  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Delivery Network</small></a>
      <div className="navlinks"><a href={`/${locale}/remittances`}>Remittances</a><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/delivery-providers/manage`}>Provider Console</a></div>
      <a className="miniCta" href={whatsappUrl(channels.whatsappPrimary.e164)}>WhatsApp Business Sofia</a>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">VERIFIED PRIVATE-SECTOR DELIVERY NETWORK</div>
        <h1>Compare verified delivery providers by price, coverage, availability and expected arrival.</h1>
        <p className="heroLead">Verified providers can publish their own delivery charges, availability and approximate service location so customers can compare real options before requesting service. Phone numbers, exact addresses and payment credentials remain private.</p>
        <div className="actions"><a className="cta" href={`/${locale}/delivery-providers/manage`}>Manage My Provider Offer</a><a className="ghost" href={whatsappUrl(channels.whatsappPrimary.e164)}>Request Delivery with Sofia</a></div>
      </div>
      <aside className="commandPreview" aria-label="Delivery directory comparison">
        <div className="previewTop"><span className="liveDot"/> Public Directory <span className="previewTag">COMPARE</span></div>
        <div className="previewGrid">
          <div><span>Provider</span><strong>VERIFIED + ID</strong></div>
          <div><span>Choice</span><strong>PRICE + ETA</strong></div>
          <div><span>Coverage</span><strong>CITY + ZONES</strong></div>
          <div><span>Private</span><strong>PHONE + ADDRESS</strong></div>
        </div>
      </aside>
    </section>

    {!unavailable&&<section className="section"><GeoOperationsMap providers={geoProviders} title="Worldwide provider coverage"/></section>}

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">DELIVERY PROVIDERS</span><h2>Compare verified providers</h2></div><p>Rates are posted by each provider and are separate from mycubacash platform fees. Availability and arrival times are provider estimates until a specific job is accepted.</p></div>
      {unavailable?<p>The delivery directory is temporarily unavailable. Contact Sofia on WhatsApp Business for assistance.</p>:
      !providers.length?<div><p>No verified public delivery providers are listed yet.</p><div className="actions"><a className="cta" href={whatsappUrl(channels.whatsappPrimary.e164)}>Become the first verified provider in your area</a></div></div>:
      <div className="featureGrid">{providers.map((provider)=>{
        const currency=provider.fee_currency||'USD';
        const base=money(provider.base_fee,currency);
        const perKm=money(provider.per_km_fee,currency);
        const min=money(provider.minimum_fee,currency);
        const max=money(provider.maximum_fee,currency);
        const eta=etaLabel(provider.estimated_eta_min_minutes,provider.estimated_eta_max_minutes);
        return <article className="feature" key={provider.public_provider_id}>
          <div className="icon">D</div>
          <h3>{provider.display_name}</h3>
          <p><strong>ID:</strong> {provider.public_provider_id}</p>
          <p><strong>Availability:</strong> {provider.accepting_jobs?'Accepting requests':'Not accepting new jobs'}</p>
          {eta&&<p><strong>Estimated arrival:</strong> {eta}</p>}
          <p><strong>City:</strong> {[provider.city,provider.region,provider.country_code].filter(Boolean).join(', ')}</p>
          <p><strong>Zones:</strong> {provider.service_zones?.length?provider.service_zones.join(' · '):(provider.service_area||'Coverage available in profile')}</p>
          <p><strong>Days:</strong> {provider.work_days?.length?provider.work_days.join(' · '):'Flexible'}</p>
          <p><strong>Hours:</strong> {provider.work_start||provider.work_end?`${formatTime(provider.work_start)} – ${formatTime(provider.work_end)}`:'Flexible'}</p>
          {provider.transport_mode&&<p><strong>Transport:</strong> {provider.transport_mode}</p>}
          {provider.public_latitude!=null&&provider.public_longitude!=null&&<p><strong>Map location:</strong> {provider.location_precision||'APPROXIMATE'} service point</p>}
          <div className="feature" style={{marginTop:12}}>
            <strong>Provider-posted delivery pricing</strong>
            <p><strong>Model:</strong> {provider.pricing_model==='FLAT'?'Flat rate':provider.pricing_model==='PER_DISTANCE'?'Per distance':provider.pricing_model==='HYBRID'?'Base + distance':'Quote required'}</p>
            {base&&<p><strong>Starting/base fee:</strong> {base}</p>}
            {perKm&&<p><strong>Distance rate:</strong> {perKm} / km</p>}
            {(min||max)&&<p><strong>Range:</strong> {min?`Min ${min}`:'No minimum posted'} · {max?`Max ${max}`:'No maximum posted'}</p>}
            {provider.pricing_notes&&<p><strong>Conditions:</strong> {provider.pricing_notes}</p>}
            {!base&&!perKm&&provider.pricing_model==='QUOTE'&&<p>Provider requires a job-specific quote.</p>}
          </div>
          <div className="actions" style={{marginTop:12}}><a className="ghost" href={whatsappUrl(channels.whatsappPrimary.e164,`I want delivery help with provider ${provider.public_provider_id} (${provider.display_name}). Please confirm the final delivery quote and availability.`)}>Request this provider</a></div>
          <div className="featureMeta">{provider.provider_kind==='INDIVIDUAL'?'INDEPENDENT PROVIDER':'PRIVATE BUSINESS'} · VERIFIED · PRICING POSTED BY PROVIDER</div>
        </article>;
      })}</div>}
    </section>

    <section className="policyBlock"><div><span className="eyebrow">FAIR CHOICE</span><h2>Transparent provider competition without exposing private contact details</h2></div><p>Customers can compare verified providers using provider ID, approximate location, service zones, schedule, availability, estimated arrival and posted delivery charges. A posted rate or ETA is informational until the provider accepts the specific job. mycubacash keeps private contact details, exact addresses and payment credentials off the public directory.</p></section>
  </main>;
}
