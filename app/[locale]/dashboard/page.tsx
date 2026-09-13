import { copy, localeOf } from '@/lib/i18n';

const modulesEs = [
  {k:'Cerebro de la aplicación',d:'Orquestación ejecutiva de remesas, marketplace, confianza, confiabilidad, mejora y crecimiento.',s:'CEREBRO'},
  {k:'Remesas familiares',d:'Apoyo persona a persona, beneficiarios, rutas de socios, seguimiento y conciliación.',s:'NÚCLEO'},
  {k:'Remesas comerciales',d:'Solicitudes de pago de negocios privados con propósito comercial, contrapartes y evidencia.',s:'NÚCLEO'},
  {k:'Ruteo cripto aprobado',d:'Preferencias USDC, USDT, BTC y ETH solo mediante redes y proveedores aprobados. Los ingresos de plataforma siguen en USD.',s:'SOCIO REQUERIDO'},
  {k:'Marketplace privado',d:'Ofertas de compra, venta y servicios para negocios privados y emprendedores.',s:'NÚCLEO'},
  {k:'Registro comunitario de efectivo',d:'Registros directos, confirmación de todas las partes, reputación pública, disputas y estrellas.',s:'LISTO'},
  {k:'Motor autorreparable',d:'Detecta degradación, reintenta solo trabajo idempotente, aísla adaptadores y escala incidentes.',s:'POLÍTICA'},
  {k:'Motor de mejora continua',d:'Convierte brechas de KPI en experimentos acotados con límites, evidencia y rollback.',s:'POLÍTICA'},
  {k:'Motor de crecimiento autónomo',d:'Usa señales propias de intención para calificar, conectar, nutrir y convertir con consentimiento.',s:'CONSENTIMIENTO'},
  {k:'Motor de confianza y políticas',d:'Identidad, KYB, sanciones, señales de fraude, evidencia y controles de decisión.',s:'FAIL-CLOSED'}
] as const;
const modulesEn = [
  {k:'Application Brain',d:'Executive orchestration across remittance, marketplace, trust, reliability, improvement and growth.',s:'BRAIN'},
  {k:'Family Remittance',d:'Person-to-person family support, beneficiaries, partner routing, tracking and reconciliation.',s:'CORE'},
  {k:'Business Remittance',d:'Private-business payment intents with commercial purpose, counterparties and settlement evidence.',s:'CORE'},
  {k:'Approved Crypto Routing',d:'USDC, USDT, BTC and ETH preferences routed only through approved networks and appropriately authorized providers. Platform revenue remains USD-only.',s:'PARTNER-GATED'},
  {k:'Private-Sector Marketplace',d:'Buy, sell and service offers for private businesses and entrepreneurs.',s:'CORE'},
  {k:'Community Cash Ledger',d:'Direct cash records, all-party confirmation, public transaction reputation, disputes and gold stars.',s:'READY'},
  {k:'Self-Healing Engine',d:'Detects degradation, retries only idempotent work, quarantines failing adapters and escalates material incidents.',s:'POLICY-GATED'},
  {k:'Self-Improvement Engine',d:'Turns KPI gaps into bounded experiments with guardrails, evidence and rollback discipline.',s:'POLICY-GATED'},
  {k:'Autonomous Growth Engine',d:'Uses first-party marketplace and remittance intent signals for qualification, matching, nurturing and conversion.',s:'CONSENT-GATED'},
  {k:'Trust & Policy Engine',d:'Identity, KYB, sanctions state, fraud signals, evidence and decision controls.',s:'FAIL-CLOSED'}
] as const;

export default async function Dashboard({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const t=copy[locale];
  const rtl=locale==='ar';
  const es=locale==='es';
  const modules=es?modulesEs:modulesEn;
  return <main className="shell premiumAppShell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav premiumNav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Remesas familiares + comerciales':'Family + Business Remittance'}</small></a>
      <div className="navlinks"><a href={`/${locale}`}>{es?'Inicio':'Home'}</a><a href={`/${locale}/remittances`}>{es?'Remesas':'Remittances'}</a><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/cash`}>{es?'Registro de efectivo':'Cash Ledger'}</a><a href={`/${locale}/agents`}>{es?'Agentes IA':'AI Agents'}</a><a href={`/${locale}/autonomy`}>{es?'Autonomía':'Autonomy'}</a></div>
      <a className="miniCta" href="/api/health">{es?'Salud del sistema':'System Health'}</a>
    </nav>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'FAMILIA · NEGOCIOS · MARKETPLACE PRIVADO':'FAMILY · BUSINESS · PRIVATE MARKETPLACE'}</span><h2>{es?'Centro de Comando':t.dashboard}</h2></div><p>{es?'Plano de control operativo para las funciones principales de MY CUBA CASH, coordinado por un cerebro de aplicación con autorreparación, mejora continua y crecimiento autónomo sujetos a políticas.':'Operational control plane for the primary MY CUBA CASH jobs, coordinated by an application brain with bounded self-healing, self-improvement, autonomous growth and partner-gated crypto routing.'}</p></div>
      <div className="previewGrid">
        <div><span>{es?'Cerebro':'Brain'}</span><strong>{es?'ORQUESTADO':'ORCHESTRATED'}</strong></div>
        <div><span>Crypto</span><strong>{es?'RUTEADO POR SOCIO':'PARTNER-ROUTED'}</strong></div>
        <div><span>{es?'Ingresos':'Revenue'}</span><strong>{es?'SOLO USD':'USD ONLY'}</strong></div>
        <div><span>{es?'Controles':'Controls'}</span><strong>FAIL-CLOSED</strong></div>
      </div>
    </section>

    <section className="section" style={{paddingTop:0}}>
      <div className="featureGrid">
        {modules.map((m,i)=><article className="feature" key={m.k}><div className="icon">{String(i+1).padStart(2,'0')}</div><h3>{m.k}</h3><p>{m.d}</p><div className="featureMeta">{es?'ESTADO':'STATUS'} · {m.s}</div></article>)}
      </div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">{es?'PRINCIPIO DE AUTONOMÍA':'AUTONOMY PRINCIPLE'}</span><h2>{es?'Los modelos proponen. La política autoriza. La evidencia promueve.':'Models propose. Policy authorizes. Evidence promotes.'}</h2></div><p>{es?'La recuperación segura y reversible puede automatizarse. Configuración material, precios, acciones reguladas, compromisos vinculantes, settlement cripto y contacto externo sin consentimiento permanecen detrás de políticas o aprobaciones explícitas.':'Safe reversible recovery can be automated. Material configuration, pricing, regulated actions, binding partner commitments, crypto settlement and unconsented external outreach stay behind explicit policy or approval gates.'}</p></section>
    <footer className="footer"><strong>MY CUBA CASH</strong><span>{es?'Remesas familiares · Remesas comerciales · Marketplace privado':'Family Remittance · Business Remittance · Private-Sector Marketplace'}</span></footer>
  </main>;
}
