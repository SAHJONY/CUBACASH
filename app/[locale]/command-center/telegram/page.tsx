import {supabaseServer} from '@/lib/supabase/server';
import {localeOf} from '@/lib/i18n';
import TelegramPublisher from './TelegramPublisher';

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

  const botConfigured=Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
  const channelConfigured=Boolean(process.env.TELEGRAM_CHANNEL_ID?.trim());
  const ready=botConfigured&&channelConfigured;

  return <main className="shell premiumAppShell">
    <nav className="nav premiumNav"><a href={`/${locale}/command-center`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>Telegram</small></a><div className="navlinks"><a href={`/${locale}/command-center`}>{es?'Centro de Comando':'Command Center'}</a><a href={`/${locale}/payments`}>{es?'Pagos':'Payments'}</a></div><span className="miniCta">OWNER ONLY</span></nav>

    <section className="hero"><div className="heroCopy"><div className="eyebrow">TELEGRAM CHANNEL</div><h1>{es?'Canal oficial de adquisición y comunidad':'Official acquisition and community channel'}</h1><p className="heroLead">{es?'Publica novedades, posters, oportunidades del marketplace y llamados a visitar MY CUBA CASH directamente desde el Command Center.':'Publish updates, posters, marketplace opportunities and calls to visit MY CUBA CASH directly from the Command Center.'}</p><p className="heroSub">{es?'El canal queda separado de las operaciones financieras y no cambia estados de pagos, sanciones, KYC/KYB ni transacciones.':'The channel is separate from financial operations and cannot change payment, sanctions, KYC/KYB or transaction states.'}</p></div></section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'ESTADO LOCAL':'LOCAL STATUS'}</span><h2>{ready?(es?'Variables de producción detectadas':'Production variables detected'):(es?'Falta configuración segura':'Secure configuration missing')}</h2></div><p>{es?'El publicador solo funciona cuando el bot y el canal están configurados como secretos del entorno. Usa únicamente un token nuevo y no expuesto.':'Publishing works only when both bot and channel are configured as environment secrets. Use only a newly generated, unexposed token.'}</p></div><div className="previewGrid"><div><span>TELEGRAM_BOT_TOKEN</span><strong>{botConfigured?'CONFIGURED':'MISSING'}</strong></div><div><span>TELEGRAM_CHANNEL_ID</span><strong>{channelConfigured?'CONFIGURED':'MISSING'}</strong></div></div></section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">{es?'PUBLICACIÓN EN VIVO':'LIVE PUBLISHING'}</span><h2>{es?'Controla el canal desde MY CUBA CASH':'Run the channel from MY CUBA CASH'}</h2></div><p>{es?'Verifica la conexión real del bot y publica texto o una imagen HTTPS con un botón directo a MY CUBA CASH.':'Verify the bot connection and publish text or an HTTPS image with a direct button to MY CUBA CASH.'}</p></div><TelegramPublisher es={es}/></section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">CONTENT PLAN</span><h2>{es?'Qué publicar primero':'What to publish first'}</h2></div></div><div className="featureGrid"><article className="feature premiumCard"><h3>{es?'Familia':'Family'}</h3><p>{es?'Poster de apoyo familiar con enlace directo a MY CUBA CASH.':'Family-support poster with direct link to MY CUBA CASH.'}</p></article><article className="feature premiumCard"><h3>{es?'Negocios':'Business'}</h3><p>{es?'Marketplace privado, productos, servicios y oportunidades para emprendedores.':'Private marketplace, products, services and opportunities for entrepreneurs.'}</p></article><article className="feature premiumCard"><h3>{es?'Servicios y entregas':'Services and delivery'}</h3><p>{es?'Proveedores, cobertura, entregas y seguimiento disponible dentro de la plataforma.':'Providers, coverage, delivery and tracking available inside the platform.'}</p></article><article className="feature premiumCard"><h3>Sofia</h3><p>{es?'Explica cómo Sofia ayuda a iniciar solicitudes, comparar opciones y dar seguimiento.':'Explain how Sofia helps start requests, compare options and follow progress.'}</p></article></div></section>

    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">SECURITY</span><h2>{es?'Token secreto, canal controlado':'Secret token, controlled channel'}</h2></div><p>{es?'Nunca se muestra ni guarda el token en el código o en el navegador. Si un token se expone, debe revocarse y sustituirse antes de habilitar el publicador. El bot debe ser administrador del canal para publicar.':'The token is never displayed or stored in code or the browser. If a token is exposed, it must be revoked and replaced before publishing is enabled. The bot must be a channel administrator to publish.'}</p></section>
  </main>;
}
