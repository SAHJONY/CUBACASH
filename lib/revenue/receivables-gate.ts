export type ReceivableState='OPEN'|'DUE'|'GRACE'|'OVERDUE'|'PAID'|'WAIVED'|'DISPUTED'|'CANCELLED';
export type PaymentControlState='GOOD_STANDING'|'PAYMENT_DUE'|'GRACE'|'PAYMENT_HOLD'|'MANUAL_HOLD';

export type ReceivableInput={
  amountDue:number;
  paidAmount:number;
  dueAt:string|Date;
  gracePeriodHours?:number;
  status?:ReceivableState;
  ownerOverride?:boolean;
};

export type GateDecision={
  receivableState:ReceivableState;
  paymentControlState:PaymentControlState;
  blockNewEconomicActions:boolean;
  allowLogin:boolean;
  allowRead:boolean;
  allowPayment:boolean;
  allowSupport:boolean;
  allowDispute:boolean;
  shouldSendReminder:boolean;
  reason:string;
  blockAt:string|null;
};

export function evaluateReceivableGate(input:ReceivableInput,now=new Date()):GateDecision{
  if(input.status==='WAIVED'||input.status==='CANCELLED') return openDecision(input.status,'Receivable is not collectible.');
  if(input.status==='DISPUTED') return {...openDecision('DISPUTED','Receivable is under dispute; preserve access while review is open.'),shouldSendReminder:false};
  if(input.paidAmount>=input.amountDue||input.status==='PAID') return openDecision('PAID','Balance is paid.');
  if(input.ownerOverride) return {...openDecision(input.status??'OPEN','Owner override keeps economic actions available.'),paymentControlState:'MANUAL_HOLD'};

  const dueAt=new Date(input.dueAt);
  if(Number.isNaN(dueAt.getTime())) throw new Error('INVALID_DUE_AT');
  const graceHours=Math.max(0,Math.min(720,input.gracePeriodHours??72));
  const blockAt=new Date(dueAt.getTime()+graceHours*60*60*1000);

  if(now<dueAt) return {...openDecision('OPEN','Payment is not yet due.'),blockAt:blockAt.toISOString()};
  if(now<blockAt) return {receivableState:'GRACE',paymentControlState:'GRACE',blockNewEconomicActions:false,allowLogin:true,allowRead:true,allowPayment:true,allowSupport:true,allowDispute:true,shouldSendReminder:true,reason:'Payment is due and inside the configured grace period.',blockAt:blockAt.toISOString()};

  return {receivableState:'OVERDUE',paymentControlState:'PAYMENT_HOLD',blockNewEconomicActions:true,allowLogin:true,allowRead:true,allowPayment:true,allowSupport:true,allowDispute:true,shouldSendReminder:true,reason:'Payment remains unpaid after the grace period. Block new economic actions until verified payment, waiver, dispute resolution, or owner override.',blockAt:blockAt.toISOString()};
}

function openDecision(state:ReceivableState,reason:string):GateDecision{
  return {receivableState:state,paymentControlState:'GOOD_STANDING',blockNewEconomicActions:false,allowLogin:true,allowRead:true,allowPayment:true,allowSupport:true,allowDispute:true,shouldSendReminder:false,reason,blockAt:null};
}

export function canStartEconomicAction(control:{economic_actions_blocked?:boolean}|null|undefined){
  return !control?.economic_actions_blocked;
}
