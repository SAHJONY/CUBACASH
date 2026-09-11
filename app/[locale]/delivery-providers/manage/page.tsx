'use client';

import {FormEvent,useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
import {localeOf} from '@/lib/i18n';

type Provider={
  public_provider_id:string|null; display_name:string; profile_status:string; public_listing_enabled:boolean;
  pricing_model:'FLAT'|'PER_DISTANCE'|'HYBRID'|'QUOTE'; fee_currency:string;
  base_fee:number|null; per_km_fee:number|null; minimum_fee:number|null; maximum_fee:number|null;
  pricing_notes:string|null; pricing_updated_at:string|null;
};

export default function ManageDeliveryPricing(){
  const params=useParams<{locale:string}>();
  const locale=localeOf(params?.locale);
  const [provider,setProvider]=useState<Provider|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');

  useEffect(()=>{(async()=>{
    const res=await fetch('/api/delivery-provider-pricing',{cache:'no-store'});
    if(res.status===401){window.location.href=`/${locale}/auth`;return;}
    const body=await res.json().catch(()=>({}));
    if(res.ok) setProvider(body.provider);
    else setMessage(body.error==='DELIVERY_PROVIDER_PROFILE_REQUIRED'?'A delivery-provider profile is required before posting prices. Contact Sofia to complete onboarding.':'Unable to load your delivery pricing profile.');
    setLoading(false);
  })()},[locale]);

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
      pricingNotes:String(form.get('pricingNotes')||'')
    };
    const res=await fetch('/api/delivery-provider-pricing',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const body=await res.json().catch(()=>({}));
    if(res.ok){setProvider(body.provider);setMessage('Your delivery prices were updated. Verified public listings will show the new rates to customers.');}
    else setMessage(body.error??'Unable to update pricing.');
    setBusy(false);
  }

  return <main className="shell">
    <nav className="nav"><a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Provider Pricing</small></a><div className="navlinks"><a href={`/${locale}/delivery-providers`}>Public Directory</a><a href={`/${locale}/transactions`}>Transactions</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">DELIVERY PROVIDER PRICING</div><h1>Post clear delivery charges and compete on value.</h1><p className="heroLead">Publish a base fee, distance rate, minimum/maximum charge and pricing notes so customers can compare verified providers before requesting delivery.</p></div></section>
    <section className="section" style={{maxWidth:900,margin:'0 auto'}}>
      {loading?<p>Loading your provider profile…</p>:!provider?<div className="feature"><h2>Provider onboarding required</h2><p>{message}</p><div className="actions"><a className="cta" href={`/${locale}/delivery-providers`}>Delivery Network</a></div></div>:
      <form className="feature" onSubmit={submit} style={{display:'grid',gap:16}}>
        <div><span className="eyebrow">{provider.public_provider_id??'PROVIDER'}</span><h2>{provider.display_name}</h2><p>Status: <strong>{provider.profile_status}</strong> · Public listing: <strong>{provider.public_listing_enabled?'Enabled':'Disabled'}</strong></p></div>
        <div className="featureGrid">
          <label>Pricing model<select name="pricingModel" defaultValue={provider.pricing_model} style={{width:'100%',padding:12,marginTop:6}}><option value="FLAT">Flat rate</option><option value="PER_DISTANCE">Per distance</option><option value="HYBRID">Base + distance</option><option value="QUOTE">Quote required</option></select></label>
          <label>Currency<input name="feeCurrency" defaultValue={provider.fee_currency||'USD'} maxLength={3} required style={{width:'100%',padding:12,marginTop:6}}/></label>
        </div>
        <div className="featureGrid">
          <label>Base / starting fee<input name="baseFee" type="number" min="0" step="0.01" defaultValue={provider.base_fee??''} style={{width:'100%',padding:12,marginTop:6}}/></label>
          <label>Fee per kilometer<input name="perKmFee" type="number" min="0" step="0.01" defaultValue={provider.per_km_fee??''} style={{width:'100%',padding:12,marginTop:6}}/></label>
          <label>Minimum charge<input name="minimumFee" type="number" min="0" step="0.01" defaultValue={provider.minimum_fee??''} style={{width:'100%',padding:12,marginTop:6}}/></label>
          <label>Maximum charge<input name="maximumFee" type="number" min="0" step="0.01" defaultValue={provider.maximum_fee??''} style={{width:'100%',padding:12,marginTop:6}}/></label>
        </div>
        <label>Pricing notes<textarea name="pricingNotes" maxLength={500} defaultValue={provider.pricing_notes??''} placeholder="Example: Base fee covers first 5 km. Extra stops +$2 each. Large/heavy items quoted separately." style={{width:'100%',padding:12,marginTop:6,minHeight:110}}/></label>
        <p className="sectionCopy">Post only service pricing and conditions. Do not publish phone numbers, exact addresses, bank details, payment credentials or other private information here.</p>
        <button className="cta" type="submit" disabled={busy}>{busy?'Saving…':'Publish Delivery Pricing'}</button>
        {message&&<p role="status">{message}</p>}
      </form>}
    </section>
  </main>;
}
