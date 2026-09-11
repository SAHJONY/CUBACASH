import { AGENTS } from '@/lib/agentic/registry';
import { localeOf } from '@/lib/i18n';

const spanish:Record<string,{name:string;mission:string}>={
  'executive-orchestrator':{name:'Cerebro de la Aplicación / Orquestador Ejecutivo',mission:'Descompone objetivos, coordina agentes especialistas, optimiza la ejecución basada en evidencia y aplica gates de aprobación y publicación.'},
  'reliability-guardian':{name:'Guardián de Confiabilidad Autorreparable',mission:'Detecta degradación operativa, clasifica incidentes, ejecuta solo recuperación reversible de bajo riesgo y escala cambios materiales.'},
  'improvement-engine':{name:'Motor de Experimentos y Mejora Continua',mission:'Identifica mejoras medibles, propone experimentos acotados y promueve únicamente resultados respaldados por evidencia.'},
  'growth-engine':{name:'Motor Autónomo de Crecimiento y Ventas',mission:'Convierte señales propias de marketplace, remesas y engagement en oportunidades calificadas y flujos de conversión con consentimiento.'},
  'compliance-sentinel':{name:'Centinela de Cumplimiento',mission:'Mantiene los flujos regulados en fail-closed y exige evidencia oficial vigente antes de avanzar acciones sensibles.'},
  'remittance-router':{name:'Enrutador de Remesas',mission:'Prepara solicitudes de remesa, beneficiarios, corredores, selección de proveedor, seguimiento de estado y manejo de excepciones.'},
  'cash-ledger-agent':{name:'Guardián del Registro de Efectivo',mission:'Orquesta registros de efectivo directo, confirmación de todas las partes, evidencia, confianza comunitaria y disputas sin custodiar fondos.'},
  'marketplace-matchmaker':{name:'Motor de Matching del Marketplace',mission:'Conecta demanda y oferta verificadas del sector privado usando ajuste estructurado, confianza, geografía y preparación operativa.'},
  'rfq-operator':{name:'Operador de RFQ',mission:'Convierte demanda en RFQs estructurados, compara respuestas y escala oportunidades listas para transacción.'},
  'risk-analyst':{name:'Analista de Riesgo',mission:'Evalúa señales de transacción, fraude, sanciones y ejecución sin sobrepasar controles duros.'},
  'reconciliation-agent':{name:'Agente de Conciliación',mission:'Compara resultados esperados con reportes de settlement, detecta diferencias y preserva evidencia.'},
  'support-agent':{name:'Agente de Operaciones al Cliente',mission:'Resuelve preguntas usando estado verificado de la plataforma y escala de forma segura asuntos financieros o de cumplimiento.'},
  'research-agent':{name:'Agente de Inteligencia e Investigación',mission:'Recopila y estructura evidencia actual de fuentes aprobadas sin presentar información no verificada como hecho.'},
  'fraud-guardian':{name:'Guardián Antifraude',mission:'Detecta patrones sospechosos, identidades duplicadas, anomalías de velocidad y señales de estructuración para revisión.'}
};

export default async function AgentsPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const rtl=locale==='ar';
  const es=locale==='es';
  return <main className="shell premiumAppShell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav premiumNav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>{es?'Red de Comando Agéntica':'Agentic Command Network'}</small></a>
      <div className="navlinks"><a href={`/${locale}/dashboard`}>Command Center</a><a href={`/${locale}/remittances`}>{es?'Remesas':'Remittances'}</a></div>
      <a className="miniCta" href="/api/health">{es?'Salud del sistema':'System Health'}</a>
    </nav>

    <section className="section">
      <div className="sectionHead">
        <div><span className="eyebrow">{es?'PLANO DE CONTROL MULTIAGENTE':'MULTI-AGENT CONTROL PLANE'}</span><h2>{es?'Red de Comando Agéntica':'Agentic Command Network'}</h2></div>
        <p>{es?'Red de especialistas sujeta a políticas para planificación, investigación, marketplace, RFQs, remesas, cumplimiento, fraude, conciliación y operaciones al cliente. Las acciones de alto impacto permanecen separadas del análisis y requieren evidencia y gates de aprobación.':'A policy-gated specialist network for planning, research, marketplace operations, RFQs, remittances, compliance, fraud detection, reconciliation and customer operations. High-impact actions are separated from analysis and require the configured evidence and approval gates.'}</p>
      </div>
      <div className="previewGrid">
        <div><span>{es?'Agentes especialistas':'Specialist agents'}</span><strong>{AGENTS.length}</strong></div>
        <div><span>{es?'Modo operativo':'Operating mode'}</span><strong>{es?'SUJETO A POLÍTICA':'POLICY-GATED'}</strong></div>
        <div><span>{es?'Acciones reguladas':'Regulated actions'}</span><strong>{es?'GATE HUMANO':'HUMAN GATE'}</strong></div>
        <div><span>{es?'Política de evidencia':'Evidence policy'}</span><strong>FAIL-CLOSED</strong></div>
      </div>
    </section>

    <section className="section" style={{paddingTop:0}}>
      <div className="featureGrid">
        {AGENTS.map((agent,i)=>{const tr=spanish[agent.id];return <article className="feature" key={agent.id}>
          <div className="icon">{String(i+1).padStart(2,'0')}</div>
          <h3>{es&&tr?tr.name:agent.name}</h3>
          <p>{es&&tr?tr.mission:agent.mission}</p>
          <div className="featureMeta">{agent.domain.toUpperCase()} · {agent.capabilities.length} {es?'CAPACIDADES':'CAPABILITIES'}</div>
        </article>})}
      </div>
    </section>

    <section className="policyBlock">
      <div><span className="eyebrow">{es?'PRINCIPIO DE EJECUCIÓN':'EXECUTION PRINCIPLE'}</span><h2>{es?'Autonomía con límites firmes':'Autonomy with hard boundaries'}</h2></div>
      <p>{es?'Los agentes pueden investigar, planificar, priorizar, conciliar y preparar trabajo dentro de sus permisos. Escrituras materiales, acciones financieras reguladas, decisiones sensibles a sanciones y acciones prohibidas no pueden autoaprobarse silenciosamente.':'Agents may autonomously research, plan, rank, reconcile and prepare work inside their permissions. Material writes, regulated financial actions, sanctions-sensitive decisions and prohibited actions cannot be silently self-approved.'}</p>
    </section>

    <footer className="footer"><strong>mycubacash.com</strong><span>{es?'Red de Comando Agéntica':'Agentic Command Network'}</span></footer>
  </main>;
}
