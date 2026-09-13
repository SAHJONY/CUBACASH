import { localeOf } from '@/lib/i18n';

const enginesEs=[
  ['Cerebro de la aplicación','Coordina agentes especialistas y produce próximos pasos sujetos a políticas usando evidencia actual.','ORQUESTADOR'],
  ['Confiabilidad autorreparable','Detecta fallos, reintenta trabajo idempotente acotado, aísla adaptadores con problemas y escala incidentes críticos.','AUTO-SEGURO'],
  ['Mejora continua','Mide brechas de KPI, propone experimentos, aplica límites y promueve solo mejoras validadas.','EXPERIMENTO CONTROLADO'],
  ['Crecimiento autónomo','Prioriza intención de primera parte, conecta demanda del marketplace y dirige oportunidades calificadas con consentimiento.','CONSENTIMIENTO']
] as const;
const enginesEn=[
  ['Application Brain','Coordinates specialist agents and produces policy-gated next actions from current evidence.','ORCHESTRATOR'],
  ['Self-Healing Reliability','Detects failures, retries bounded idempotent work, quarantines failing adapters and escalates critical incidents.','AUTO-SAFE'],
  ['Self-Improvement','Measures KPI gaps, proposes experiments, enforces guardrails and promotes only validated winners.','EXPERIMENT-GATED'],
  ['Autonomous Growth','Scores first-party intent, matches marketplace demand, nurtures opted-in prospects and routes qualified opportunities.','CONSENT-GATED']
] as const;

export default async function Autonomy({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params; const locale=localeOf(raw); const rtl=locale==='ar'; const es=locale==='es'; const engines=es?enginesEs:enginesEn;
  return <main className="shell premiumAppShell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav premiumNav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Cerebro de la aplicación':'Application Brain'}</small></a>
      <div className="navlinks"><a href={`/${locale}/dashboard`}>Command Center</a><a href={`/${locale}/remittances`}>{es?'Remesas':'Remittances'}</a><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/agents`}>{es?'Agentes':'Agents'}</a></div>
      <a className="miniCta" href="/api/autonomy">{es?'API de autonomía':'Autonomy API'}</a>
    </nav>
    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'SISTEMA OPERATIVO AUTÓNOMO':'AUTONOMOUS OPERATING SYSTEM'}</span><h2>{es?'Cerebro, resiliencia, aprendizaje y crecimiento':'Brain, resilience, learning and growth'}</h2></div><p>{es?'La aplicación puede razonar continuamente sobre operaciones y crecimiento, pero la autonomía permanece limitada por reversibilidad, evidencia, consentimiento del cliente y controles regulatorios.':'The application can continuously reason about operations and growth, but autonomy remains bounded by reversibility, evidence, customer consent and regulatory controls.'}</p></div>
      <div className="previewGrid">
        <div><span>{es?'Reparación segura':'Safe repair'}</span><strong>{es?'AUTOMATIZABLE':'AUTOMATABLE'}</strong></div>
        <div><span>{es?'Cambio material':'Material change'}</span><strong>{es?'APROBACIÓN':'APPROVAL'}</strong></div>
        <div><span>{es?'Ventas':'Sales'}</span><strong>{es?'CON CONSENTIMIENTO':'CONSENT-AWARE'}</strong></div>
        <div><span>{es?'Acción regulada':'Regulated action'}</span><strong>{es?'GATE HUMANO/POLÍTICA':'HUMAN/POLICY GATE'}</strong></div>
      </div>
    </section>
    <section className="section" style={{paddingTop:0}}><div className="featureGrid">{engines.map(([n,d,s],i)=><article className="feature" key={n}><div className="icon">{String(i+1).padStart(2,'0')}</div><h3>{n}</h3><p>{d}</p><div className="featureMeta">{s}</div></article>)}</div></section>
    <section className="policyBlock"><div><span className="eyebrow">{es?'DOCTRINA CENTRAL':'CORE DOCTRINE'}</span><h2>{es?'Los modelos proponen. La política autoriza. La evidencia promueve.':'Models propose. Policy authorizes. Evidence promotes.'}</h2></div><p>{es?'Ningún motor autónomo puede levantar sanciones, aprobar por sí mismo una transacción regulada, crear obligaciones vinculantes con socios, cambiar precios materiales o contactar comercialmente a quien se haya excluido.':'No autonomous engine can clear sanctions, approve its own regulated transaction, create binding partner obligations, change material pricing or send marketing to an opted-out user.'}</p></section>
    <footer className="footer"><strong>MY CUBA CASH</strong><span>{es?'Sistema Operativo Autónomo':'Autonomous Operating System'}</span></footer>
  </main>;
}
