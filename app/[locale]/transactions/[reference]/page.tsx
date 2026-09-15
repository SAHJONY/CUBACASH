import {supabaseServer} from '@/lib/supabase/server';
import {localeOf} from '@/lib/i18n';
import EvidenceForm from './EvidenceForm';

function nextStep(item:{transfer_status:string;compliance_state:string;sanctions_state:string;settlement_status:string},es=false){
  if(item.sanctions_state==='BLOCKED'||item.compliance_state==='BLOCK') return es?'Esta solicitud no puede continuar. Contacta soporte si consideras que el estado es incorrecto.':'This request cannot proceed. Contact support if you believe the status is incorrect.';
  if(item.compliance_state==='HOLD'||item.sanctions_state!=='CLEAR') return es?'La revisión sigue pendiente. Mantén tu información actualizada y envía la evidencia solicitada.':'Review is still required. Keep your information current and submit any requested supporting information.';
  if(item.transfer_status==='PENDING_REVIEW'||item.transfer_status==='DRAFT') return es?'Tu solicitud espera revisión antes de poder ser dirigida a un proveedor autorizado.':'Your request is awaiting review before it can be routed to an authorized provider.';
  if(item.transfer_status==='READY_FOR_PARTNER') return es?'La solicitud está lista para ser dirigida a un proveedor autorizado. No envíes fondos fuera de las instrucciones mostradas por MY CUBA CASH o Sofia.':'The request is ready for authorized-provider routing. Do not send funds outside instructions shown by MY CUBA CASH or Sofia.';
  if(['SUBMITTED','PROCESSING'].includes(item.transfer_status)) return es?'El procesamiento está en curso. Sigue esta página para la próxima actualización verificada.':'Processing is underway. Track this page for the next verified status update.';
  if(item.transfer_status==='AVAILABLE') return es?'El valor aparece como disponible. Sigue las instrucciones aprobadas de recogida, comercio o entrega vinculadas a esta transacción.':'Value is reported available. Follow the approved pickup, merchant or delivery instructions tied to this transaction.';
  if(item.transfer_status==='DELIVERED') return es?'La entrega aparece como completada. Conserva recibos y confirmaciones para tu historial.':'Delivery is reported complete. Keep receipts and confirmation records for your transaction history.';
  if(item.transfer_status==='FAILED') return es?'El procesamiento falló. No repitas el pago hasta recibir nuevas instrucciones de MY CUBA CASH o del proveedor autorizado.':'Processing failed. Do not retry payment until MY CUBA CASH or the authorized provider gives a new instruction.';
  return es?'Sigue esta página para la próxima actualización verificada.':'Track this page for the next verified status update.';
}

export default async function TransactionDetail({params}:{params:Promise<{locale:string;reference:string}>}){
  const {locale:raw,reference}=await params;const locale=localeOf(raw);const es=locale==='es';
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return <main className="shell"><section className="section"><h1>{es?'Detalles de la transacción':'Transaction Details'}</h1><p>{es?'Inicia sesión para ver esta transacción.':'Sign in to view this transaction.'}</p><div className="actions"><a className="cta" href={`/${locale}/auth`}>{es?'Iniciar sesión':'Sign In'}</a></div></section></main>;

  const {data:item}=await supabase.from('remittance_intents').select('id,reference,remittance_type,purpose,origin_country,destination_country,send_currency,send_amount,receive_currency,expected_receive_amount,compliance_state,sanctions_state,risk_band,transfer_status,settlement_status,partner_code,partner_reference,created_at,updated_at').eq('reference',reference).single();
  if(!item) return <main className="shell"><section className="section"><h1>{es?'Transacción no encontrada':'Transaction not found'}</h1><a className="cta" href={`/${locale}/transactions`}>{es?'Volver a Mis transacciones':'Back to My Transactions'}</a></section></main>;

  const [{data:pref},{data:evidence}]=await Promise.all([
    supabase.from('remittance_customer_preferences').select('payment_preference,requested_fulfillment,delivery_requested,customer_notes,updated_at').eq('remittance_intent_id',item.id).maybeSingle(),
    supabase.from('remittance_customer_evidence').select('id,evidence_type,evidence_reference,customer_note,review_status,created_at,reviewed_at').eq('remittance_intent_id',item.id).order('created_at',{ascending:false})
  ]);
  const step=nextStep(item,es);

  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav"><a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Detalles de la transacción':'Transaction Details'}</small></a><div className="navlinks"><a href={`/${locale}/transactions`}>{es?'Mis transacciones':'My Transactions'}</a><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a><a href={`/${locale}/privacy`}>{es?'Privacidad':'Privacy'}</a></div></nav>
    <section className="hero"><div className="heroCopy"><div className="eyebrow">{es?'TRANSACCIÓN':'TRANSACTION'} {item.transfer_status}</div><h1>{item.reference}</h1><p className="heroLead">{item.origin_country} → {item.destination_country} · {item.send_amount} {item.send_currency}</p></div></section>
    <section className="section" style={{maxWidth:980,margin:'0 auto'}}>
      <div className="featureGrid">
        <article className="feature"><h2>{es?'Estado actual':'Current status'}</h2><p><strong>{es?'Transferencia:':'Transfer:'}</strong> {item.transfer_status}</p><p><strong>{es?'Revisión:':'Review:'}</strong> {item.compliance_state}</p><p><strong>{es?'Sanciones:':'Sanctions:'}</strong> {item.sanctions_state}</p><p><strong>{es?'Liquidación:':'Settlement:'}</strong> {item.settlement_status}</p><div className="featureMeta">{es?'Actualizada':'Updated'} {new Date(item.updated_at).toLocaleString(es?'es-US':'en-US')}</div></article>
        <article className="feature"><h2>{es?'Qué sucede ahora':'What happens next'}</h2><p>{step}</p><p>{es?'Nunca consideres verificada una referencia de pago enviada por el cliente hasta que MY CUBA CASH o el proveedor autorizado la marque como revisada.':'Never treat a customer-submitted payment reference as verified until MY CUBA CASH or the authorized provider marks it reviewed.'}</p></article>
        <article className="feature"><h2>{es?'Tu solicitud':'Your request'}</h2><p><strong>{es?'Propósito:':'Purpose:'}</strong> {item.purpose}</p><p><strong>{es?'Entrega de valor:':'Fulfillment:'}</strong> {pref?.requested_fulfillment??(es?'No seleccionado':'Not selected')}</p><p><strong>{es?'Preferencia de pago:':'Payment preference:'}</strong> {pref?.payment_preference??(es?'No seleccionada':'Not selected')}</p><p><strong>{es?'Entrega solicitada:':'Delivery requested:'}</strong> {pref?.delivery_requested?(es?'Sí':'Yes'):(es?'No':'No')}</p></article>
      </div>
      <div style={{marginTop:24}}><EvidenceForm remittanceIntentId={item.id} es={es}/></div>
      <section className="section" style={{paddingLeft:0,paddingRight:0}}><div className="sectionHead"><div><span className="eyebrow">{es?'EVIDENCIA DEL CLIENTE':'CUSTOMER EVIDENCE'}</span><h2>{es?'Referencias y notas enviadas':'Submitted references and notes'}</h2></div><p>{es?'Estos registros son evidencia para revisión; por sí solos no prueban un pago o una liquidación verificados.':'These records are evidence for review, not proof of verified payment or settlement by themselves.'}</p></div>
        {!evidence?.length?<p>{es?'Todavía no se ha enviado evidencia.':'No evidence submitted yet.'}</p>:<div className="featureGrid">{evidence.map(e=><article className="feature" key={e.id}><h3>{e.evidence_type}</h3><p><strong>{es?'Referencia:':'Reference:'}</strong> {e.evidence_reference}</p>{e.customer_note&&<p>{e.customer_note}</p>}<p><strong>{es?'Revisión:':'Review:'}</strong> {e.review_status}</p><div className="featureMeta">{es?'Enviada':'Submitted'} {new Date(e.created_at).toLocaleString(es?'es-US':'en-US')}</div></article>)}</div>}
      </section>
      <div className="actions"><a className="cta" href={`/${locale}/transactions`}>{es?'Volver a Mis transacciones':'Back to My Transactions'}</a><a className="ghost" href={`/${locale}#contact`}>Contact Sofia on WhatsApp Business</a></div>
    </section>
  </main>;
}
