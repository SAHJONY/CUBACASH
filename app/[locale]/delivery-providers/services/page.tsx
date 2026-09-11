'use client';

import {useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
import {localeOf} from '@/lib/i18n';

type Offer={service_code:string;active:boolean;fee_currency:string;starting_fee:number|null;minimum_fee:number|null;maximum_fee:number|null;eta_min_minutes:number|null;eta_max_minutes:number|null;conditions:string|null;approval_status:string;updated_at:string};
type Service={code:string;display_name_es:string;display_name_en:string;category:string;requires_manual_review:boolean;sort_order:number;offer:Offer|null};

type Draft={active:boolean;feeCurrency:string;startingFee:string;minimumFee:string;maximumFee:string;etaMinMinutes:string;etaMaxMinutes:string;conditions:string};

function draftOf(service:Service):Draft{return {
  active:service.offer?.active??false,
  feeCurrency:service.offer?.fee_currency??'USD',
  startingFee:service.offer?.starting_fee?.toString()??'',
  minimumFee:service.offer?.minimum_fee?.toString()??'',
  maximumFee:service.offer?.maximum_fee?.toString()??'',
  etaMinMinutes:service.offer?.eta_min_minutes?.toString()??'',
  etaMaxMinutes:service.offer?.eta_max_minutes?.toString()??'',
  conditions:service.offer?.conditions??''
};}

export default function ProviderServices(){
  const params=useParams<{locale:string}>();
  const locale=localeOf(params?.locale);const es=locale==='es';
  const [services,setServices]=useState<Service[]>([]);const [drafts,setDrafts]=useState<Record<string,Draft>>({});
  const [providerName,setProviderName]=useState('');const [loading,setLoading]=useState(true);const [busy,setBusy]=useState('');const [message,setMessage]=useState('');

  async function load(){
    const res=await fetch('/api/provider-services',{cache:'no-store'});
    if(res.status===401){window.location.href=`/${locale}/auth`;return;}
    const body=await res.json().catch(()=>({}));
    if(res.ok){setServices(body.services??[]);setProviderName(body.provider?.display_name??'');setDrafts(Object.fromEntries((body.services??[]).map((s:Service)=>[s.code,draftOf(s)])));}
    else setMessage(body.error==='DELIVERY_PROVIDER_PROFILE_REQUIRED'?(es?'Necesitas un perfil de proveedor antes de ofrecer servicios.':'A provider profile is required before offering services.'):(es?'No pudimos cargar tus servicios.':'Unable to load provider services.'));
    setLoading(false);
  }
  useEffect(()=>{load()},[]);

  function patch(code:string,part:Partial<Draft>){setDrafts(v=>({...v,[code]:{...v[code],...part}}));}
  async function save(service:Service){
    const d=drafts[service.code];if(!d)return;setBusy(service.code);setMessage('');
    const res=await fetch('/api/provider-services',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({serviceCode:service.code,...d})});
    const body=await res.json().catch(()=>({}));
    if(res.ok){setMessage(es?`${service.display_name_es}: guardado. ${body.publication==='PENDING_REVIEW'?'Queda pendiente de revisión antes de aparecer públicamente.':'Disponible públicamente cuando tu perfil esté verificado.'}`:`${service.display_name_en}: saved. ${body.publication==='PENDING_REVIEW'?'Pending review before public listing.':'Public when your provider profile is verified.'}`);await load();}
    else setMessage(body.error??(es?'No pudimos guardar el servicio.':'Unable to save service.'));
    setBusy('');
  }

  const groups=['DELIVERY','TOPUP','COMMERCE','ERRAND','OTHER'];
  const groupLabel=(g:string)=>es?({DELIVERY:'Entrega',TOPUP:'Recargas',COMMERCE:'Compras + entrega',ERRAND:'Mandados',OTHER:'Otros'} as any)[g]:({DELIVERY:'Delivery',TOPUP:'Top-ups',COMMERCE:'Commerce + delivery',ERRAND:'Errands',OTHER:'Other'} as any)[g];

  return <main className="shell premiumAppShell">
    <nav className="nav premiumNav"><a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash</div><small>{es?'Servicios locales':'Local Services'}</small></a><div className="navlinks"><a href={`/${locale}/delivery-providers/manage`}>{es?'Tarifas de entrega':'Delivery rates'}</a><a href={`/${locale}/delivery-providers`}>{es?'Directorio público':'Public directory'}</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">{es?'RED DE SERVICIOS LOCALES':'LOCAL SERVICE NETWORK'}</div><h1>{es?'Convierte tu operación en un proveedor multi-servicio.':'Turn your operation into a multi-service provider.'}</h1><p className="heroLead">{es?'Además de entrega, ofrece recargas Cubacel, recargas Nauta, compras y entregas, mensajería, diligencias y otros servicios aprobados. Publica precio, tiempo y condiciones por servicio.':'Beyond delivery, offer Cubacel top-ups, Nauta top-ups, purchase-and-delivery, document messenger, errands and other approved services. Publish price, time and conditions per service.'}</p></div></section>
    <section className="section" style={{maxWidth:1100,margin:'0 auto'}}>
      {providerName&&<div className="sectionHead"><div><span className="eyebrow">{es?'PROVEEDOR':'PROVIDER'}</span><h2>{providerName}</h2></div><p>{es?'Los servicios sensibles o nuevos requieren revisión antes de aparecer públicamente.':'Sensitive or new services require review before appearing publicly.'}</p></div>}
      {loading?<p>{es?'Cargando servicios…':'Loading services…'}</p>:groups.map(group=>{
        const items=services.filter(s=>s.category===group);if(!items.length)return null;
        return <section key={group} style={{marginBottom:34}}><h2>{groupLabel(group)}</h2><div className="featureGrid">{items.map(service=>{const d=drafts[service.code];if(!d)return null;return <article className="feature premiumCard" key={service.code}>
          <div className="deliveryChoiceTop"><div><span className="eyebrow">{service.code}</span><h3>{es?service.display_name_es:service.display_name_en}</h3></div>{service.offer?.approval_status&&<span className="previewTag">{service.offer.approval_status}</span>}</div>
          <label style={{display:'flex',gap:10,alignItems:'center',margin:'12px 0'}}><input type="checkbox" checked={d.active} onChange={e=>patch(service.code,{active:e.target.checked})}/><strong>{es?'Ofrecer este servicio':'Offer this service'}</strong></label>
          <div className="featureGrid"><label>{es?'Moneda':'Currency'}<input maxLength={3} value={d.feeCurrency} onChange={e=>patch(service.code,{feeCurrency:e.target.value.toUpperCase()})}/></label><label>{es?'Desde':'Starting fee'}<input type="number" min="0" step="0.01" value={d.startingFee} onChange={e=>patch(service.code,{startingFee:e.target.value})}/></label></div>
          <div className="featureGrid"><label>{es?'Mínimo':'Minimum'}<input type="number" min="0" step="0.01" value={d.minimumFee} onChange={e=>patch(service.code,{minimumFee:e.target.value})}/></label><label>{es?'Máximo':'Maximum'}<input type="number" min="0" step="0.01" value={d.maximumFee} onChange={e=>patch(service.code,{maximumFee:e.target.value})}/></label></div>
          <div className="featureGrid"><label>{es?'ETA mínimo (min)':'ETA min (min)'}<input type="number" min="0" max="10080" value={d.etaMinMinutes} onChange={e=>patch(service.code,{etaMinMinutes:e.target.value})}/></label><label>{es?'ETA máximo (min)':'ETA max (min)'}<input type="number" min="0" max="10080" value={d.etaMaxMinutes} onChange={e=>patch(service.code,{etaMaxMinutes:e.target.value})}/></label></div>
          <label>{es?'Condiciones':'Conditions'}<textarea maxLength={500} value={d.conditions} onChange={e=>patch(service.code,{conditions:e.target.value})} placeholder={es?'Ej.: disponible en La Habana; comisión no incluye el valor de la recarga o compra.':'Example: available in Havana; fee does not include top-up or purchase value.'}/></label>
          {service.requires_manual_review&&<p className="sectionCopy">{es?'Este servicio requiere revisión de mycubacash antes de publicarse.':'This service requires mycubacash review before public listing.'}</p>}
          <button className="cta premiumCta" type="button" disabled={busy===service.code} onClick={()=>save(service)}>{busy===service.code?(es?'Guardando…':'Saving…'):(es?'Guardar servicio':'Save service')}</button>
        </article>})}</div></section>})}
      {message&&<p role="status">{message}</p>}
      <div className="policyBlock"><div><span className="eyebrow">{es?'LÍMITE OPERACIONAL':'OPERATIONAL BOUNDARY'}</span><h2>{es?'Más servicios, sin convertir un servicio local en una actividad financiera no autorizada.':'More services without turning a local-service listing into unauthorized financial activity.'}</h2></div><p>{es?'Recargas, compras, entrega y diligencias pueden publicarse bajo revisión. Transmisión de dinero, cambio de moneda, custodia o liquidación requieren controles y proveedores autorizados separados.':'Top-ups, purchases, delivery and errands may be offered subject to review. Money transmission, currency exchange, custody or settlement require separate controls and appropriately authorized providers.'}</p></div>
    </section>
  </main>;
}
