'use client';

import {FormEvent,useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
import {localeOf} from '@/lib/i18n';

type ProgramStatus={available:boolean;total?:number;awarded?:number;remaining?:number;open?:boolean};

export default function ProviderJoin(){
  const params=useParams<{locale:string}>();
  const locale=localeOf(params?.locale);
  const es=locale==='es';
  const [state,setState]=useState<any>(null);
  const [authenticated,setAuthenticated]=useState<boolean|null>(null);
  const [program,setProgram]=useState<ProgramStatus>({available:false});
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function load(){
    const [account,status]=await Promise.all([
      fetch('/api/providers/join',{cache:'no-store'}),
      fetch('/api/providers/founding-status',{cache:'no-store'})
    ]);
    setProgram(await status.json().catch(()=>({available:false})));
    if(account.status===401){setAuthenticated(false);return;}
    setAuthenticated(true);
    setState(await account.json().catch(()=>({})));
  }

  useEffect(()=>{void load()},[]);

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMsg('');
    const f=new FormData(e.currentTarget);
    const payload={legalName:f.get('legalName'),tradeName:f.get('tradeName'),displayName:f.get('displayName'),countryCode:f.get('countryCode'),businessType:f.get('businessType'),registrationNumber:f.get('registrationNumber'),phone:f.get('phone'),city:f.get('city'),region:f.get('region'),serviceArea:f.get('serviceArea'),acceptedProviderAgreement:f.get('accepted')==='on'};
    const r=await fetch('/api/providers/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const body=await r.json().catch(()=>({}));
    setMsg(r.ok?(es?'Solicitud recibida. La plaza fundadora se asigna al completar la verificación, si todavía está disponible.':'Application received. A founding spot is awarded after verification if one is still available.'):(body.error??'Error'));
    if(r.ok) await load();
    setBusy(false);
  }

  const membership=state?.membership;
  const remaining=program.available?program.remaining:null;
  const applicationOpen=program.available?Boolean(program.open):true;
  const authHref=`/${locale}/auth?next=/${locale}/providers/join`;

  return <main className="shell premiumAppShell">
    <nav className="nav premiumNav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>Founding 100 Suppliers</small></a>
      <div className="navlinks"><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/business-pricing`}>{es?'Planes':'Plans'}</a><a href={`/${locale}/catalog`}>{es?'Catálogo':'Catalog'}</a><a href={`/${locale}/delivery-providers`}>{es?'Proveedores':'Providers'}</a></div>
    </nav>

    <section className="foundingHero">
      <div className="foundingHeroCopy">
        <span className="eyebrow">{es?'PROGRAMA DE LANZAMIENTO':'LAUNCH PROGRAM'}</span>
        <h1>{es?'Conviértete en uno de nuestros 100 proveedores fundadores.':'Become one of our first 100 founding suppliers.'}</h1>
        <p className="heroLead">{es?'Doce meses sin mensualidad. Perfil premium, catálogo y acceso al marketplace desde una identidad comercial verificada.':'Twelve months with no subscription fee. Premium profile, catalog and marketplace access through a verified business identity.'}</p>
        <div className="foundingCounter" aria-live="polite"><strong>{remaining===null?'—':remaining}</strong><span>{remaining===null?(es?'Cupos verificados: consultando disponibilidad':'Verified spots: checking availability'):(es?'plazas verificadas disponibles':'verified spots remaining')}</span></div>
        <div className="actions"><a className="cta premiumCta" href={authenticated?'#apply':authHref}>{authenticated?(es?'Completar solicitud':'Complete application'):(es?'Crear cuenta y solicitar':'Create account and apply')}</a><a className="glassCta" href="#benefits">{es?'Ver beneficios':'View benefits'}</a></div>
        <p className="foundingFinePrint">{es?'Solicitar no reserva una plaza. El cupo se asigna por orden de verificación y activación. Una empresa por plaza.':'Applying does not reserve a spot. Spots are awarded in verified activation order. One spot per business.'}</p>
      </div>
      <img className="foundingPoster" src={es?'/social/founding-100-cuba-es.jpg':'/social/founding-100-worldwide-en.jpg'} alt={es?'Programa Fundadores 100 para proveedores en Cuba':'Founding 100 Suppliers program worldwide'}/>
    </section>

    <section className="section" id="benefits">
      <div className="sectionHead"><div><span className="eyebrow">FOUNDING 100</span><h2>{es?'Beneficios que premian a quienes construyen la red primero.':'Benefits for the suppliers who build the network first.'}</h2></div><p>{es?'La oferta comienza cuando MY CUBA CASH verifica y activa la membresía. No concede autorización para servicios financieros regulados.':'The offer starts when MY CUBA CASH verifies and activates the membership. It does not authorize regulated financial services.'}</p></div>
      <div className="foundingBenefits">
        <article className="feature premiumCard"><span className="foundingBenefitNumber">01</span><h3>{es?'$0 por 12 meses':'$0 for 12 months'}</h3><p>{es?'Sin mensualidad desde la fecha de activación verificada. Servicios comerciales opcionales pueden tener cargos separados.':'No subscription fee from verified activation. Optional trade services may carry separate charges.'}</p></article>
        <article className="feature premiumCard"><span className="foundingBenefitNumber">02</span><h3>{es?'25% de descuento permanente':'25% lifetime discount'}</h3><p>{es?'Después del periodo gratis, conservas 25% de descuento sobre la mensualidad vigente del plan elegible.':'After the free period, keep 25% off the then-current eligible subscription price.'}</p></article>
        <article className="feature premiumCard"><span className="foundingBenefitNumber">03</span><h3>{es?'Perfil + catálogo':'Profile + catalog'}</h3><p>{es?'Publica productos, servicios, cobertura, condiciones y precios después de la revisión correspondiente.':'Publish products, services, coverage, terms and prices after the applicable review.'}</p></article>
        <article className="feature premiumCard"><span className="foundingBenefitNumber">04</span><h3>{es?'Insignia fundadora':'Founding badge'}</h3><p>{es?'Tu condición de proveedor fundador aparece en el directorio público mientras tu membresía y verificación permanezcan activas.':'Your founding status appears in the public directory while membership and verification remain active.'}</p></article>
      </div>
    </section>

    <section className="section" id="apply" style={{maxWidth:980,margin:'0 auto'}}>
      {authenticated===null?<div className="feature premiumCard"><h2>{es?'Preparando tu solicitud…':'Preparing your application…'}</h2></div>:
      authenticated===false?<div className="feature premiumCard"><span className="eyebrow">{es?'PASO 1 DE 2':'STEP 1 OF 2'}</span><h2>{es?'Crea tu cuenta para solicitar verificación.':'Create your account to request verification.'}</h2><p>{es?'Usaremos la cuenta para proteger la información del negocio y mantener el proceso de revisión vinculado a una identidad segura.':'We use the account to protect business information and keep the review tied to a secure identity.'}</p><div className="actions"><a className="cta premiumCta" href={authHref}>{es?'Crear cuenta / iniciar sesión':'Create account / sign in'}</a></div></div>:
      membership?<div className="feature premiumCard"><span className="eyebrow">{es?'MI SOLICITUD':'MY APPLICATION'}</span><h2>{membership.founding_slot?(es?`Proveedor fundador #${membership.founding_slot}`:`Founding Supplier #${membership.founding_slot}`):membership.status}</h2><p>{es?'Identidad':'Identity'}: <strong>{membership.identity_status}</strong></p><p>{es?'Plan':'Plan'}: <strong>{membership.plan_code}</strong></p>{membership.founding_slot?<><p><strong>{es?'Gratis hasta':'Free until'}:</strong> {new Date(membership.free_until).toLocaleDateString(es?'es-US':'en-US')}</p><p><strong>{es?'Descuento permanente después':'Lifetime discount afterward'}:</strong> 25%</p></>:<p>{es?'Tu solicitud no reserva una plaza. Si completas la verificación mientras existan cupos, el beneficio se asignará automáticamente al activarte.':'Your application does not reserve a spot. If you complete verification while spots remain, the benefit is awarded automatically upon activation.'}</p>}</div>:
      <form className="feature premiumCard" onSubmit={submit} style={{display:'grid',gap:14}}>
        <span className="eyebrow">{es?'PASO 2 DE 2':'STEP 2 OF 2'}</span><h2>{es?'Solicitud de proveedor':'Provider application'}</h2>
        {!applicationOpen&&<p role="status">{es?'Las 100 plazas fundadoras ya fueron otorgadas. Aún puedes solicitar membresía estándar.':'All 100 founding spots have been awarded. You can still apply for standard membership.'}</p>}
        <div className="featureGrid"><label>{es?'Nombre legal':'Legal name'}<input name="legalName" required/></label><label>{es?'Nombre comercial':'Trade name'}<input name="tradeName"/></label><label>{es?'Nombre visible al cliente':'Customer-facing name'}<input name="displayName" required/></label><label>{es?'País (ISO 2 letras)':'Country (2-letter ISO)'}<input name="countryCode" required maxLength={2} placeholder="CU, US, MX, ES…"/></label></div>
        <div className="featureGrid"><label>{es?'Tipo de negocio':'Business type'}<input name="businessType" defaultValue="PRIVATE_BUSINESS" required/></label><label>{es?'Registro / identificación comercial':'Registration / business ID'}<input name="registrationNumber"/></label><label>{es?'Teléfono privado para verificación':'Private verification phone'}<input name="phone"/></label></div>
        <div className="featureGrid"><label>{es?'Ciudad':'City'}<input name="city"/></label><label>{es?'Región / provincia':'Region / province'}<input name="region"/></label></div>
        <label>{es?'Zona o países donde presta servicios':'Service area / countries served'}<input name="serviceArea"/></label>
        <label style={{display:'flex',gap:10,alignItems:'flex-start'}}><input name="accepted" type="checkbox" required/><span>{es?'Acepto afiliarme como proveedor y mostrar mi identidad comercial pública, país, ID público, estado de verificación, catálogo y capacidades aprobadas.':'I agree to join as a provider and display my public business identity, country, public ID, verification status, catalog and approved capabilities.'}</span></label>
        <button className="cta premiumCta" disabled={busy}>{busy?(es?'Enviando…':'Submitting…'):(es?'Enviar solicitud de verificación':'Submit verification application')}</button>{msg&&<p role="status">{msg}</p>}
      </form>}
    </section>

    <section className="policyBlock"><div><span className="eyebrow">{es?'ELEGIBILIDAD':'ELIGIBILITY'}</span><h2>{es?'Verificación real, una plaza por empresa.':'Real verification, one spot per business.'}</h2></div><p>{es?'La oferta no es transferible. MY CUBA CASH puede rechazar, suspender o retirar visibilidad por identidad no verificable, información falsa, inactividad material, fraude o incumplimiento. Documentos sensibles permanecen privados.':'The offer is non-transferable. MY CUBA CASH may reject, suspend or remove visibility for unverifiable identity, false information, material inactivity, fraud or noncompliance. Sensitive documents remain private.'}</p></section>
  </main>;
}
