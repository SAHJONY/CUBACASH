'use client';

import {FormEvent,useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import {localeOf} from '@/lib/i18n';

type Beneficiary={id:string;full_name:string;country_code:string;beneficiary_type:'PERSON'|'BUSINESS'};
type DeliveryOption={
  public_provider_id:string;display_name:string;city:string|null;region:string|null;country_code:string;service_zones:string[]|null;service_area:string|null;
  transport_mode:string|null;pricing_model:string|null;fee_currency:string|null;base_fee:number|null;per_km_fee:number|null;minimum_fee:number|null;maximum_fee:number|null;
  pricing_notes:string|null;estimated_eta_min_minutes:number|null;estimated_eta_max_minutes:number|null;starting_fee:number|null;zone_match:boolean;badges:string[];
};

export default function StartTransaction(){
  const params=useParams<{locale:string}>();
  const locale=localeOf(params?.locale);
  const es=locale==='es';
  const [beneficiaries,setBeneficiaries]=useState<Beneficiary[]>([]);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState('');
  const [reference,setReference]=useState('');
  const [createdId,setCreatedId]=useState('');
  const [busy,setBusy]=useState(false);
  const [beneficiaryId,setBeneficiaryId]=useState('');
  const [newName,setNewName]=useState('');
  const [newCountry,setNewCountry]=useState('CU');
  const [amount,setAmount]=useState('');
  const [deliveryRequested,setDeliveryRequested]=useState(false);
  const [destinationZone,setDestinationZone]=useState('');
  const [deliveryOptions,setDeliveryOptions]=useState<DeliveryOption[]>([]);
  const [deliveryLoading,setDeliveryLoading]=useState(false);
  const [selectedProvider,setSelectedProvider]=useState('');
  const [selectionMessage,setSelectionMessage]=useState('');
  const fee=useMemo(()=>{const n=Number(amount);if(!Number.isFinite(n)||n<=0)return null;return Math.min(12,Math.max(1,Math.round(n*0.0125*100)/100))},[amount]);

  useEffect(()=>{(async()=>{
    const res=await fetch('/api/beneficiaries',{cache:'no-store'});
    if(res.status===401){window.location.href=`/${locale}/auth`;return;}
    const body=await res.json().catch(()=>({}));
    if(res.ok){setBeneficiaries(body.beneficiaries??[]);setBeneficiaryId(body.beneficiaries?.[0]?.id??'');}
    else setMessage(es?'No pudimos cargar tus receptores.':'Unable to load your recipients.');
    setLoading(false);
  })()},[locale,es]);

  async function addBeneficiary(){
    if(newName.trim().length<2) return setMessage(es?'Escribe el nombre del receptor.':'Enter the receiver name.');
    setBusy(true);setMessage('');
    const res=await fetch('/api/beneficiaries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fullName:newName,countryCode:newCountry,beneficiaryType:'PERSON',deliveryMethod:'PARTNER_NETWORK'})});
    const body=await res.json().catch(()=>({}));
    if(res.ok){setBeneficiaries(v=>[body.beneficiary,...v]);setBeneficiaryId(body.beneficiary.id);setNewName('');setMessage(es?'Receptor agregado.':'Receiver added.');}
    else setMessage(body.error??(es?'No pudimos agregar el receptor.':'Unable to add receiver.'));
    setBusy(false);
  }

  async function loadDeliveryOptions(country:string,zone:string){
    setDeliveryLoading(true);setDeliveryOptions([]);setSelectionMessage('');
    const qs=new URLSearchParams({country,zone});
    const res=await fetch(`/api/delivery/options?${qs.toString()}`,{cache:'no-store'});
    const body=await res.json().catch(()=>({}));
    if(res.ok) setDeliveryOptions(body.options??[]);
    else setSelectionMessage(es?'No encontramos opciones de entrega disponibles ahora mismo. Sofia puede ayudarte.':'No delivery options are available right now. Sofia can help.');
    setDeliveryLoading(false);
  }

  async function selectDelivery(option:DeliveryOption){
    if(!createdId) return;
    setSelectedProvider(option.public_provider_id);setSelectionMessage(es?'Solicitando esta opción…':'Requesting this option…');
    const res=await fetch('/api/delivery/options',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({remittanceIntentId:createdId,publicProviderId:option.public_provider_id})});
    const body=await res.json().catch(()=>({}));
    if(res.ok) setSelectionMessage(es?`Elegiste ${option.display_name}. La solicitud quedó enviada; la asignación final depende de confirmación del proveedor.`:`You chose ${option.display_name}. The request was sent; final assignment depends on provider confirmation.`);
    else {setSelectedProvider('');setSelectionMessage(body.error??(es?'No pudimos guardar tu selección.':'Unable to save your selection.'));}
  }

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage('');setReference('');setCreatedId('');setDeliveryOptions([]);setSelectedProvider('');setSelectionMessage('');
    const form=new FormData(event.currentTarget);
    const destinationCountry=String(form.get('destinationCountry')||'CU').toUpperCase();
    const notes=String(form.get('customerNotes')||'').trim();
    const combinedNotes=deliveryRequested&&destinationZone.trim()?`${notes}${notes?' · ':''}Zona de entrega: ${destinationZone.trim()}`:notes;
    const payload={
      beneficiaryId,remittanceType:'FAMILY',
      originCountry:String(form.get('originCountry')||'US').toUpperCase(),destinationCountry,
      sendCurrency:String(form.get('sendCurrency')||'USD').toUpperCase(),receiveCurrency:String(form.get('receiveCurrency')||'USD').toUpperCase(),
      sendAmount:Number(form.get('sendAmount')),purpose:String(form.get('purpose')||'Family support'),sourceOfFunds:String(form.get('sourceOfFunds')||''),
      senderFullName:String(form.get('senderFullName')||''),senderPhone:String(form.get('senderPhone')||''),senderEmail:String(form.get('senderEmail')||''),
      senderCountryCode:String(form.get('originCountry')||'US').toUpperCase()
    };
    const res=await fetch('/api/remittances',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const body=await res.json().catch(()=>({}));
    if(!res.ok){setMessage(body.error??(es?'No pudimos crear la solicitud.':'Unable to create transaction request.'));setBusy(false);return;}

    const intentId=body.remittance?.id as string|undefined;
    const ref=body.remittance?.reference??(es?'Creada':'Created');
    if(intentId){
      await fetch('/api/transactions/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        action:'PREFERENCE',remittanceIntentId:intentId,paymentPreference:String(form.get('paymentPreference')||'UNDECIDED'),
        requestedFulfillment:String(form.get('requestedFulfillment')||'CASH'),deliveryRequested,
        customerNotes:combinedNotes
      })});
      setCreatedId(intentId);
      if(deliveryRequested) await loadDeliveryOptions(destinationCountry,destinationZone);
    }
    setReference(ref);setMessage(es?'Envío publicado correctamente. Guarda tu referencia y, si pediste entrega, elige abajo la opción que prefieras. Todavía no se han movido fondos.':'Request posted successfully. Save your reference and, if delivery was requested, choose your preferred option below. No funds have moved yet.');setBusy(false);
  }

  const badge=(value:string)=>value==='RECOMMENDED'?(es?'Recomendado':'Recommended'):value==='LOWEST_STARTING_FEE'?(es?'Mejor precio inicial':'Lowest starting fee'):value==='FASTEST_ETA'?(es?'Más rápido':'Fastest'):value;

  return <main className="shell premiumAppShell">
    <nav className="nav premiumNav"><a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash</div><small>{es?'Publicar un envío':'Post a delivery'}</small></a><div className="navlinks"><a href={`/${locale}/transactions`}>{es?'Mis transacciones':'My Transactions'}</a><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a><a href={`/${locale}/privacy`}>{es?'Privacidad':'Privacy'}</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">{es?'ENVÍO FAMILIAR':'FAMILY REMITTANCE'}</div><h1>{es?'Publica tu envío. Compara opciones. Tú decides.':'Post your request. Compare options. You decide.'}</h1><p className="heroLead">{es?'Crea el envío una sola vez. Si necesitas entrega, mycubacash te muestra varias opciones verificadas para comparar precio inicial, tiempo estimado, cobertura y tipo de transporte antes de elegir.':'Create the request once. If delivery is needed, mycubacash shows multiple verified options so you can compare starting price, ETA, coverage and transport before choosing.'}</p></div></section>
    <section className="section" style={{maxWidth:980,margin:'0 auto'}}>
      {loading?<p>{es?'Cargando tu cuenta…':'Loading your account…'}</p>:<>
      <article className="feature" style={{display:'grid',gap:12,marginBottom:24}}><h2>{es?'1. Receptor':'1. Receiver'}</h2>
        {beneficiaries.length>0&&<label>{es?'Elige el receptor':'Choose receiver'}<select value={beneficiaryId} onChange={e=>setBeneficiaryId(e.target.value)} style={{width:'100%',padding:12,marginTop:6}}>{beneficiaries.filter(b=>b.beneficiary_type==='PERSON').map(b=><option key={b.id} value={b.id}>{b.full_name} · {b.country_code}</option>)}</select></label>}
        <div className="featureGrid"><label>{es?'Nuevo receptor':'New receiver'}<input value={newName} onChange={e=>setNewName(e.target.value)} style={{width:'100%',padding:12,marginTop:6}}/></label><label>{es?'País':'Country'}<input maxLength={2} value={newCountry} onChange={e=>setNewCountry(e.target.value.toUpperCase())} style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        <button type="button" className="ghost" onClick={addBeneficiary} disabled={busy}>{es?'Agregar receptor':'Add receiver'}</button>
      </article>
      <form onSubmit={submit} className="feature" style={{display:'grid',gap:14}}><h2>{es?'2. Remitente y monto':'2. Sender and amount'}</h2>
        <div className="featureGrid"><label>{es?'Tu nombre completo':'Your full name'}<input name="senderFullName" required minLength={2} style={{width:'100%',padding:12,marginTop:6}}/></label><label>{es?'Tu teléfono':'Your phone'}<input name="senderPhone" required minLength={7} style={{width:'100%',padding:12,marginTop:6}}/></label><label>Email<input name="senderEmail" type="email" style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        <div className="featureGrid"><label>{es?'País de origen':'Origin country'}<input name="originCountry" defaultValue="US" maxLength={2} required style={{width:'100%',padding:12,marginTop:6}}/></label><label>{es?'País de destino':'Destination country'}<input name="destinationCountry" defaultValue="CU" maxLength={2} required style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        <div className="featureGrid"><label>{es?'Monto':'Amount'}<input name="sendAmount" value={amount} onChange={e=>setAmount(e.target.value)} type="number" min="1" step="0.01" required style={{width:'100%',padding:12,marginTop:6}}/></label><label>{es?'Moneda de envío':'Send currency'}<input name="sendCurrency" defaultValue="USD" maxLength={3} required style={{width:'100%',padding:12,marginTop:6}}/></label><label>{es?'Moneda de recepción':'Receive currency'}<input name="receiveCurrency" defaultValue="USD" maxLength={3} required style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        {fee!==null&&<p><strong>{es?'Tarifa estimada de plataforma familiar mycubacash:':'Estimated mycubacash family platform fee:'}</strong> ${fee.toFixed(2)} USD. {es?'Cargos separados de settlement, FX o entrega pueden aplicar y deben mostrarse antes del compromiso.':'Separate settlement, FX or delivery charges may apply and must be disclosed before commitment.'}</p>}
        <h2>{es?'3. Cómo quieres que reciba el valor':'3. How should the receiver receive value?'}</h2>
        <div className="featureGrid"><label>{es?'Entrega del valor':'Fulfillment'}<select name="requestedFulfillment" defaultValue="CASH" style={{width:'100%',padding:12,marginTop:6}}><option value="CASH">{es?'Efectivo':'Cash'}</option><option value="PRODUCTS">{es?'Productos':'Products'}</option><option value="SERVICES">{es?'Servicios':'Services'}</option><option value="SPLIT">{es?'Combinado':'Split'}</option></select></label><label>{es?'Preferencia de pago':'Payment preference'}<select name="paymentPreference" defaultValue="UNDECIDED" style={{width:'100%',padding:12,marginTop:6}}><option value="UNDECIDED">{es?'Decidir con Sofia':'Decide with Sofia'}</option><option value="CASH">Cash</option><option value="ZELLE">Zelle</option><option value="CASH_APP">Cash App</option><option value="OTHER">{es?'Otro':'Other'}</option></select></label></div>
        <label className="deliveryToggle"><input checked={deliveryRequested} onChange={e=>setDeliveryRequested(e.target.checked)} type="checkbox"/> {es?'Quiero comparar servicios de entrega':'I want to compare delivery services'}</label>
        {deliveryRequested&&<label>{es?'Ciudad / municipio / zona de entrega':'Delivery city / municipality / zone'}<input value={destinationZone} onChange={e=>setDestinationZone(e.target.value)} required placeholder={es?'Ej. La Habana, Vedado, Santiago…':'e.g. Havana, Vedado, Santiago…'} style={{width:'100%',padding:12,marginTop:6}}/></label>}
        <label>{es?'Propósito':'Purpose'}<input name="purpose" defaultValue={es?'Apoyo familiar':'Family support'} required style={{width:'100%',padding:12,marginTop:6}}/></label><label>{es?'Origen de fondos':'Source of funds'}<input name="sourceOfFunds" placeholder={es?'Salario, ahorros, ingreso de negocio…':'Salary, savings, business income…'} style={{width:'100%',padding:12,marginTop:6}}/></label><label>{es?'Notas':'Notes'}<textarea name="customerNotes" maxLength={500} placeholder={es?'Instrucciones para el receptor, detalles del envío u otra información útil':'Receiver instructions, shipment details or other useful information'} style={{width:'100%',padding:12,marginTop:6,minHeight:90}}/></label>
        <label><input type="checkbox" required/> {es?'Confirmo que la información es correcta y acepto los':'I confirm the information is accurate and I agree to the'} <a href={`/${locale}/terms`}>{es?'Términos':'Terms'}</a> {es?'y el':'and'} <a href={`/${locale}/privacy`}>{es?'Aviso de Privacidad':'Privacy Notice'}</a>.</label>
        <button className="cta premiumCta" disabled={busy||!beneficiaryId}>{busy?(es?'Publicando envío…':'Posting request…'):(es?'Publicar envío':'Post Request')}</button>
        {message&&<p role="status">{message}</p>}{reference&&<div className="feature premiumCard"><h3>{es?'Referencia de transacción':'Transaction reference'}</h3><p><strong>{reference}</strong></p><p>{es?'Guárdala. Une el envío, la selección de entrega y el seguimiento.':'Save it. It connects the request, delivery choice and tracking.'}</p></div>}
      </form></>}

      {createdId&&deliveryRequested&&<section style={{marginTop:30}}>
        <div className="sectionHead"><div><span className="eyebrow">{es?'ELIGE TU ENTREGA':'CHOOSE YOUR DELIVERY'}</span><h2>{es?'Varias opciones. Una decisión tuya.':'Multiple options. Your choice.'}</h2></div><p>{es?'Compara proveedores verificados como en una app de movilidad: precio inicial, ETA, cobertura y transporte. La selección es una solicitud; el proveedor debe confirmar antes de quedar asignado.':'Compare verified providers like a mobility app: starting price, ETA, coverage and transport. Your selection is a request; the provider must confirm before assignment.'}</p></div>
        {deliveryLoading?<div className="feature premiumCard"><h3>{es?'Buscando las mejores opciones…':'Finding the best options…'}</h3></div>:deliveryOptions.length===0?<div className="feature premiumCard"><h3>{es?'Sin opciones automáticas por ahora':'No automatic options right now'}</h3><p>{es?'Tu envío ya está publicado. Sofia puede ayudarte a coordinar manualmente un proveedor.':'Your request is already posted. Sofia can help coordinate a provider manually.'}</p></div>:<div className="deliveryChoiceGrid">{deliveryOptions.map((o,index)=><article className={`feature premiumCard deliveryChoiceCard ${selectedProvider===o.public_provider_id?'selectedDelivery':''}`} key={o.public_provider_id}>
          <div className="deliveryChoiceTop"><div><span className="eyebrow">{index===0?(es?'MEJOR OPCIÓN':'BEST MATCH'):(es?'OPCIÓN':'OPTION')} {index+1}</span><h3>{o.display_name}</h3></div><div className="deliveryEta">{o.estimated_eta_min_minutes!=null?`${o.estimated_eta_min_minutes}${o.estimated_eta_max_minutes?`–${o.estimated_eta_max_minutes}`:''} min`:'ETA —'}</div></div>
          <div className="deliveryBadges">{o.badges?.map(b=><span key={b}>{badge(b)}</span>)}</div>
          <div className="deliveryMetrics"><div><span>{es?'Desde':'From'}</span><strong>{o.starting_fee!=null?`${o.starting_fee.toFixed(2)} ${o.fee_currency||''}`:(es?'Cotización':'Quote')}</strong></div><div><span>{es?'Transporte':'Transport'}</span><strong>{o.transport_mode||'—'}</strong></div><div><span>{es?'Zona':'Area'}</span><strong>{o.city||o.region||o.service_area||'—'}</strong></div></div>
          {o.pricing_notes&&<p>{o.pricing_notes}</p>}
          <button type="button" className={selectedProvider===o.public_provider_id?'cta premiumCta':'glassCta'} onClick={()=>selectDelivery(o)}>{selectedProvider===o.public_provider_id?(es?'Seleccionado':'Selected'):(es?'Elegir esta opción':'Choose this option')}</button>
        </article>)}</div>}
        {selectionMessage&&<p role="status" style={{marginTop:16}}>{selectionMessage}</p>}
      </section>}

      <p className="sectionCopy" style={{marginTop:28}}>{es?'Publicar un envío no mueve fondos. Elegir un servicio de entrega tampoco significa aceptación final. La transacción permanece sujeta a los controles requeridos de identidad, sanciones, pago, corredor y proveedor autorizado.':'Posting a request does not move funds. Choosing a delivery service also does not mean final acceptance. The transaction remains subject to required identity, sanctions, payment, corridor and authorized-provider controls.'}</p>
    </section>
  </main>;
}
