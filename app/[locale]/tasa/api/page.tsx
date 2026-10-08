import { localeOf } from '@/lib/i18n';
import '../tasa.css';
import ApiViewer from './viewer';

export const dynamic = 'force-dynamic';

export default async function TasaApiPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw} = await params;
  const locale = localeOf(raw);
  const es = locale === 'es';
  return <div className="tasaRoot">
    <section className="tasaHero" style={{padding:'56px 24px 36px'}}><div className="tasaHeroInner">
      <span className="tasaEyebrow">{es?'DATOS ABIERTOS':'OPEN DATA'}</span>
      <h1 className="tasaTitle">{es?<><span className="gold">API</span> de la pizarra</>:<>Board <span className="gold">API</span></>}</h1>
      <p className="tasaSub">{es?'El alimentador de datos de la tasa de referencia MY CUBA CASH, con colores para humanos. Las máquinas pueden consumir el JSON crudo en la misma URL.':'The MY CUBA CASH reference-rate data feed, colorized for humans. Machines can consume the raw JSON at the same URL.'}</p>
      <p style={{marginTop:14}}><a href={`/${locale}/tasa`} style={{color:'#d8b84a'}}>← {es?'Volver a la pizarra':'Back to the board'}</a></p>
    </div></section>
    <section className="tasaSection"><ApiViewer es={es}/></section>
    <footer className="tasaFooter"><span><strong style={{color:'#d8b84a'}}>MY CUBA CASH</strong></span><span><a href={`/${locale}/tasa`}>{es?'Pizarra':'Board'}</a></span></footer>
  </div>;
}
