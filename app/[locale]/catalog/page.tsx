import {localeOf} from '@/lib/i18n';
import {supabaseServer} from '@/lib/supabase/server';
import {APP_COMMUNICATIONS,whatsappUrl} from '@/lib/communications';

export const dynamic='force-dynamic';

export default async function Catalog({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<{type?:string;category?:string}>}){
  const {locale:raw}=await params;const locale=localeOf(raw);const es=locale==='es';const query=await searchParams;
  const supabase=await supabaseServer();
  let db=supabase.from('provider_catalog_items').select('id,provider_user_id,business_id,item_type,title,description,category,currency,price,unit,stock_quantity,service_area,image_url,conditions,sponsored_until,updated_at').eq('review_status','APPROVED').eq('available',true).order('sponsored_until',{ascending:false,nullsFirst:false}).order('updated_at',{ascending:false}).limit(100);
  if(['PRODUCT','SERVICE'].includes(String(query.type??'').toUpperCase()))db=db.eq('item_type',String(query.type).toUpperCase());
  if(query.category)db=db.eq('category',String(query.category));
  const {data,error}=await db;
  const businessIds=[...new Set((data??[]).map((item:any)=>item.business_id))];
  const {data:businesses}=businessIds.length?await supabase.from('businesses').select('id,legal_name,trade_name,country_code').in('id',businessIds):{data:[] as any[]};
  const names=new Map((businesses??[]).map((business:any)=>[business.id,business.trade_name||business.legal_name]));
  const providerIds=[...new Set((data??[]).map((item:any)=>item.provider_user_id))];
  const {data:providers}=providerIds.length?await supabase.from('delivery_provider_public_directory').select('user_id,public_provider_id,country_code,founding_supplier,founding_slot').in('user_id',providerIds):{data:[] as any[]};
  const providerMap=new Map((providers??[]).map((provider:any)=>[provider.user_id,provider]));
  const support=APP_COMMUNICATIONS.whatsappPrimary;

  return <main className="shell premiumAppShell">
    <nav className="nav premiumNav"><a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Catálogo privado':'Private-sector catalog'}</small></a><div className="navlinks"><a href={`/${locale}/providers/join`}>Founding 100</a><a href={`/${locale}/business-pricing`}>{es?'Planes':'Plans'}</a><a href={`/${locale}/catalog/manage`}>{es?'Gestionar catálogo':'Manage catalog'}</a><a href={`/${locale}/catalog/sponsor`}>{es?'Promocionar':'Promote'}</a><a href={`/${locale}/marketplace`}>Marketplace</a></div></nav>
    <section className="hero"><div className="heroCopy"><span className="eyebrow">{es?'PRODUCTOS + SERVICIOS VERIFICADOS':'VERIFIED PRODUCTS + SERVICES'}</span><h1>{es?'Compra directamente a MIPYMEs y emprendedores verificados.':'Buy directly from verified private businesses and entrepreneurs.'}</h1><p className="heroLead">{es?'Explora catálogos publicados por los propios proveedores: precios, disponibilidad, zonas y condiciones visibles antes de coordinar.':'Browse provider-authored catalogs with visible prices, availability, areas and conditions before coordinating.'}</p></div></section>
    <section className="section"><div className="actions" style={{marginBottom:24}}><a className="ghost" href={`/${locale}/catalog`}>{es?'Todo':'All'}</a><a className="ghost" href={`/${locale}/catalog?type=PRODUCT`}>{es?'Productos':'Products'}</a><a className="ghost" href={`/${locale}/catalog?type=SERVICE`}>{es?'Servicios':'Services'}</a></div>
      {error?<div className="feature premiumCard"><h3>{es?'Catálogo temporalmente no disponible':'Catalog temporarily unavailable'}</h3></div>:!data?.length?<div className="feature premiumCard"><h3>{es?'Todavía no hay artículos aprobados publicados.':'No approved catalog items are public yet.'}</h3><p>{es?'No mostramos productos ni servicios inventados.':'We do not show fabricated products or services.'}</p></div>:<div className="featureGrid">{data.map((item:any)=>{
        const provider=providerMap.get(item.provider_user_id);const sponsored=Boolean(item.sponsored_until&&new Date(item.sponsored_until).getTime()>Date.now());
        return <article className="feature premiumCard" key={item.id}>{item.image_url&&<img src={item.image_url} alt={item.title} style={{width:'100%',height:200,objectFit:'cover',borderRadius:12}}/>}<span className="eyebrow">{item.item_type==='PRODUCT'?(es?'PRODUCTO':'PRODUCT'):(es?'SERVICIO':'SERVICE')} · {es?'VERIFICADO':'VERIFIED'}</span>{sponsored&&<span className="foundingBadge">{es?'PATROCINADO':'SPONSORED'}</span>}{provider?.founding_supplier&&<span className="foundingBadge">{es?`PROVEEDOR FUNDADOR #${provider.founding_slot}`:`FOUNDING SUPPLIER #${provider.founding_slot}`}</span>}<h3>{item.title}</h3><p><strong>{names.get(item.business_id)??(es?'Negocio privado verificado':'Verified private business')}</strong></p>{provider&&<p><strong>ID:</strong> {provider.public_provider_id} · <strong>{es?'País':'Country'}:</strong> {provider.country_code} · <strong>{es?'Membresía':'Membership'}:</strong> {es?'ACTIVA':'ACTIVE'}</p>}{item.description&&<p>{item.description}</p>}<p><strong>{es?'Precio':'Price'}:</strong> {item.price==null?(es?'Consultar':'Ask'):`${Number(item.price).toLocaleString()} ${item.currency}`}{item.unit?` / ${item.unit}`:''}</p>{item.stock_quantity!=null&&<p><strong>{es?'Disponibilidad':'Availability'}:</strong> {item.stock_quantity} {item.unit??''}</p>}{item.service_area&&<p><strong>{es?'Zona':'Area'}:</strong> {item.service_area}</p>}{item.conditions&&<p>{item.conditions}</p>}<div className="actions"><a className="cta" href={whatsappUrl(support.e164,es?`Quiero comprar o solicitar: ${item.title}. Referencia de catálogo: ${item.id}`:`I want to buy or request: ${item.title}. Catalog reference: ${item.id}`)}>{es?'Solicitar':'Request'}</a></div></article>;
      })}</div>}
    </section>
  </main>;
}
