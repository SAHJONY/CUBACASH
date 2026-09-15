'use client';
import {useState} from 'react';

export default function BillingPortalButton({locale}:{locale:string}){
  const es=locale==='es';const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  async function open(){setBusy(true);setMessage('');const res=await fetch('/api/billing/portal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale})});const body=await res.json().catch(()=>({}));if(res.ok&&body.url){location.href=body.url;return}setMessage(es?'No se pudo abrir el portal de facturación.':'Unable to open the billing portal.');setBusy(false)}
  return <><button className="ghost" type="button" disabled={busy} onClick={open}>{busy?(es?'Abriendo…':'Opening…'):(es?'Administrar facturación':'Manage billing')}</button>{message&&<p role="status" className="checkoutMessage">{message}</p>}</>;
}
