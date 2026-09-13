import { localeOf } from '@/lib/i18n';
import { APP_COMMUNICATIONS, whatsappUrl } from '@/lib/communications';
import { supabaseServer } from '@/lib/supabase/server';

const SOFIA_IMAGE='https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&fm=jpg&q=86&w=2400';

function txStatus(row:any,es:boolean){
  if(row.sanctions_state&&row.sanctions_state!=='CLEAR') return es?'En revisión de sanciones':'Sanctions review';
  if(row.compliance_state==='HOLD') return es?'En revisión':'Under review';
  if(row.transfer_status==='COMPLETED'||row.settlement_status==='SETTLED') return es?'Completada':'Completed';
  if(row.transfer_status==='FAILED'||row.transfer_status==='CANCELLED'||row.transfer_status==='REFUNDED') return es?'Cerrada':'Closed';
  return es?'En proceso':'In progress';
}

export default async function SofiaHub({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';
  const channels=APP_COMMUNICATIONS;
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  let recent:any[]=[];
  if(user){
    const {data}=await supabase.from('remittance_intents')
      .select('id,reference,transfer_status,compliance_state,sanctions_state,settlement_status,destination_country,send_amount,send_currency,created_at')
      .eq('owner_user_id',user.id)
      .order('created_at',{ascending:false})
      .limit(4);
    recent=data??[];
  }

  const wa=whatsappUrl(channels.whatsappPrimary.e164,es?'Hola Sofia. Necesito ayuda con MY CUBA CASH.':'Hi Sofia. I need help with MY CUBA CASH.');

  return <main className="shell premiumAppShell">
    <nav className="nav premiumNav appNav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>Sofia</small></a>
      <div className="navlinks"><a href={`/${locale}/start`}>{es?'Enviar':'Send'}</a><a href={`/${locale}/transactions`}>{es?'Rastrear':'Track'}</a><a href={`/${locale}/local-services`}>{es?'Servicios locales':'Local Services'}</a><a href={`/${locale}/marketplace`}>Marketplace</a></div>
      <a className="miniCta premiumCta" href={wa}>{es?'Abrir Sofia':'Open Sofia'}</a>
    </nav>

    <section className="homeCinematicHero" style={{minHeight:'72vh'}}>
      <img className="homeHeroMedia" src={SOFIA_IMAGE} alt={es?'Asistente profesional ayudando a un cliente.':'Professional assistant helping a customer.'}/>
      <div className="homeHeroOverlay"/>
      <div className="homeHeroContent">
        <div className="eyebrow">SOFIA · {es?'COPILOTO MY CUBA CASH':'MY CUBA CASH COPILOT'}</div>
        <h1>{es?'Dime qué necesitas. Sofia organiza el camino.':'Tell Sofia what you need. She organizes the path.'}</h1>
        <p className="heroLead">{es?'Remesas, Xpress 1 hora, entregas, recargas, servicios locales, marketplace y seguimiento desde una sola experiencia. Sofia recoge el contexto, te muestra la acción correcta y escala cuando hace falta criterio humano.':'Remittances, Xpress 1 hour, delivery, top-ups, local services, marketplace and tracking from one experience. Sofia gathers context, shows the right action and escalates when human judgment is required.'}</p>
        <div className="actions"><a className="cta premiumCta" href={wa}>{es?'Hablar con Sofia en WhatsApp Business':'Talk to Sofia on WhatsApp Business'}</a><a className="glassCta" href={`/${locale}/start`}>{es?'Publicar un envío':'Post a request'}</a></div>
        <div className="heroTrustRail"><span>{es?'Español primero':'Spanish first'}</span><span>{es?'Contexto de transacción':'Transaction context'}</span><span>{es?'Controles separados':'Separated controls'}</span><span>{es?'Escalación humana':'Human escalation'}</span></div>
      </div>
    </section>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'¿QUÉ QUIERES HACER?':'WHAT DO YOU NEED?'}</span><h2>{es?'Una entrada. Varias soluciones.':'One entry point. Multiple solutions.'}</h2></div><p>{es?'Sofia no obliga al cliente a conocer proveedores, rails o procesos internos. Empieza por la necesidad y MY CUBA CASH organiza las opciones disponibles.':'Sofia does not make customers understand providers, rails or internal processes. Start with the need and MY CUBA CASH organizes the available options.'}</p></div>
      <div className="luxuryGrid">
        <article className="luxuryCard"><span>01</span><h3>{es?'Enviar apoyo':'Send support'}</h3><p>{es?'Crea una remesa familiar y compara opciones de entrega cuando corresponda.':'Create a family remittance and compare delivery options when applicable.'}</p><a className="textLink" href={`/${locale}/start`}>{es?'Comenzar':'Start'} →</a></article>
        <article className="luxuryCard"><span>02</span><h3>{es?'Entrega rápida':'Fast delivery'}</h3><p>{es?'Compara Xpress 1 hora, 1–3 horas, mismo día y flexible según disponibilidad real del proveedor.':'Compare Xpress 1 hour, 1–3 hour, same-day and flexible service based on actual provider availability.'}</p><a className="textLink" href={`/${locale}/start`}>{es?'Comparar':'Compare'} →</a></article>
        <article className="luxuryCard"><span>03</span><h3>{es?'Servicios en Cuba':'Services in Cuba'}</h3><p>{es?'Recargas Cubacel/Nauta, compras y entregas, mensajería y otros servicios aprobados.':'Cubacel/Nauta top-ups, purchase + delivery, messenger and other approved services.'}</p><a className="textLink" href={`/${locale}/local-services`}>{es?'Explorar servicios':'Explore services'} →</a></article>
        <article className="luxuryCard"><span>04</span><h3>{es?'Comprar o vender':'Buy or sell'}</h3><p>{es?'Usa el marketplace privado con identidad, reputación e historial unidos al flujo.':'Use the private marketplace with identity, reputation and history attached to the workflow.'}</p><a className="textLink" href={`/${locale}/marketplace`}>Marketplace →</a></article>
      </div>
    </section>

    {user&&<section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'TU CONTEXTO':'YOUR CONTEXT'}</span><h2>{es?'Sofia puede partir de tus operaciones recientes.':'Sofia can start from your recent activity.'}</h2></div><p>{es?'El contexto mostrado aquí es de solo lectura. Sofia puede explicar el estado y orientar el próximo paso, pero no puede saltarse controles de pago, identidad, sanciones o proveedor.':'This context is read-only. Sofia can explain status and guide the next step, but cannot bypass payment, identity, sanctions or provider controls.'}</p></div>
      {!recent.length?<div className="feature premiumCard"><h3>{es?'Todavía no tienes transacciones':'No transactions yet'}</h3><p>{es?'Empieza una solicitud y Sofia podrá ayudarte a seguirla por referencia.':'Start a request and Sofia can help you follow it by reference.'}</p></div>:<div className="featureGrid">{recent.map(row=><article className="feature premiumCard" key={row.id}><span className="eyebrow">{txStatus(row,es)}</span><h3>{row.reference}</h3><p><strong>{Number(row.send_amount).toFixed(2)} {row.send_currency}</strong> · {row.destination_country}</p><div className="actions"><a className="ghost" href={`/${locale}/transactions`}>{es?'Ver transacción':'View transaction'}</a><a className="glassCta" href={whatsappUrl(channels.whatsappPrimary.e164,es?`Hola Sofia. Necesito ayuda con la transacción ${row.reference}.`:`Hi Sofia. I need help with transaction ${row.reference}.`)}>{es?'Preguntar a Sofia':'Ask Sofia'}</a></div></article>)}</div>}
    </section>}

    {!user&&<section className="section"><div className="spotlightPanel"><div><span className="eyebrow">{es?'CONTEXTO PERSONAL':'PERSONAL CONTEXT'}</span><h2>{es?'Entra para que Sofia pueda orientarte usando tus propias transacciones.':'Sign in so Sofia can guide you using your own transactions.'}</h2><p>{es?'Sin iniciar sesión, Sofia todavía puede ayudarte a comenzar o explicar servicios públicos.':'Without signing in, Sofia can still help you start or explain public services.'}</p></div><div className="actions"><a className="cta premiumCta" href={`/${locale}/auth`}>{es?'Entrar':'Sign in'}</a></div></div></section>}

    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">{es?'LÍMITES DE SOFIA':'SOFIA BOUNDARIES'}</span><h2>{es?'Sofia coordina. Los controles autorizan.':'Sofia coordinates. Controls authorize.'}</h2></div><p>{es?'Sofia puede recoger información, explicar estados, comparar opciones, preparar solicitudes y escalar excepciones. No puede aprobar por sí sola un match de sanciones, verificar un pago, mover fondos, alterar settlement, aprobar un proveedor sensible ni cerrar una excepción de compliance.':'Sofia can collect information, explain status, compare options, prepare requests and escalate exceptions. She cannot independently clear a sanctions match, verify a payment, move funds, alter settlement, approve a sensitive provider or close a compliance exception.'}</p></section>
  </main>;
}
