import {supabaseServer} from '@/lib/supabase/server';
import {localeOf} from '@/lib/i18n';
import ManualPaymentReview from './ManualPaymentReview';

export default async function PlatformFeesPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const es=locale==='es';
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();

  if(!user){
    return <main className="shell premiumAppShell"><section className="section"><h1>{es?'Acceso requerido':'Authentication required'}</h1><p>{es?'Inicia sesión con la cuenta propietaria para revisar pagos manuales.':'Sign in with the owner account to review manual payments.'}</p><a className="cta premiumCta" href={`/${locale}/auth?next=${encodeURIComponent(`/${locale}/command-center/platform-fees`)}`}>{es?'Iniciar sesión':'Sign in'}</a></section></main>;
  }

  const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();
  if(!profile||!['platform_owner','platform_admin'].includes(profile.role)){
    return <main className="shell premiumAppShell"><section className="section"><h1>{es?'Acceso restringido':'Restricted access'}</h1><p>{es?'Solo un revisor de pagos de confianza puede confirmar tarifas manualmente.':'Only a trusted payment reviewer may confirm fees manually.'}</p></section></main>;
  }

  const {data,error}=await supabase.from('transaction_platform_fee_gates')
    .select('id,entity_type,entity_id,fee_amount,fee_currency,fee_status,customer_business_id,created_at')
    .in('fee_status',['PENDING','DUE'])
    .order('created_at',{ascending:false})
    .limit(100);

  const items=(data??[]).map(item=>({...item,fee_amount:Number(item.fee_amount)}));

  return <main className="shell premiumAppShell">
    <nav className="nav premiumNav"><a href={`/${locale}/command-center`} className="brandwrap"><div className="brand">mycubacash</div><small>{es?'Revisión de tarifas':'Fee review'}</small></a><div className="navlinks"><a href={`/${locale}/command-center`}>{es?'Centro de Comando':'Command Center'}</a><a href={`/${locale}/cash`}>{es?'Libro de efectivo':'Cash Ledger'}</a></div><span className="miniCta">TRUSTED REVIEW</span></nav>
    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'PAGOS MANUALES DE CONFIANZA':'TRUSTED MANUAL PAYMENTS'}</span><h1>{es?'Confirmación manual de tarifas de plataforma':'Manual platform fee confirmation'}</h1></div><p>{es?'Usa esta consola únicamente después de verificar evidencia real de pago. La confirmación marca el receivable y el fee gate como PAID y conserva el revisor, la referencia, el método y la evidencia en el historial auditable.':'Use this console only after verifying real payment evidence. Confirmation marks both the receivable and fee gate as PAID and preserves reviewer, reference, method, and evidence in the audit history.'}</p></div>
      {error?<div className="feature premiumCard"><h3>{es?'No se pudieron cargar las tarifas':'Unable to load fees'}</h3><p>{error.message}</p></div>:<ManualPaymentReview items={items} es={es}/>} 
    </section>
    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">FAIL-CLOSED</span><h2>{es?'Nunca confirmar sin evidencia':'Never confirm without evidence'}</h2></div><p>{es?'Esta acción no mueve el dinero principal de la transacción. Solo confirma que la tarifa de mycubacash fue recibida por un medio externo y verificado por un revisor autorizado.':'This action never moves transaction principal. It only confirms that the mycubacash platform fee was received through an external method and verified by an authorized reviewer.'}</p></section>
  </main>;
}
