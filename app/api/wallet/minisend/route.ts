import{NextResponse}from"next/server";import{desc,eq}from"drizzle-orm";import{currentUser}from"@/lib/current-user";import{getDb}from"@/lib/db";import{tabWallets,walletDeposits}from"@/db/schema";
const CHAINS=new Set(["base","ethereum","polygon","arbitrum","optimism","avalanche"]);
function pickAddress(data:any):string|null{const seen=new Set<any>();function walk(v:any):string|null{if(!v||typeof v!=="object"||seen.has(v))return null;seen.add(v);for(const k of["address","walletAddress","depositAddress"]){const x=v[k];if(typeof x==="string"&&/^0x[a-fA-F0-9]{40}$/.test(x))return x}for(const x of Object.values(v)){const r=walk(x);if(r)return r}return null}return walk(data)}
function pickId(data:any):string|null{for(const v of[data?.id,data?.walletId,data?.wallet?.id,data?.data?.id,data?.data?.wallet?.id])if(typeof v==="string"&&v)return v;return null}

export async function GET(){try{const u=await currentUser(),db=getDb();const wallets=await db.select().from(tabWallets).where(eq(tabWallets.userId,u.id));const deposits=await db.select().from(walletDeposits).where(eq(walletDeposits.userId,u.id)).orderBy(desc(walletDeposits.receivedAt)).limit(20);return NextResponse.json({wallets,deposits})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to load Tab Wallet"},{status:400})}}

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