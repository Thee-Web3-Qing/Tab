import{eq,ilike}from"drizzle-orm";import{tabWallets,users}from"@/db/schema";import{getDb}from"@/lib/db";
type UserLike={id:string;email:string|null};
export async function walletOwnerCandidates(user:UserLike){const db=getDb(),ids=[user.id];if(user.email){const matches=await db.select({id:users.id}).from(users).where(ilike(users.email,user.email.trim()));for(const m of matches)if(!ids.includes(m.id))ids.push(m.id)}return ids}
export async function resolveStoredTabWallet(user:UserLike){const db=getDb();for(const id of await walletOwnerCandidates(user)){const[w]=await db.select().from(tabWallets).where(eq(tabWallets.userId,id)).limit(1);if(w)return w}return null}
