import {NextResponse} from "next/server";
import {and,eq} from "drizzle-orm";
import {beneficiaries,expenses,members,tabs,users} from "@/db/schema";
import {getDb} from "@/lib/db";
import {requirePrivyUserId} from "@/lib/auth";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params,privyId=await requirePrivyUserId(),db=getDb();
  const [u]=await db.select().from(users).where(eq(users.privyId,privyId)).limit(1);
  if(!u)throw new Error("Sync your account first");
  const [membership]=await db.select().from(members).where(and(eq(members.tabId,id),eq(members.userId,u.id))).limit(1);
  if(!membership) return NextResponse.json({error:"You are not a member of this Tab"},{status:403});
  const [tab]=await db.select().from(tabs).where(eq(tabs.id,id)).limit(1);
  if(!tab)return NextResponse.json({error:"Tab not found"},{status:404});
  const memberRows=await db.select({id:users.id,name:users.name,status:members.status}).from(members).innerJoin(users,eq(members.userId,users.id)).where(eq(members.tabId,id));
  const expenseRows=await db.select({id:expenses.id,description:expenses.description,originalAmount:expenses.originalAmount,originalCurrency:expenses.originalCurrency,payerName:users.name}).from(expenses).innerJoin(users,eq(expenses.payerId,users.id)).where(and(eq(expenses.tabId,id),eq(expenses.status,"active")));
  const withCounts=await Promise.all(expenseRows.map(async e=>{const b=await db.select().from(beneficiaries).where(eq(beneficiaries.expenseId,e.id));return {...e,beneficiaryCount:b.length}}));
  return NextResponse.json({tab,members:memberRows,expenses:withCounts});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to load Tab"},{status:401})}
}
