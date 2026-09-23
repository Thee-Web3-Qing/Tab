const BASE="https://merchant.minisend.xyz/api/onramp";
function key(){const k=process.env.MINISEND_API_KEY;if(!k)throw new Error("MINISEND_API_KEY is not configured");return k}
async function call(path:string,body:unknown,extra:Record<string,string>={}){const r=await fetch(BASE+path,{method:"POST",headers:{Authorization:`Bearer ${key()}`,"Content-Type":"application/json",...extra},body:JSON.stringify(body),cache:"no-store"});const data=await r.json();if(!r.ok)throw new Error(data?.message||data?.error||"Minisend request failed");return data}
export function quoteKesForUsdc(amountUsdc:number){return call("/quote",{currency:"KES",amount_usdc:amountUsdc})}
export function createKesOrder(input:{amountUsdc:number;phone:string;address:string;reference:string}){return call("/orders",{currency:"KES",amount_usdc:input.amountUsdc,phone:input.phone,address:input.address,reference:input.reference},{"Idempotency-Key":input.reference})}
