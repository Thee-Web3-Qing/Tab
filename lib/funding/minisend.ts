const BASE="https://merchant.minisend.xyz/api/onramp";
function key(){const k=process.env.MINISEND_API_KEY;if(!k)throw new Error("MINISEND_API_KEY is not configured");return k}
async function request(path:string,init:RequestInit={}){const r=await fetch(BASE+path,{...init,headers:{Authorization:`Bearer ${key()}`,...(init.body?{"Content-Type":"application/json"}:{}),...(init.headers||{})},cache:"no-store"});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data?.message||data?.error||"Minisend request failed");return data}
async function post(path:string,body:unknown,extra:Record<string,string>={}){return request(path,{method:"POST",headers:extra,body:JSON.stringify(body)})}
export function quoteKesForUsdc(amountUsdc:number){return post("/quote",{currency:"KES",amount_usdc:amountUsdc})}
export function createKesOrder(input:{amountUsdc:number;phone:string;address:string;reference:string}){return post("/orders",{currency:"KES",amount_usdc:input.amountUsdc,phone:input.phone,address:input.address,reference:input.reference},{"Idempotency-Key":input.reference})}
export function listNgnInstitutions(){return request("/institutions?currency=NGN")}
export function quoteNgn(input:{amountNgn?:number;amountUsdc?:number}){return post("/quote",{currency:"NGN",...(input.amountNgn!=null?{amount_ngn:input.amountNgn}:{amount_usdc:input.amountUsdc})})}
export function createNgnOrder(input:{amountNgn?:number;amountUsdc?:number;institution:string;accountNumber:string;accountName?:string;address:string;reference:string}){return post("/orders",{currency:"NGN",...(input.amountNgn!=null?{amount_ngn:input.amountNgn}:{amount_usdc:input.amountUsdc}),refund_account:{institution:input.institution,account_number:input.accountNumber,...(input.accountName?{account_name:input.accountName}:{})},address:input.address,reference:input.reference},{"Idempotency-Key":input.reference})}
export function getOnrampOrder(orderId:string){return request("/orders/"+encodeURIComponent(orderId))}
