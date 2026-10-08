import { localeOf } from '@/lib/i18n';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import './tasa.css';
import Converter from './converter';

export const dynamic = 'force-dynamic';

type FxInput = { source:string; value:string|number; as_of:string; role:string };
type Rate = { code:string; value:number };
type Fixing = {
  edition:number; date:string; published_at:string; rates:Rate[];
  previous?:{ date:string; rates:Rate[] };
  inputs:FxInput[]; notes?:string; revision_note?:string; ai_brief?:string;
};
type Currency = { code:string; name:string; kind:'currency'|'instrument' };
type FxData = { methodology:string; disclaimer:string; unit:string; currencies:Currency[]; fixings:Fixing[] };

async function loadFx():Promise<FxData|null>{
  try{
    const raw = await readFile(path.join(process.cwd(),'public','fx','fixings.json'),'utf8');
    return JSON.parse(raw) as FxData;
  }catch{ return null; }
}

function sparkline(values:number[], w=96, h=30){
  if(values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v,i)=>{
    const x = (i/(values.length-1))*w;
    const y = h - 4 - ((v-min)/span)*(h-8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const up = values[values.length-1] >= values[0];
  const color = up ? '#f87171' : '#34d399';
  return <svg className="tasaSpark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
    <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx={w} cy={parseFloat(pts.split(' ').pop()!.split(',')[1])} r="3" fill={color}/>
  </svg>;
}

const ACCENTS:Record<string,string> = {
  USD:'linear-gradient(90deg,#d4af37,#f5d67b)', EUR:'linear-gradient(90deg,#38bdf8,#818cf8)',
  MLC:'linear-gradient(90deg,#34d399,#a7f3d0)', CAD:'linear-gradient(90deg,#f472b6,#fda4af)',
  MXN:'linear-gradient(90deg,#fb923c,#fde68a)', ZELLE:'linear-gradient(90deg,#a78bfa,#e9d5ff)',
  CLA:'linear-gradient(90deg,#22d3ee,#a5f3fc)',
};

export default async function TasaPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw} = await params;
  const locale = localeOf(raw);
  const es = locale === 'es';
  const data = await loadFx() ?? undefined;
  const fixings = data?.fixings ?? [];
  const latest = fixings.length ? fixings[fixings.length-1] : null;
  const usd = latest?.rates.find(r=>r.code==='USD');
  const prevOf = (code:string)=>latest?.previous?.rates.find(r=>r.code===code)?.value;
  const usdPrev = prevOf('USD');
  const usdDelta = usd && usdPrev ? ((usd.value-usdPrev)/usdPrev)*100 : null;
  const history = [...fixings].reverse();
  const seriesFor = (code:string)=>{
    const vals:number[] = [];
    const pv = prevOf(code); if(pv!==undefined) vals.push(pv);
    for(const f of fixings){ const v=f.rates.find(r=>r.code===code)?.value; if(v!==undefined) vals.push(v); }
    return vals;
  };

  return <div className="tasaRoot">
    <section className="tasaHero"><div className="tasaHeroInner">
      <span className="tasaEyebrow">MY CUBA CASH · {es?'TASA DE REFERENCIA':'REFERENCE RATE'}</span>
      <h1 className="tasaTitle">{es?<><span className="gold">La pizarra</span> del dinero en Cuba</>:<>The <span className="gold">money board</span> of Cuba</>}</h1>
      <p className="tasaSub">{es?'Todas las monedas e instrumentos que se transan en la isla, fijados cada mañana y archivados para siempre.':'Every currency and instrument traded on the island, fixed every morning and archived forever.'}</p>
      {latest && usd ? <>
        <div><div className="tasaHeadline">
          <span className="tasaHeadlineNum">{usd.value}</span>
          <span className="tasaHeadlineUnit">CUP<br/>{es?'por 1 USD':'per 1 USD'}</span>
          {usdDelta!==null ? <span className={`tasaDelta ${usdDelta<0?'down':usdDelta>0?'up':'flat'}`}>{usdDelta<0?'▼':usdDelta>0?'▲':'—'} {Math.abs(usdDelta).toFixed(1)}%</span> : null}
        </div></div>
        <p className="tasaMeta">{es?`EDICIÓN NO. ${latest.edition} · ${latest.date} · FIJACIÓN 10:00 AM ET`:`EDITION NO. ${latest.edition} · ${latest.date} · FIXING 10:00 AM ET`}</p>
      </> : null}
    </div></section>

    {latest ? <section className="tasaSection">
      <div className="tasaSectionHead"><span className="tasaEyebrow">{es?'LA PIZARRA COMPLETA':'THE FULL BOARD'}</span><h2>{es?'Siete referencias, un solo estándar.':'Seven references, one standard.'}</h2><p>{es?'Valores en CUP por unidad. Zelle y Clásica son instrumentos de pago.':'Values in CUP per unit. Zelle and Clásica are payment instruments.'}</p></div>
      <div className="tasaGrid">{latest.rates.map(r=>{
        const c = data?.currencies.find(x=>x.code===r.code);
        const pv = prevOf(r.code);
        const d = pv!==undefined ? ((r.value-pv)/pv)*100 : null;
        return <article className="tasaCard" key={r.code} style={{'--accent':ACCENTS[r.code]??'linear-gradient(90deg,#d4af37,#f5d67b)'} as React.CSSProperties}>
          <div className="code">{r.code}{c?.kind==='instrument' ? (es?' · INSTRUMENTO':' · INSTRUMENT') : ''}</div>
          <div className="val">{r.value.toLocaleString('es-ES')} <small>CUP</small></div>
          <p className="cname">{c?.name ?? r.code}</p>
          <div className="tasaCardRow">
            {d!==null ? <span className={`tasaDelta ${d<0?'down':d>0?'up':'flat'}`} style={{fontSize:'.8rem'}}>{d<0?'▼':d>0?'▲':'—'} {Math.abs(d).toFixed(1)}%</span> : <span/>}
            {sparkline(seriesFor(r.code))}
          </div>
        </article>;
      })}</div>
    </section> : null}

    {latest ? <section className="tasaSection"><Converter rates={latest.rates} currencies={data?.currencies ?? []} es={es}/></section> : null}

    {latest?.ai_brief ? <section className="tasaSection"><div className="tasaBrief">
      <span className="tasaEyebrow">{es?'ANÁLISIS DEL DÍA':'MARKET BRIEF'}</span>
      <p>{latest.ai_brief}</p>
    </div></section> : null}

    <section className="tasaSection">
      <div className="tasaSectionHead"><span className="tasaEyebrow">{es?'METODOLOGÍA':'METHODOLOGY'}</span><h2>{es?'El número es público. El modelo es nuestro.':'The number is public. The model is ours.'}</h2><p>{data?.methodology ?? ''}</p></div>
      <div className="tasaRules">
        <div className="tasaRule"><div className="n">{es?'REGLA 1':'RULE 1'}</div><p>{es?'Nunca publicamos una tasa a la que no operaríamos. El día que la cotización y el precio real diverjan, la tasa muere.':'We never publish a rate we would not trade at. The day the quote and the real dealing price diverge, the rate dies.'}</p></div>
        <div className="tasaRule"><div className="n">{es?'REGLA 2':'RULE 2'}</div><p>{es?'Referencia y precio minorista siempre van separados y etiquetados. Hoy publicamos solo referencia: no operamos cambio de moneda.':'Reference and retail price are always separate and labeled. Today we publish reference only: we do not deal foreign exchange.'}</p></div>
        <div className="tasaRule"><div className="n">{es?'REGLA 3':'RULE 3'}</div><p>{es?'El número, sus fuentes y el archivo histórico son públicos y auditables por cualquiera. Una sola edición manipulada destruiría la confianza para siempre.':'The number, its sources and the full historical archive are public and auditable by anyone. One manipulated edition would destroy trust forever.'}</p></div>
      </div>
    </section>

    {history.length > 0 ? <section className="tasaSection">
      <div className="tasaSectionHead"><span className="tasaEyebrow">{es?'HISTORIAL':'HISTORY'}</span><h2>{es?'Cada edición, archivada para siempre.':'Every edition, archived forever.'}</h2></div>
      <div className="tasaHist">{history.map(f=>{const u=f.rates.find(r=>r.code==='USD');return <div className="tasaHistCard" key={f.edition}>
        <div className="e">{es?`EDICIÓN ${f.edition}`:`EDITION ${f.edition}`} · {f.date}</div>
        <div className="v">{u?u.value.toLocaleString('es-ES'):'—'} <small style={{fontSize:'.9rem',fontWeight:400}}>CUP</small></div>
        <p>1 USD · {f.rates.length} {es?'referencias':'references'}</p>
      </div>;})}</div>
    </section> : null}

    <section className="tasaSection"><div className="tasaApi">
      <span className="tasaEyebrow">{es?'PARA MEDIOS Y SITIOS':'FOR MEDIA & SITES'}</span>
      <p style={{margin:'12px 0 0'}}>{es?'Cada sitio que cite esta pizarra nos convierte en el estándar. Datos abiertos:':'Every site quoting this board makes us the standard. Open data:'} <a href={`/${locale}/tasa/api`} style={{color:'#7df0c0'}}><code>https://mycubacash.com/api/fx</code></a> {es?'— tócalo para verlo con colores.':'— tap for the colorized view.'}</p>
    </div></section>

    <section className="tasaSection"><div className="tasaDisclaimer">
      <h3>{es?'Referencia informativa, no cotización.':'Informational reference, not a quote.'}</h3>
      <p style={{margin:0}}>{data?.disclaimer ?? ''}</p>
    </div></section>

    <footer className="tasaFooter"><span><strong style={{color:'#d8b84a'}}>MY CUBA CASH</strong></span><span><a href={`/${locale}/about`}>{es?'Quiénes somos':'About'}</a><a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a><a href={`/${locale}/terms`}>{es?'Términos':'Terms'}</a><a href={`/${locale}/privacy`}>{es?'Privacidad':'Privacy'}</a></span></footer>
  </div>;
}
