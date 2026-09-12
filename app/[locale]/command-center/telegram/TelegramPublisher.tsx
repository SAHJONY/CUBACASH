'use client';

import {useEffect,useState} from 'react';

type Status={configured?:boolean;reachable?:boolean;botUsername?:string;chatTitle?:string;chatUsername?:string;chatType?:string;error?:string};

const presets={
  bienvenida:'Bienvenido al canal oficial de mycubacash. Aquí compartimos novedades de la plataforma, marketplace, servicios locales, entregas y recursos para familias y negocios del sector privado cubano. Visita https://mycubacash.com',
  familia:'¿Tienes familia en Cuba? mycubacash te ayuda a coordinar solicitudes, servicios locales, entregas y seguimiento con más claridad. Empieza en https://mycubacash.com',
  negocios:'Impulsa tu negocio en Cuba. Compra, vende y ofrece servicios dentro de una red privada con más orden, visibilidad y confianza. Descubre https://mycubacash.com',
  servicios:'Servicios y entregas con confianza. Compara opciones, elige proveedores y da seguimiento a cada operación desde https://mycubacash.com',
  sofia:'Sofia te guía en cada paso. Inicia tu solicitud, compara opciones y recibe seguimiento desde un solo lugar: https://mycubacash.com'
};

export default function TelegramPublisher({es}:{es:boolean}){
  const [status,setStatus]=useState<Status>({});
  const [text,setText]=useState(presets.bienvenida);
  const [imageUrl,setImageUrl]=useState('');
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState('');

  async function refresh(){
    const res=await fetch('/api/telegram',{cache:'no-store'});
    const data=await res.json();
    setStatus(data);
  }

  useEffect(()=>{void refresh();},[]);

  async function publish(){
    setBusy(true);setResult('');
    try{
      const res=await fetch('/api/telegram',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,imageUrl:imageUrl||undefined,buttonUrl:'https://mycubacash.com',buttonText:es?'Abrir mycubacash':'Open mycubacash'})});
      const data=await res.json();
      if(!res.ok||!data.ok) setResult(`${es?'Error':'Error'}: ${data.error||res.status}`);
      else setResult(es?`Publicado correctamente · mensaje ${data.messageId??''}`:`Published successfully · message ${data.messageId??''}`);
    }catch{setResult(es?'No se pudo conectar con el publicador.':'Unable to reach publisher.');}
    finally{setBusy(false);}
  }

  return <div className="featureGrid">
    <article className="feature premiumCard">
      <div className="eyebrow">{es?'CONEXIÓN':'CONNECTION'}</div>
      <h3>{status.reachable?(es?'Telegram conectado':'Telegram connected'):(es?'Telegram no conectado':'Telegram not connected')}</h3>
      <p><strong>{es?'Configurado':'Configured'}:</strong> {status.configured?'YES':'NO'}</p>
      {status.botUsername&&<p><strong>Bot:</strong> @{status.botUsername}</p>}
      {status.chatTitle&&<p><strong>{es?'Canal':'Channel'}:</strong> {status.chatTitle}{status.chatUsername?` · @${status.chatUsername}`:''}</p>}
      {status.error&&<p><strong>{es?'Estado':'Status'}:</strong> {status.error}</p>}
      <button className="ghost" type="button" onClick={()=>void refresh()}>{es?'Verificar conexión':'Check connection'}</button>
    </article>

    <article className="feature premiumCard" style={{gridColumn:'span 2'}}>
      <div className="eyebrow">{es?'PUBLICADOR':'PUBLISHER'}</div>
      <h3>{es?'Publicar en el canal oficial':'Publish to the official channel'}</h3>
      <div className="actions" style={{flexWrap:'wrap'}}>
        {Object.entries(presets).map(([key,value])=><button key={key} className="ghost" type="button" onClick={()=>setText(value)}>{key}</button>)}
      </div>
      <label style={{display:'grid',gap:8,marginTop:18}}><span>{es?'Mensaje':'Message'}</span><textarea value={text} onChange={e=>setText(e.target.value)} rows={8} maxLength={imageUrl?1024:4096} style={{width:'100%',padding:14,borderRadius:14}}/></label>
      <label style={{display:'grid',gap:8,marginTop:14}}><span>{es?'URL HTTPS de imagen opcional':'Optional HTTPS image URL'}</span><input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://..." style={{width:'100%',padding:14,borderRadius:14}}/></label>
      <p className="featureMeta">{text.length}/{imageUrl?1024:4096}</p>
      <div className="actions"><button className="cta premiumCta" type="button" disabled={busy||!status.reachable||!text.trim()} onClick={()=>void publish()}>{busy?(es?'Publicando…':'Publishing…'):(es?'Publicar ahora':'Publish now')}</button></div>
      {result&&<p><strong>{result}</strong></p>}
    </article>
  </div>;
}
