'use client';

import {FormEvent,useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
import {localeOf} from '@/lib/i18n';

type Beneficiary={id:string;full_name:string;country_code:string;beneficiary_type:'PERSON'|'BUSINESS'};

export default function StartTransaction(){
  const params=useParams<{locale:string}>();
  const locale=localeOf(params?.locale);
  const [beneficiaries,setBeneficiaries]=useState<Beneficiary[]>([]);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState('');
  const [reference,setReference]=useState('');
  const [busy,setBusy]=useState(false);
  const [beneficiaryId,setBeneficiaryId]=useState('');
  const [newName,setNewName]=useState('');
  const [newCountry,setNewCountry]=useState('CU');

  useEffect(()=>{(async()=>{
    const res=await fetch('/api/beneficiaries',{cache:'no-store'});
    if(res.status===401){window.location.href=`/${locale}/auth`;return;}
    const body=await res.json().catch(()=>({}));
    if(res.ok){setBeneficiaries(body.beneficiaries??[]);setBeneficiaryId(body.beneficiaries?.[0]?.id??'');}
    else setMessage('Unable to load your recipients.');
    setLoading(false);
  })()},[locale]);

  async function addBeneficiary(){
    if(newName.trim().length<2) return setMessage('Enter the receiver name.');
    setBusy(true);setMessage('');
    const res=await fetch('/api/beneficiaries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fullName:newName,countryCode:newCountry,beneficiaryType:'PERSON',deliveryMethod:'PARTNER_NETWORK'})});
    const body=await res.json().catch(()=>({}));
    if(res.ok){setBeneficiaries(v=>[body.beneficiary,...v]);setBeneficiaryId(body.beneficiary.id);setNewName('');setMessage('Receiver added.');}
    else setMessage(body.error??'Unable to add receiver.');
    setBusy(false);
  }

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage('');setReference('');
    const form=new FormData(event.currentTarget);
    const payload={
      beneficiaryId,
      remittanceType:'FAMILY',
      originCountry:String(form.get('originCountry')||'US').toUpperCase(),
      destinationCountry:String(form.get('destinationCountry')||'CU').toUpperCase(),
      sendCurrency:String(form.get('sendCurrency')||'USD').toUpperCase(),
      receiveCurrency:String(form.get('receiveCurrency')||'USD').toUpperCase(),
      sendAmount:Number(form.get('sendAmount')),
      purpose:String(form.get('purpose')||'Family support'),
      sourceOfFunds:String(form.get('sourceOfFunds')||''),
      senderFullName:String(form.get('senderFullName')||''),
      senderPhone:String(form.get('senderPhone')||''),
      senderEmail:String(form.get('senderEmail')||''),
      senderCountryCode:String(form.get('originCountry')||'US').toUpperCase()
    };
    const res=await fetch('/api/remittances',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const body=await res.json().catch(()=>({}));
    if(res.ok){setReference(body.remittance?.reference??'Created');setMessage('Transaction request created and placed into review. No funds have moved yet.');}
    else setMessage(body.error??'Unable to create transaction request.');
    setBusy(false);
  }

  return <main className="shell">
    <nav className="nav"><a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Start a Transaction</small></a><div className="navlinks"><a href={`/${locale}/transactions`}>My Transactions</a><a href={`/${locale}/fees`}>Fees</a><a href={`/${locale}/privacy`}>Privacy</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">FAMILY REMITTANCE</div><h1>Start a family support request in one guided flow.</h1><p className="heroLead">Create or choose your receiver, enter the amount and sender information, then receive a mycubacash transaction reference for review and tracking.</p></div></section>
    <section className="section" style={{maxWidth:900,margin:'0 auto'}}>
      {loading?<p>Loading your account…</p>:<>
      <article className="feature" style={{display:'grid',gap:12,marginBottom:24}}><h2>1. Receiver</h2>
        {beneficiaries.length>0&&<label>Choose receiver<select value={beneficiaryId} onChange={e=>setBeneficiaryId(e.target.value)} style={{width:'100%',padding:12,marginTop:6}}>{beneficiaries.filter(b=>b.beneficiary_type==='PERSON').map(b=><option key={b.id} value={b.id}>{b.full_name} · {b.country_code}</option>)}</select></label>}
        <div className="featureGrid"><label>New receiver name<input value={newName} onChange={e=>setNewName(e.target.value)} style={{width:'100%',padding:12,marginTop:6}}/></label><label>Country<input maxLength={2} value={newCountry} onChange={e=>setNewCountry(e.target.value.toUpperCase())} style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        <button type="button" className="ghost" onClick={addBeneficiary} disabled={busy}>Add receiver</button>
      </article>
      <form onSubmit={submit} className="feature" style={{display:'grid',gap:14}}><h2>2. Transaction details</h2>
        <div className="featureGrid"><label>Your full name<input name="senderFullName" required minLength={2} style={{width:'100%',padding:12,marginTop:6}}/></label><label>Your phone<input name="senderPhone" required minLength={7} style={{width:'100%',padding:12,marginTop:6}}/></label><label>Email<input name="senderEmail" type="email" style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        <div className="featureGrid"><label>Origin country<input name="originCountry" defaultValue="US" maxLength={2} required style={{width:'100%',padding:12,marginTop:6}}/></label><label>Destination country<input name="destinationCountry" defaultValue="CU" maxLength={2} required style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        <div className="featureGrid"><label>Amount<input name="sendAmount" type="number" min="1" step="0.01" required style={{width:'100%',padding:12,marginTop:6}}/></label><label>Send currency<input name="sendCurrency" defaultValue="USD" maxLength={3} required style={{width:'100%',padding:12,marginTop:6}}/></label><label>Receive currency<input name="receiveCurrency" defaultValue="USD" maxLength={3} required style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        <label>Purpose<input name="purpose" defaultValue="Family support" required style={{width:'100%',padding:12,marginTop:6}}/></label><label>Source of funds<input name="sourceOfFunds" placeholder="Salary, savings, business income…" style={{width:'100%',padding:12,marginTop:6}}/></label>
        <button className="cta" disabled={busy||!beneficiaryId}>{busy?'Creating request…':'Create Transaction Request'}</button>
        {message&&<p role="status">{message}</p>}{reference&&<p><strong>Transaction reference:</strong> {reference}</p>}
      </form></>}
      <p className="sectionCopy">Creating a request does not move funds. Transactions remain on hold until the required payment, identity, sanctions, corridor and authorized-provider controls are satisfied.</p>
    </section>
  </main>;
}
