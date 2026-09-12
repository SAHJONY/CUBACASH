import {supabaseServer} from '@/lib/supabase/server';
import {localeOf} from '@/lib/i18n';

export default async function TelegramChannelPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();

  if(!user){
    const next=`/${locale}/command-center/telegram`;
    return <main className="shell premiumAppShell"><section className="section"><h1>{es?'Acceso requerido':'Authentication required'}</h1><p>{es?'Inicia sesión con la cuenta propietaria para administrar el canal de Telegram.':'Sign in with the owner account to manage the Telegram channel.'}</p><a className="cta premiumCta" href={`/${locale}/auth?next=${encodeURIComponent(next)}`}>{es?'Iniciar sesión':'Sign in'}</a></section></main>;
  }

  const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();
  if(profile?.role!=='platform_owner'){
    return <main className="shell premiumAppShell"><section className="section"><h1>{es?'Acceso restringido':'Restricted access'}</h1><p>{es?'Solo el propietario puede administrar este canal.':'Only the platform owner can manage this channel.'}</p></section></main>;
  }

  const botConfigured=Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const channelConfigured=Boolean(process.env.TELEGRAM_CHANNEL_ID);
  const ready=botConfigured&&channelConfigured;

  const welcome=es
    ?'Bienvenido al canal oficial de mycubacash. Aquí compartimos novedades de la plataforma, marketplace, servicios locales, entregas y recursos para familias y negocios del sector privado cubano. Visita https://mycubacash.com'
    :'Welcome to the official mycubacash channel. Here we share platform updates, marketplace opportunities, local services, delivery and resources for families and Cuba private-sector businesses. Visit https://mycubacash.com';

  return <main className="shell premiumAppShell">
    <nav className="nav premiumNav"><a href={`/${locale}/command-center`} className="brandwrap"><div className="brand">mycubacash</div><small>Telegram</small></a><div className="navlinks"><a href={`/${locale}/command-center`}>{es?'Centro de Comando':'Command Center'}</a><a href={`/${locale}/payments`}>{es?'Pagos':'Payments'}</a></div><span className="miniCta">OWNER ONLY</span></nav>

    <section className="hero"><div className="heroCopy"><div className="eyebrow">TELEGRAM CHANNEL</div><h1>{es?'Canal oficial de adquisición y comunidad':'Official acquisition and community channel'}</h1><p className="heroLead">{es?'Usa Telegram para publicar novedades, posters, oportunidades del marketplace y llamados a visitar mycubacash.com.':'Use Telegram to publish updates, posters, marketplace opportunities and calls to visit mycubacash.com.'}</p></div></section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'ESTADO':'STATUS'}</span><h2>{ready?(es?'Configuración detectada':'Configuration detected'):(es?'Configuración incompleta':'Configuration incomplete')}</h2></div></div><div className="previewGrid"><div><span>TELEGRAM_BOT_TOKEN</span><strong>{botConfigured?'CONFIGURED':'MISSING'}</strong></div><div><span>TELEGRAM_CHANNEL_ID</span><strong>{channelConfigured?'CONFIGURED':'MISSING'}</strong></div></div></section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'MENSAJE FIJADO':'PINNED MESSAGE'}</span><h2>{es?'Bienvenida recomendada':'Recommended welcome'}</h2></div></div><article className="feature premiumCard"><p>{welcome}</p><div className="actions"><a className="ghost" href={`https://t.me/share/url?url=${encodeURIComponent('https://mycubacash.com')}&text=${encodeURIComponent(welcome)}`} target="_blank" rel="noreferrer">{es?'Abrir en Telegram':'Open in Telegram'}</a></div></article></section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">CONTENT PLAN</span><h2>{es?'Qué publicar primero':'What to publish first'}</h2></div></div><div className="featureGrid"><article className="feature premiumCard"><h3>{es?'Familia':'Family'}</h3><p>{es?'Poster de apoyo familiar con enlace directo a mycubacash.com.':'Family-support poster with direct link to mycubacash.com.'}</p></article><article className="feature premiumCard"><h3>{es?'Negocios':'Business'}</h3><p>{es?'Marketplace privado, productos, servicios y oportunidades para emprendedores.':'Private marketplace, products, services and opportunities for entrepreneurs.'}</p></article><article className="feature premiumCard"><h3>{es?'Servicios y entregas':'Services and delivery'}</h3><p>{es?'Proveedores, cobertura, entregas y seguimiento disponible dentro de la plataforma.':'Providers, coverage, delivery and tracking available inside the platform.'}</p></article><article className="feature premiumCard"><h3>Sofia</h3><p>{es?'Explica cómo Sofia ayuda a iniciar solicitudes, comparar opciones y dar seguimiento.':'Explain how Sofia helps start requests, compare options and follow progress.'}</p></article></div></section>

    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">SECURITY</span><h2>{es?'Nunca guardes el token en el código':'Never store the token in code'}</h2></div><p>{es?'El token del bot debe permanecer únicamente como secreto del entorno de producción. Si un token se expone, revócalo y genera uno nuevo antes de activar el canal.':'The bot token must remain only as a production environment secret. If a token is exposed, revoke it and generate a new one before activating the channel.'}</p></section>
  </main>;
}
