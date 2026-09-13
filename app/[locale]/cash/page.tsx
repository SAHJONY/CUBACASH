import { copy, localeOf } from '@/lib/i18n';

const cards=[
  ['Negocios entre participantes','Dos negocios privados verificados pueden hacer negocios directamente entre sí y registrar la operación en MY CUBA CASH.'],
  ['Pago en persona','El pago puede hacerse directamente, en persona, entre las partes. MY CUBA CASH no toma custodia del efectivo.'],
  ['Confirmación en la aplicación','Después del intercambio, pagador y receptor confirman independientemente en la aplicación. La operación queda pendiente hasta completar las confirmaciones requeridas.'],
  ['Solicitar pago','El receptor puede iniciar una solicitud de pago y esperar la confirmación de la entrega por las partes requeridas.'],
  ['Recibos y evidencia','Las partes pueden adjuntar evidencia a la confirmación y conservar un registro trazable.'],
  ['Reputación transaccional','Después de una operación completada, los participantes pueden calificarse de 1 a 5 estrellas. Las calificaciones deben estar respaldadas por una transacción real.'],
  ['Disputas','Un participante elegible puede abrir una disputa. El historial permanece visible y el registro pasa a revisión.']
] as const;

export default async function CashLedger({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  const locale=localeOf(raw);
  const t=copy[locale];
  const rtl=locale==='ar';
  return <main className="shell" dir={rtl?'rtl':'ltr'}>
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{t.tag}</small></a>
      <div className="navlinks"><a href={`/${locale}/dashboard`}>Centro de Comando</a><a href={`/${locale}/agents`}>Agentes IA</a><a href={`/${locale}/remittances`}>Remesas</a><span>Registro de efectivo</span></div>
      <a className="miniCta" href="/api/health">Estado del sistema</a>
    </nav>

    <section className="section">
      <div className="sectionHead"><div><span className="eyebrow">NEGOCIOS DIRECTOS · PAGO EN PERSONA</span><h2>Haz el negocio directamente. Paga en persona. Confirma en MY CUBA CASH.</h2></div><p>MY CUBA CASH permite registrar operaciones directas entre negocios privados participantes. Las partes acuerdan el negocio entre sí, el pago se entrega directamente en persona y cada participante confirma el resultado dentro de la aplicación. La plataforma conserva la referencia, importe, moneda, propósito, estado, evidencia y reputación de la operación sin tomar custodia del efectivo.</p></div>
      <div className="previewGrid">
        <div><span>Custodia de MY CUBA CASH</span><strong>NINGUNA</strong></div>
        <div><span>Pago</span><strong>DIRECTO · EN PERSONA</strong></div>
        <div><span>Confirmación</span><strong>AMBAS PARTES</strong></div>
        <div><span>Registro</span><strong>AUDITABLE</strong></div>
      </div>
    </section>

    <section className="section" style={{paddingTop:0}}>
      <div className="featureGrid">
        {cards.map(([title,description],i)=><article className="feature" key={title}><div className="icon">{String(i+1).padStart(2,'0')}</div><h3>{title}</h3><p>{description}</p><div className="featureMeta">DIRECTO · CONFIRMADO · TRAZABLE</div></article>)}
      </div>
    </section>

    <section className="policyBlock"><div><span className="eyebrow">FLUJO DE CONFIRMACIÓN</span><h2>El sistema registra el acuerdo, pero las partes controlan la entrega</h2></div><p>Una parte crea o solicita la operación, las partes realizan el pago directamente, y luego pagador y receptor confirman de manera independiente dentro de MY CUBA CASH. Si una parte rechaza la operación o abre una disputa, el registro no se presenta como completado. La confirmación de la aplicación documenta lo ocurrido; no sustituye las obligaciones legales, regulatorias o contractuales aplicables a las partes.</p></section>
    <footer className="footer"><strong>MY CUBA CASH</strong><span>Negocios directos y registro de efectivo</span><span>v0.7</span></footer>
  </main>;
}
