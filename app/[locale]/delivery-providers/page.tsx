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

function etaLabel(min:number|null|undefined,max:number|null|undefined,es:boolean){
  if(min==null&&max==null) return null;
  if(min!=null&&max!=null) return `${min}–${max} min`;
  return min!=null?`${es?'Desde':'From'} ${min} min`:`${es?'Hasta':'Up to'} ${max} min`;
}

function providerPriceLabel(provider:any,es:boolean){
  const currency=provider.fee_currency||'USD';
  const base=money(provider.base_fee,currency);
  const perKm=money(provider.per_km_fee,currency);
  if(provider.pricing_model==='FLAT'&&base) return `${base} ${es?'fijo':'flat'}`;
  if(provider.pricing_model==='PER_DISTANCE'&&perKm) return `${perKm}/km`;
  if(provider.pricing_model==='HYBRID') return [base&&`${base} ${es?'base':'base'}`,perKm&&`${perKm}/km`].filter(Boolean).join(' + ')||(es?'Cotización requerida':'Quote required');
  return es?'Cotización requerida':'Quote required';
}

export default async function DeliveryProviders({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';
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
    .map(p=>({id:p.public_provider_id,name:p.display_name,city:p.city,region:p.region,country:p.country_code,latitude:Number(p.public_latitude),longitude:Number(p.public_longitude),precision:p.location_precision,acceptingJobs:p.accepting_jobs,priceLabel:providerPriceLabel(p,es),etaLabel:etaLabel(p.estimated_eta_min_minutes,p.estimated_eta_max_minutes,es)}));

  return <main className="shell premiumAppShell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav premiumNav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>{es?'Red de entrega':'Delivery Network'}</small></a>
      <div className="navlinks"><a href={`/${locale}/remittances`}>{es?'Remesas':'Remittances'}</a><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/delivery-providers/manage`}>{es?'Consola del proveedor':'Provider Console'}</a></div>
      <a className="miniCta" href={whatsappUrl(channels.whatsappPrimary.e164)}>WhatsApp Business Sofia</a>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">{es?'RED VERIFICADA DE ENTREGA DEL SECTOR PRIVADO':'VERIFIED PRIVATE-SECTOR DELIVERY NETWORK'}</div>
        <h1>{es?'Compara proveedores verificados por precio, cobertura, disponibilidad y tiempo estimado.':'Compare verified delivery providers by price, coverage, availability and expected arrival.'}</h1>
        <p className="heroLead">{es?'Los proveedores verificados publican sus propias tarifas, disponibilidad y ubicación aproximada de servicio para que compares antes de solicitar. Teléfonos, direcciones exactas y credenciales de pago permanecen privadas.':'Verified providers can publish their own delivery charges, availability and approximate service location so customers can compare real options before requesting service. Phone numbers, exact addresses and payment credentials remain private.'}</p>
        <div className="actions"><a className="cta premiumCta" href={`/${locale}/delivery-providers/manage`}>{es?'Gestionar mi oferta':'Manage My Provider Offer'}</a><a className="ghost" href={whatsappUrl(channels.whatsappPrimary.e164)}>{es?'Pedir entrega con Sofia':'Request Delivery with Sofia'}</a></div>
      </div>
      <aside className="commandPreview" aria-label={es?'Comparación del directorio de entrega':'Delivery directory comparison'}>
        <div className="previewTop"><span className="liveDot"/> {es?'Directorio público':'Public Directory'} <span className="previewTag">{es?'COMPARAR':'COMPARE'}</span></div>
        <div className="previewGrid">
          <div><span>{es?'Proveedor':'Provider'}</span><strong>{es?'VERIFICADO + ID':'VERIFIED + ID'}</strong></div>
          <div><span>{es?'Elección':'Choice'}</span><strong>{es?'PRECIO + ETA':'PRICE + ETA'}</strong></div>
          <div><span>{es?'Cobertura':'Coverage'}</span><strong>{es?'CIUDAD + ZONAS':'CITY + ZONES'}</strong></div>
          <div><span>{es?'Privado':'Private'}</span><strong>{es?'TELÉFONO + DIRECCIÓN':'PHONE + ADDRESS'}</strong></div>
        </div>
      </aside>
    </section>

    {!unavailable&&<section className="section"><GeoOperationsMap providers={geoProviders} title={es?'Cobertura mundial de proveedores':'Worldwide provider coverage'}/></section>}

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'PROVEEDORES DE ENTREGA':'DELIVERY PROVIDERS'}</span><h2>{es?'Compara proveedores verificados':'Compare verified providers'}</h2></div><p>{es?'Las tarifas las publica cada proveedor y son independientes de las tarifas de plataforma de mycubacash. La disponibilidad y el ETA siguen siendo estimados hasta que el proveedor acepte el trabajo.':'Rates are posted by each provider and are separate from mycubacash platform fees. Availability and arrival times are provider estimates until a specific job is accepted.'}</p></div>
      {unavailable?<p>{es?'El directorio está temporalmente no disponible. Contacta a Sofia por WhatsApp Business.':'The delivery directory is temporarily unavailable. Contact Sofia on WhatsApp Business for assistance.'}</p>:
      !providers.length?<div><p>{es?'Todavía no hay proveedores verificados publicados.':'No verified public delivery providers are listed yet.'}</p><div className="actions"><a className="cta" href={whatsappUrl(channels.whatsappPrimary.e164)}>{es?'Conviértete en el primer proveedor verificado de tu zona':'Become the first verified provider in your area'}</a></div></div>:
      <div className="featureGrid">{providers.map((provider)=>{
        const currency=provider.fee_currency||'USD';
        const base=money(provider.base_fee,currency);
        const perKm=money(provider.per_km_fee,currency);
        const min=money(provider.minimum_fee,currency);
        const max=money(provider.maximum_fee,currency);
        const eta=etaLabel(provider.estimated_eta_min_minutes,provider.estimated_eta_max_minutes,es);
        return <article className="feature premiumCard" key={provider.public_provider_id}>
          <div className="icon">D</div>
          <h3>{provider.display_name}</h3>
          <p><strong>ID:</strong> {provider.public_provider_id}</p>
          <p><strong>{es?'Disponibilidad':'Availability'}:</strong> {provider.accepting_jobs?(es?'Aceptando solicitudes':'Accepting requests'):(es?'No acepta nuevos trabajos':'Not accepting new jobs')}</p>
          {eta&&<p><strong>{es?'Llegada estimada':'Estimated arrival'}:</strong> {eta}</p>}
          <p><strong>{es?'Ciudad':'City'}:</strong> {[provider.city,provider.region,provider.country_code].filter(Boolean).join(', ')}</p>
          <p><strong>{es?'Zonas':'Zones'}:</strong> {provider.service_zones?.length?provider.service_zones.join(' · '):(provider.service_area||(es?'Cobertura disponible en el perfil':'Coverage available in profile'))}</p>
          <p><strong>{es?'Días':'Days'}:</strong> {provider.work_days?.length?provider.work_days.join(' · '):'Flexible'}</p>
          <p><strong>{es?'Horario':'Hours'}:</strong> {provider.work_start||provider.work_end?`${formatTime(provider.work_start)} – ${formatTime(provider.work_end)}`:'Flexible'}</p>
          {provider.transport_mode&&<p><strong>{es?'Transporte':'Transport'}:</strong> {provider.transport_mode}</p>}
          {provider.public_latitude!=null&&provider.public_longitude!=null&&<p><strong>{es?'Ubicación en mapa':'Map location'}:</strong> {provider.location_precision||'APPROXIMATE'} {es?'punto aproximado de servicio':'service point'}</p>}
          <div className="feature" style={{marginTop:12}}>
            <strong>{es?'Precio publicado por el proveedor':'Provider-posted delivery pricing'}</strong>
            <p><strong>{es?'Modelo':'Model'}:</strong> {provider.pricing_model==='FLAT'?(es?'Tarifa fija':'Flat rate'):provider.pricing_model==='PER_DISTANCE'?(es?'Por distancia':'Per distance'):provider.pricing_model==='HYBRID'?(es?'Base + distancia':'Base + distance'):(es?'Cotización requerida':'Quote required')}</p>
            {base&&<p><strong>{es?'Tarifa inicial/base':'Starting/base fee'}:</strong> {base}</p>}
            {perKm&&<p><strong>{es?'Tarifa por distancia':'Distance rate'}:</strong> {perKm} / km</p>}
            {(min||max)&&<p><strong>{es?'Rango':'Range'}:</strong> {min?`${es?'Mín':'Min'} ${min}`:(es?'Sin mínimo publicado':'No minimum posted')} · {max?`${es?'Máx':'Max'} ${max}`:(es?'Sin máximo publicado':'No maximum posted')}</p>}
            {provider.pricing_notes&&<p><strong>{es?'Condiciones':'Conditions'}:</strong> {provider.pricing_notes}</p>}
            {!base&&!perKm&&provider.pricing_model==='QUOTE'&&<p>{es?'Este proveedor requiere una cotización específica para el trabajo.':'Provider requires a job-specific quote.'}</p>}
          </div>
          <div className="actions" style={{marginTop:12}}><a className="ghost" href={whatsappUrl(channels.whatsappPrimary.e164,es?`Quiero ayuda con el proveedor ${provider.public_provider_id} (${provider.display_name}). Confirma disponibilidad y cotización final.`:`I want delivery help with provider ${provider.public_provider_id} (${provider.display_name}). Please confirm the final delivery quote and availability.`)}>{es?'Solicitar este proveedor':'Request this provider'}</a></div>
          <div className="featureMeta">{provider.provider_kind==='INDIVIDUAL'?(es?'PROVEEDOR INDEPENDIENTE':'INDEPENDENT PROVIDER'):(es?'NEGOCIO PRIVADO':'PRIVATE BUSINESS')} · {es?'VERIFICADO · PRECIO PUBLICADO POR EL PROVEEDOR':'VERIFIED · PRICING POSTED BY PROVIDER'}</div>
        </article>;
      })}</div>}
    </section>

    <section className="policyBlock"><div><span className="eyebrow">{es?'ELECCIÓN JUSTA':'FAIR CHOICE'}</span><h2>{es?'Competencia transparente sin exponer información privada.':'Transparent provider competition without exposing private contact details'}</h2></div><p>{es?'Los clientes pueden comparar proveedores verificados usando ID público, ubicación aproximada, zonas, horario, disponibilidad, ETA y tarifas publicadas. Una tarifa o ETA sigue siendo informativa hasta que el proveedor acepte el trabajo. mycubacash mantiene privados los teléfonos, direcciones exactas y credenciales de pago.':'Customers can compare verified providers using provider ID, approximate location, service zones, schedule, availability, estimated arrival and posted delivery charges. A posted rate or ETA is informational until the provider accepts the specific job. mycubacash keeps private contact details, exact addresses and payment credentials off the public directory.'}</p></section>
  </main>;
}
