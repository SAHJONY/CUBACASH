'use client';

import {useMemo,useState} from 'react';

type FeeKey='family'|'business'|'marketplace'|'cash';

type Rule={label:string;payer:string;rate:number;min:number;max:number;description:string};

const RULES:Record<FeeKey,Rule>={
  family:{label:'Family remittance',payer:'Sender',rate:0.0125,min:1,max:12,description:'Family support transaction requests.'},
  business:{label:'Business remittance',payer:'Sender',rate:0.0175,min:5,max:250,description:'Private-business payment requests with commercial purpose.'},
  marketplace:{label:'Marketplace success fee',payer:'Seller',rate:0.025,min:2,max:500,description:'Charged when a marketplace transaction reaches the fee-triggering stage.'},
  cash:{label:'Cash transaction record',payer:'Requestor',rate:0.0075,min:0.5,max:20,description:'Platform recordkeeping and transaction-control fee for eligible cash-ledger activity.'}
};

function money(value:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value)}

export default function FeeCalculator(){
  const [type,setType]=useState<FeeKey>('family');
  const [amount,setAmount]=useState('100');
  const rule=RULES[type];
  const parsed=Math.max(0,Number(amount)||0);
  const fee=useMemo(()=>{
    if(parsed<=0)return 0;
    return Math.min(rule.max,Math.max(rule.min,Math.round(parsed*rule.rate*100)/100));
  },[parsed,rule]);
  const percent=(rule.rate*100).toFixed(2).replace(/\.00$/,'');

  return <article className="feature" style={{display:'grid',gap:16}}>
    <div><div className="eyebrow">FEE CALCULATOR</div><h2 style={{marginBottom:6}}>Estimate the mycubacash platform fee</h2><p>See the platform fee before starting a request. Third-party payment, FX, settlement or delivery charges are separate and are not included here unless explicitly shown.</p></div>
    <div className="featureGrid">
      <label>Transaction type<select value={type} onChange={e=>setType(e.target.value as FeeKey)} style={{width:'100%',padding:12,marginTop:6}}>
        <option value="family">Family remittance</option><option value="business">Business remittance</option><option value="marketplace">Marketplace</option><option value="cash">Cash transaction record</option>
      </select></label>
      <label>Transaction amount (USD)<input type="number" min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} style={{width:'100%',padding:12,marginTop:6}}/></label>
    </div>
    <div className="featureGrid">
      <div className="feature"><span className="eyebrow">RATE</span><h3>{percent}%</h3><p>{rule.description}</p></div>
      <div className="feature"><span className="eyebrow">PLATFORM FEE</span><h3>{money(fee)}</h3><p>Payer: {rule.payer}. Minimum {money(rule.min)} · Maximum {money(rule.max)}.</p></div>
      <div className="feature"><span className="eyebrow">AMOUNT + PLATFORM FEE</span><h3>{money(parsed+fee)}</h3><p>This is not a settlement quote and excludes any separate third-party costs.</p></div>
    </div>
    <p className="sectionCopy">The calculator is an estimate based on the published default fee schedule. The final amount shown before commitment governs if a corridor-specific rule, delivery charge, provider fee or other disclosed cost applies.</p>
  </article>;
}
