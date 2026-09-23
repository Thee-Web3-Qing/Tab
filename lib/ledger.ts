export type Position={userId:string;paid:number;responsibility:number;net:number};
export type LedgerExpense={payerId:string;lockedUsdValue:number;beneficiaryIds:string[]};
export function calculatePositions(expenses:LedgerExpense[], percentages:Record<string,number>|null):Position[]{
 const ids=new Set<string>(); expenses.forEach(e=>{ids.add(e.payerId);e.beneficiaryIds.forEach(x=>ids.add(x))});
 const m=new Map([...ids].map(id=>[id,{userId:id,paid:0,responsibility:0,net:0}]));
 for(const e of expenses){m.get(e.payerId)!.paid+=e.lockedUsdValue; const bs=e.beneficiaryIds;
  if(percentages){const total=bs.reduce((s,id)=>s+(percentages[id]??0),0); if(total<=0)throw new Error("Selected percentages must total above zero"); for(const id of bs)m.get(id)!.responsibility+=e.lockedUsdValue*((percentages[id]??0)/total)}
  else {const share=e.lockedUsdValue/bs.length;for(const id of bs)m.get(id)!.responsibility+=share}
 }
 return [...m.values()].map(p=>({...p,net:p.paid-p.responsibility}));
}
export function minimizeTransfers(positions:Position[]){const debtors=positions.filter(p=>p.net<-.000001).map(p=>({...p}));const creditors=positions.filter(p=>p.net>.000001).map(p=>({...p}));const transfers:{from:string;to:string;amount:number}[]=[];let i=0,j=0;while(i<debtors.length&&j<creditors.length){const amount=Math.min(-debtors[i].net,creditors[j].net);transfers.push({from:debtors[i].userId,to:creditors[j].userId,amount});debtors[i].net+=amount;creditors[j].net-=amount;if(Math.abs(debtors[i].net)<.000001)i++;if(Math.abs(creditors[j].net)<.000001)j++;}return transfers}