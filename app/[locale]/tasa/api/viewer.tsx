'use client';
import { useEffect, useState } from 'react';

function highlight(json:string){
  const esc = json.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return esc.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?/g,(m)=>{
    let cls = 'tok-num';
    if(/^"/.test(m)) cls = /:$/.test(m) ? 'tok-key' : 'tok-str';
    else if(/true|false/.test(m)) cls = 'tok-bool';
    else if(/null/.test(m)) cls = 'tok-null';
    return `<span class="${cls}">${m}</span>`;
  });
}

export default function ApiViewer({ es }:{ es:boolean }){
  const [data, setData] = useState<string>('');
  const [copied, setCopied] = useState(false);
  useEffect(()=>{
    fetch('/api/fx').then(r=>r.json()).then(j=>setData(JSON.stringify(j,null,2))).catch(()=>setData(''));
  },[]);
  const copy = async ()=>{
    try{ await navigator.clipboard.writeText(data); setCopied(true); setTimeout(()=>setCopied(false),1800); }catch{}
  };
  return <div>
    <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
      <code style={{background:'#04060d',border:'1px solid rgba(255,255,255,.12)',borderRadius:8,padding:'6px 12px',color:'#7df0c0'}}>https://mycubacash.com/api/fx</code>
      <button onClick={copy} style={{background:'rgba(216,184,74,.12)',border:'1px solid rgba(216,184,74,.4)',color:'#f0d98a',borderRadius:10,padding:'8px 18px',cursor:'pointer',fontWeight:700}}>
        {copied ? (es?'¡Copiado!':'Copied!') : (es?'Copiar JSON':'Copy JSON')}
      </button>
    </div>
    <pre className="tasaJsonView" dangerouslySetInnerHTML={{__html: data ? highlight(data) : (es?'Cargando…':'Loading…')}} />
    <style>{`.tasaJsonView{background:#04060d;border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:22px;overflow:auto;font-size:.82rem;line-height:1.6;color:#c3cad8;max-height:70vh}
    .tok-key{color:#f0d98a}.tok-str{color:#7df0c0}.tok-num{color:#a5b4fc}.tok-bool{color:#f472b6}.tok-null{color:#6b7280}`}</style>
  </div>;
}
