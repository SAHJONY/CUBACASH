import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';
import { localeOf } from '@/lib/i18n';
import DealIntakeForm from './DealIntakeForm';

// TODO: wire FIRM_APP_URL to the private AI agentic law firm app (artifact slug
// ai-agentic-law-firm) when its internal URL is available. Keep it '#' until
// then so the entry point never leaks a private URL to any public surface.
const FIRM_APP_URL='#';

const LABEL_ES='Investigación legal con IA — no es asesoría legal';
const LABEL_EN='AI LEGAL RESEARCH — NOT LEGAL ADVICE';

type Alert={
  id:string;severity:'INFO'|'WATCH'|'ACTION';
  date_detected:string;date_detected_tz:string;effective_date:string;
  title_es:string;title_en:string;
  what_changed_es:string;what_changed_en:string;
  practice_module:string;live_matters_affected_es:string;live_matters_affected_en:string;
  gates_touched:string;prior_firm_position:string;research_note:string;
  source_link:string;source_note:string;
};

async function loadAlerts():Promise<Alert[]>{
  try{
    const raw=await readFile(path.join(process.cwd(),'legal','regulatory-watch-baseline.json'),'utf8');
    return (JSON.parse(raw).alerts??[]) as Alert[];
  }catch{return [];}
}

function RequireOwner({locale,es}:{locale:string;es:boolean}){
  return <main className="shell premiumAppShell"><section className="section" style={{maxWidth:760,margin:'0 auto'}}><div className="sectionHead"><div><span className="eyebrow">OWNER ACCESS</span><h1>{es?'Firma Legal':'Legal Office'}</h1></div><p>{es?'La sesión está iniciada, pero esta cuenta no tiene el rol platform_owner.':'You are signed in, but this account does not have the platform_owner role.'}</p></div><div className="feature premiumCard"><p>{es?'Firma Legal es interno y solo para el propietario. Cierra sesión e inicia con la cuenta propietaria correcta.':'Legal Office is internal and owner-only. Sign out and use the correct owner account.'}</p><div className="actions"><a className="ghost" href={`/${locale}/auth?next=${encodeURIComponent(`/${locale}/command-center/firma-legal`)}`}>{es?'Ir al acceso seguro':'Open secure access'}</a></div></div></section></main>;
}

export default async function FirmaLegal({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();

  if(!user){
    const next=`/${locale}/command-center/firma-legal`;
    return <main className="shell premiumAppShell"><section className="section" style={{maxWidth:760,margin:'0 auto'}}><div className="sectionHead"><div><span className="eyebrow">OWNER ACCESS</span><h1>{es?'Firma Legal':'Legal Office'}</h1></div><p>{es?'Tu sesión de propietario no está activa en este navegador. Inicia sesión y volverás directamente a la Firma Legal.':'Your owner session is not active in this browser. Sign in and you will return directly to the Legal Office.'}</p></div><div className="feature premiumCard"><h3>{es?'Autenticación requerida':'Authentication required'}</h3><p>{es?'La Firma Legal es un módulo interno solo para el propietario. No es una oferta pública de asesoría legal.':'The Legal Office is an internal, owner-only module. It is not a public legal-advice offering.'}</p><div className="actions"><a className="cta premiumCta" href={`/${locale}/auth?next=${encodeURIComponent(next)}`}>{es?'Iniciar sesión como propietario':'Sign in as owner'}</a><a className="ghost" href={`/${locale}`}>{es?'Volver al inicio':'Back home'}</a></div></div></section></main>;
  }

  const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();
  if(profile?.role!=='platform_owner') return <RequireOwner locale={locale} es={es}/>;

  const alerts=await loadAlerts();

  const exposures=[
    {
      n:'01',severity:'CRÍTICO · CRITICAL',
      title:es?'Licencia de transmisor de dinero — sin licencia, sin entidad':'Money-transmitter licensing — no license, no entity',
      body:es
        ?'Federal — registro FinCEN como MSB (31 U.S.C. §5330; 31 CFR §1010.100(ff)): el Form 107 debe presentarse dentro de 180 días de establecerse y renovarse cada dos años. Incumplimiento: multa civil de $5,000 por violación, cada día una violación continua; operar sin licencia es delito federal (18 U.S.C. §1960). Estatal — Texas Finance Code cap. 151: nadie puede dedicarse a la transmisión de dinero ni anunciarla/solicitarla sin licencia (§151.302); el esquema de comisiones (1.25–2.50%) es compensación. La publicidad del beta puede activar la violación por sí sola. Sin entidad legal ni dirección: la exposición personal de Juan (la vía de Cash App pasa por su cuenta personal) no queda limitada por una corporación.'
        :'Federal — FinCEN MSB registration (31 U.S.C. §5330; 31 CFR §1010.100(ff)): Form 107 due within 180 days of establishment, biennial renewal. Non-compliance: $5,000 civil penalty per violation, each day a continuing violation; operating unlicensed is a federal criminal offense (18 U.S.C. §1960). State — Texas Finance Code ch. 151: no person may engage in or advertise/solicit money transmission without a license (§151.302); the fee schedule (1.25–2.50%) is compensation. The public beta can trigger the violation on its own. No legal entity or address: Juan\u2019s personal exposure (Cash App rails run through his personal account) is not corporate-limited.'
    },
    {
      n:'02',severity:'WATCH',
      title:es?'Custodia — la línea del concierge debe mantenerse':'Custody — the concierge line must hold',
      body:es
        ?'El modelo de custodia fue rechazado correctamente, pero el tramo concierge ($4 flat por envío) debe mantenerse del lado seguro de la definición de "aceptación y transmisión" de FinCEN: permitido — coordinación "hecha contigo" donde los fondos del cliente nunca pasan por las manos o cuentas de Juan. Prohibido sin licencia — cualquier paso donde Juan acepta fondos del cliente (aunque sea brevemente, aunque sea en Cash App, "solo para guardarlos hasta el envío") y los reenvía: eso es aceptación + transmisión (31 CFR §1010.100(ff)(5)(i)), sin importar la etiqueta o el monto de la comisión. La regla de remesas del CFPB (Regulation E, 12 CFR §1005.30 et seq.) impone una segunda capa: divulgación, cancelación y resolución de errores si algún flujo califica.'
        :'The custody model was correctly rejected, but the concierge tier ($4 flat per send) must stay on the safe side of FinCEN\u2019s "acceptance and transmission" definition: permitted — done-with-you coordination where the customer\u2019s funds never pass through Juan\u2019s hands or accounts. Prohibited without a license — any step where Juan accepts customer funds (even briefly, even in Cash App, "just holding it for the send") and forwards them: that is acceptance + transmission (31 CFR §1010.100(ff)(5)(i)), regardless of fee label or amount. The CFPB remittance-transfer rule (Regulation E, 12 CFR §1005.30 et seq.) adds a second layer: disclosure, cancellation and error-resolution duties if any flow qualifies.'
    },
    {
      n:'03',severity:'WATCH',
      title:es?'Nexo de sanciones Cuba en cada envío':'Cuba sanctions nexus on every send',
      body:es
        ?'Cada remesa que toca Cuba se mueve bajo el programa de sanciones de OFAC sobre Cuba (31 CFR Part 515): la Cuba Restricted List debe revisarse para cada receptor e intermediario; cero toques a bancos cubanos (suspensión BIS 2026-03-04 de SCP para depósitos; Banco Exterior de Cuba SDN ~2026-09-03); la documentación de receptor del sector privado debe ser real. Las sanciones secundarias bajo EO 14404 se extienden a bancos extranjeros en la cadena. Gate 1 verificó a los proveedores, no la pantalla de sanciones — la pantalla es una obligación permanente por transacción.'
        :'Every remittance touching Cuba moves under the OFAC Cuba sanctions program (31 CFR Part 515): the Cuba Restricted List must be screened for every recipient and intermediary; no Cuban-bank touchpoints (BIS 2026-03-04 SCP suspension on deposits; Banco Exterior de Cuba SDN ~2026-09-03); private-sector-recipient documentation must be real. EO 14404 secondary sanctions extend to foreign banks in the chain. Gate 1 verified the providers, not the sanctions screen — the screen is a standing per-transaction obligation.'
    }
  ];

  const guardrails=[
    es?'Modelo de custodia rechazado (2026-09-16): la plataforma nunca toma custodia del principal.':'Custody model rejected (2026-09-16): the platform never takes custody of the principal.',
    es?'Negocio separado: MY CUBA CASH e Import/Export son negocios separados — leads, proveedores y contactos nunca se archivan cruzados.':'Separate business: MY CUBA CASH and Import/Export are separate businesses — leads, providers and contacts are never cross-filed.',
    es?'Comisiones congeladas hasta las primeras 10 transacciones reales (Juan, 2026-09-16); la idea de tarifa plana por $100 quedó archivada.':'Fees parked until the first 10 real transactions (Juan, 2026-09-16); the per-$100 flat-fee idea is parked.',
    es?'Enmarcado honesto como beta ("no mostramos proveedores inventados"); acceso de propietario aún pendiente.':'Honest beta framing ("no mostramos proveedores inventados"); owner access still pending.',
    es?'Gate 1 superado: 10/10 proveedores verificados (2026-09-18).':'Gate 1 cleared: 10/10 verified providers (2026-09-18).'
  ];

  const sevStyle=(sev:string)=>({display:'inline-block',fontSize:12,fontWeight:700,padding:'2px 8px',borderRadius:4,background:sev==='ACTION'?'#b71c1c':sev==='WATCH'?'#e65100':'#616161',color:'#fff'} as const);

  return <main className="shell premiumAppShell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav premiumNav"><a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Firma Legal — interno del propietario':'Legal Office — owner internal'}</small></a><div className="navlinks"><a href={`/${locale}/command-center`}>{es?'Command Center':'Command Center'}</a></div><span className="miniCta">OWNER MODE</span></nav>

    <section className="hero"><div className="heroCopy"><div className="eyebrow">FIRMA LEGAL · AI AGENTIC LAW FIRM · OWNER ONLY</div>
      <h1>{es?'Departamento legal interno de MY CUBA CASH.':'MY CUBA CASH in-house legal department.'}</h1>
      <p className="heroLead">{es?'Perfil de riesgo legal, asesoría previa a compromisos y vigilancia regulatoria — preparado por la firma legal de IA de Juan, servido internamente y solo para el propietario.':'Legal-risk profile, pre-commitment advisory and regulatory watch — prepared by Juan\u2019s AI law firm, served internally and owner-only.'}</p>
      <p className="heroSub"><strong>{LABEL_ES}</strong> · <strong>{LABEL_EN}</strong></p>
      <div className="actions"><a className="cta premiumCta" href={FIRM_APP_URL}>{es?'Abrir firma legal':'Open legal firm app'}</a><a className="ghost" href={`/${locale}/command-center`}>{es?'Volver al Command Center':'Back to Command Center'}</a></div>
    </div><aside className="commandPreview"><div className="previewTop"><span className="liveDot"/> INTERNAL <span className="previewTag">PLATFORM_OWNER</span></div><div className="previewGrid"><div><span>{es?'Módulos':'Modules'}</span><strong>{es?'3 activos':'3 active'}</strong></div><div><span>{es?'Alertas vigentes':'Live alerts'}</span><strong>{alerts.length}</strong></div><div><span>{es?'Oferta pública':'Public offer'}</span><strong>{es?'NUNCA':'NEVER'}</strong></div><div><span>{es?'Riesgo UPL':'UPL risk'}</span><strong>{es?'MITIGADO':'MITIGATED'}</strong></div></div></aside></section>

    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">{LABEL_EN}</span><h2>{es?'Investigación legal con IA — no es asesoría legal':'AI legal research — not legal advice'}</h2></div><p>{es?'Este módulo fue preparado por un sistema de investigación con IA, no por un abogado licenciado. No crea privilegio abogado-cliente y no sustituye a un abogado de transmisores de dinero ni a un asesor de sanciones. Las preguntas de remesas/licencias activan el gate de revisión de abogado del charter §6. La firma sirve a MY CUBA CASH por separado de SAHJONY Import/Export: ningún proveedor, lead o contacto se archiva cruzado entre los negocios.':'This module was prepared by an AI research system, not a licensed attorney. It does not create attorney-client privilege and is not a substitute for licensed money-transmitter or sanctions counsel. Remittance/licensing questions trigger the charter §6 attorney-review gate. The firm serves MY CUBA CASH separately from SAHJONY Import/Export: no provider, lead or contact is cross-filed between the businesses.'}</p></section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'PERFIL DE RIESGO':'RISK PROFILE'}</span><h2>{es?'Principales exposiciones legales':'Top legal exposures'}</h2></div><p>{LABEL_ES} · {LABEL_EN} · {es?'Perfil del 2026-09-20.':'Profile dated 2026-09-20.'}</p></div>
      <div className="featureGrid">{exposures.map((x)=><article className="feature premiumCard" key={x.n}><div className="icon">{x.n}</div><div><span style={sevStyle(x.severity.split(' ')[0])}>{x.severity}</span></div><h3>{x.title}</h3><p>{x.body}</p><p className="featureMeta">{LABEL_ES}</p></article>)}</div>
    </section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'CONTROLES EN VIGOR':'GUARDRAILS IN FORCE'}</span><h2>{es?'Barreras que ya están activas':'Guardrails already in force'}</h2></div><p>{LABEL_ES} · {LABEL_EN}</p></div>
      <div className="featureGrid">{guardrails.map((g,i)=><article className="feature" key={i}><div className="icon">G{i+1}</div><p>{g}</p></article>)}</div>
    </section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'ASESORÍA DE TRATOS':'DEAL ADVISORY'}</span><h2>{es?'Revisión legal previa a compromiso':'Pre-commitment legal review'}</h2></div><p>{es?'Envía un trato, alianza o asociación para revisión interna antes de comprometerte. Se guarda como archivo local en el repositorio (legal/deal-intakes/) y no se envía a nadie.':'Submit a deal, alliance or partnership for internal review before committing. Stored as a local file in the repository (legal/deal-intakes/) and sent to no one.'}</p><p><strong>{LABEL_ES}</strong> · <strong>{LABEL_EN}</strong></p></div>
      <article className="feature premiumCard"><DealIntakeForm es={es}/></article>
    </section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'VIGILANCIA REGULATORIA':'REGULATORY WATCH'}</span><h2>{es?'Alertas para remesas y Cuba (baseline 2026)':'Remittance & Cuba alerts (2026 baseline)'}</h2></div><p>{LABEL_ES} · {LABEL_EN} · {es?'Semilla verificada el 2026-09-20 (America/Chicago). Nada aquí contacta a ninguna autoridad.':'Seed verified 2026-09-20 (America/Chicago). Nothing here contacts any authority.'}</p></div>
      {alerts.length===0
        ?<p>{es?'No hay alertas cargadas.':'No alerts loaded.'}</p>
        :<div className="featureGrid">{alerts.map((a)=><article className="feature premiumCard" key={a.id}><div><span style={sevStyle(a.severity)}>{a.severity}</span></div><h3>{es?a.title_es:a.title_en}</h3><p>{es?a.what_changed_es:a.what_changed_en}</p><p><strong>{es?'Detectado':'Detected'}:</strong> {a.date_detected} ({a.date_detected_tz}) · <strong>{es?'Vigente':'Effective'}:</strong> {a.effective_date}</p><p><strong>{es?'Módulo':'Module'}:</strong> {a.practice_module}</p><p><strong>{es?'Nota':'Note'}:</strong> {a.research_note}</p>{a.source_link&&<p><a className="ghost" href={a.source_link} target="_blank" rel="noreferrer">{es?'Fuente':'Source'}</a></p>}<p className="featureMeta">{LABEL_ES}</p></article>)}</div>}
    </section>

    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">OWNER AUTHORITY</span><h2>{es?'Interno del propietario. Sin oferta pública.':'Owner internal. No public offer.'}</h2></div><p>{es?'Este módulo existe únicamente dentro de las rutas de propietario y jamás se enlaza desde páginas públicas. No es una oferta de servicios legales al público (riesgo UPL). Cualquier decisión de licencia, registro o cumplimiento externo requiere abogado licenciado y la aprobación explícita de Juan.':'This module exists only inside owner routes and is never linked from public pages. It is not an offer of legal services to the public (UPL risk). Any licensing, registration or external compliance decision requires licensed counsel and Juan\u2019s explicit approval.'}</p></section>
  </main>;
}
