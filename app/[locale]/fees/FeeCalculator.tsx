'use client';

import {useMemo,useState} from 'react';

type FeeKey='family'|'business'|'marketplace'|'cash';
type Rule={labelEs:string;labelEn:string;payerEs:string;payerEn:string;rate:number;min:number;max:number;descriptionEs:string;descriptionEn:string};

const RULES:Record<FeeKey,Rule>={
  family:{labelEs:'Apoyo familiar',labelEn:'Family support',payerEs:'Remitente',payerEn:'Sender',rate:0.0125,min:1,max:12,descriptionEs:'Solicitudes elegibles de apoyo familiar.',descriptionEn:'Eligible family-support requests.'},
  business:{labelEs:'Pago comercial',labelEn:'Business payment',payerEs:'Remitente',payerEn:'Sender',rate:0.0175,min:5,max:250,descriptionEs:'Solicitudes para negocios privados con propósito comercial.',descriptionEn:'Private-business requests with a commercial purpose.'},
  marketplace:{labelEs:'Comisión de éxito del marketplace',labelEn:'Marketplace success fee',payerEs:'Vendedor',payerEn:'Seller',rate:0.025,min:2,max:500,descriptionEs:'Se cobra al alcanzar la etapa aplicable que activa la comisión.',descriptionEn:'Charged when the applicable fee-triggering stage is reached.'},
  cash:{labelEs:'Registro de transacción en efectivo',labelEn:'Cash transaction record',payerEs:'Solicitante',payerEn:'Requestor',rate:0.0075,min:0.5,max:20,descriptionEs:'Registro y controles de plataforma para actividad elegible.',descriptionEn:'Platform recordkeeping and controls for eligible activity.'}
};

function money(value:number,locale:string){return new Intl.NumberFormat(locale,{style:'currency',currency:'USD'}).format(value)}

export default function FeeCalculator({es=false}:{es?:boolean}){
  const [type,setType]=useState<FeeKey>('family');
  const [amount,setAmount]=useState('100');
  const rule=RULES[type];
  const parsed=Math.max(0,Number(amount)||0);
  const fee=useMemo(()=>parsed<=0?0:Math.min(rule.max,Math.max(rule.min,Math.round(parsed*rule.rate*100)/100)),[parsed,rule]);
  const percent=(rule.rate*100).toFixed(2).replace(/\.00$/,'');
  const locale=es?'es-US':'en-US';

  return <article className="feature premiumCard" style={{display:'grid',gap:16}}>
    <div><div className="eyebrow">{es?'CALCULADORA PÚBLICA':'PUBLIC FEE CALCULATOR'}</div><h2 style={{marginBottom:6}}>{es?'Calcula la tarifa de MY CUBA CASH antes de registrarte':'Calculate the MY CUBA CASH fee before signing up'}</h2><p>{es?'Esta calculadora muestra nuestra tarifa. Los costos de proveedor, entrega, pago o cambio de moneda aparecen por separado solo cuando exista una cotización confirmada.':'This calculator shows our fee. Provider, delivery, payment or foreign-exchange costs appear separately only when a quote is confirmed.'}</p></div>
    <div className="featureGrid">
      <label>{es?'Tipo de solicitud':'Request type'}<select value={type} onChange={e=>setType(e.target.value as FeeKey)} style={{width:'100%',padding:12,marginTop:6}}>
        {Object.entries(RULES).map(([key,value])=><option key={key} value={key}>{es?value.labelEs:value.labelEn}</option>)}
      </select></label>
      <label>{es?'Importe (USD)':'Amount (USD)'}<input type="number" min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} style={{width:'100%',padding:12,marginTop:6}}/></label>
    </div>
    <div className="featureGrid" aria-live="polite">
      <div className="feature"><span className="eyebrow">{es?'TASA':'RATE'}</span><h3>{percent}%</h3><p>{es?rule.descriptionEs:rule.descriptionEn}</p></div>
      <div className="feature"><span className="eyebrow">{es?'TARIFA MY CUBA CASH':'MY CUBA CASH FEE'}</span><h3>{money(fee,locale)}</h3><p>{es?'Pagador':'Payer'}: {es?rule.payerEs:rule.payerEn}. {es?'Mínimo':'Minimum'} {money(rule.min,locale)} · {es?'Máximo':'Maximum'} {money(rule.max,locale)}.</p></div>
      <div className="feature"><span className="eyebrow">{es?'IMPORTE + NUESTRA TARIFA':'AMOUNT + OUR FEE'}</span><h3>{money(parsed+fee,locale)}</h3><p>{es?'No es una cotización de entrega o cambio. Los costos externos pendientes no están incluidos.':'This is not a delivery or FX quote. Pending external costs are not included.'}</p></div>
    </div>
    <p className="sectionCopy">{es?'Ejemplo: para $100 de apoyo familiar, nuestra tarifa estimada es $1.25. No mostramos cuánto recibirá la persona en Cuba hasta contar con tipo de cambio, proveedor, entrega y método de pago confirmados.':'Example: for $100 of family support, our estimated fee is $1.25. We do not show what the receiver will get in Cuba until the exchange rate, provider, delivery and payment method are confirmed.'}</p>
  </article>;
}
