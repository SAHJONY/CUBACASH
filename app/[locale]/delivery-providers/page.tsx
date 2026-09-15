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
      .select('public_provider_id,provider_kind,display_name,city,region,country_code,service_zones,service_area,work_days,work_start,work_end,transport_mode,verified,founding_supplier,founding_slot,featured_until,pricing_model,fee_currency,base_fee,per_km_fee,minimum_fee,maximum_fee,pricing_notes,pricing_updated_at,public_latitude,public_longitude,location_precision,estimated_eta_min_minutes,estimated_eta_max_minutes,accepting_jobs')
      .eq('verified',true)
      .order('featured_until',{ascending:false,nullsFirst:false})
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
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Red privada verificada':'Verified Private Network'}</small></a>
      <div className="navlinks"><a href={`/${locale}`}>{es?'Inicio':'Home'}</a><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a><a href={`/${locale}/how-it-works`}>{es?'Cómo funciona':'How it works'}</a><a href={`/${locale}/providers/join`}>Founding 100</a></div>
      <a className="miniCta" href={whatsappUrl(channels.whatsappPrimary.e164)}>WhatsApp Business Sofia</a>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">{providers.length?(es?'RED PÚBLICA VERIFICADA':'VERIFIED PUBLIC NETWORK'):(es?'ESTADO DE LA RED · PRE-LANZAMIENTO':'NETWORK STATUS · PRE-LAUNCH')}</div>
        <h1>{providers.length?(es?'Compara opciones reales antes de solicitar.':'Compare real options before requesting.'):(es?'Todavía no hay proveedores verificados publicados.':'No verified providers are publicly listed yet.')}</h1>
        <p className="heroLead">{providers.length?(es?'Cada MIPYME, emprendedor o proveedor listado publica las capacidades que tiene verificadas, junto con disponibilidad, cobertura y costos visibles sin exponer datos privados.':'Each listed private business, entrepreneur or provider publishes verified capabilities together with availability, coverage and visible costs without exposing private data.'):(es?'No mostramos proveedores, precios de entrega ni tiempos que no podamos verificar. Puedes revisar nuestra tarifa de plataforma y el proceso, o contactar soporte, pero la entrega no está disponible hasta que una opción real sea aprobada y publicada.':'We do not show providers, delivery prices or times we cannot verify. You can review our platform fee and process or contact support, but delivery is unavailable until a real option is approved and published.')}</p>
        <div className="actions">{providers.length?<><a className="cta premiumCta" href={`/${locale}/delivery-providers/manage`}>{es?'Gestionar mi oferta':'Manage my provider offer'}</a><a className="ghost" href={whatsappUrl(channels.whatsappPrimary.e164)}>{es?'Consultar una opción con Sofia':'Ask Sofia about an option'}</a></>:<><a className="cta premiumCta" href={`/${locale}/fees`}>{es?'Ver tarifas públicas':'View public fees'}</a><a className="ghost" href={whatsappUrl(channels.whatsappPrimary.e164,es?'Hola, quiero información sobre el pre-lanzamiento de la red de proveedores.':'Hello, I want information about the provider-network pre-launch.')}>{es?'Preguntar a soporte':'Ask support'}</a></>}</div>
      </div>
      <aside className="commandPreview" aria-label={es?'Estado del directorio de entrega':'Delivery directory status'}>
        <div className="previewTop"><span className="liveDot"/> {es?'Directorio público':'Public directory'} <span className="previewTag">{providers.length?(es?'ACTIVO':'ACTIVE'):(es?'PRE-LANZAMIENTO':'PRE-LAUNCH')}</span></div>
        <div className="previewGrid">{providers.length?<><div><span>{es?'Proveedores':'Providers'}</span><strong>{providers.length}</strong></div><div><span>{es?'Elección':'Choice'}</span><strong>{es?'PRECIO + ETA':'PRICE + ETA'}</strong></div><div><span>{es?'Cobertura':'Coverage'}</span><strong>{es?'CIUDAD + ZONAS':'CITY + ZONES'}</strong></div><div><span>{es?'Privado':'Private'}</span><strong>{es?'DATOS SENSIBLES':'SENSITIVE DATA'}</strong></div></>:<><div><span>{es?'Proveedores publicados':'Listed providers'}</span><strong>0</strong></div><div><span>{es?'Cotizaciones':'Quotes'}</span><strong>{es?'NO DISPONIBLES':'UNAVAILABLE'}</strong></div><div><span>{es?'Entregas':'Deliveries'}</span><strong>{es?'NO DISPONIBLES':'UNAVAILABLE'}</strong></div><div><span>{es?'Próximo paso':'Next step'}</span><strong>{es?'VER TARIFAS':'VIEW FEES'}</strong></div></>}</div>
      </aside>
    </section>

    {!unavailable&&providers.length>0&&<section className="section"><GeoOperationsMap providers={geoProviders} title={es?'Cobertura mundial de proveedores':'Worldwide provider coverage'}/></section>}

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'RED PRIVADA VERIFICADA':'VERIFIED PRIVATE NETWORK'}</span><h2>{providers.length?(es?'Compara proveedores verificados':'Compare verified providers'):(es?'Estado público de la red':'Public network status')}</h2></div><p>{es?'Las tarifas las publica cada proveedor y son independientes de las tarifas de plataforma de MY CUBA CASH. La disponibilidad y el ETA siguen siendo estimados hasta que el proveedor acepte el trabajo.':'Rates are posted by each provider and are separate from MY CUBA CASH platform fees. Availability and arrival times are provider estimates until a specific job is accepted.'}</p></div>
      {unavailable?<p>{es?'El directorio está temporalmente no disponible. Contacta a Sofia por WhatsApp Business.':'The delivery directory is temporarily unavailable. Contact Sofia on WhatsApp Business for assistance.'}</p>:
      !providers.length?<article className="feature premiumCard" style={{display:'grid',gap:14}}>
        <span className="eyebrow">{es?'0 PROVEEDORES PUBLICADOS':'0 PROVIDERS LISTED'}</span>
        <h3>{es?'Marketplace de entrega en pre-lanzamiento controlado.':'Delivery marketplace in controlled pre-launch.'}</h3>
        <p>{es?'La ausencia de resultados es real, no un error de diseño. MY CUBA CASH no permite comparar ni elegir un proveedor hasta que complete la revisión y publique disponibilidad y costos verificables.':'The empty result is real, not a design error. MY CUBA CASH does not allow comparison or selection until a provider completes review and publishes verifiable availability and costs.'}</p>
        <p>{es?'No envíes dinero a una persona que diga representar esta red si no aparece aquí con un ID público y una cotización confirmada dentro de la plataforma.':'Do not send money to anyone claiming to represent this network unless they appear here with a public ID and a confirmed quote inside the platform.'}</p>
        <div className="actions"><a className="cta premiumCta" href={`/${locale}/fees`}>{es?'Ver nuestra tarifa':'View our fee'}</a><a className="ghost" href={`/${locale}/delivery-providers/manage`}>{es?'Solicitar verificación como proveedor':'Apply for provider verification'}</a><a className="ghost" href={whatsappUrl(channels.whatsappPrimary.e164,es?'Hola, quiero confirmar el estado actual de la red de proveedores de MY CUBA CASH. No deseo enviar dinero todavía.':'Hello, I want to confirm the current MY CUBA CASH provider-network status. I do not want to send money yet.')}>{es?'Confirmar estado con soporte':'Confirm status with support'}</a></div>
      </article>:
      <div className="featureGrid">{providers.map((provider)=>{
        const currency=provider.fee_currency||'USD';
        const base=money(provider.base_fee,currency);
        const perKm=money(provider.per_km_fee,currency);
        const min=money(provider.minimum_fee,currency);
        const max=money(provider.maximum_fee,currency);
        const eta=etaLabel(provider.estimated_eta_min_minutes,provider.estimated_eta_max_minutes,es);
        return <article className="feature premiumCard" key={provider.public_provider_id}>
          <div className="icon">D</div>
          {provider.featured_until&&new Date(provider.featured_until).getTime()>Date.now()&&<span className="foundingBadge">{es?'DESTACADO':'FEATURED'}</span>}
          {provider.founding_supplier&&<span className="foundingBadge">{es?`PROVEEDOR FUNDADOR #${provider.founding_slot}`:`FOUNDING SUPPLIER #${provider.founding_slot}`}</span>}
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

    <section className="policyBlock"><div><span className="eyebrow">{es?'ELECCIÓN JUSTA':'FAIR CHOICE'}</span><h2>{providers.length?(es?'Competencia transparente sin exponer información privada.':'Transparent competition without exposing private information.'):(es?'No hay nada que elegir todavía.':'There is nothing to choose yet.')}</h2></div><p>{providers.length?(es?'Los clientes comparan ID público, ubicación aproximada, zonas, disponibilidad, ETA y tarifas. Una tarifa o ETA sigue siendo informativa hasta la aceptación del trabajo.':'Customers compare public ID, approximate location, zones, availability, ETA and rates. A rate or ETA remains informational until job acceptance.'):(es?'Cuando se publique el primer proveedor verificado, aparecerán aquí su ID público, zona, disponibilidad y costos. Teléfonos, direcciones exactas y credenciales de pago permanecerán privados.':'When the first verified provider is published, its public ID, area, availability and costs will appear here. Phone numbers, exact addresses and payment credentials will remain private.')}</p></section>
  </main>;
}
