'use client';

import {FormEvent,useState} from 'react';

export default function EvidenceForm({remittanceIntentId}:{remittanceIntentId:string}){
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage('');
    const form=new FormData(event.currentTarget);
    const res=await fetch('/api/transactions/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      action:'EVIDENCE',remittanceIntentId,evidenceType:String(form.get('evidenceType')||'PAYMENT_REFERENCE'),
      evidenceReference:String(form.get('evidenceReference')||''),customerNote:String(form.get('customerNote')||'')
    })});
    const body=await res.json().catch(()=>({}));
    if(res.ok){setMessage('Evidence submitted for trusted review. This does not mark payment or delivery as verified.');event.currentTarget.reset();}
    else setMessage(body.error??'Unable to submit evidence.');
    setBusy(false);
  }
  return <form onSubmit={submit} className="feature" style={{display:'grid',gap:12}}>
    <h2>Submit supporting information</h2>
    <p>Use this to provide a payment reference, receipt note or delivery note. MY CUBA CASH will review it before any trusted status changes.</p>
    <label>Evidence type<select name="evidenceType" defaultValue="PAYMENT_REFERENCE" style={{width:'100%',padding:12,marginTop:6}}><option value="PAYMENT_REFERENCE">Payment reference</option><option value="RECEIPT_NOTE">Receipt note</option><option value="DELIVERY_NOTE">Delivery note</option><option value="OTHER">Other</option></select></label>
    <label>Reference / confirmation<input name="evidenceReference" required minLength={3} maxLength={240} placeholder="Reference number, receipt identifier or delivery note" style={{width:'100%',padding:12,marginTop:6}}/></label>
    <label>Notes<textarea name="customerNote" maxLength={500} style={{width:'100%',padding:12,marginTop:6,minHeight:90}}/></label>
    <button className="cta" disabled={busy}>{busy?'Submitting…':'Submit for Review'}</button>
    {message&&<p role="status">{message}</p>}
  </form>;
}
