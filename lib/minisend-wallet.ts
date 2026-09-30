const BASE="https://merchant.minisend.xyz";
const CHAINS=new Set(["BASE","AVAX","ETH","OP","ARB","ARC","MATIC"]);
export type MinisendTransferChain="BASE"|"AVAX"|"ETH"|"OP"|"ARB"|"ARC"|"MATIC";
export type MinisendTransfer={id:string;state:"queued"|"sending"|"completed"|"failed"|"under_review";from:string;to:string;chain:MinisendTransferChain;token:"USDC"|"USDT";amount:string;tx_hash:string|null;created_at:string;updated_at:string};
function key(){const k=process.env.MINISEND_WALLET_API_KEY;if(!k)throw new Error("MiniSend Wallet API is not configured");return k}
async function request(path:string,init:RequestInit={}){const headers=new Headers(init.headers);headers.set("Authorization",`Bearer ${key()}`);if(init.body&&!headers.has("Content-Type"))headers.set("Content-Type","application/json");const r=await fetch(BASE+path,{...init,headers,cache:"no-store"});const data:any=await r.json().catch(()=>({}));if(!r.ok){const message=typeof data?.error==="string"?data.error:typeof data?.message==="string"?data.message:`MiniSend Wallet API returned ${r.status}`;const e=new Error(message) as Error&{status?:number};e.status=r.status;throw e}return data}
export function transferMinimum(chain:MinisendTransferChain){if(chain==="ETH")return 20;if(chain==="AVAX")return 0.5;return 0.1}
export function parseTransferChain(value:unknown):MinisendTransferChain{const chain=String(value||"BASE").toUpperCase();if(!CHAINS.has(chain))throw new Error("Unsupported transfer network");return chain as MinisendTransferChain}
export async function createWalletTransfer(input:{from:string;to:string;chain:MinisendTransferChain;token:"USDC"|"USDT";amount:number;idempotencyKey:string}):Promise<{transfer:MinisendTransfer}>{return await request("/api/v1/transfers",{method:"POST",body:JSON.stringify({from:input.from,to:input.to,chain:input.chain,token:input.token,amount:input.amount,idempotency_key:input.idempotencyKey})})}
export async function getWalletTransfer(id:string):Promise<{transfer:MinisendTransfer}>{return await request("/api/v1/transfers/"+encodeURIComponent(id))}

export async function listWalletTransfers(limit=100,offset=0):Promise<{transfers:MinisendTransfer[];total?:number;limit?:number;offset?:number}>{return await request(`/api/v1/transfers?limit=${Math.min(Math.max(limit,1),100)}&offset=${Math.max(offset,0)}`)}
