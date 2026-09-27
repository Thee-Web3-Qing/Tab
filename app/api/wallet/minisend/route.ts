import{NextResponse}from"next/server";import{desc,eq}from"drizzle-orm";import{currentUser}from"@/lib/current-user";import{getDb}from"@/lib/db";import{tabWallets,walletDeposits}from"@/db/schema";import{neon}from"@neondatabase/serverless";
const CHAINS=new Set(["base","ethereum","polygon","arbitrum","optimism","avalanche"]);
function pickAddress(data:any):string|null{const seen=new Set<any>();function walk(v:any):string|null{if(!v||typeof v!=="object"||seen.has(v))return null;seen.add(v);for(const k of["address","walletAddress","depositAddress"]){const x=v[k];if(typeof x==="string"&&/^0x[a-fA-F0-9]{40}$/.test(x))return x}for(const x of Object.values(v)){const r=walk(x);if(r)return r}return null}return walk(data)}
function pickId(data:any):string|null{for(const v of[data?.id,data?.walletId,data?.wallet?.id,data?.data?.id,data?.data?.wallet?.id])if(typeof v==="string"&&v)return v;return null}

async function ensureDepositColumns(){const url=process.env.DATABASE_URL;if(!url)throw new Error("DATABASE_URL is not configured");const sql=neon(url);await sql`ALTER TABLE wallet_deposits ADD COLUMN IF NOT EXISTS provider_deposit_id text`;await sql`ALTER TABLE wallet_deposits ADD COLUMN IF NOT EXISTS settlement_status text`;await sql`ALTER TABLE wallet_deposits ADD COLUMN IF NOT EXISTS settlement_chain text`;await sql`ALTER TABLE wallet_deposits ADD COLUMN IF NOT EXISTS settlement_amount numeric(18,6)`;await sql`ALTER TABLE wallet_deposits ADD COLUMN IF NOT EXISTS settlement_tx_hash text`;await sql`CREATE INDEX IF NOT EXISTS wallet_deposits_provider_deposit_idx ON wallet_deposits(provider_deposit_id)`}
const SETTLEMENT_CHAIN="arc";
async function settlementConfig(){const key=process.env.MINISEND_WALLET_API_KEY;if(!key)return{config:null,error:"MiniSend Wallet API is not configured",chain:null,enabled:false,desiredChain:SETTLEMENT_CHAIN};const base=(process.env.MINISEND_WALLET_API_BASE||"https://merchant.minisend.xyz").replace(/\/$/,"");try{let r=await fetch(base+"/api/v1/settlement",{headers:{Authorization:`Bearer ${key}`},cache:"no-store"});let data=await r.json().catch(()=>({}));if(!r.ok)return{config:null,error:data?.message||data?.error||`MiniSend settlement API returned ${r.status}`,chain:null,enabled:false,desiredChain:SETTLEMENT_CHAIN};let chain=String(data?.chain||data?.settlementChain||data?.settlement_chain||data?.data?.chain||data?.data?.settlement?.chain||"").toLowerCase()||null;let enabled=typeof data?.enabled==="boolean"?data.enabled:typeof data?.active==="boolean"?data.active:!!chain;if(chain!==SETTLEMENT_CHAIN||!enabled){r=await fetch(base+"/api/v1/settlement",{method:"PUT",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({chain:"ARC"}),cache:"no-store"});data=await r.json().catch(()=>({}));if(!r.ok)return{config:data,error:data?.message||data?.error||`MiniSend could not activate ARC settlement (${r.status})`,chain,enabled,desiredChain:SETTLEMENT_CHAIN};chain=String(data?.chain||data?.settlementChain||data?.settlement_chain||data?.data?.chain||data?.data?.settlement?.chain||"arc").toLowerCase();enabled=typeof data?.enabled==="boolean"?data.enabled:typeof data?.active==="boolean"?data.active:true}return{config:data,error:null,chain,enabled,desiredChain:SETTLEMENT_CHAIN}}catch(e){return{config:null,error:e instanceof Error?e.message:"Unable to load settlement configuration",chain:null,enabled:false,desiredChain:SETTLEMENT_CHAIN}}}
const BASE_USDC="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ARC_USDC="0x3600000000000000000000000000000000000000";
async function erc20Balance(rpc:string,token:string,address:string){try{const selector="0x70a08231"+address.toLowerCase().replace(/^0x/,"").padStart(64,"0");const r=await fetch(rpc,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:"eth_call",params:[{to:token,data:selector},"latest"]}),cache:"no-store"});const j=await r.json();if(!r.ok||j?.error||typeof j?.result!=="string")return null;return Number(BigInt(j.result))/1e6}catch{return null}}
export async function GET(){try{await ensureDepositColumns();const u=await currentUser(),db=getDb();const wallets=await db.select().from(tabWallets).where(eq(tabWallets.userId,u.id));const deposits=await db.select().from(walletDeposits).where(eq(walletDeposits.userId,u.id)).orderBy(desc(walletDeposits.receivedAt)).limit(20);const evmWallet=wallets[0];const[baseOnchainBalanceUsdc,arcOnchainBalanceUsdc,settlement]=await Promise.all([evmWallet?.address?erc20Balance(process.env.BASE_RPC_URL||"https://mainnet.base.org",BASE_USDC,evmWallet.address):null,evmWallet?.address?erc20Balance(process.env.ARC_MAINNET_RPC_URL||"https://rpc.mainnet.arc.io",ARC_USDC,evmWallet.address):null,settlementConfig()]);return NextResponse.json({wallets,deposits,baseOnchainBalanceUsdc,arcOnchainBalanceUsdc,settlement,supportedFundingChains:[...CHAINS]})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to load Tab Wallet"},{status:400})}}

export async function POST(req:Request){try{
 const u=await currentUser(),b=await req.json(),chain=String(b.chain||"base").toLowerCase();
 if(!CHAINS.has(chain))return NextResponse.json({error:"Unsupported funding network"},{status:400});
 const key=process.env.MINISEND_WALLET_API_KEY;
 if(!key)return NextResponse.json({error:"MiniSend Wallet API is not configured"},{status:503});
 const db=getDb();

 // One Tab user, one permanent EVM wallet. Never ask MiniSend for another address once one is stored.
 const existing=(await db.select().from(tabWallets).where(eq(tabWallets.userId,u.id)).limit(1))[0];
 if(existing)return NextResponse.json({...existing,permanent:true});

 const walletRef=`tab-${u.id}`;
 const base=(process.env.MINISEND_WALLET_API_BASE||"https://merchant.minisend.xyz").replace(/\/$/,"");
 const r=await fetch(base+"/api/v1/wallets",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({walletRef,chain:chain.toUpperCase()}),cache:"no-store"});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)return NextResponse.json({error:data?.message||data?.error||"Could not create funding address",providerStatus:r.status},{status:r.status});
 const address=pickAddress(data),providerWalletId=pickId(data);
 if(!address)return NextResponse.json({error:"Funding address was not returned by the wallet provider",providerWalletId},{status:502});

 const inserted=await db.insert(tabWallets).values({userId:u.id,provider:"minisend",providerWalletId,walletRef,chain,address}).onConflictDoNothing({target:tabWallets.userId}).returning();
 const wallet=inserted[0]||(await db.select().from(tabWallets).where(eq(tabWallets.userId,u.id)).limit(1))[0];
 if(!wallet)return NextResponse.json({error:"Could not lock your permanent Tab Wallet"},{status:500});
 return NextResponse.json({...wallet,permanent:true});
}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to create funding address"},{status:400})}}