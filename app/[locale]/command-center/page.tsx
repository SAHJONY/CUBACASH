import { supabaseServer } from '@/lib/supabase/server';
import { localeOf } from '@/lib/i18n';

const controls=[
  ['Operaciones','Vista operativa central de transacciones, participantes, estados y próximos pasos.','operations'],
  ['Revisión de servicios','Aprobar, rechazar o suspender ofertas de servicios de proveedores.','provider-services'],
  ['Remesas','Supervisar solicitudes, receptores, referencias y estado de cumplimiento.','../remittances'],
  ['Red de proveedores','Gestionar y comparar la red competitiva de proveedores locales.','../delivery-providers'],
  ['Mi oferta de proveedor','Administrar precios, cobertura, ETA, disponibilidad y Xpress.','../delivery-providers/manage'],
  ['Servicios locales','Administrar servicios locales ofrecidos por proveedores.','../delivery-providers/services'],
  ['Marketplace','Supervisar el marketplace privado y sus oportunidades.','../marketplace'],
  ['Gestionar marketplace','Crear y administrar ofertas del marketplace.','../marketplace/manage'],
  ['Red de agentes','Ver la red de agentes especialistas y sus capacidades.','../agents'],
  ['Autonomía','Ver motores de confiabilidad, mejora continua y crecimiento.','../autonomy'],
  ['Telegram','Publicar mensajes, posters y campañas en el canal oficial desde el Command Center.','telegram'],
  ['Dashboard','Vista ejecutiva de módulos y capacidades de la aplicación.','../dashboard'],
  ['Salud del sistema','Comprobar salud, base de datos y modo fail-closed.','/api/health']
] as const;

export default async function CommandCenter({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();

  if(!user){
    const next=`/${locale}/command-center`;
    return <main className="shell premiumAppShell"><section className="section" style={{maxWidth:760,margin:'0 auto'}}><div className="sectionHead"><div><span className="eyebrow">OWNER ACCESS</span><h1>{es?'Centro de Comando del Propietario':'Owner Command Center'}</h1></div><p>{es?'Tu sesión de propietario no está activa en este navegador. Inicia sesión y volverás directamente al centro de comando.':'Your owner session is not active in this browser. Sign in and you will return directly to the command center.'}</p></div><div className="feature premiumCard"><h3>{es?'Autenticación requerida':'Authentication required'}</h3><p>{es?'El acceso al centro de comando usa tu cuenta segura de MY CUBA CASH y no se omite ni se comparte con otros usuarios.':'Command-center access uses your secure MY CUBA CASH account and is never bypassed or shared with other users.'}</p><div className="actions"><a className="cta premiumCta" href={`/${locale}/auth?next=${encodeURIComponent(next)}`}>{es?'Iniciar sesión como propietario':'Sign in as owner'}</a><a className="ghost" href={`/${locale}`}>{es?'Volver al inicio':'Back home'}</a></div></div></section></main>;
  }

  const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();
  if(profile?.role!=='platform_owner'){
    return <main className="shell premiumAppShell"><section className="section" style={{maxWidth:760,margin:'0 auto'}}><div className="sectionHead"><div><span className="eyebrow">OWNER ACCESS</span><h1>{es?'Centro de Comando del Propietario':'Owner Command Center'}</h1></div><p>{es?'La sesión está iniciada, pero esta cuenta no tiene el rol platform_owner.':'You are signed in, but this account does not have the platform_owner role.'}</p></div><div className="feature premiumCard"><p>{es?'Cierra sesión e inicia con la cuenta propietaria correcta. No se elevarán privilegios automáticamente.':'Sign out and use the correct owner account. Privileges will not be elevated automatically.'}</p><div className="actions"><a className="ghost" href={`/${locale}/auth?next=${encodeURIComponent(`/${locale}/command-center`)}`}>{es?'Ir al acceso seguro':'Open secure access'}</a></div></div></section></main>;
  }

  const [
    {data:senders,error:senderError},
    {data:intakes,error:intakeError},
    {data:network,error:networkError},
    remittanceCount,
    providerCount,
    marketplaceCount,
    pendingServiceCount,
    profileCount
  ]=await Promise.all([
    supabase.from('remittance_sender_private').select('remittance_intent_id,sender_full_name,sender_phone,sender_email,address_line1,address_line2,city,region,postal_code,country_code,captured_at').order('captured_at',{ascending:false}).limit(12),
    supabase.from('sofia_order_intakes').select('id,platform_transaction_reference,channel,sender_full_name,sender_phone,beneficiary_full_name,beneficiary_phone,receiver_whatsapp_phone,receiver_phone,receiver_confirmation_channel,receiver_confirmed_at,request_type,requested_amount,requested_currency,requested_fulfillment,payment_preference,payment_status,delivery_requested,intake_status,auto_closed_at,closed_by,created_at').order('created_at',{ascending:false}).limit(12),
    supabase.from('platform_transaction_participants').select('id,platform_transaction_reference,participant_role,display_label,public_provider_id,participation_status,joined_at,completed_at').order('joined_at',{ascending:false}).limit(18),
    supabase.from('remittance_intents').select('id',{count:'exact',head:true}),
    supabase.from('delivery_provider_public_directory').select('public_provider_id',{count:'exact',head:true}).eq('verified',true),
    supabase.from('marketplace_offers').select('id',{count:'exact',head:true}),
    supabase.from('delivery_provider_service_offers').select('id',{count:'exact',head:true}).eq('approval_status','PENDING'),
    supabase.from('profiles').select('id',{count:'exact',head:true})
  ]);

  const metrics=[
    [es?'Transacciones':'Transactions',remittanceCount.count??0],
    [es?'Proveedores verificados':'Verified providers',providerCount.count??0],
    [es?'Ofertas marketplace':'Marketplace offers',marketplaceCount.count??0],
    [es?'Servicios por revisar':'Services pending review',pendingServiceCount.count??0],
    [es?'Perfiles':'Profiles',profileCount.count??0]
  ] as const;

  return <main className="shell premiumAppShell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav premiumNav"><a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Centro de Comando del Propietario':'Owner Command Center'}</small></a><div className="navlinks"><a href={`/${locale}/command-center/operations`}>{es?'Operaciones':'Operations'}</a><a href={`/${locale}/command-center/provider-services`}>{es?'Revisiones':'Reviews'}</a><a href={`/${locale}/command-center/telegram`}>Telegram</a><a href={`/${locale}/dashboard`}>Dashboard</a></div><span className="miniCta">OWNER MODE</span></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">OWNER MODE · PLATFORM_OWNER</div><h1>{es?'Control total de la aplicación desde un solo lugar.':'Full application control from one place.'}</h1><p className="heroLead">{es?'Tu cuenta de propietario tiene acceso completo a las consolas internas de MY CUBA CASH sin límites de producto, suscripción o uso dentro de la aplicación.':'Your owner account has complete access to internal MY CUBA CASH consoles without product, subscription or usage limits inside the application.'}</p><p className="heroSub">{es?'Los controles obligatorios de identidad, sanciones, fraude y seguridad permanecen activos. Ser propietario no convierte un HOLD o BLOCK regulatorio en una aprobación automática.':'Mandatory identity, sanctions, fraud and security controls remain active. Owner status does not turn a regulatory HOLD or BLOCK into automatic approval.'}</p><div className="actions"><a className="cta premiumCta" href={`/${locale}/command-center/operations`}>{es?'Abrir Operaciones':'Open Operations'}</a><a className="ghost" href={`/${locale}/command-center/provider-services`}>{es?'Revisar servicios pendientes':'Review pending services'}</a><a className="ghost" href={`/${locale}/command-center/provider-catalog`}>{es?'Revisar catálogo':'Review catalog'}</a></div></div><aside className="commandPreview"><div className="previewTop"><span className="liveDot"/> OWNER ACCESS <span className="previewTag">UNLIMITED APP</span></div><div className="previewGrid"><div><span>{es?'Rol':'Role'}</span><strong>PLATFORM_OWNER</strong></div><div><span>{es?'Acceso':'Access'}</span><strong>ALL INTERNAL CONSOLES</strong></div><div><span>{es?'Costo de uso':'Usage cost'}</span><strong>$0 OWNER ACCESS</strong></div><div><span>{es?'Controles duros':'Hard controls'}</span><strong>FAIL-CLOSED</strong></div></div></aside></section>
    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'VERDAD OPERATIVA':'OPERATING TRUTH'}</span><h2>{es?'Estado de la plataforma':'Platform status'}</h2></div><p>{es?'Métricas en vivo obtenidas directamente de la base de datos con tu sesión de propietario.':'Live metrics loaded directly from the database with your owner session.'}</p></div><div className="previewGrid">{metrics.map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>
    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'CONTROLES DEL PROPIETARIO':'OWNER CONTROLS'}</span><h2>{es?'Toda la aplicación, una consola':'The whole app, one console'}</h2></div><p>{es?'Cada módulo abre una superficie operativa existente. El Command Center centraliza acceso, visibilidad y decisión.':'Each module opens an existing operational surface. The Command Center centralizes access, visibility and decision-making.'}</p></div><div className="featureGrid">{controls.map(([name,description,target],index)=>{const href=target.startsWith('/')?target:target.startsWith('..')?`/${locale}/${target.replace('../','')}`:`/${locale}/command-center/${target}`;return <article className="feature premiumCard" key={name}><div className="icon">{String(index+1).padStart(2,'0')}</div><h3>{name}</h3><p>{description}</p><div className="actions"><a className="ghost" href={href}>{es?'Abrir control':'Open control'}</a></div></article>;})}</div></section>
    <section className="section"><div className="sectionHead"><div><span className="eyebrow">SOFIA · OWNER ONLY</span><h2>{es?'Solicitudes recientes':'Recent requests'}</h2></div></div>{intakeError?<p>{es?'No se pudieron cargar las solicitudes de Sofia.':'Unable to load Sofia intake records.'}</p>:<div className="featureGrid">{(intakes??[]).map((item)=><article className="feature" key={item.id}><div className="icon">{item.channel==='WHATSAPP'?'W':'P'}</div><h3>{item.sender_full_name}</h3><p><strong>ID:</strong> {item.platform_transaction_reference??(es?'Pendiente':'Pending')}</p><p><strong>{es?'Solicitud':'Request'}:</strong> {item.request_type}{item.requested_amount?` · ${item.requested_amount} ${item.requested_currency}`:''}</p><p><strong>{es?'Pago':'Payment'}:</strong> {item.payment_status} · <strong>{es?'Estado':'Status'}:</strong> {item.intake_status}</p><div className="featureMeta">{new Date(item.created_at).toLocaleString()}</div></article>)}</div>}</section>
    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'RED DE RELACIONES':'RELATIONSHIP GRAPH'}</span><h2>{es?'Una transacción, todos los participantes':'One transaction, every participant'}</h2></div></div>{networkError?<p>{es?'No se pudo cargar la red de participantes.':'Unable to load the participant network.'}</p>:<div className="featureGrid">{(network??[]).map((item)=><article className="feature" key={item.id}><div className="icon">N</div><h3>{item.display_label||item.participant_role}</h3><p><strong>{es?'Transacción':'Transaction'}:</strong> {item.platform_transaction_reference}</p><p><strong>{es?'Rol':'Role'}:</strong> {item.participant_role}</p><p><strong>{es?'Estado':'Status'}:</strong> {item.participation_status}</p><div className="featureMeta">{new Date(item.joined_at).toLocaleString()}</div></article>)}</div>}</section>
    <section className="section"><div className="sectionHead"><div><span className="eyebrow">OWNER ONLY</span><h2>{es?'Directorio privado de remitentes':'Private sender directory'}</h2></div></div>{senderError?<p>{es?'No se pudieron cargar los remitentes.':'Unable to load sender records.'}</p>:<div className="featureGrid">{(senders??[]).map((sender)=><article className="feature" key={sender.remittance_intent_id}><div className="icon">S</div><h3>{sender.sender_full_name}</h3><p><strong>{es?'Teléfono':'Phone'}:</strong> {sender.sender_phone}</p>{sender.sender_email&&<p><strong>Email:</strong> {sender.sender_email}</p>}<p><strong>ID:</strong> {sender.remittance_intent_id}</p><div className="featureMeta">{new Date(sender.captured_at).toLocaleString()}</div></article>)}</div>}</section>
    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">OWNER AUTHORITY</span><h2>{es?'Sin límites de producto. Con límites de seguridad.':'No product limits. Security limits remain.'}</h2></div><p>{es?'Tu rol de propietario no tiene paywall interno ni límite de uso dentro de MY CUBA CASH. Los controles de seguridad, identidad, fraude, sanciones y autorizaciones externas permanecen independientes.':'Your owner role has no internal paywall or usage limit inside MY CUBA CASH. Security, identity, fraud, sanctions and external authorization controls remain independent.'}</p></section>
  </main>;
}
