import {supabaseServer} from '@/lib/supabase/server';
import {localeOf} from '@/lib/i18n';

function customerStatus(transfer:string,review:string,sanctions:string,es=false){
  if(sanctions==='BLOCKED'||review==='BLOCK') return es?'Bloqueada':'Blocked';
  if(review==='HOLD'||sanctions!=='CLEAR') return es?'Requiere revisión':'Needs review';
  if(['PENDING_REVIEW','DRAFT'].includes(transfer)) return es?'En revisión':'Under review';
  if(transfer==='READY_FOR_PARTNER') return es?'Lista para proveedor':'Ready for provider';
  if(['SUBMITTED','PROCESSING'].includes(transfer)) return es?'Procesando':'Processing';
  if(transfer==='AVAILABLE') return es?'Lista para receptor':'Ready for receiver';
  if(transfer==='DELIVERED') return es?'Entregada':'Delivered';
  if(transfer==='FAILED') return es?'Requiere atención':'Needs attention';
  return transfer.replaceAll('_',' ');
}

export default async function TransactionsPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;const locale=localeOf(raw);const es=locale==='es';
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return <main className="shell"><section className="section"><h1>{es?'Mis transacciones':'My Transactions'}</h1><p>{es?'Inicia sesión para ver tu historial de transacciones.':'Sign in to view your transaction history.'}</p><div className="actions"><a className="cta" href={`/${locale}/auth`}>{es?'Entrar / Crear cuenta':'Sign In / Create Account'}</a></div></section></main>;
  const {data,error}=await supabase.from('remittance_intents').select('id,reference,remittance_type,purpose,origin_country,destination_country,send_currency,send_amount,receive_currency,expected_receive_amount,compliance_state,sanctions_state,risk_band,transfer_status,settlement_status,created_at,updated_at').order('created_at',{ascending:false}).limit(100);

  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav"><a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Mis transacciones':'My Transactions'}</small></a><div className="navlinks"><a href={`/${locale}/start`}>{es?'Nueva solicitud':'Start Transaction'}</a><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a><a href={`/${locale}/privacy`}>{es?'Privacidad':'Privacy'}</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">{es?'SEGUIMIENTO DE TRANSACCIONES':'TRANSACTION TRACKING'}</div><h1>{es?'Sabe qué está pasando y cuál es el próximo paso.':'Know what is happening and what to do next.'}</h1><p className="heroLead">{es?'Cada solicitud tiene una referencia permanente de MY CUBA CASH, un estado comprensible y una página de detalle para aportar información de respaldo.':'Each request has a permanent MY CUBA CASH reference, customer-readable status and a detail page for submitting supporting information.'}</p></div></section>
    <section className="section">
      {error?<p>{es?'No se pueden cargar tus transacciones ahora mismo.':'Unable to load your transactions right now.'}</p>:!data?.length?<div className="feature"><h2>{es?'Todavía no hay transacciones':'No transactions yet'}</h2><p>{es?'Crea tu primera solicitud de apoyo familiar para recibir una referencia de MY CUBA CASH.':'Create your first family support request to receive a MY CUBA CASH transaction reference.'}</p><div className="actions"><a className="cta" href={`/${locale}/start`}>{es?'Crear solicitud':'Start Transaction'}</a></div></div>:
      <div className="featureGrid">{data.map(item=><article className="feature" key={item.id}><div className="icon">{item.remittance_type==='BUSINESS'?'B':'F'}</div><h3>{item.reference}</h3><p><strong>{item.remittance_type}</strong> · {item.origin_country} → {item.destination_country}</p><p><strong>{es?'Importe:':'Amount:'}</strong> {item.send_amount} {item.send_currency}</p><p><strong>{es?'Estado del cliente:':'Customer status:'}</strong> {customerStatus(item.transfer_status,item.compliance_state,item.sanctions_state,es)}</p><p><strong>{es?'Liquidación:':'Settlement:'}</strong> {item.settlement_status}</p><div className="actions"><a className="cta" href={`/${locale}/transactions/${item.reference}`}>{es?'Ver detalles / Próximo paso':'View Details / Next Step'}</a></div><div className="featureMeta">{es?'Actualizada':'Updated'} {new Date(item.updated_at).toLocaleString(es?'es-US':'en-US')}</div></article>)}</div>}
    </section>
  </main>;
}
