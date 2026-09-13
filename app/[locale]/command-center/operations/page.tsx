import {supabaseServer} from '@/lib/supabase/server';
import {localeOf} from '@/lib/i18n';
import GeoOperationsMap,{type GeoProvider} from '@/components/GeoOperationsMap';

function money(value:number|null|undefined,currency='USD'){
  if(value==null) return null;
  try{return new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:2}).format(Number(value));}
  catch{return `${Number(value).toFixed(2)} ${currency}`;}
}

function etaLabel(min:number|null|undefined,max:number|null|undefined){
  if(min==null&&max==null) return null;
  if(min!=null&&max!=null) return `${min}–${max} min`;
  return min!=null?`From ${min} min`:`Up to ${max} min`;
}

function priceLabel(provider:any){
  const currency=provider.fee_currency||'USD';
  const base=money(provider.base_fee,currency);
  const perKm=money(provider.per_km_fee,currency);
  if(provider.pricing_model==='FLAT'&&base) return `${base} flat`;
  if(provider.pricing_model==='PER_DISTANCE'&&perKm) return `${perKm}/km`;
  if(provider.pricing_model==='HYBRID') return [base&&`${base} base`,perKm&&`${perKm}/km`].filter(Boolean).join(' + ')||'Quote required';
  return 'Quote required';
}

export default async function OperationsCommandCenter({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const supabase=await supabaseServer();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return <main className="shell"><section className="section"><h1>Operations Command Center</h1><p>Authentication required.</p></section></main>;
  const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();
  if(profile?.role!=='platform_owner') return <main className="shell"><section className="section"><h1>Operations Command Center</h1><p>Restricted to the platform owner.</p></section></main>;

  const [{data:providers},{data:intakes},{data:remittances}]=await Promise.all([
    supabase.from('delivery_provider_public_directory')
      .select('public_provider_id,display_name,city,region,country_code,verified,pricing_model,fee_currency,base_fee,per_km_fee,estimated_eta_min_minutes,estimated_eta_max_minutes,accepting_jobs,public_latitude,public_longitude,location_precision,updated_at')
      .eq('verified',true).order('updated_at',{ascending:false}).limit(500),
    supabase.from('sofia_order_intakes')
      .select('id,platform_transaction_reference,intake_status,payment_status,delivery_requested,receiver_confirmed_at,selected_delivery_provider_user_id,created_at')
      .order('created_at',{ascending:false}).limit(500),
    supabase.from('remittance_intents')
      .select('id,reference,remittance_type,origin_country,destination_country,send_currency,send_amount,compliance_state,sanctions_state,transfer_status,settlement_status,created_at')
      .order('created_at',{ascending:false}).limit(500)
  ]);

  const providerList=providers??[];
  const intakeList=intakes??[];
  const remittanceList=remittances??[];
  const activeProviders=providerList.filter(p=>p.accepting_jobs).length;
  const deliveryRequests=intakeList.filter(i=>i.delivery_requested&&!i.receiver_confirmed_at).length;
  const openIntakes=intakeList.filter(i=>!['CONVERTED','CANCELLED'].includes(i.intake_status)).length;
  const heldRemittances=remittanceList.filter(r=>r.compliance_state==='HOLD'||r.sanctions_state!=='CLEAR').length;
  const unsettled=remittanceList.filter(r=>r.settlement_status!=='SETTLED'&&!['CANCELLED','REFUNDED','FAILED'].includes(r.transfer_status)).length;

  const geoProviders:GeoProvider[]=providerList.filter(p=>p.public_latitude!=null&&p.public_longitude!=null).map(p=>({
    id:p.public_provider_id,name:p.display_name,city:p.city,region:p.region,country:p.country_code,
    latitude:Number(p.public_latitude),longitude:Number(p.public_longitude),precision:p.location_precision,
    acceptingJobs:p.accepting_jobs,priceLabel:priceLabel(p),etaLabel:etaLabel(p.estimated_eta_min_minutes,p.estimated_eta_max_minutes)
  }));

  return <main className="shell" dir={locale==='ar'?'rtl':'ltr'}>
    <nav className="nav"><a href={`/${locale}/command-center`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>Global Operations</small></a><div className="navlinks"><a href={`/${locale}/command-center`}>Command Center</a><a href={`/${locale}/delivery-providers`}>Delivery Network</a><a href={`/${locale}/transactions`}>Transactions</a></div></nav>

    <section className="hero"><div className="heroCopy"><div className="eyebrow">OWNER-ONLY GLOBAL OPERATIONS</div><h1>One operating picture for transactions, delivery capacity and exceptions.</h1><p className="heroLead">This view improves the system you already have without changing transaction execution. It surfaces operational demand, verified delivery capacity and exception queues from the existing MY CUBA CASH system of record.</p></div><aside className="commandPreview"><div className="previewTop"><span className="liveDot"/> Operations <span className="previewTag">OWNER ONLY</span></div><div className="previewGrid"><div><span>Providers accepting</span><strong>{activeProviders}</strong></div><div><span>Open delivery requests</span><strong>{deliveryRequests}</strong></div><div><span>Compliance/sanctions attention</span><strong>{heldRemittances}</strong></div><div><span>Unsettled remittances</span><strong>{unsettled}</strong></div></div></aside></section>

    <section className="section"><div className="featureGrid">
      <article className="feature"><span className="eyebrow">INTAKE</span><h2>{openIntakes}</h2><p>Open Sofia/customer intake records still requiring progression or review.</p></article>
      <article className="feature"><span className="eyebrow">DELIVERY</span><h2>{deliveryRequests}</h2><p>Delivery-requested records not yet receiver-confirmed.</p></article>
      <article className="feature"><span className="eyebrow">CAPACITY</span><h2>{activeProviders}/{providerList.length}</h2><p>Verified providers currently accepting new requests.</p></article>
      <article className="feature"><span className="eyebrow">EXCEPTIONS</span><h2>{heldRemittances}</h2><p>Remittances with compliance hold or sanctions state requiring attention. Existing fail-closed controls remain unchanged.</p></article>
    </div></section>

    <section className="section"><GeoOperationsMap providers={geoProviders} title="Worldwide verified delivery capacity"/></section>

    <section className="section"><div className="sectionHead"><div><span className="eyebrow">RECENT DELIVERY DEMAND</span><h2>Jobs needing operational attention</h2></div><p>Prioritized from the existing Sofia intake records. This view does not change payment, compliance, settlement or transaction states.</p></div>
      <div className="featureGrid">{intakeList.filter(i=>i.delivery_requested&&!i.receiver_confirmed_at).slice(0,24).map(item=><article className="feature" key={item.id}><h3>{item.platform_transaction_reference??'Reference pending'}</h3><p><strong>Intake:</strong> {item.intake_status}</p><p><strong>Payment:</strong> {item.payment_status}</p><p><strong>Provider:</strong> {item.selected_delivery_provider_user_id?'Assigned':'Needs selection'}</p><div className="featureMeta">Created {new Date(item.created_at).toLocaleString()}</div></article>)}</div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">OPERATING RULE</span><h2>Visibility improves decisions; it does not bypass controls.</h2></div><p>The Operations view is read-only orchestration intelligence over the current system. It does not move funds, clear sanctions, verify payments, alter settlement state or expose exact private addresses.</p></section>
  </main>;
}
