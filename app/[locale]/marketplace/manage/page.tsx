'use client';

import {FormEvent,useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import {localeOf} from '@/lib/i18n';

type Business={id:string;legal_name:string;trade_name:string|null;country_code:string;business_type:string;kyb_status:string;sanctions_status:string;risk_band:string};
type Offer={id:string;business_id:string;offer_type:'BUY'|'SELL'|'SERVICE';title:string;description:string|null;category:string|null;quantity:number|null;unit:string|null;currency:string;target_price:number|null;origin_country:string|null;destination_country:string|null;status:string;visibility:string;created_at:string;updated_at:string};

export default function MarketplaceManage(){
  const params=useParams<{locale:string}>();
  const locale=localeOf(params?.locale);
  const es=locale==='es';
  const [businesses,setBusinesses]=useState<Business[]>([]);
  const [offers,setOffers]=useState<Offer[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');

  async function load(){
    const res=await fetch('/api/marketplace/context',{cache:'no-store'});
    if(res.status===401){window.location.href=`/${locale}/auth`;return;}
    const body=await res.json().catch(()=>({}));
    if(res.ok){setBusinesses(body.businesses??[]);setOffers(body.offers??[]);} else setMessage(es?'No pudimos cargar tu espacio de marketplace.':'Unable to load marketplace workspace.');
    setLoading(false);
  }

  useEffect(()=>{load()},[]);
  const businessMap=useMemo(()=>Object.fromEntries(businesses.map(b=>[b.id,b.trade_name||b.legal_name])),[businesses]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage('');
    const form=new FormData(event.currentTarget);
    const payload={
      businessId:String(form.get('businessId')||''),offerType:String(form.get('offerType')||''),title:String(form.get('title')||''),description:String(form.get('description')||''),category:String(form.get('category')||''),quantity:String(form.get('quantity')||'')||null,unit:String(form.get('unit')||''),currency:String(form.get('currency')||'USD'),targetPrice:String(form.get('targetPrice')||'')||null,originCountry:String(form.get('originCountry')||''),destinationCountry:String(form.get('destinationCountry')||''),visibility:String(form.get('visibility')||'NETWORK')
    };
    const res=await fetch('/api/marketplace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const body=await res.json().catch(()=>({}));
    if(res.ok){setMessage(es?'Oferta guardada como borrador. No será pública hasta que pase la revisión de la plataforma.':'Offer saved as draft. It will not appear publicly until platform review and publication.');(event.currentTarget as HTMLFormElement).reset();await load();}
    else setMessage(body.error==='MARKETPLACE_CREATE_FAILED'?(es?'No pudimos crear la oferta. Confirma que seleccionaste un negocio que te pertenece.':'Offer could not be created. Confirm you selected a business you own.'):(body.error??(es?'No pudimos crear la oferta.':'Unable to create offer.')));
    setBusy(false);
  }

  return <main className="shell">
    <nav className="nav"><a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>{es?'Espacio de Marketplace':'Marketplace Workspace'}</small></a><div className="navlinks"><a href={`/${locale}/marketplace`}>{es?'Explorar':'Browse Marketplace'}</a><a href={`/${locale}/delivery-providers`}>{es?'Entrega':'Delivery'}</a><a href={`/${locale}/transactions`}>{es?'Transacciones':'Transactions'}</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">PRIVATE-SECTOR COMMERCE</div><h1>{es?'Publica demanda, ofertas y servicios desde un solo espacio comercial.':'Create demand, offers and services from one business workspace.'}</h1><p className="heroLead">{es?'Cada publicación comienza como borrador. La visibilidad pública requiere revisión, por lo que datos de contacto y afirmaciones no revisadas no se exponen automáticamente.':'Every new listing starts as a draft. Public visibility requires platform review, so contact details and unreviewed claims are not exposed automatically.'}</p></div></section>
    <section className="section" style={{maxWidth:1000,margin:'0 auto'}}>
      {loading?<p>{es?'Cargando tu espacio comercial…':'Loading marketplace workspace…'}</p>:!businesses.length?<div className="feature"><h2>{es?'Necesitas un perfil de negocio':'Business profile required'}</h2><p>{es?'Necesitas un perfil comercial de mycubacash antes de publicar actividad. Sofia puede ayudarte con el onboarding.':'You need a mycubacash business profile before publishing marketplace activity. Sofia can help complete onboarding.'}</p><div className="actions"><a className="cta" href={`/${locale}/marketplace`}>{es?'Volver al Marketplace':'Back to Marketplace'}</a></div></div>:
      <form className="feature" onSubmit={submit} style={{display:'grid',gap:16}}>
        <div><span className="eyebrow">{es?'NUEVA OFERTA':'NEW MARKETPLACE OFFER'}</span><h2>{es?'Publica una solicitud de compra, una venta o un servicio':'Post a buy request, sale offer or service'}</h2></div>
        <label>{es?'Negocio':'Business'}<select name="businessId" required style={{width:'100%',padding:12,marginTop:6}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.trade_name||b.legal_name} · {b.country_code}</option>)}</select></label>
        <div className="featureGrid"><label>{es?'Tipo de oferta':'Offer type'}<select name="offerType" required style={{width:'100%',padding:12,marginTop:6}}><option value="BUY">{es?'Quiero comprar':'I want to buy'}</option><option value="SELL">{es?'Quiero vender':'I want to sell'}</option><option value="SERVICE">{es?'Ofrezco un servicio':'I offer a service'}</option></select></label><label>{es?'Visibilidad':'Visibility'}<select name="visibility" defaultValue="NETWORK" style={{width:'100%',padding:12,marginTop:6}}><option value="NETWORK">{es?'Red mycubacash':'mycubacash network'}</option><option value="PUBLIC">{es?'Público después de revisión':'Public after review'}</option></select></label></div>
        <label>{es?'Título':'Title'}<input name="title" minLength={3} maxLength={180} required placeholder={es?'Ejemplo: Necesito 200 kg de arroz empacado en La Habana':'Example: Need 200 kg of packaged rice in Havana'} style={{width:'100%',padding:12,marginTop:6}}/></label>
        <label>{es?'Descripción':'Description'}<textarea name="description" maxLength={2000} placeholder={es?'Describe producto, servicio, calidad, tiempo y requisitos comerciales importantes.':'Describe the product, service, quality, timing and any important commercial requirements.'} style={{width:'100%',padding:12,marginTop:6,minHeight:120}}/></label>
        <div className="featureGrid"><label>{es?'Categoría':'Category'}<input name="category" maxLength={120} placeholder={es?'Alimentos, logística, reparaciones…':'Food, logistics, repairs…'} style={{width:'100%',padding:12,marginTop:6}}/></label><label>{es?'Cantidad':'Quantity'}<input name="quantity" type="number" min="0" step="any" style={{width:'100%',padding:12,marginTop:6}}/></label><label>{es?'Unidad':'Unit'}<input name="unit" maxLength={40} placeholder="kg, unit, trip…" style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        <div className="featureGrid"><label>{es?'Moneda':'Currency'}<input name="currency" defaultValue="USD" maxLength={3} required style={{width:'100%',padding:12,marginTop:6}}/></label><label>{es?'Precio objetivo / solicitado':'Target / asking price'}<input name="targetPrice" type="number" min="0" step="0.01" style={{width:'100%',padding:12,marginTop:6}}/></label><label>{es?'País de origen':'Origin country'}<input name="originCountry" maxLength={2} placeholder="CU" style={{width:'100%',padding:12,marginTop:6}}/></label><label>{es?'País destino':'Destination country'}<input name="destinationCountry" maxLength={2} placeholder="CU" style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        <p className="sectionCopy">{es?'No publiques teléfonos, datos bancarios, contraseñas, documentos de identidad ni credenciales de pago. El matching y la coordinación permanecen dentro de mycubacash y Sofia.':'Do not place phone numbers, bank information, passwords, identity documents or payment credentials in public offer text. Matching and transaction coordination remain inside mycubacash and Sofia.'}</p>
        <button className="cta" type="submit" disabled={busy}>{busy?(es?'Guardando…':'Saving…'):(es?'Guardar oferta':'Save Marketplace Offer')}</button>{message&&<p role="status">{message}</p>}
      </form>}
    </section>
    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'MIS OFERTAS':'MY OFFERS'}</span><h2>{es?'Borradores y actividad publicada':'Draft and published activity'}</h2></div><p>{es?'El estado lo controla el flujo de la plataforma. Un borrador nunca se presenta como oportunidad pública verificada.':'Status is controlled by the platform workflow. A draft is never presented as a verified public opportunity.'}</p></div>{!offers.length?<p>{es?'Todavía no tienes ofertas.':'No marketplace offers yet.'}</p>:<div className="featureGrid">{offers.map(o=><article className="feature" key={o.id}><div className="icon">{o.offer_type==='BUY'?'B':o.offer_type==='SELL'?'S':'SV'}</div><h3>{o.title}</h3><p><strong>{es?'Negocio':'Business'}:</strong> {businessMap[o.business_id]||'My business'}</p>{o.category&&<p><strong>{es?'Categoría':'Category'}:</strong> {o.category}</p>}{o.target_price!==null&&<p><strong>{es?'Precio':'Target / asking'}:</strong> {o.target_price} {o.currency}</p>}<p><strong>{es?'Visibilidad':'Visibility'}:</strong> {o.visibility}</p><div className="featureMeta">{o.status} · {new Date(o.updated_at).toLocaleString()}</div></article>)}</div>}</section>
  </main>;
}
