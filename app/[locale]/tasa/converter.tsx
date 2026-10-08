'use client';
import { useMemo, useState } from 'react';

type Rate = { code:string; value:number };
type Currency = { code:string; name:string; kind:'currency'|'instrument' };

export default function Converter({ rates, currencies, es }:{ rates:Rate[]; currencies:Currency[]; es:boolean }){
  const [amount, setAmount] = useState('100');
  const [code, setCode] = useState('USD');
  const [dir, setDir] = useState<'toCup'|'fromCup'>('toCup');
  const rate = useMemo(()=>rates.find(r=>r.code===code)?.value ?? 0,[rates,code]);
  const name = useMemo(()=>currencies.find(c=>c.code===code)?.name ?? code,[currencies,code]);
  const n = parseFloat((amount||'').replace(',','.')) || 0;
  const result = dir==='toCup' ? n*rate : (rate ? n/rate : 0);
  const fmt = (v:number)=>v.toLocaleString(es?'es-ES':'en-US',{maximumFractionDigits:2});

  return <div className="tasaConverter">
    <span className="tasaEyebrow">{es?'CALCULADORA':'CALCULATOR'}</span>
    <div className="tasaConvRow">
      <div className="tasaField">
        <label>{es?'CANTIDAD':'AMOUNT'}</label>
        <input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="100" />
      </div>
      <div className="tasaField">
        <label>{es?'MONEDA':'CURRENCY'}</label>
        <select value={code} onChange={e=>setCode(e.target.value)}>
          {rates.map(r=><option key={r.code} value={r.code}>{r.code} — {currencies.find(c=>c.code===r.code)?.name ?? r.code}</option>)}
        </select>
      </div>
      <div className="tasaField">
        <label>{es?'DIRECCIÓN':'DIRECTION'}</label>
        <select value={dir} onChange={e=>setDir(e.target.value as 'toCup'|'fromCup')}>
          <option value="toCup">{code} → CUP</option>
          <option value="fromCup">CUP → {code}</option>
        </select>
      </div>
    </div>
    <div className="tasaConvResult">
      {dir==='toCup'
        ? <>{fmt(n)} {code} ≈ <span className="gold">{fmt(result)} CUP</span></>
        : <>{fmt(n)} CUP ≈ <span className="gold">{fmt(result)} {code}</span></>}
    </div>
    <p className="tasaConvNote">{es?`A la tasa de referencia (${fmt(rate)} CUP por ${name}). Referencia informativa, no cotización.`:`At the reference rate (${fmt(rate)} CUP per ${name}). Informational reference, not a quote.`}</p>
  </div>;
}
