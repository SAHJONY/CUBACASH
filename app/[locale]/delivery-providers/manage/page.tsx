'use client';

import {FormEvent,useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
import {localeOf} from '@/lib/i18n';

type Provider={
  public_provider_id:string|null;display_name:string;profile_status:string;public_listing_enabled:boolean;
  pricing_model:'FLAT'|'PER_DISTANCE'|'HYBRID'|'QUOTE';fee_currency:string;base_fee:number|null;per_km_fee:number|null;minimum_fee:number|null;maximum_fee:number|null;
  pricing_notes:string|null;pricing_updated_at:string|null;public_latitude:number|null;public_longitude:number|null;location_precision:'CITY'|'ZONE'|'APPROXIMATE';
  estimated_eta_min_minutes:number|null;estimated_eta_max_minutes:number|null;accepting_jobs:boolean;
  supports_xpress_1h:boolean;xpress_1h_surcharge:number|null;supports_express_1_3h:boolean;express_1_3h_surcharge:number|null;supports_same_day:boolean;same_day_surcharge:number|null;same_day_cutoff_local:string|null;
};

export default function ManageDeliveryPricing(){
  const params=useParams<{locale:string}>();const locale=localeOf(params?.locale);const es=locale==='es';
  const [provider,setProvider]=useState<Provider|null>(null);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');

  useEffect(()=>{(async()=>{const res=await fetch('/api/delivery-provider-pricing',{cache:'no-store'});if(res.status===401){window.location.href=`/${locale}/auth`;return;}const body=await res.json().catch(()=>({}));if(res.ok)setProvider(body.provider);else setMessage(body.error==='DELIVERY_PROVIDER_PROFILE_REQUIRED'?(es?'Necesitas un perfil de proveedor antes de publicar tarifas.':'A provider profile is required before posting rates.'):(es?'No pudimos cargar tu perfil.':'Unable to load your provider profile.'));setLoading(false);})()},[locale,es]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage('');const form=new FormData(event.currentTarget);
    const payload={pricingModel:String(form.get('pricingModel')||'QUOTE'),feeCurrency:String(form.get('feeCurrency')||'USD'),baseFee:String(form.get('baseFee')||''),perKmFee:String(form.get('perKmFee')||''),minimumFee:String(form.get('minimumFee')||''),maximumFee:String(form.get('maximumFee')||''),pricingNotes:String(form.get('pricingNotes')||''),publicLatitude:String(form.get('publicLatitude')||''),publicLongitude:String(form.get('publicLongitude')||''),locationPrecision:String(form.get('locationPrecision')||'CITY'),etaMinMinutes:String(form.get('etaMinMinutes')||''),etaMaxMinutes:String(form.get('etaMaxMinutes')||''),acceptingJobs:form.get('acceptingJobs')==='on',supportsXpress1h:form.get('supportsXpress1h')==='on',xpress1hSurcharge:String(form.get('xpress1hSurcharge')||''),supportsExpress1_3h:form.get('supportsExpress1_3h')==='on',express1_3hSurcharge:String(form.get('express1_3hSurcharge')||''),supportsSameDay:form.get('supportsSameDay')==='on',sameDaySurcharge:String(form.get('sameDaySurcharge')||''),sameDayCutoffLocal:String(form.get('sameDayCutoffLocal')||'')};
    const res=await fetch('/api/delivery-provider-pricing',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const body=await res.json().catch(()=>({}));
    if(res.ok){setProvider(body.provider);setMessage(es?'Oferta actualizada. Los clientes podrán comparar tus opciones Xpress, 1–3 horas y mismo día cuando correspondan.':'Offer updated. Customers can compare your Xpress, 1–3 hour and same-day options when eligible.');}else setMessage(body.error??(es?'No pudimos actualizar tu oferta.':'Unable to update provider offer.'));setBusy(false);
  }

  return <main className="shell premiumAppShell">
    <nav className="nav premiumNav"><a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash</div><small>{es?'Consola de proveedor':'Provider Console'}</small></a><div className="navlinks"><a href={`/${locale}/delivery-providers/services`}>{es?'Más servicios':'More services'}</a><a href={`/${locale}/local-services`}>{es?'Servicios públicos':'Public services'}</a><a href={`/${locale}/delivery-providers`}>{es?'Directorio':'Directory'}</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">{es?'PROVEEDOR MULTI-SERVICIO':'MULTI-SERVICE PROVIDER'}</div><h1>{es?'Compite por precio, rapidez y servicio.':'Compete on price, speed and service.'}</h1><p className="heroLead">{es?'Configura delivery aquí y añade recargas Cubacel, Nauta, compras, mensajería y otros servicios desde tu catálogo de servicios.':'Configure delivery here and add Cubacel, Nauta, purchase, messenger and other services from your service catalog.'}</p><div className="actions"><a className="cta premiumCta" href={`/${locale}/delivery-providers/services`}>{es?'Administrar más servicios':'Manage more services'}</a></div></div></section>
    <section className="section" style={{maxWidth:960,margin:'0 auto'}}>
      {loading?<p>{es?'Cargando tu perfil…':'Loading your profile…'}</p>:!provider?<div className="feature premiumCard"><h2>{es?'Onboarding requerido':'Onboarding required'}</h2><p>{message}</p></div>:
      <form className="feature premiumCard" onSubmit={submit} style={{display:'grid',gap:18}}>
        <div><span className="eyebrow">{provider.public_provider_id??'PROVIDER'}</span><h2>{provider.display_name}</h2><p>{es?'Estado':'Status'}: <strong>{provider.profile_status}</strong> · {es?'Listado público':'Public listing'}: <strong>{provider.public_listing_enabled?(es?'Activo':'Enabled'):(es?'Inactivo':'Disabled')}</strong></p></div>
        <div className="featureGrid"><label>{es?'Modelo de precio':'Pricing model'}<select name="pricingModel" defaultValue={provider.pricing_model}><option value="FLAT">{es?'Tarifa fija':'Flat rate'}</option><option value="PER_DISTANCE">{es?'Por distancia':'Per distance'}</option><option value="HYBRID">{es?'Base + distancia':'Base + distance'}</option><option value="QUOTE">{es?'Cotización':'Quote required'}</option></select></label><label>{es?'Moneda':'Currency'}<input name="feeCurrency" defaultValue={provider.fee_currency||'USD'} maxLength={3} required/></label></div>
        <div className="featureGrid"><label>{es?'Tarifa base':'Base fee'}<input name="baseFee" type="number" min="0" step="0.01" defaultValue={provider.base_fee??''}/></label><label>{es?'Tarifa por km':'Per-km fee'}<input name="perKmFee" type="number" min="0" step="0.01" defaultValue={provider.per_km_fee??''}/></label><label>{es?'Mínimo':'Minimum'}<input name="minimumFee" type="number" min="0" step="0.01" defaultValue={provider.minimum_fee??''}/></label><label>{es?'Máximo':'Maximum'}<input name="maximumFee" type="number" min="0" step="0.01" defaultValue={provider.maximum_fee??''}/></label></div>
        <label>{es?'Condiciones':'Pricing conditions'}<textarea name="pricingNotes" maxLength={500} defaultValue={provider.pricing_notes??''}/></label>

        <div className="feature"><span className="eyebrow">{es?'VELOCIDAD':'SPEED TIERS'}</span><h3>{es?'Publica solo velocidades que realmente puedas cumplir':'Publish only speeds you can actually support'}</h3>
          <div className="featureGrid">
            <label style={{display:'flex',gap:10,alignItems:'center'}}><input name="supportsXpress1h" type="checkbox" defaultChecked={provider.supports_xpress_1h}/><strong>{es?'Xpress · hasta 1 hora':'Xpress · up to 1 hour'}</strong></label><label>{es?'Recargo Xpress':'Xpress surcharge'}<input name="xpress1hSurcharge" type="number" min="0" step="0.01" defaultValue={provider.xpress_1h_surcharge??''}/></label>
            <label style={{display:'flex',gap:10,alignItems:'center'}}><input name="supportsExpress1_3h" type="checkbox" defaultChecked={provider.supports_express_1_3h}/><strong>{es?'1–3 horas':'1–3 hours'}</strong></label><label>{es?'Recargo 1–3 horas':'1–3 hour surcharge'}<input name="express1_3hSurcharge" type="number" min="0" step="0.01" defaultValue={provider.express_1_3h_surcharge??''}/></label>
            <label style={{display:'flex',gap:10,alignItems:'center'}}><input name="supportsSameDay" type="checkbox" defaultChecked={provider.supports_same_day}/><strong>{es?'Mismo día':'Same day'}</strong></label><label>{es?'Recargo mismo día':'Same-day surcharge'}<input name="sameDaySurcharge" type="number" min="0" step="0.01" defaultValue={provider.same_day_surcharge??''}/></label>
            <label>{es?'Corte local':'Local cutoff'}<input name="sameDayCutoffLocal" type="time" defaultValue={provider.same_day_cutoff_local?.slice(0,5)??''}/></label>
          </div><p className="sectionCopy">{es?'Xpress 1 hora, 1–3 horas y mismo día son objetivos estimados del proveedor y no garantías hasta que se acepte el trabajo específico.':'Xpress 1 hour, 1–3 hour and same-day are provider-posted service targets and not guarantees until the specific job is accepted.'}</p>
        </div>

        <div className="feature"><span className="eyebrow">{es?'DISPONIBILIDAD':'AVAILABILITY'}</span><div className="featureGrid"><label>{es?'ETA mínimo (min)':'ETA min (min)'}<input name="etaMinMinutes" type="number" min="0" max="10080" defaultValue={provider.estimated_eta_min_minutes??''}/></label><label>{es?'ETA máximo (min)':'ETA max (min)'}<input name="etaMaxMinutes" type="number" min="0" max="10080" defaultValue={provider.estimated_eta_max_minutes??''}/></label></div><label style={{display:'flex',gap:10,alignItems:'center',marginTop:12}}><input name="acceptingJobs" type="checkbox" defaultChecked={provider.accepting_jobs}/><span>{es?'Aceptando nuevas solicitudes':'Accepting new requests'}</span></label></div>

        <div className="feature"><span className="eyebrow">{es?'MAPA PRIVADO-SEGURO':'PRIVACY-SAFE MAP'}</span><p>{es?'Usa solo ciudad, zona o punto aproximado. Nunca una dirección privada exacta.':'Use only a city, zone or approximate point. Never an exact private address.'}</p><div className="featureGrid"><label>Latitude<input name="publicLatitude" type="number" min="-90" max="90" step="0.0001" defaultValue={provider.public_latitude??''}/></label><label>Longitude<input name="publicLongitude" type="number" min="-180" max="180" step="0.0001" defaultValue={provider.public_longitude??''}/></label><label>{es?'Precisión':'Precision'}<select name="locationPrecision" defaultValue={provider.location_precision||'CITY'}><option value="CITY">{es?'Ciudad':'City'}</option><option value="ZONE">{es?'Zona':'Zone'}</option><option value="APPROXIMATE">{es?'Aproximada':'Approximate'}</option></select></label></div></div>
        <button className="cta premiumCta" type="submit" disabled={busy}>{busy?(es?'Guardando…':'Saving…'):(es?'Guardar oferta de delivery':'Save delivery offer')}</button>{message&&<p role="status">{message}</p>}
      </form>}
    </section>
  </main>;
}
