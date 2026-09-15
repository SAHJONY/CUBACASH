'use client';

import {useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import {localeOf} from '@/lib/i18n';

export default function MembershipReview(){
  const params=useParams<{locale:string}>();
  const locale=localeOf(params?.locale);
  const es=locale==='es';
  const [data,setData]=useState<any>({items:[],profiles:[],businesses:[]});
  const [message,setMessage]=useState('');

  async function load(){
    const res=await fetch('/api/providers/membership-review',{cache:'no-store'});
    if(res.status===401){
      location.href=`/${locale}/auth?next=/${locale}/command-center/provider-memberships`;
      return;
    }
    setData(await res.json().catch(()=>({items:[]})));
  }
  useEffect(()=>{void load()},[]);

  const profiles=useMemo(
    ()=>new Map<string,any>((data.profiles??[]).map((x:any)=>[x.user_id,x])),
    [data.profiles]
  );
  const businesses=useMemo(
    ()=>new Map<string,any>((data.businesses??[]).map((x:any)=>[x.id,x])),
    [data.businesses]
  );

  async function decide(userId:string,decision:'APPROVE'|'REJECT'|'SUSPEND'){
    const note=prompt(es?'Nota de revisión / evidencia (recomendado):':'Review/evidence note (recommended):')||'';
    const res=await fetch('/api/providers/membership-review',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId,decision,note})
    });
    const body=await res.json().catch(()=>({}));
    setMessage(res.ok?(es?'Decisión guardada.':'Decision saved.'):(body.error??'Error'));
    if(res.ok) await load();
  }

  const items=data.items??[];
  return <main className="shell premiumAppShell">
    <nav className="nav premiumNav">
      <a href={`/${locale}/command-center`} className="brandwrap">
        <div className="brand">MY CUBA CASH</div>
        <small>{es?'Membresías de proveedor':'Provider memberships'}</small>
      </a>
    </nav>
    <section className="section">
      <div className="sectionHead">
        <div><span className="eyebrow">{es?'RED GLOBAL':'GLOBAL NETWORK'}</span><h1>{es?'Revisión de suscripción e identidad':'Membership and identity review'}</h1></div>
        <p>{es?'Aprobar significa que revisaste la identidad del proveedor para la red MY CUBA CASH. No autoriza transmisión de dinero ni otras actividades financieras reguladas.':'Approval means you reviewed provider identity for the MY CUBA CASH network. It does not authorize money transmission or other regulated financial activity.'}</p>
      </div>
      {!items.length?<div className="feature premiumCard"><h3>{es?'Sin solicitudes':'No applications'}</h3></div>:
      <div className="featureGrid">{items.map((membership:any)=>{
        const provider=profiles.get(membership.user_id)??{};
        const business=businesses.get(membership.business_id)??{};
        return <article className="feature premiumCard" key={membership.user_id}>
          <span className="eyebrow">{membership.status} · {membership.identity_status}</span>
          <h3>{provider.display_name||business.trade_name||business.legal_name||membership.user_id}</h3>
          <p><strong>{es?'País':'Country'}:</strong> {provider.country_code||business.country_code||'—'}</p>
          <p><strong>ID:</strong> {provider.public_provider_id||'—'}</p>
          <p><strong>{es?'Registro':'Registration'}:</strong> {business.registration_number||'—'}</p>
          <p><strong>{es?'Perfil':'Profile'}:</strong> {provider.profile_status||'—'}</p>
          <div className="actions">
            <button className="cta" onClick={()=>decide(membership.user_id,'APPROVE')}>{es?'Verificar + activar':'Verify + activate'}</button>
            <button className="ghost" onClick={()=>decide(membership.user_id,'REJECT')}>{es?'Rechazar':'Reject'}</button>
            <button className="ghost" onClick={()=>decide(membership.user_id,'SUSPEND')}>{es?'Suspender':'Suspend'}</button>
          </div>
        </article>;
      })}</div>}
      {message&&<p role="status">{message}</p>}
    </section>
  </main>;
}
