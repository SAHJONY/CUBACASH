import { localeOf } from '@/lib/i18n';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';

type FxInput = { source:string; value:string|number; as_of:string; role:string };
type Rate = { code:string; value:number };
type Fixing = {
  edition:number; date:string; published_at:string; rates:Rate[];
  inputs:FxInput[]; agent_reports?:string; notes?:string; revision_note?:string;
};
type Currency = { code:string; name:string; kind:'currency'|'instrument' };
type FxData = { methodology:string; disclaimer:string; unit:string; currencies:Currency[]; fixings:Fixing[] };

async function loadFx():Promise<FxData|null>{
  try{
    const raw = await readFile(path.join(process.cwd(),'public','fx','fixings.json'),'utf8');
    return JSON.parse(raw) as FxData;
  }catch{ return null; }
}

function nameFor(data:FxData|undefined, code:string){
  return data?.currencies.find(c=>c.code===code)?.name ?? code;
}
function kindFor(data:FxData|undefined, code:string){
  return data?.currencies.find(c=>c.code===code)?.kind ?? 'currency';
}

export default async function TasaPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw} = await params;
  const locale = localeOf(raw);
  const es = locale === 'es';
  const data = await loadFx() ?? undefined;
  const fixings = data?.fixings ?? [];
  const latest = fixings.length ? fixings[fixings.length-1] : null;
  const usd = latest?.rates.find(r=>r.code==='USD');
  const others = (latest?.rates ?? []).filter(r=>r.code!=='USD');
  const history = [...fixings].reverse();

  return <main className="shell premiumAppShell">
    <nav className="nav premiumNav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Tasas de referencia':'Reference rates'}</small></a>
      <div className="navlinks"><a href={`/${locale}/fees`}>{es?'Tarifas':'Fees'}</a><a href={`/${locale}/how-it-works`}>{es?'Cómo funciona':'How it works'}</a><a href={`/${locale}/faq`}>FAQ</a><a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a></div>
    </nav>

    <section className="hero"><div className="heroCopy">
      <div className="eyebrow">{es?'TASAS DE REFERENCIA DIARIAS':'DAILY REFERENCE RATES'}</div>
      <h1>{es?'Todas las monedas que se transan en Cuba':'Every currency traded in Cuba'}</h1>
      {latest && usd ? <>
        <p style={{fontSize:'3.2rem',fontWeight:800,margin:'12px 0 4px'}}>{usd.value} <span style={{fontSize:'1.4rem',fontWeight:400}}>CUP</span></p>
        <p className="heroLead">{es?`1 USD = ${usd.value} CUP · Edición No. ${latest.edition} · ${latest.date}`:`1 USD = ${usd.value} CUP · Edition No. ${latest.edition} · ${latest.date}`}</p>
        {latest.notes ? <p className="heroSub">{latest.notes}</p> : null}
        {latest.revision_note ? <p className="heroSub"><em>{latest.revision_note}</em></p> : null}
      </> : <p className="heroLead">{es?'La primera edición está en preparación.':'The first edition is being prepared.'}</p>}
      <div className="actions"><a className="cta premiumCta" href="#monedas">{es?'Ver todas':'See all'}</a><a className="ghost" href="#metodologia">{es?'Metodología':'Methodology'}</a></div>
    </div></section>

    {latest ? <section className="section" id="monedas">
      <div className="sectionHead"><div><span className="eyebrow">{es?`EDICIÓN NO. ${latest.edition} — ${latest.date}`:`EDITION NO. ${latest.edition} — ${latest.date}`}</span><h2>{es?'La pizarra completa.':'The full board.'}</h2></div><p>{es?'Valores en CUP por unidad. Zelle y Clásica son instrumentos de pago, no monedas.':''}</p></div>
      <div className="featureGrid">{latest.rates.map(r=><article className="feature premiumCard" key={r.code}>
        <div className="eyebrow">{r.code}{kindFor(data,r.code)==='instrument' ? (es?' · INSTRUMENTO':' · INSTRUMENT') : ''}</div>
        <h3 style={{fontSize:'2rem',margin:'8px 0'}}>{r.value} <span style={{fontSize:'1rem',fontWeight:400}}>CUP</span></h3>
        <p>{nameFor(data,r.code)}</p>
      </article>)}</div>
      <div className="sectionHead" style={{marginTop:32}}><div><span className="eyebrow">{es?'FUENTES DE ESTA EDICIÓN':'THIS EDITION’S SOURCES'}</span></div></div>
      <div className="featureGrid">{latest.inputs.map((inp,i)=><article className="feature premiumCard" key={i}>
        <div className="eyebrow">{inp.role === 'primary' ? (es?'FUENTE PRINCIPAL':'PRIMARY SOURCE') : (es?'BANDA DE REFERENCIA':'SANITY BAND')}</div>
        <p>{inp.source}</p><p><strong>{es?'Vigencia':'As of'}:</strong> {inp.as_of}</p>
      </article>)}</div>
      {latest.agent_reports ? <p style={{marginTop:16}}><strong>{es?'Red de agentes':'Agent network'}:</strong> {latest.agent_reports}</p> : null}
    </section> : null}

    <section className="section" id="metodologia">
      <div className="sectionHead"><div><span className="eyebrow">{es?'METODOLOGÍA PÚBLICA':'PUBLIC METHODOLOGY'}</span><h2>{es?'Transparencia es el producto.':'Transparency is the product.'}</h2></div></div>
      <p>{data?.methodology ?? ''}</p>
      <div className="featureGrid">
        <article className="feature premiumCard"><div className="eyebrow">{es?'REGLA 1':'RULE 1'}</div><p>{es?'Nunca publicamos una tasa a la que no operaríamos. El día que la cotización y el precio real diverjan, la tasa muere.':'We never publish a rate we would not trade at. The day the quote and the real dealing price diverge, the rate dies.'}</p></article>
        <article className="feature premiumCard"><div className="eyebrow">{es?'REGLA 2':'RULE 2'}</div><p>{es?'Referencia y precio minorista siempre van separados y etiquetados. Hoy publicamos solo referencia: no operamos cambio de moneda.':'Reference and retail price are always separate and labeled. Today we publish reference only: we do not deal foreign exchange.'}</p></article>
        <article className="feature premiumCard"><div className="eyebrow">{es?'REGLA 3':'RULE 3'}</div><p>{es?'Metodología y fuentes siempre publicadas. Si los insumos están reducidos, se dice. Una sola cotización manipulada destruye la confianza para siempre.':'Methodology and sources always published. When inputs are thin, we say so. One manipulated quote destroys trust forever.'}</p></article>
      </div>
    </section>

    {history.length > 1 ? <section className="section" id="historial">
      <div className="sectionHead"><div><span className="eyebrow">{es?'HISTORIAL':'HISTORY'}</span><h2>{es?'Todas las ediciones, archivadas.':'Every edition, archived.'}</h2></div></div>
      <div className="featureGrid">{history.map(f=>{const u=f.rates.find(r=>r.code==='USD');return <article className="feature premiumCard" key={f.edition}>
        <div className="eyebrow">{es?`EDICIÓN ${f.edition}`:`EDITION ${f.edition}`} · {f.date}</div>
        <h3 style={{fontSize:'2rem',margin:'8px 0'}}>{u ? u.value : '—'} CUP</h3>
        <p>1 USD = {u ? u.value : '—'} CUP · {f.rates.length} {es?'referencias':'references'}</p>
        {f.notes ? <p>{f.notes}</p> : null}
      </article>;})}</div>
    </section> : null}

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">{es?'PARA MEDIOS Y SITIOS':'FOR MEDIA & SITES'}</span><h2>{es?'Usa nuestras tasas.':'Quote our rates.'}</h2></div><p>{es?'Cada sitio que cite estas tasas nos convierte en el estándar. Datos abiertos en:':'Every site quoting these rates makes us the standard. Open data at:'}</p></div>
      <p><code>https://mycubacash.com/api/fx</code> — {es?'JSON con la última edición, metodología y archivo.':'JSON with the latest edition, methodology and archive.'}</p>
    </section>

    <section className="policyBlock premiumPolicy"><div><span className="eyebrow">{es?'IMPORTANTE':'IMPORTANT'}</span><h2>{es?'Referencia informativa, no cotización.':'Reference, not a quote.'}</h2></div><p>{data?.disclaimer ?? ''}</p></section>

    <footer className="footer premiumFooter"><strong>MY CUBA CASH</strong><span><a href={`/${locale}/about`}>{es?'Quiénes somos':'About'}</a> · <a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a> · <a href={`/${locale}/terms`}>{es?'Términos':'Terms'}</a> · <a href={`/${locale}/privacy`}>{es?'Privacidad':'Privacy'}</a></span><span>{es?'Tasas de referencia en CUP':'Reference rates in CUP'}</span></footer>
  </main>;
}
