import { copy, localeOf } from '@/lib/i18n';

const familyEn=[
  ['Family beneficiaries','Manage people receiving family support with identity and delivery-method state.'],
  ['Send family support','Create a FAMILY remittance intent for a person beneficiary.'],
  ['Receiver choice','Where supported, the beneficiary can choose an eligible cash payout route or approved private-sector goods and services.'],
  ['Track delivery','Follow review, partner processing, availability, delivery and settlement from one reference.']
] as const;

const businessEn=[
  ['Business beneficiary','Register a business recipient separately from a family beneficiary.'],
  ['Business payment','Create a BUSINESS remittance intent tied to an owned sender business and commercial purpose.'],
  ['Invoice / purpose evidence','Keep commercial purpose, supporting evidence and counterparty state attached to the transfer record.'],
  ['Business reconciliation','Match provider settlement, fees and delivered amount against the expected commercial payment.']
] as const;

const deliveryEn=[
  ['Independent delivery provider','A single person may register for delivery work, including part-time availability, without becoming a remittance intermediary.'],
  ['Private-business delivery provider','A verified private-sector business can register its delivery service separately from its merchant role.'],
  ['Multi-role account','The same account may be a customer, family beneficiary and independent delivery provider. Each role keeps separate permissions.'],
  ['Beneficiary rights stay intact','A delivery provider who is personally receiving family support can receive their own FAMILY remittance like any other eligible beneficiary.']
] as const;


const familyEs=[
  ['Beneficiarios familiares','Administra a las personas que reciben apoyo familiar con estado de identidad y método de entrega.'],
  ['Enviar apoyo familiar','Crea una solicitud de remesa FAMILIAR para un beneficiario individual.'],
  ['Elección del receptor','Cuando esté disponible, el beneficiario puede elegir una ruta elegible de efectivo o bienes y servicios aprobados del sector privado.'],
  ['Seguimiento de entrega','Sigue revisión, procesamiento del proveedor, disponibilidad, entrega y conciliación desde una sola referencia.']
] as const;
const businessEs=[
  ['Beneficiario comercial','Registra un negocio receptor separado de un beneficiario familiar.'],
  ['Pago comercial','Crea una solicitud COMERCIAL vinculada a un negocio remitente propio y a un propósito comercial.'],
  ['Factura y evidencia','Mantén propósito comercial, evidencia de respaldo y estado de contraparte unidos al registro.'],
  ['Conciliación comercial','Compara liquidación del proveedor, tarifas e importe entregado con el pago comercial esperado.']
] as const;
const deliveryEs=[
  ['Proveedor independiente de entrega','Una persona puede registrarse para trabajos de entrega, incluso a tiempo parcial, sin convertirse en intermediario de remesas.'],
  ['Negocio privado de entrega','Un negocio privado verificado puede registrar su servicio de entrega separado de su rol comercial.'],
  ['Cuenta con múltiples roles','La misma cuenta puede ser cliente, beneficiario familiar y proveedor independiente de entrega. Cada rol mantiene permisos separados.'],
  ['Derechos del beneficiario','Un proveedor de entrega que recibe apoyo familiar personalmente puede recibir su propia remesa FAMILIAR como cualquier otro beneficiario elegible.']
] as const;

const crypto=[
  ['USDC','Ethereum · Solana'],
  ['USDT','Ethereum · Solana'],
  ['BTC','Bitcoin'],
  ['ETH','Ethereum']
] as const;

export default async function Remittances({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const t=copy[locale];
  const rtl=locale==='ar';
  const es=locale==='es';
  const family=es?familyEs:familyEn;
  const business=es?businessEs:businessEn;
  const delivery=es?deliveryEs:deliveryEn;
  return <main className="shell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{t.tag}</small></a>
      <div className="navlinks"><a href={`/${locale}/dashboard`}>{t.dashboard}</a><a href={`/${locale}/cash`}>{es?'Registro de efectivo':'Cash Ledger'}</a><a href={`/${locale}/agents`}>{es?'Agentes IA':'AI Agents'}</a><span>{t.compliance}</span></div>
      <a className="miniCta" href="/api/auth/status">{es?'Estado de la cuenta':'Account status'}</a>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow">{es?'FAMILIA + NEGOCIOS + RED DE ENTREGA':'FAMILY + BUSINESS + DELIVERY NETWORK'}</div>
        <h1>{es?'Envía apoyo. Paga a negocios. Entrega a la familia. Mantén cada rol trazable.':'Send support. Pay businesses. Deliver to family. Keep every role traceable.'}</h1>
        <p className="heroLead">{es?'MY CUBA CASH separa remesas familiares, pagos de negocios privados y actividad de proveedores de entrega para que una persona pueda tener varios roles legítimos sin mezclar permisos.':'MY CUBA CASH separates family remittances, private-business payments and delivery-provider activity so one person can hold multiple legitimate roles without those permissions bleeding into one another.'}</p>
        <p className="heroSub">{es?'Fiat y cripto aprobada pueden ofrecerse como preferencias de fondeo o liquidación solo cuando un proveedor debidamente autorizado soporte el corredor. Ser proveedor de entrega nunca autoriza a transmitir fondos de remesas para terceros.':'Fiat and approved crypto can be offered as funding or settlement preferences where an appropriately authorized provider supports the corridor. Delivery-provider status never authorizes a person or business to transmit remittance funds for others.'}</p>
        <div className="actions"><a className="cta" href="#family">{es?'Remesa familiar':'Family remittance'}</a><a className="ghost" href="#delivery">{es?'Proveedores de entrega':'Delivery providers'}</a></div>
      </div>
      <aside className="commandPreview" aria-label={es?'Resumen de remesas':'Remittance overview'}>
        <div className="previewTop"><span className="liveDot"/> {es?'Control de Remesas':'Remittance Control'} <span className="previewTag">{es?'ROLES SEPARADOS':'ROLE-SEPARATED'}</span></div>
        <div className="previewGrid">
          <div><span>{es?'Flujos principales':'Primary flows'}</span><strong>{es?'FAMILIA + NEGOCIOS':'FAMILY + BUSINESS'}</strong></div>
          <div><span>{es?'Proveedores de entrega':'Delivery providers'}</span><strong>{es?'PERSONA + NEGOCIO':'INDIVIDUAL + BUSINESS'}</strong></div>
          <div><span>{es?'Movimiento de fondos':'Funds movement'}</span><strong>{es?'SOLO RUTA AUTORIZADA':'AUTHORIZED ROUTE ONLY'}</strong></div>
          <div><span>{es?'Tarifas de plataforma':'Platform fees'}</span><strong>{es?'SOLO USD':'USD ONLY'}</strong></div>
        </div>
      </aside>
    </section>

    <section className="section" id="family">
      <div className="sectionHead"><div><span className="eyebrow">{es?'REMESA FAMILIAR':'FAMILY REMITTANCE'}</span><h2>{es?'Apoyo familiar de persona a persona':'Person-to-person family support'}</h2></div><p>{es?'Diseñado para apoyo familiar legítimo a una persona beneficiaria. El beneficiario puede tener otro rol en la plataforma sin cambiar las reglas de la remesa FAMILIAR.':'Designed for legitimate family support to a person beneficiary. A beneficiary may also hold another platform role, including independent delivery provider, without changing the rules that apply to the FAMILY remittance.'}</p></div>
      <div className="featureGrid">{family.map(([title,description],i)=><article className="feature" key={title}><div className="icon">F{String(i+1).padStart(2,'0')}</div><h3>{title}</h3><p>{description}</p><div className="featureMeta">FAMILY FLOW</div></article>)}</div>
    </section>

    <section className="section" id="delivery">
      <div className="sectionHead"><div><span className="eyebrow">{es?'PROVEEDORES DE ENTREGA':'DELIVERY PROVIDERS'}</span><h2>{es?'Personas a tiempo parcial y negocios privados':'Part-time individuals and private businesses'}</h2></div><p>{es?'Personas y negocios privados verificados pueden mantener perfiles de entrega, zonas de servicio y disponibilidad. Su rol de entrega es solo operativo y no crea autoridad para remesas, manejo de efectivo o transmisión de dinero.':'Verified private-sector individuals and businesses can maintain delivery profiles, service areas and availability. Their delivery role is operational only; it does not create remittance, cash-handling or money-transmission authority.'}</p></div>
      <div className="featureGrid">{delivery.map(([title,description],i)=><article className="feature" key={title}><div className="icon">D{String(i+1).padStart(2,'0')}</div><h3>{title}</h3><p>{description}</p><div className="featureMeta">SEPARATE ROLE + PERMISSIONS</div></article>)}</div>
    </section>

    <section className="section" id="business">
      <div className="sectionHead"><div><span className="eyebrow">{es?'REMESA COMERCIAL':'BUSINESS REMITTANCE'}</span><h2>{es?'Pagos de negocios privados':'Private-business payments'}</h2></div><p>{es?'Diseñado para pagos comerciales legítimos. Cada pago comercial se vincula a un negocio remitente propio, un beneficiario comercial, un propósito y los requisitos de evidencia y revisión aplicables.':'Designed for legitimate commercial payments. A business payment is tied to an owned sender business, a business beneficiary, a commercial purpose and the applicable evidence and review requirements.'}</p></div>
      <div className="featureGrid">{business.map(([title,description],i)=><article className="feature" key={title}><div className="icon">B{String(i+1).padStart(2,'0')}</div><h3>{title}</h3><p>{description}</p><div className="featureMeta">BUSINESS FLOW</div></article>)}</div>
    </section>

    <section className="section" id="crypto">
      <div className="sectionHead"><div><span className="eyebrow">{es?'CRIPTO APROBADA':'APPROVED CRYPTO'}</span><h2>{es?'Opciones de activos digitales canalizadas por proveedores':'Partner-routed digital-asset options'}</h2></div><p>{es?'Solo se admiten combinaciones de activo y red aprobadas. La elección del cliente es una preferencia de enrutamiento, no una autorización regulatoria ni permiso para transmitir fondos.':'Only approved asset/network combinations are supported. Customer choice is a routing preference, not compliance clearance or authorization to transmit funds.'}</p></div>
      <div className="featureGrid">{crypto.map(([asset,networks],i)=><article className="feature" key={asset}><div className="icon">C{String(i+1).padStart(2,'0')}</div><h3>{asset}</h3><p>{networks}</p><div className="featureMeta">AUTHORIZED PROVIDER REQUIRED</div></article>)}</div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">{es?'REGLA CENTRAL':'CORE RULE'}</span><h2>{es?'Una cuenta puede tener varios roles, pero la autoridad nunca se transfiere entre ellos':'One account can have many roles, but authority never transfers between roles'}</h2></div><p>{es?'Un proveedor de entrega puede recibir su propia remesa familiar como beneficiario. Eso no le autoriza a recibir ni transmitir fondos para clientes no relacionados. Clasificación familiar/comercial, identidad/KYB, sanciones, controles de corredor y elegibilidad del proveedor autorizado siguen siendo controles separados.':'A delivery provider may receive their own family remittance as a beneficiary. That does not authorize them to receive or transmit remittance funds on behalf of unrelated customers. Family/business classification, identity/KYB, sanctions state, corridor controls and authorized-provider eligibility remain separate gates.'}</p></section>
    <footer className="footer"><strong>MY CUBA CASH</strong><span>{es?'Remesas familiares + comerciales · Red privada de entrega':'Family + Business Remittance · Private-Sector Delivery Network'}</span><span>v0.9</span></footer>
  </main>;
}
