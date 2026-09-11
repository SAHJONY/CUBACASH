'use client';

import {FormEvent,useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import {localeOf} from '@/lib/i18n';

type Business={id:string;legal_name:string;trade_name:string|null;country_code:string;business_type:string;kyb_status:string;sanctions_status:string;risk_band:string};
type Offer={id:string;business_id:string;offer_type:'BUY'|'SELL'|'SERVICE';title:string;description:string|null;category:string|null;quantity:number|null;unit:string|null;currency:string;target_price:number|null;origin_country:string|null;destination_country:string|null;status:string;visibility:string;created_at:string;updated_at:string};

export default function MarketplaceManage(){
  const params=useParams<{locale:string}>();
  const locale=localeOf(params?.locale);
  const [businesses,setBusinesses]=useState<Business[]>([]);
  const [offers,setOffers]=useState<Offer[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');

  async function load(){
    const res=await fetch('/api/marketplace/context',{cache:'no-store'});
    if(res.status===401){window.location.href=`/${locale}/auth`;return;}
    const body=await res.json().catch(()=>({}));
    if(res.ok){setBusinesses(body.businesses??[]);setOffers(body.offers??[]);} else setMessage('Unable to load marketplace workspace.');
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
    if(res.ok){setMessage('Offer saved as draft. It will not appear publicly until platform review and publication.');(event.currentTarget as HTMLFormElement).reset();await load();}
    else setMessage(body.error==='MARKETPLACE_CREATE_FAILED'?'Offer could not be created. Confirm you selected a business you own.':body.error??'Unable to create offer.');
    setBusy(false);
  }

  return <main className="shell">
    <nav className="nav"><a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Marketplace Workspace</small></a><div className="navlinks"><a href={`/${locale}/marketplace`}>Browse Marketplace</a><a href={`/${locale}/delivery-providers`}>Delivery</a><a href={`/${locale}/transactions`}>Transactions</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">PRIVATE-SECTOR COMMERCE</div><h1>Create demand, offers and services from one business workspace.</h1><p className="heroLead">Every new listing starts as a draft. Public visibility requires platform review, so contact details and unreviewed claims are not exposed automatically.</p></div></section>
    <section className="section" style={{maxWidth:1000,margin:'0 auto'}}>
      {loading?<p>Loading marketplace workspace…</p>:!businesses.length?<div className="feature"><h2>Business profile required</h2><p>You need a mycubacash business profile before publishing marketplace activity. Sofia can help complete onboarding.</p><div className="actions"><a className="cta" href={`/${locale}/marketplace`}>Back to Marketplace</a></div></div>:
      <form className="feature" onSubmit={submit} style={{display:'grid',gap:16}}>
        <div><span className="eyebrow">NEW MARKETPLACE OFFER</span><h2>Post a buy request, sale offer or service</h2></div>
        <label>Business<select name="businessId" required style={{width:'100%',padding:12,marginTop:6}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.trade_name||b.legal_name} · {b.country_code}</option>)}</select></label>
        <div className="featureGrid"><label>Offer type<select name="offerType" required style={{width:'100%',padding:12,marginTop:6}}><option value="BUY">I want to buy</option><option value="SELL">I want to sell</option><option value="SERVICE">I offer a service</option></select></label><label>Visibility<select name="visibility" defaultValue="NETWORK" style={{width:'100%',padding:12,marginTop:6}}><option value="NETWORK">mycubacash network</option><option value="PUBLIC">Public after review</option></select></label></div>
        <label>Title<input name="title" minLength={3} maxLength={180} required placeholder="Example: Need 200 kg of packaged rice in Havana" style={{width:'100%',padding:12,marginTop:6}}/></label>
        <label>Description<textarea name="description" maxLength={2000} placeholder="Describe the product, service, quality, timing and any important commercial requirements." style={{width:'100%',padding:12,marginTop:6,minHeight:120}}/></label>
        <div className="featureGrid"><label>Category<input name="category" maxLength={120} placeholder="Food, logistics, repairs…" style={{width:'100%',padding:12,marginTop:6}}/></label><label>Quantity<input name="quantity" type="number" min="0" step="any" style={{width:'100%',padding:12,marginTop:6}}/></label><label>Unit<input name="unit" maxLength={40} placeholder="kg, unit, trip…" style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        <div className="featureGrid"><label>Currency<input name="currency" defaultValue="USD" maxLength={3} required style={{width:'100%',padding:12,marginTop:6}}/></label><label>Target / asking price<input name="targetPrice" type="number" min="0" step="0.01" style={{width:'100%',padding:12,marginTop:6}}/></label><label>Origin country<input name="originCountry" maxLength={2} placeholder="CU" style={{width:'100%',padding:12,marginTop:6}}/></label><label>Destination country<input name="destinationCountry" maxLength={2} placeholder="CU" style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        <p className="sectionCopy">Do not place phone numbers, bank information, passwords, identity documents or payment credentials in public offer text. Matching and transaction coordination remain inside mycubacash and Sofia.</p>
        <button className="cta" type="submit" disabled={busy}>{busy?'Saving…':'Save Marketplace Offer'}</button>{message&&<p role="status">{message}</p>}
      </form>}
    </section>
    <section className="section"><div className="sectionHead"><div><span className="eyebrow">MY OFFERS</span><h2>Draft and published activity</h2></div><p>Status is controlled by the platform workflow. A draft is never presented as a verified public opportunity.</p></div>{!offers.length?<p>No marketplace offers yet.</p>:<div className="featureGrid">{offers.map(o=><article className="feature" key={o.id}><div className="icon">{o.offer_type==='BUY'?'B':o.offer_type==='SELL'?'S':'SV'}</div><h3>{o.title}</h3><p><strong>Business:</strong> {businessMap[o.business_id]||'My business'}</p>{o.category&&<p><strong>Category:</strong> {o.category}</p>}{o.target_price!==null&&<p><strong>Target / asking:</strong> {o.target_price} {o.currency}</p>}<p><strong>Visibility:</strong> {o.visibility}</p><div className="featureMeta">{o.status} · {new Date(o.updated_at).toLocaleString()}</div></article>)}</div>}</section>
  </main>;
}
