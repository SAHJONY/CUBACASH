'use client';

import {useState} from 'react';

type Method={
  id:string;
  method_key:'ZELLE'|'CASH_APP'|'PAYPAL'|'SQUARE';
  display_name:string;
  recipient_identifier:string|null;
  payment_url:string|null;
  instructions:string|null;
  enabled:boolean;
  public_visible:boolean;
  updated_at:string;
};

export default function PaymentMethodSettings({initialMethods,es}:{initialMethods:Method[];es:boolean}){
  const [methods,setMethods]=useState(initialMethods);
  const [saving,setSaving]=useState<string|null>(null);
  const [message,setMessage]=useState('');

  function patchLocal(key:string,patch:Partial<Method>){
    setMethods(current=>current.map(method=>method.method_key===key?{...method,...patch}:method));
  }

  async function save(method:Method){
    setSaving(method.method_key); setMessage('');
    const response=await fetch('/api/platform-payment-methods',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      methodKey:method.method_key,
      recipientIdentifier:method.recipient_identifier??'',
      paymentUrl:method.payment_url??'',
      instructions:method.instructions??'',
      enabled:method.enabled,
      publicVisible:method.public_visible
    })});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok){
      setMessage(es?`No se pudo guardar ${method.display_name}: ${payload.error??'ERROR'}`:`Could not save ${method.display_name}: ${payload.error??'ERROR'}`);
    }else{
      setMethods(current=>current.map(item=>item.method_key===method.method_key?payload.method:item));
      setMessage(es?`${method.display_name} guardado.`:`${method.display_name} saved.`);
    }
    setSaving(null);
  }

  return <div>
    <div className="sectionHead"><div><span className="eyebrow">{es?'MÉTODOS DE COBRO DEL PROPIETARIO':'OWNER COLLECTION METHODS'}</span><h2>{es?'Configura Zelle, Cash App, PayPal y Square':'Configure Zelle, Cash App, PayPal and Square'}</h2></div><p>{es?'Solo tú puedes editar estos destinos. Activa únicamente métodos reales y verificados. La visibilidad pública se controla por separado.':'Only you can edit these destinations. Enable only real verified methods. Public visibility is controlled separately.'}</p></div>
    {message&&<div className="feature premiumCard"><strong>{message}</strong></div>}
    <div className="featureGrid">
      {methods.map(method=><article className="feature premiumCard" key={method.method_key}>
        <div className="eyebrow">{method.method_key.replace('_',' ')}</div>
        <h3>{method.display_name}</h3>
        <label style={{display:'grid',gap:6,margin:'12px 0'}}><span>{es?'Identificador receptor':'Recipient identifier'}</span><input value={method.recipient_identifier??''} onChange={e=>patchLocal(method.method_key,{recipient_identifier:e.target.value})} placeholder={method.method_key==='ZELLE'?(es?'Email o teléfono de Zelle':'Zelle email or phone'):method.method_key==='CASH_APP'?'$Cashtag':es?'Email, usuario o referencia':'Email, user or reference'} /></label>
        <label style={{display:'grid',gap:6,margin:'12px 0'}}><span>{es?'Enlace de pago HTTPS':'HTTPS payment link'}</span><input value={method.payment_url??''} onChange={e=>patchLocal(method.method_key,{payment_url:e.target.value})} placeholder="https://..." /></label>
        <label style={{display:'grid',gap:6,margin:'12px 0'}}><span>{es?'Instrucciones':'Instructions'}</span><textarea value={method.instructions??''} onChange={e=>patchLocal(method.method_key,{instructions:e.target.value})} rows={3} placeholder={es?'Ej.: incluir la referencia de tarifa en la nota del pago.':'Example: include the fee reference in the payment note.'}/></label>
        <label style={{display:'flex',gap:8,alignItems:'center',margin:'10px 0'}}><input type="checkbox" checked={method.enabled} onChange={e=>patchLocal(method.method_key,{enabled:e.target.checked})}/><span>{es?'Método activo':'Method enabled'}</span></label>
        <label style={{display:'flex',gap:8,alignItems:'center',margin:'10px 0'}}><input type="checkbox" checked={method.public_visible} onChange={e=>patchLocal(method.method_key,{public_visible:e.target.checked})}/><span>{es?'Mostrar en la página pública de pagos':'Show on public payments page'}</span></label>
        <div className="actions"><button className="cta premiumCta" type="button" disabled={saving===method.method_key} onClick={()=>save(method)}>{saving===method.method_key?(es?'Guardando…':'Saving…'):(es?'Guardar método':'Save method')}</button></div>
        <div className="featureMeta">{es?'Última actualización':'Last update'}: {new Date(method.updated_at).toLocaleString()}</div>
      </article>)}
    </div>
  </div>;
}
