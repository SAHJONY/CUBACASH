import { localeOf, type Locale } from '@/lib/i18n';
import { APP_COMMUNICATIONS, whatsappUrl } from '@/lib/communications';
import EnviosQuoteForm, { type CargoType } from './quote-form';

// SAHJONY Envíos — a SAHJONY logistics service (broker/intermediary),
// visually and data-separated from the MY CUBA CASH money-transfer product.
const STEPS: { es: string; en: string; esNote: string; enNote: string }[] = [
  { es: 'Cotización', en: 'Quote', esNote: 'Solicitud → cotización REAL en 24–48h, con número de referencia (ENV-2026-XXXXXX).', enNote: 'Request → REAL quote within 24–48h, with a reference number (ENV-2026-XXXXXX).' },
  { es: 'Recogida', en: 'Pickup', esNote: 'Recogida en Houston o entrega en nuestro punto de recepción.', enNote: 'Pickup in Houston or drop-off at our reception point.' },
  { es: 'Documentación', en: 'Documentation', esNote: 'SAHJONY prepara la documentación y las licencias de exportación de EE.UU.; tú firmas.', enNote: 'SAHJONY prepares the U.S. export documentation and licenses; you sign.' },
  { es: 'Flete marítimo', en: 'Ocean freight', esNote: 'Flete con navieras autorizadas.', enNote: 'Freight with authorized carriers.' },
  { es: 'Aduana en Cuba', en: 'Cuba customs', esNote: 'Gestionamos el despacho; los aranceles e impuestos oficiales son del cliente y se muestran con transparencia donde existan tablas oficiales.', enNote: 'We manage clearance; official duties and taxes are the customer\u2019s and are shown transparently wherever official tables exist.' },
  { es: 'Entrega a domicilio', en: 'Home delivery', esNote: 'Coordinada y confirmada desde la cotización.', enNote: 'Coordinated and confirmed at quote time.' },
];

const FACTS: { esTitle: string; enTitle: string; esBody: string; enBody: string; esSource: string; enSource: string }[] = [
  {
    esTitle: 'Decreto 163/2026 de Cuba', enTitle: 'Cuba Decree 163/2026',
    esBody: 'Gaceta Oficial No. 65 (publicado 4 ago 2026, vigente desde 11 ago 2026): las personas naturales cubanas pueden importar directamente, una vez y sin carácter comercial, un carro 100% eléctrico. Libre de arancel si llega con una estación de carga de energía renovable que cubra sus necesidades de carga; de lo contrario arancel fijo por valor: $500 (hasta $10,000), $1,000 ($10,001–$20,000), $1,500 ($20,001–$30,000), $2,000 (más de $30,000). Impuestos especiales: combustión 25%, híbrido 15%, eléctrico 5%, lujo 35%. Diplomáticos, cooperantes y personal de misión estatal con 2+ años en el exterior pueden importar una vez un carro de combustión/híbrido/eléctrico de hasta 8 plazas. Las marcas y modelos requieren aprobación del Comité de Evaluación Automotriz.',
    enBody: 'Official Gazette No. 65 (published Aug 4, 2026, effective Aug 11, 2026): Cuban nationals may directly import, one time and non-commercially, one fully electric car. Duty-FREE if it arrives with a renewable-energy charging station covering its charging needs; otherwise a fixed customs duty by value: $500 (up to $10,000), $1,000 ($10,001–$20,000), $1,500 ($20,001–$30,000), $2,000 (over $30,000). Special taxes: combustion 25%, hybrid 15%, electric 5%, luxury 35%. Diplomats, cooperative workers and state mission personnel with 2+ years abroad may import one combustion/hybrid/electric car of up to 8 seats, one time. Vehicle brands and models require Automotive Evaluation Committee approval.',
    esSource: 'Fuentes: cubaheadlines.com (artículos, ago 2026) y translatingcuba.com.',
    enSource: 'Sources: cubaheadlines.com (articles, Aug 2026) and translatingcuba.com.',
  },
  {
    esTitle: 'Crowley — servicio a Cuba desde el sur de Florida', enTitle: 'Crowley — Cuba service from South Florida',
    esBody: 'Primera naviera estadounidense con licencia OFAC para Cuba (dic 2001), con servicio regular. Su servicio a Cuba opera desde el sur de Florida (Miami CFS → Cuba CFS) con tarifa pública Cubapack (ej. $2.50/lb; entrega a domicilio por paquete según provincia: La Habana $12, Artemisa/Mayabeque $16, Pinar del Río/Matanzas $21, otros puntos $31, más $5 de manejo). NOTA HONESTA: el nuevo servicio semanal de Crowley en Houston (ago 2026) cubre Centroamérica, NO Cuba — no lo presentamos como una ruta Houston→Cuba.',
    enBody: 'The first U.S. carrier licensed by OFAC for Cuba (Dec 2001), with regular service. Its Cuba service operates from South Florida (Miami CFS → Cuba CFS) with a public Cubapack tariff (e.g. $2.50/lb; door delivery per package by province: Havana $12, Artemisa/Mayabeque $16, Pinar del Río/Matanzas $21, other points $31, plus $5 handling). HONEST NOTE: Crowley\u2019s new weekly Houston call (Aug 2026) serves Central America, NOT Cuba — we do not present it as a Houston→Cuba sailing.',
    esSource: 'Fuente: tarifa pública Cubapack de Crowley y comunicados de la empresa (ago 2026).',
    enSource: 'Source: Crowley\u2019s public Cubapack tariff and company announcements (Aug 2026).',
  },
  {
    esTitle: 'Seaboard Marine — Cuba solo FCL', enTitle: 'Seaboard Marine — Cuba FCL-only',
    esBody: 'El servicio de Seaboard Marine a Cuba es solo contenedor completo (FCL), sin carga consolidada (LCL).',
    enBody: 'Seaboard Marine\u2019s Cuba service is full-container (FCL) only, no consolidated (LCL) cargo.',
    esSource: 'Fuente: verificación directa con la empresa, sep 2026.',
    enSource: 'Source: direct verification with the company, Sep 2026.',
  },
  {
    esTitle: 'Licencias de exportación de EE.UU.', enTitle: 'U.S. export licensing',
    esBody: 'Los envíos EE.UU.→Cuba requieren la autorización/licencia de exportación de EE.UU. aplicable; SAHJONY prepara toda la documentación y el cliente firma.',
    enBody: 'U.S.→Cuba shipments require the applicable U.S. export authorization/licensing; SAHJONY prepares all the documentation and the customer signs.',
    esSource: 'Fuente: regulación de exportación de EE.UU. aplicable a Cuba.',
    enSource: 'Source: U.S. export regulations applicable to Cuba.',
  },
];

function cargoFromParam(v: string | undefined): CargoType {
  const t = (v ?? '').toLowerCase();
  if (t === 'contenedor' || t === 'fcl') return 'CONTENEDOR_FCL';
  if (t === 'pallet' || t === 'carga') return 'PALLET_CONSOLIDADO';
  return 'CARRO';
}

export default async function EnviosPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { locale: raw } = await params;
  const { tipo } = await searchParams;
  const locale: Locale = localeOf(raw);
  const es = locale === 'es';
  const support = APP_COMMUNICATIONS.whatsappPrimary;
  const defaultCargo = cargoFromParam(tipo);

  const cards: { key: CargoType; esTitle: string; enTitle: string; esBody: string; enBody: string; tipo: string }[] = [
    {
      key: 'CARRO', tipo: 'carro',
      esTitle: '🚗 Carros (EE.UU. → Cuba)', enTitle: '🚗 Cars (U.S. → Cuba)',
      esBody: 'Elige un carro de nuestro inventario como corredor o el tuyo propio. Cotizamos el envío real, recogemos en Houston / puerto, gestionamos los documentos de exportación y aduana en Cuba, y coordinamos la entrega a domicilio.',
      enBody: 'Pick a car from our brokered inventory or your own. We quote real shipping, handle Houston pickup / port, export and Cuba customs documentation, and coordinate home delivery.',
    },
    {
      key: 'CONTENEDOR_FCL', tipo: 'contenedor',
      esTitle: '📦 Contenedores FCL (Houston → Mariel/La Habana)', enTitle: '📦 FCL Containers (Houston → Mariel/Havana)',
      esBody: 'Contenedores completos de 20\' o 40\' desde Houston hasta Mariel / La Habana. Cotización real según mercancía, puerto y documentación — sin tarifas inventadas.',
      enBody: 'Full 20\' or 40\' containers from Houston to Mariel / Havana. Real quote by cargo, port and documentation — no invented rates.',
    },
    {
      key: 'PALLET_CONSOLIDADO', tipo: 'pallet',
      esTitle: '📋 Pallets y carga consolidada (Houston → Cuba)', enTitle: '📋 Pallets & consolidated cargo (Houston → Cuba)',
      esBody: 'Mercancía paletizada y envíos consolidados desde Houston a Cuba. Nos das piezas, peso, dimensiones y destino; te devolvemos una cotización real en 24–48h.',
      enBody: 'Palletized goods and consolidated shipments from Houston to Cuba. You give us pieces, weight, dimensions and destination; we return a real quote in 24–48h.',
    },
  ];

  return (
    <main className="shell premiumAppShell" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <nav className="nav premiumNav">
        <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>SAHJONY Envíos</small></a>
        <div className="navlinks">
          <a href={`/${locale}/envios#servicios`}>{es ? 'Servicios' : 'Services'}</a>
          <a href={`/${locale}/envios#proceso`}>{es ? 'Proceso' : 'Process'}</a>
          <a href={`/${locale}/envios#cotizar`}>{es ? 'Cotizar' : 'Quote'}</a>
          <a href={`/${locale}/contact`}>{es ? 'Contacto' : 'Contact'}</a>
        </div>
      </nav>

      <section className="hero"><div className="heroCopy">
        <div className="eyebrow">{es ? 'SAHJONY ENVÍOS · SERVICIO LOGÍSTICO' : 'SAHJONY ENVÍOS · LOGISTICS SERVICE'}</div>
        <h1>{es ? 'Envía más que dinero.' : 'Send more than money.'}</h1>
        <p className="heroLead">{es
          ? 'Houston, Texas → Cuba, puerta a puerta. Actuamos como corredor logístico: cotizaciones, documentación y cadena de custodia con transportistas autorizados. No somos la naviera.'
          : 'Houston, Texas → Cuba, door to door. We act as a logistics broker: quotes, documentation and chain of custody with authorized carriers. We are not the ocean carrier.'}</p>
        <div className="actions">
          <a className="cta premiumCta" style={{ minHeight: 48 }} href={`/${locale}/envios#cotizar`}>{es ? 'Solicitar cotización' : 'Request a quote'}</a>
          <a className="ghost" style={{ minHeight: 48 }} href={whatsappUrl(support.e164, es ? 'Hola Sofia, quiero cotizar un envío a Cuba con SAHJONY Envíos.' : 'Hi Sofia, I want to quote a shipment to Cuba with SAHJONY Envíos.')} target="_blank" rel="noreferrer">
            {es ? `WhatsApp: ${support.display}` : `WhatsApp: ${support.display}`}
          </a>
        </div>
      </div></section>

      <section className="section supportSection" style={{ paddingTop: 0 }}>
        <div className="supportCard">
          <div>
            <strong>{es ? 'Servicio logístico, separado de las transferencias' : 'A logistics service, separate from transfers'}</strong>
            <span>{es
              ? 'SAHJONY Envíos es un servicio logístico de SAHJONY, separado de las transferencias de dinero de MY CUBA CASH. Los leads de esta sección se guardan por separado y nunca se mezclan con datos de remesas.'
              : 'SAHJONY Envíos is a SAHJONY logistics service, separate from MY CUBA CASH money transfers. Leads from this section are stored separately and never mixed with remittance data.'}</span>
          </div>
        </div>
      </section>

      <section className="section" id="servicios" style={{ paddingTop: 0 }}>
        <div className="sectionHead"><div>
          <span className="eyebrow">{es ? 'TRES LÍNEAS DE SERVICIO' : 'THREE SERVICE LINES'}</span>
          <h2>{es ? 'Houston → puerta en Cuba' : 'Houston → door in Cuba'}</h2>
        </div><p>{es
          ? 'Tres formas de enviar. Cada una tiene su formulario de cotización; la cotización real llega en 24–48h con un número de referencia.'
          : 'Three ways to ship. Each has its own quote form; the real quote arrives in 24–48h with a reference number.'}</p></div>
        <div className="featureGrid">
          {cards.map(c => (
            <article className="feature premiumCard" key={c.key} style={{ display: 'grid', gap: 10 }}>
              <h3>{es ? c.esTitle : c.enTitle}</h3>
              <p>{es ? c.esBody : c.enBody}</p>
              <div className="actions">
                <a className="ghost" style={{ minHeight: 48 }} href={`/${locale}/envios?tipo=${c.tipo}#cotizar`}>{es ? 'Cotizar este servicio' : 'Quote this service'}</a>
              </div>
            </article>
          ))}
        </div>
        <p className="sectionCopy">{es
          ? 'Nota: no publicamos tarifas de flete marítimo, tiempos de tránsito ni itinerarios porque no están verificados. Donde falta un dato verificado, decimos "cotización real en 24–48h".'
          : 'Note: we publish no ocean freight rates, transit times or sailing schedules because none are verified. Where a verified fact is missing, we say "real quote within 24–48h".'}</p>
      </section>

      <section className="section" id="proceso">
        <div className="sectionHead"><div>
          <span className="eyebrow">{es ? 'DE LA A A LA Z' : 'FROM A TO Z'}</span>
          <h2>{es ? 'El proceso, paso a paso' : 'The process, step by step'}</h2>
        </div><p>{es
          ? 'Como corredor, coordinamos cada etapa con transportistas y autoridades autorizados. Tú siempre sabes en qué paso está tu envío.'
          : 'As a broker, we coordinate every stage with authorized carriers and authorities. You always know which step your shipment is at.'}</p></div>
        <div className="luxuryGrid">
          {STEPS.map((s, i) => (
            <article className="luxuryCard" key={s.en}><span>{i + 1}</span><h3>{es ? s.es : s.en}</h3><p>{es ? s.esNote : s.enNote}</p></article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHead"><div>
          <span className="eyebrow">{es ? 'DATOS VERIFICADOS' : 'VERIFIED FACTS'}</span>
          <h2>{es ? 'Lo que sí podemos decir, con fuente' : 'What we can say, with sources'}</h2>
        </div><p>{es
          ? 'Solo publicamos hechos verificados, cada uno con su fuente y fecha. Lo demás se cotiza de forma real, caso por caso.'
          : 'We only publish verified facts, each with its source and date. Everything else is quoted for real, case by case.'}</p></div>
        <div className="featureGrid">
          {FACTS.map(f => (
            <article className="feature premiumCard" key={f.enTitle} style={{ display: 'grid', gap: 8 }}>
              <h3>{es ? f.esTitle : f.enTitle}</h3>
              <p>{es ? f.esBody : f.enBody}</p>
              <p className="sectionCopy"><em>{es ? f.esSource : f.enSource}</em></p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" style={{ maxWidth: 980, margin: '0 auto' }}>
        <EnviosQuoteForm defaultCargo={defaultCargo} locale={locale} whatsappE164={support.e164} whatsappDisplay={support.display} />
      </section>

      <section className="policyBlock premiumPolicy"><div>
        <span className="eyebrow">{es ? 'POSICIONAMIENTO' : 'POSITIONING'}</span>
        <h2>{es ? 'Corredor, no naviera.' : 'Broker, not carrier.'}</h2>
      </div><p>{es
        ? 'SAHJONY actúa estrictamente como corredor / intermediario logístico: organizamos cotizaciones, documentación y la cadena de custodia con transportistas autorizados. Nunca afirmamos ser la naviera ni publicamos tarifas, tiempos de tránsito, itinerarios, transportistas específicos de la ruta Houston→Cuba, socios de transporte en Cuba, plazos de entrega, direcciones de almacén, clientes ni reseñas que no podamos verificar. Tu solicitud crea solo una solicitud de cotización con número de referencia; la cotización real la prepara el equipo de Juan en 24–48h.'
        : 'SAHJONY acts strictly as a logistics broker / intermediary: we arrange quotes, documentation and the chain of custody with authorized carriers. We never claim to be the ocean carrier and we never publish freight rates, transit times, sailing schedules, specific Houston→Cuba carriers, Cuba trucking partners, delivery timeframes, warehouse addresses, customers or reviews we cannot verify. Your submission creates only a quote request with a reference number; the real quote is prepared by Juan\u2019s team within 24–48h.'}</p></section>

      <footer className="footer premiumFooter"><strong>SAHJONY Envíos</strong><span>
        <a href={`/${locale}`}>{es ? 'Inicio' : 'Home'}</a> · <a href={`/${locale}/terms`}>{es ? 'Términos' : 'Terms'}</a> · <a href={`/${locale}/privacy`}>{es ? 'Privacidad' : 'Privacy'}</a>
      </span><span>{es ? 'Servicio logístico de SAHJONY · Houston, Texas' : 'A SAHJONY logistics service · Houston, Texas'}</span></footer>
    </main>
  );
}
