import{createHash,createHmac,timingSafeEqual}from"crypto";import{NextResponse}from"next/server";import{eq}from"drizzle-orm";import{neon}from"@neondatabase/serverless";import{getDb}from"@/lib/db";import{tabWallets,users,walletDeposits}from"@/db/schema";

export const runtime="nodejs";

function valid(raw:string,sig:string){const secret=process.env.MINISEND_WEBHOOK_SECRET;if(!secret)return false;const expected=createHmac("sha256",secret).update(raw,"utf8").digest("hex"),normalized=sig.replace(/^sha256=/i,"").trim();try{const a=Buffer.from(normalized,"hex"),b=Buffer.from(expected,"hex");return a.length===b.length&&timingSafeEqual(a,b)}catch{return false}}
function first(...v:any[]){return v.find(x=>x!==undefined&&x!==null&&x!=="")}
function string(v:any){return v==null?null:String(v)}
function parseWalletRef(p:any){return string(first(p?.walletRef,p?.wallet_ref,p?.wallet?.walletRef,p?.wallet?.wallet_ref,p?.data?.walletRef,p?.data?.wallet_ref,p?.data?.wallet?.walletRef,p?.data?.wallet?.wallet_ref,p?.deposit?.walletRef,p?.deposit?.wallet_ref))}
function parseAmount(p:any){const v=first(p?.amount,p?.amount_usdc,p?.deposit?.amount,p?.deposit?.amount_usdc,p?.data?.amount,p?.data?.amount_usdc);if(v==null)return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n.toFixed(6):null}

async function ensureWalletTables(){
 const url=process.env.DATABASE_URL;
 if(!url)throw new Error("DATABASE_URL is not configured");
 const sql=neon(url);
 await sql`CREATE TABLE IF NOT EXISTS tab_wallets(
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   provider text NOT NULL DEFAULT 'minisend',
   provider_wallet_id text,
   wallet_ref text NOT NULL UNIQUE,
   chain text NOT NULL,
   address text NOT NULL,
   created_at timestamptz NOT NULL DEFAULT now(),
   updated_at timestamptz NOT NULL DEFAULT now()
 )`;
 await sql`CREATE UNIQUE INDEX IF NOT EXISTS tab_wallets_user_unique ON tab_wallets(user_id)`;
 await sql`CREATE TABLE IF NOT EXISTS wallet_deposits(
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   wallet_id uuid REFERENCES tab_wallets(id) ON DELETE SET NULL,
   provider_event_id text NOT NULL UNIQUE,
   wallet_ref text NOT NULL,
   chain text NOT NULL,
   token text NOT NULL DEFAULT 'USDC',
   amount numeric(18,6) NOT NULL,
   tx_hash text,
   status text NOT NULL DEFAULT 'received',
   raw_payload text,
   received_at timestamptz NOT NULL DEFAULT now(),
   created_at timestamptz NOT NULL DEFAULT now()
 )`;
 await sql`CREATE INDEX IF NOT EXISTS wallet_deposits_user_idx ON wallet_deposits(user_id)`;
 await sql`CREATE INDEX IF NOT EXISTS wallet_deposits_wallet_ref_idx ON wallet_deposits(wallet_ref)`;
}

export async function POST(req:Request){
 const raw=await req.text(),sig=req.headers.get("x-minisend-signature")||"";
 if(!process.env.MINISEND_WEBHOOK_SECRET)return NextResponse.json({error:"MiniSend webhook secret is not configured"},{status:503});
 if(!valid(raw,sig))return NextResponse.json({error:"Invalid MiniSend signature"},{status:401});
 let p:any;try{p=JSON.parse(raw)}catch{return NextResponse.json({error:"Invalid JSON payload"},{status:400})}
 await ensureWalletTables();
 const event=String(first(p?.event,p?.type,p?.event_type,"unknown"));
 const isDeposit=event==="wallet.deposit.received"||event.includes("deposit");
 if(!isDeposit)return NextResponse.json({ok:true,received:true,event,ignored:true});

 const walletRef=parseWalletRef(p),amount=parseAmount(p);
 if(!walletRef||!amount)return NextResponse.json({ok:true,received:true,event,ignored:true,reason:"deposit payload missing walletRef or amount"});

 const db=getDb();
 let wallet=(await db.select().from(tabWallets).where(eq(tabWallets.walletRef,walletRef)).limit(1))[0];
 let userId=wallet?.userId;
 if(!userId){
   const m=walletRef.match(/^tab-([0-9a-fA-F-]{36})(?:-|$)/);
   if(m){const u=(await db.select({id:users.id}).from(users).where(eq(users.id,m[1])).limit(1))[0];if(u)userId=u.id}
 }
 if(!userId)return NextResponse.json({ok:true,received:true,event,ignored:true,reason:"walletRef is not linked to a Tab user"});

 const chain=String(first(p?.chain,p?.network,p?.wallet?.chain,p?.data?.chain,p?.deposit?.chain,wallet?.chain,"unknown")).toLowerCase();
 const token=String(first(p?.token,p?.asset,p?.currency,p?.deposit?.token,p?.data?.token,"USDC")).toUpperCase();
 const txHash=string(first(p?.txHash,p?.tx_hash,p?.transactionHash,p?.transaction_hash,p?.deposit?.txHash,p?.deposit?.tx_hash,p?.data?.txHash,p?.data?.tx_hash));
 const providerEventId=String(first(p?.id,p?.eventId,p?.event_id,p?.deposit?.id,p?.data?.id,createHash("sha256").update(raw).digest("hex")));
 const receivedAtRaw=first(p?.createdAt,p?.created_at,p?.timestamp,p?.deposit?.createdAt,p?.data?.createdAt);
 const receivedAt=receivedAtRaw?new Date(receivedAtRaw):new Date();

 if(!wallet){
   const address=string(first(p?.address,p?.walletAddress,p?.wallet_address,p?.wallet?.address,p?.deposit?.address,p?.data?.address));
   if(address){const inserted=await db.insert(tabWallets).values({userId,provider:"minisend",walletRef,chain,address,providerWalletId:string(first(p?.walletId,p?.wallet_id,p?.wallet?.id,p?.data?.walletId))}).onConflictDoNothing({target:tabWallets.walletRef}).returning();wallet=inserted[0]||(await db.select().from(tabWallets).where(eq(tabWallets.walletRef,walletRef)).limit(1))[0]}
 }

 await db.insert(walletDeposits).values({userId,walletId:wallet?.id??null,providerEventId,walletRef,chain,token,amount,txHash,status:"received",rawPayload:raw,receivedAt:Number.isNaN(receivedAt.getTime())?new Date():receivedAt}).onConflictDoNothing({target:walletDeposits.providerEventId});
 return NextResponse.json({ok:true,received:true,event});
}