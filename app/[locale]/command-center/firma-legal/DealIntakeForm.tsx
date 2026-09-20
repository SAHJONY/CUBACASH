'use client';
import {useState} from 'react';

// Owner-only deal-advisory intake form. Submissions are stored locally in the
// repo (legal/deal-intakes/) and are NEVER sent anywhere.
export default function DealIntakeForm({es}:{es:boolean}){
  const [dealType,setDealType]=useState('ALIANZA');
  const [counterparty,setCounterparty]=useState('');
  const [jurisdiction,setJurisdiction]=useState('');
  const [amountApprox,setAmountApprox]=useState('');
  const [description,setDescription]=useState('');
  const [questions,setQuestions]=useState('');
  const [urgency,setUrgency]=useState('NORMAL');
  const [state,setState]=useState<'idle'|'sending'|'done'|'error'>('idle');
  const [message,setMessage]=useState('');

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    setState('sending');setMessage('');
    try{
      const res=await fetch('/api/legal/deal-intake',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dealType,counterparty,jurisdiction,amountApprox,description,questions,urgency})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error??'FAILED');
      setState('done');
      setMessage(`${es?'Guardado localmente con referencia':'Saved locally with reference'}: ${data.reference}`);
      setCounterparty('');setJurisdiction('');setAmountApprox('');setDescription('');setQuestions('');setDealType('ALIANZA');setUrgency('NORMAL');
    }catch{setState('error');setMessage(es?'No se pudo guardar la solicitud. Inténtalo de nuevo.':'Could not save the intake. Try again.');}
  };

  const field={display:'grid',gap:6,margin:'12px 0'} as const;
  return <form onSubmit={submit}>
    <div style={{display:'grid',gap:12,gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'}}>
      <label style={field}>{es?'Tipo de trato':'Deal type'}
        <select value={dealType} onChange={(e)=>setDealType(e.target.value)} required>
          {['ALIANZA','PROVEEDOR','INVERSION','COMPRA','VENTA','SERVICIO','OTRO'].map((t)=><option key={t} value={t}>{t}</option>)}
        </select></label>
      <label style={field}>{es?'Contraparte (opcional)':'Counterparty (optional)'}
        <input value={counterparty} onChange={(e)=>setCounterparty(e.target.value)} maxLength={200} placeholder={es?'Nombre de la otra parte':'Other party name'}/></label>
      <label style={field}>{es?'Jurisdicción (opcional)':'Jurisdiction (optional)'}
        <input value={jurisdiction} onChange={(e)=>setJurisdiction(e.target.value)} maxLength={120} placeholder={es?'Ej.: Texas, EE. UU.':'e.g., Texas, USA'}/></label>
      <label style={field}>{es?'Monto aproximado (opcional)':'Approx. amount (optional)'}
        <input value={amountApprox} onChange={(e)=>setAmountApprox(e.target.value)} maxLength={120} placeholder={es?'Ej.: $50,000':'e.g., $50,000'}/></label>
      <label style={field}>{es?'Urgencia':'Urgency'}
        <select value={urgency} onChange={(e)=>setUrgency(e.target.value)} required>
          {['NORMAL','PRONTO','URGENTE'].map((u)=><option key={u} value={u}>{u}</option>)}
        </select></label>
    </div>
    <label style={field}>{es?'Descripción del trato *':'Deal description *'}
      <textarea value={description} onChange={(e)=>setDescription(e.target.value)} required minLength={20} maxLength={5000} rows={5} placeholder={es?'Describe el trato, alianza o asociación antes de comprometerte…':'Describe the deal, alliance or partnership before committing…'}/></label>
    <label style={field}>{es?'Preguntas legales específicas (opcional)':'Specific legal questions (optional)'}
      <textarea value={questions} onChange={(e)=>setQuestions(e.target.value)} maxLength={3000} rows={3} placeholder={es?'Ej.: ¿qué riesgos veo antes de firmar?':'e.g., what risks should I see before signing?'}/></label>
    <p className="featureMeta">{es?'Se guarda localmente en el repositorio (legal/deal-intakes/). No se envía a nadie — ni correo, ni WhatsApp, ni autoridades.':'Saved locally in the repository (legal/deal-intakes/). Sent to no one — not email, not WhatsApp, not any authority.'}</p>
    <p className="featureMeta"><strong>{es?'Investigación legal con IA — no es asesoría legal':'AI legal research — not legal advice'}</strong></p>
    <div className="actions"><button className="cta premiumCta" type="submit" disabled={state==='sending'}>{state==='sending'?(es?'Guardando…':'Saving…'):(es?'Enviar a revisión interna':'Submit for internal review')}</button></div>
    {message&&<p style={{marginTop:12,color:state==='done'?'var(--ok,#2e7d32)':'inherit'}}>{message}</p>}
  </form>;
}
