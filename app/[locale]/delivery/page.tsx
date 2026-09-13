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
  const es=locale==='es';
  const supabase=await supabaseServer();
  const {data:providers,error}=await supabase
    .from('delivery_provider_public_directory')
    .select('user_id,provider_kind,display_name,city,region,country_code,service_area,work_days,work_start,work_end,transport_mode,verified,updated_at')
    .eq('verified',true)
    .order('city',{ascending:true});

  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Red de entrega verificada':'Verified Delivery Network'}</small></a>
      <div className="navlinks"><a href={`/${locale}/remittances`}>{es?'Remesas':'Remittances'}</a><a href={`/${locale}/marketplace`}>Marketplace</a></div>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">{es?'ENTREGA VERIFICADA DEL SECTOR PRIVADO':'VERIFIED PRIVATE-SECTOR DELIVERY'}</div>
        <h1>{es?'Encuentra un proveedor verificado por ciudad, zona y horario.':'Find a verified delivery provider by city, zone and working hours.'}</h1>
        <p className="heroLead">{es?'Solo mostramos información pública aprobada. Los teléfonos, direcciones exactas, datos de pago y documentación privada de verificación nunca se muestran públicamente.':'Only approved public profile information is displayed. Phone numbers, exact street addresses, payment details and private verification data are never shown publicly.'}</p>
      </div>
    </section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'DIRECTORIO DE ENTREGA':'DELIVERY DIRECTORY'}</span><h2>{es?'Proveedores disponibles':'Available providers'}</h2></div><p>{es?'Proveedores independientes y negocios privados verificados pueden aparecer aquí después de completar revisión y activación.':'Independent part-time providers and verified private businesses can appear here after verification and activation.'}</p></div>
      {error?<p>{es?'No pudimos cargar el directorio de entrega.':'Unable to load the delivery directory.'}</p>:
      (providers??[]).length===0?<p>{es?'Todavía no hay proveedores de entrega verificados publicados.':'No verified delivery providers are publicly listed yet.'}</p>:
      <div className="featureGrid">{(providers??[]).map((provider)=><article className="feature" key={provider.user_id}>
        <div className="icon">D</div>
        <h3>{provider.display_name}</h3>
        <p><strong>{es?'Tipo':'Type'}:</strong> {provider.provider_kind==='INDIVIDUAL'?(es?'Proveedor independiente':'Independent Delivery Provider'):(es?'Negocio privado de entrega':'Private Business Delivery Provider')}</p>
        <p><strong>{es?'Ciudad':'City'}:</strong> {[provider.city,provider.region,provider.country_code].filter(Boolean).join(', ')}</p>
        <p><strong>{es?'Zonas cubiertas':'Zones covered'}:</strong> {provider.service_area||(es?'No especificado':'Not specified')}</p>
        <p><strong>{es?'Días de trabajo':'Working days'}:</strong> {(provider.work_days??[]).length?(provider.work_days as string[]).join(', '):'Flexible'}</p>
        <p><strong>{es?'Horario':'Hours'}:</strong> {provider.work_start||provider.work_end?`${formatTime(provider.work_start)} – ${formatTime(provider.work_end)}`:'Flexible'}</p>
        {provider.transport_mode&&<p><strong>{es?'Transporte':'Transport'}:</strong> {provider.transport_mode}</p>}
        <div className="featureMeta">{es?'VERIFICADO · TELÉFONO OCULTO POR SEGURIDAD':'VERIFIED · PHONE HIDDEN FOR SECURITY'}</div>
      </article>)}</div>}
    </section>
  </main>;
}
