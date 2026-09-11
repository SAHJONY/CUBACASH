'use client';

import {FormEvent,useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
import {localeOf} from '@/lib/i18n';

type Provider={
  public_provider_id:string|null; display_name:string; profile_status:string; public_listing_enabled:boolean;
  pricing_model:'FLAT'|'PER_DISTANCE'|'HYBRID'|'QUOTE'; fee_currency:string;
  base_fee:number|null; per_km_fee:number|null; minimum_fee:number|null; maximum_fee:number|null;
  pricing_notes:string|null; pricing_updated_at:string|null;
  public_latitude:number|null; public_longitude:number|null; location_precision:'CITY'|'ZONE'|'APPROXIMATE';
  estimated_eta_min_minutes:number|null; estimated_eta_max_minutes:number|null; accepting_jobs:boolean;
  supports_express_1_3h:boolean; express_1_3h_surcharge:number|null; supports_same_day:boolean; same_day_surcharge:number|null; same_day_cutoff_local:string|null;
};

export default function ManageDeliveryPricing(){
  const params=useParams<{locale:string}>();
  const locale=localeOf(params?.locale);
  const es=locale==='es';
  const [provider,setProvider]=useState<Provider|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');

  useEffect(()=>{(async()=>{
    const res=await fetch('/api/delivery-provider-pricing',{cache:'no-store'});
    if(res.status===401){window.location.href=`/${locale}/auth`;return;}
    const body=await res.json().catch(()=>({}));
    if(res.ok) setProvider(body.provider);
    else setMessage(body.error==='DELIVERY_PROVIDER_PROFILE_REQUIRED'?(es?'Necesitas un perfil de proveedor de entrega antes de publicar tarifas. Contacta a Sofia para completar el onboarding.':'A delivery-provider profile is required before posting prices. Contact Sofia to complete onboarding.'):(es?'No pudimos cargar tu perfil de entrega.':'Unable to load your delivery pricing profile.'));
    setLoading(false);
  })()},[locale,es]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setBusy(true);setMessage('');
    const form=new FormData(event.currentTarget);
    const payload={
      pricingModel:String(form.get('pricingModel')||'QUOTE'),
      feeCurrency:String(form.get('feeCurrency')||'USD'),
      baseFee:String(form.get('baseFee')||''),
      perKmFee:String(form.get('perKmFee')||''),
      minimumFee:String(form.get('minimumFee')||''),
      maximumFee:String(form.get('maximumFee')||''),
      pricingNotes:String(form.get('pricingNotes')||''),
      publicLatitude:String(form.get('publicLatitude')||''),
      publicLongitude:String(form.get('publicLongitude')||''),
      locationPrecision:String(form.get('locationPrecision')||'CITY'),
      etaMinMinutes:String(form.get('etaMinMinutes')||''),
      etaMaxMinutes:String(form.get('etaMaxMinutes')||''),
      acceptingJobs:form.get('acceptingJobs')==='on',
      supportsExpress1_3h:form.get('supportsExpress1_3h')==='on',
      express1_3hSurcharge:String(form.get('express1_3hSurcharge')||''),
      supportsSameDay:form.get('supportsSameDay')==='on',
      sameDaySurcharge:String(form.get('sameDaySurcharge')||''),
      sameDayCutoffLocal:String(form.get('sameDayCutoffLocal')||'')
    };
    const res=await fetch('/api/delivery-provider-pricing',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const body=await res.json().catch(()=>({}));
    if(res.ok){setProvider(body.provider);setMessage(es?'Tu oferta pública fue actualizada. Los clientes verán tus precios, disponibilidad y opciones 1–3 horas / mismo día cuando correspondan.':'Your public delivery offer was updated. Customers will see your pricing, availability and 1–3 hour / same-day options when eligible.');}
    else setMessage(body.error??(es?'No pudimos actualizar tu oferta.':'Unable to update provider offer.'));
    setBusy(false);
  }

  return <main className="shell premiumAppShell">
    <nav className="nav premiumNav"><a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash</div><small>{es?'Consola de entrega':'Provider Console'}</small></a><div className="navlinks"><a href={`/${locale}/delivery-providers`}>{es?'Directorio público':'Public Directory'}</a><a href={`/${locale}/transactions`}>{es?'Transacciones':'Transactions'}</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">{es?'PROVEEDOR DE ENTREGA':'DELIVERY PROVIDER CONSOLE'}</div><h1>{es?'Compite por precio, rapidez y calidad.':'Compete on price, speed and service quality.'}</h1><p className="heroLead">{es?'Publica tarifas y disponibilidad reales. Si puedes cumplir entregas de 1–3 horas o el mismo día, actívalo para aparecer en esas opciones.':'Publish real pricing and availability. If you can complete eligible deliveries in 1–3 hours or the same day, enable those tiers to appear in those customer options.'}</p></div></section>
    <section className="section" style={{maxWidth:960,margin:'0 auto'}}>
      {loading?<p>{es?'Cargando tu perfil…':'Loading your provider profile…'}</p>:!provider?<div className="feature"><h2>{es?'Onboarding requerido':'Provider onboarding required'}</h2><p>{message}</p><div className="actions"><a className="cta" href={`/${locale}/delivery-providers`}>{es?'Red de entrega':'Delivery Network'}</a></div></div>:
      <form className="feature premiumCard" onSubmit={submit} style={{display:'grid',gap:18}}>
        <div><span className="eyebrow">{provider.public_provider_id??'PROVIDER'}</span><h2>{provider.display_name}</h2><p>{es?'Estado':'Status'}: <strong>{provider.profile_status}</strong> · {es?'Listado público':'Public listing'}: <strong>{provider.public_listing_enabled?(es?'Activo':'Enabled'):(es?'Inactivo':'Disabled')}</strong></p></div>
        <div className="featureGrid">
          <label>{es?'Modelo de precio':'Pricing model'}<select name="pricingModel" defaultValue={provider.pricing_model} style={{width:'100%',padding:12,marginTop:6}}><option value="FLAT">{es?'Tarifa fija':'Flat rate'}</option><option value="PER_DISTANCE">{es?'Por distancia':'Per distance'}</option><option value="HYBRID">{es?'Base + distancia':'Base + distance'}</option><option value="QUOTE">{es?'Cotización':'Quote required'}</option></select></label>
          <label>{es?'Moneda':'Currency'}<input name="feeCurrency" defaultValue={provider.fee_currency||'USD'} maxLength={3} required style={{width:'100%',padding:12,marginTop:6}}/></label>
        </div>
        <div className="featureGrid">
          <label>{es?'Tarifa base / inicial':'Base / starting fee'}<input name="baseFee" type="number" min="0" step="0.01" defaultValue={provider.base_fee??''} style={{width:'100%',padding:12,marginTop:6}}/></label>
          <label>{es?'Tarifa por km':'Fee per kilometer'}<input name="perKmFee" type="number" min="0" step="0.01" defaultValue={provider.per_km_fee??''} style={{width:'100%',padding:12,marginTop:6}}/></label>
          <label>{es?'Cargo mínimo':'Minimum charge'}<input name="minimumFee" type="number" min="0" step="0.01" defaultValue={provider.minimum_fee??''} style={{width:'100%',padding:12,marginTop:6}}/></label>
          <label>{es?'Cargo máximo':'Maximum charge'}<input name="maximumFee" type="number" min="0" step="0.01" defaultValue={provider.maximum_fee??''} style={{width:'100%',padding:12,marginTop:6}}/></label>
        </div>
        <label>{es?'Condiciones de precio':'Pricing conditions'}<textarea name="pricingNotes" maxLength={500} defaultValue={provider.pricing_notes??''} placeholder={es?'Ej.: tarifa base cubre 5 km. Paradas extra +$2. Bultos grandes se cotizan aparte.':'Example: Base fee covers first 5 km. Extra stops +$2 each. Large/heavy items quoted separately.'} style={{width:'100%',padding:12,marginTop:6,minHeight:110}}/></label>

        <div className="feature"><span className="eyebrow">{es?'VELOCIDAD DE ENTREGA':'DELIVERY SPEED'}</span><h3>{es?'Ofrece 1–3 horas y mismo día cuando realmente puedas cumplirlo':'Offer 1–3 hour and same-day service only when you can actually deliver it'}</h3><p>{es?'Los tiempos son estimados publicados por el proveedor y siguen sujetos a aceptación, ruta, disponibilidad y controles de la transacción.':'Times are provider-posted estimates and remain subject to acceptance, route, availability and transaction controls.'}</p>
          <div className="featureGrid">
            <label style={{display:'flex',gap:10,alignItems:'center'}}><input name="supportsExpress1_3h" type="checkbox" defaultChecked={provider.supports_express_1_3h}/><span><strong>{es?'Entrega 1–3 horas':'1–3 hour delivery'}</strong></span></label>
            <label>{es?'Recargo 1–3 horas':'1–3 hour surcharge'}<input name="express1_3hSurcharge" type="number" min="0" step="0.01" defaultValue={provider.express_1_3h_surcharge??''} style={{width:'100%',padding:12,marginTop:6}}/></label>
            <label style={{display:'flex',gap:10,alignItems:'center'}}><input name="supportsSameDay" type="checkbox" defaultChecked={provider.supports_same_day}/><span><strong>{es?'Entrega el mismo día':'Same-day delivery'}</strong></span></label>
            <label>{es?'Recargo mismo día':'Same-day surcharge'}<input name="sameDaySurcharge" type="number" min="0" step="0.01" defaultValue={provider.same_day_surcharge??''} style={{width:'100%',padding:12,marginTop:6}}/></label>
            <label>{es?'Hora límite local para mismo día':'Local same-day cutoff'}<input name="sameDayCutoffLocal" type="time" defaultValue={provider.same_day_cutoff_local?.slice(0,5)??''} style={{width:'100%',padding:12,marginTop:6}}/></label>
          </div>
        </div>

        <div className="feature"><span className="eyebrow">{es?'DISPONIBILIDAD':'AVAILABILITY'}</span><h3>{es?'Ayuda al cliente a elegir con confianza':'Help customers choose with confidence'}</h3><div className="featureGrid">
          <label>{es?'ETA mínimo — minutos':'Estimated arrival — minimum minutes'}<input name="etaMinMinutes" type="number" min="0" max="10080" defaultValue={provider.estimated_eta_min_minutes??''} style={{width:'100%',padding:12,marginTop:6}}/></label>
          <label>{es?'ETA máximo — minutos':'Estimated arrival — maximum minutes'}<input name="etaMaxMinutes" type="number" min="0" max="10080" defaultValue={provider.estimated_eta_max_minutes??''} style={{width:'100%',padding:12,marginTop:6}}/></label>
        </div><label style={{display:'flex',gap:10,alignItems:'center',marginTop:12}}><input name="acceptingJobs" type="checkbox" defaultChecked={provider.accepting_jobs}/><span>{es?'Aceptando nuevas solicitudes ahora':'Currently accepting new delivery requests'}</span></label></div>

        <div className="feature"><span className="eyebrow">{es?'UBICACIÓN PÚBLICA APROXIMADA':'PRIVACY-SAFE MAP LOCATION'}</span><h3>{es?'Usa solo un punto de ciudad o zona de servicio':'Use an approximate city or service-zone point only'}</h3><p>{es?'Nunca publiques una dirección residencial o la dirección exacta de un cliente.':'Never enter a home address, customer address or other precise private location.'}</p><div className="featureGrid">
          <label>Latitude<input name="publicLatitude" type="number" min="-90" max="90" step="0.0001" defaultValue={provider.public_latitude??''} placeholder="23.1136" style={{width:'100%',padding:12,marginTop:6}}/></label>
          <label>Longitude<input name="publicLongitude" type="number" min="-180" max="180" step="0.0001" defaultValue={provider.public_longitude??''} placeholder="-82.3666" style={{width:'100%',padding:12,marginTop:6}}/></label>
          <label>{es?'Precisión pública':'Public location precision'}<select name="locationPrecision" defaultValue={provider.location_precision||'CITY'} style={{width:'100%',padding:12,marginTop:6}}><option value="CITY">{es?'Ciudad':'City-level'}</option><option value="ZONE">{es?'Zona':'Service-zone'}</option><option value="APPROXIMATE">{es?'Aproximada':'Approximate'}</option></select></label>
        </div></div>

        <p className="sectionCopy">{es?'Publica solo precios, cobertura aproximada y disponibilidad operacional. No publiques teléfonos privados, direcciones exactas, datos bancarios, credenciales de pago ni información de clientes.':'Post only service pricing, approximate coverage and operational availability. Do not publish phone numbers, exact addresses, bank details, payment credentials or customer information.'}</p>
        <button className="cta premiumCta" type="submit" disabled={busy}>{busy?(es?'Guardando…':'Saving…'):(es?'Publicar oferta de entrega':'Publish Provider Offer')}</button>
        {message&&<p role="status">{message}</p>}
      </form>}
    </section>
  </main>;
}
