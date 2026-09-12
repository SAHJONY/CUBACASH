'use client';

import {useState} from 'react';

type FeeItem={
  id:string;
  entity_type:string;
  entity_id:string;
  fee_amount:number|string;
  fee_currency:string;
  fee_status:string;
  customer_business_id:string|null;
  created_at:string;
};

export default function ManualPaymentReview({items,es}:{items:FeeItem[];es:boolean}){
  const [rows,setRows]=useState(items);
  const [busy,setBusy]=useState<string|null>(null);
  const [messages,setMessages]=useState<Record<string,string>>({});

  async function confirm(item:FeeItem,form:HTMLFormElement){
    const data=new FormData(form);
    const paymentReference=String(data.get('paymentReference')??'').trim();
    const paymentMethod=String(data.get('paymentMethod')??'').trim();
    const notes=String(data.get('notes')??'').trim();
    if(paymentReference.length<3){
      setMessages(m=>({...m,[item.id]:es?'Añade una referencia de pago válida.':'Add a valid payment reference.'}));
      return;
    }
    setBusy(item.id);
    setMessages(m=>({...m,[item.id]:''}));
    try{
      const res=await fetch('/api/platform-fees/manual-confirm',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({entityType:item.entity_type,entityId:item.entity_id,paymentReference,paymentMethod,notes})
      });
      const body=await res.json();
      if(!res.ok) throw new Error(body.error||'CONFIRMATION_FAILED');
      setRows(current=>current.filter(row=>row.id!==item.id));
      setMessages(m=>({...m,[item.id]:es?'Pago confirmado y tarifa liberada.':'Payment confirmed and fee gate cleared.'}));
    }catch(error){
      setMessages(m=>({...m,[item.id]:`${es?'No se pudo confirmar':'Unable to confirm'}: ${error instanceof Error?error.message:'ERROR'}`}));
    }finally{
      setBusy(null);
    }
  }

  if(rows.length===0){
    return <div className="feature premiumCard"><h3>{es?'No hay tarifas pendientes':'No pending fees'}</h3><p>{es?'Todas las tarifas visibles están pagadas, exentas o no requieren revisión manual.':'All visible fees are paid, waived, or do not require manual review.'}</p></div>;
  }

  return <div className="featureGrid">{rows.map(item=><article className="feature premiumCard" key={item.id}>
    <div className="eyebrow">{item.entity_type}</div>
    <h3>{Number(item.fee_amount).toFixed(2)} {item.fee_currency}</h3>
    <p><strong>{es?'Entidad':'Entity'}:</strong> {item.entity_id}</p>
    <p><strong>{es?'Estado':'Status'}:</strong> {item.fee_status}</p>
    <p><strong>{es?'Creada':'Created'}:</strong> {new Date(item.created_at).toLocaleString()}</p>
    <form onSubmit={(event)=>{event.preventDefault();void confirm(item,event.currentTarget);}} style={{display:'grid',gap:10,marginTop:14}}>
      <label>{es?'Método de pago':'Payment method'}<select name="paymentMethod" defaultValue="CASH" required><option value="CASH">Cash</option><option value="BANK_TRANSFER">Bank transfer</option><option value="ACH">ACH</option><option value="WIRE">Wire</option><option value="CARD">Card</option><option value="OTHER">Other</option></select></label>
      <label>{es?'Referencia / recibo':'Reference / receipt'}<input name="paymentReference" maxLength={160} required placeholder={es?'Ej. recibo, referencia bancaria':'e.g. receipt or bank reference'}/></label>
      <label>{es?'Notas de revisión':'Review notes'}<textarea name="notes" maxLength={500} rows={3} placeholder={es?'Opcional: evidencia revisada, ubicación, observación':'Optional: reviewed evidence, location, note'}/></label>
      <button className="cta premiumCta" disabled={busy===item.id} type="submit">{busy===item.id?(es?'Confirmando…':'Confirming…'):(es?'Confirmar pago manual':'Confirm manual payment')}</button>
    </form>
    {messages[item.id]&&<p className="featureMeta" style={{marginTop:10}}>{messages[item.id]}</p>}
  </article>)}</div>;
}
