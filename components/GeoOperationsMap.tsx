'use client';

import {useMemo,useState} from 'react';

export type GeoProvider={
  id:string;
  name:string;
  city?:string|null;
  region?:string|null;
  country?:string|null;
  latitude:number;
  longitude:number;
  precision?:string|null;
  acceptingJobs?:boolean;
  priceLabel?:string|null;
  etaLabel?:string|null;
};

export default function GeoOperationsMap({providers,title='Global delivery coverage'}:{providers:GeoProvider[];title?:string}){
  const visible=useMemo(()=>providers.filter(p=>Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)),[providers]);
  const [selectedId,setSelectedId]=useState<string|null>(visible[0]?.id??null);
  const selected=visible.find(p=>p.id===selectedId)??visible[0]??null;

  return <section className="feature" aria-label={title} style={{overflow:'hidden'}}>
    <div className="sectionHead"><div><span className="eyebrow">PRIVACY-SAFE GEO OPERATIONS</span><h2>{title}</h2></div><p>Map points are provider-posted city, zone or approximate service locations — never private customer or provider addresses.</p></div>
    {!visible.length?<div style={{padding:'28px 0'}}><p>No providers have published an approximate service-map point yet.</p></div>:
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,2fr) minmax(240px,1fr)',gap:18,alignItems:'stretch'}}>
      <div style={{position:'relative',minHeight:420,borderRadius:18,overflow:'hidden',border:'1px solid rgba(255,255,255,.12)',background:'radial-gradient(circle at 50% 45%, rgba(48,124,255,.17), transparent 42%), linear-gradient(180deg,#071427,#040a13)'}}>
        <div aria-hidden="true" style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px)',backgroundSize:'12.5% 16.66%'}}/>
        <div aria-hidden="true" style={{position:'absolute',inset:'8% 5%',border:'1px solid rgba(120,190,255,.25)',borderRadius:'50%',boxShadow:'inset 0 0 70px rgba(31,120,255,.08)'}}/>
        <div aria-hidden="true" style={{position:'absolute',left:'50%',top:'8%',bottom:'8%',width:1,background:'rgba(255,255,255,.12)'}}/>
        <div aria-hidden="true" style={{position:'absolute',top:'50%',left:'5%',right:'5%',height:1,background:'rgba(255,255,255,.12)'}}/>
        {visible.map(provider=>{
          const left=((provider.longitude+180)/360)*100;
          const top=((90-provider.latitude)/180)*100;
          const active=provider.id===selected?.id;
          return <button key={provider.id} onClick={()=>setSelectedId(provider.id)} title={`${provider.name} · ${provider.city??provider.country??'Service area'}`} aria-label={`Select ${provider.name}`} style={{position:'absolute',left:`${left}%`,top:`${top}%`,transform:'translate(-50%,-50%)',width:active?22:16,height:active?22:16,borderRadius:'50%',border:'2px solid white',background:provider.acceptingJobs===false?'#6b7280':'#22c55e',boxShadow:active?'0 0 0 7px rgba(34,197,94,.18),0 0 24px rgba(34,197,94,.8)':'0 0 14px rgba(34,197,94,.55)',cursor:'pointer',zIndex:2}}/>;
        })}
        <div style={{position:'absolute',left:14,bottom:12,fontSize:12,opacity:.68}}>Longitude −180° → +180° · Latitude +90° → −90°</div>
      </div>
      <aside className="feature" style={{margin:0}}>
        {selected&&<><span className="eyebrow">SELECTED PROVIDER</span><h3>{selected.name}</h3><p><strong>Provider ID:</strong> {selected.id}</p><p><strong>Area:</strong> {[selected.city,selected.region,selected.country].filter(Boolean).join(', ')||'Published service point'}</p><p><strong>Map precision:</strong> {selected.precision||'APPROXIMATE'}</p><p><strong>Availability:</strong> {selected.acceptingJobs===false?'Not accepting new jobs':'Accepting requests'}</p>{selected.priceLabel&&<p><strong>Posted pricing:</strong> {selected.priceLabel}</p>}{selected.etaLabel&&<p><strong>Estimated arrival:</strong> {selected.etaLabel}</p>}<div className="featureMeta">Approximate operational coverage only</div></>}
      </aside>
    </div>}
  </section>;
}
