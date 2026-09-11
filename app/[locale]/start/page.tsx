'use client';

import {FormEvent,useEffect,useMemo,useState} from 'react';
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
  const [createdId,setCreatedId]=useState('');
  const [busy,setBusy]=useState(false);
  const [beneficiaryId,setBeneficiaryId]=useState('');
  const [newName,setNewName]=useState('');
  const [newCountry,setNewCountry]=useState('CU');
  const [amount,setAmount]=useState('');
  const fee=useMemo(()=>{const n=Number(amount);if(!Number.isFinite(n)||n<=0)return null;return Math.min(12,Math.max(1,Math.round(n*0.0125*100)/100))},[amount]);

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
    event.preventDefault();setBusy(true);setMessage('');setReference('');setCreatedId('');
    const form=new FormData(event.currentTarget);
    const payload={
      beneficiaryId,remittanceType:'FAMILY',
      originCountry:String(form.get('originCountry')||'US').toUpperCase(),destinationCountry:String(form.get('destinationCountry')||'CU').toUpperCase(),
      sendCurrency:String(form.get('sendCurrency')||'USD').toUpperCase(),receiveCurrency:String(form.get('receiveCurrency')||'USD').toUpperCase(),
      sendAmount:Number(form.get('sendAmount')),purpose:String(form.get('purpose')||'Family support'),sourceOfFunds:String(form.get('sourceOfFunds')||''),
      senderFullName:String(form.get('senderFullName')||''),senderPhone:String(form.get('senderPhone')||''),senderEmail:String(form.get('senderEmail')||''),
      senderCountryCode:String(form.get('originCountry')||'US').toUpperCase()
    };
    const res=await fetch('/api/remittances',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const body=await res.json().catch(()=>({}));
    if(!res.ok){setMessage(body.error??'Unable to create transaction request.');setBusy(false);return;}

    const intentId=body.remittance?.id as string|undefined;
    const ref=body.remittance?.reference??'Created';
    if(intentId){
      await fetch('/api/transactions/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        action:'PREFERENCE',remittanceIntentId:intentId,paymentPreference:String(form.get('paymentPreference')||'UNDECIDED'),
        requestedFulfillment:String(form.get('requestedFulfillment')||'CASH'),deliveryRequested:form.get('deliveryRequested')==='on',
        customerNotes:String(form.get('customerNotes')||'')
      })});
      setCreatedId(intentId);
    }
    setReference(ref);setMessage('Request created. Keep this reference and follow the status in My Transactions. No funds have moved yet.');setBusy(false);
  }

  return <main className="shell">
    <nav className="nav"><a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Start a Transaction</small></a><div className="navlinks"><a href={`/${locale}/transactions`}>My Transactions</a><a href={`/${locale}/fees`}>Fees</a><a href={`/${locale}/privacy`}>Privacy</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">FAMILY REMITTANCE</div><h1>Start, review and track your family support request.</h1><p className="heroLead">Choose the receiver, amount, fulfillment and payment preference. mycubacash creates a traceable transaction reference and keeps the request on hold until required checks are satisfied.</p></div></section>
    <section className="section" style={{maxWidth:920,margin:'0 auto'}}>
      {loading?<p>Loading your account…</p>:<>
      <article className="feature" style={{display:'grid',gap:12,marginBottom:24}}><h2>1. Receiver</h2>
        {beneficiaries.length>0&&<label>Choose receiver<select value={beneficiaryId} onChange={e=>setBeneficiaryId(e.target.value)} style={{width:'100%',padding:12,marginTop:6}}>{beneficiaries.filter(b=>b.beneficiary_type==='PERSON').map(b=><option key={b.id} value={b.id}>{b.full_name} · {b.country_code}</option>)}</select></label>}
        <div className="featureGrid"><label>New receiver name<input value={newName} onChange={e=>setNewName(e.target.value)} style={{width:'100%',padding:12,marginTop:6}}/></label><label>Country<input maxLength={2} value={newCountry} onChange={e=>setNewCountry(e.target.value.toUpperCase())} style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        <button type="button" className="ghost" onClick={addBeneficiary} disabled={busy}>Add receiver</button>
      </article>
      <form onSubmit={submit} className="feature" style={{display:'grid',gap:14}}><h2>2. Sender and amount</h2>
        <div className="featureGrid"><label>Your full name<input name="senderFullName" required minLength={2} style={{width:'100%',padding:12,marginTop:6}}/></label><label>Your phone<input name="senderPhone" required minLength={7} style={{width:'100%',padding:12,marginTop:6}}/></label><label>Email<input name="senderEmail" type="email" style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        <div className="featureGrid"><label>Origin country<input name="originCountry" defaultValue="US" maxLength={2} required style={{width:'100%',padding:12,marginTop:6}}/></label><label>Destination country<input name="destinationCountry" defaultValue="CU" maxLength={2} required style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        <div className="featureGrid"><label>Amount<input name="sendAmount" value={amount} onChange={e=>setAmount(e.target.value)} type="number" min="1" step="0.01" required style={{width:'100%',padding:12,marginTop:6}}/></label><label>Send currency<input name="sendCurrency" defaultValue="USD" maxLength={3} required style={{width:'100%',padding:12,marginTop:6}}/></label><label>Receive currency<input name="receiveCurrency" defaultValue="USD" maxLength={3} required style={{width:'100%',padding:12,marginTop:6}}/></label></div>
        {fee!==null&&<p><strong>Estimated mycubacash family platform fee:</strong> ${fee.toFixed(2)} USD. Separate settlement, FX or delivery charges may apply and must be disclosed before commitment.</p>}
        <h2>3. How should the receiver receive value?</h2>
        <div className="featureGrid"><label>Fulfillment<select name="requestedFulfillment" defaultValue="CASH" style={{width:'100%',padding:12,marginTop:6}}><option value="CASH">Cash</option><option value="PRODUCTS">Products</option><option value="SERVICES">Services</option><option value="SPLIT">Split</option></select></label><label>Payment preference<select name="paymentPreference" defaultValue="UNDECIDED" style={{width:'100%',padding:12,marginTop:6}}><option value="UNDECIDED">Decide with Sofia</option><option value="CASH">Cash</option><option value="ZELLE">Zelle</option><option value="CASH_APP">Cash App</option><option value="OTHER">Other</option></select></label></div>
        <label><input name="deliveryRequested" type="checkbox"/> Delivery coordination requested</label>
        <label>Purpose<input name="purpose" defaultValue="Family support" required style={{width:'100%',padding:12,marginTop:6}}/></label><label>Source of funds<input name="sourceOfFunds" placeholder="Salary, savings, business income…" style={{width:'100%',padding:12,marginTop:6}}/></label><label>Notes<textarea name="customerNotes" maxLength={500} placeholder="Receiver instructions, preferred city/zone, product request or other details" style={{width:'100%',padding:12,marginTop:6,minHeight:90}}/></label>
        <label><input type="checkbox" required/> I confirm the information is accurate and I agree to the <a href={`/${locale}/terms`}>Terms</a> and <a href={`/${locale}/privacy`}>Privacy Notice</a>.</label>
        <button className="cta" disabled={busy||!beneficiaryId}>{busy?'Creating request…':'Create Transaction Request'}</button>
        {message&&<p role="status">{message}</p>}{reference&&<div className="feature"><h3>Transaction reference</h3><p><strong>{reference}</strong></p><p>Save this reference. You can now track review, payment evidence and fulfillment status.</p><div className="actions"><a className="cta" href={`/${locale}/transactions`}>Track Transaction</a>{createdId&&<a className="ghost" href={`/${locale}/transactions/${reference}`}>Open Details</a>}</div></div>}
      </form></>}
      <p className="sectionCopy">Creating a request does not move funds. Customer-selected payment methods and submitted references are not treated as verified payment. Transactions remain on hold until the required identity, sanctions, payment, corridor and authorized-provider controls are satisfied.</p>
    </section>
  </main>;
}
