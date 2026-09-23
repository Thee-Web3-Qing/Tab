"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {usePrivy} from "@privy-io/react-auth";
import {useSearchParams} from "next/navigation";

type TabData={tab:{id:string;name:string;emoji?:string|null;status:string;inviteCode:string;splitMode:string};members:Array<{id:string;name:string;status:string}>;expenses:Array<{id:string;description:string;originalAmount:string;originalCurrency:string;payerName:string;beneficiaryCount:number}>};

export default function TabPage(){
 const {getAccessToken}=usePrivy(),params=useSearchParams(),id=params.get("id");
 const [data,setData]=useState<TabData|null>(null),[error,setError]=useState("");
 const [view,setView]=useState<"expenses"|"balances"|"details">("expenses");
 useEffect(()=>{if(!id){setError("Choose a Tab from Home.");return}(async()=>{const token=await getAccessToken();if(!token)return;const r=await fetch(`/api/tabs/${id}`,{headers:{Authorization:`Bearer ${token}`}});const j=await r.json();if(!r.ok)setError(j.error||"Unable to load Tab");else setData(j)})()},[getAccessToken,id]);
 if(error)return <main className="shell formPage"><Link href="/" className="back">‹</Link><div className="emptyState"><h2>{error}</h2><Link className="primary" href="/">Back home</Link></div></main>;
 if(!data)return <main className="shell"><div className="infoCard"><b>Loading Tab…</b></div></main>;
 const t=data.tab;
 return <main className="tabDetail"><section className="tabHero"><Link href="/" className="heroBack">‹</Link><div className="heroCopy"><h1>{t.name} {t.emoji??""}</h1><p>{data.members.filter(m=>m.status==="active").length} people · {t.status}</p></div></section><section className="detailSheet">
  <div className="segmented">{(["expenses","balances","details"] as const).map(x=><button key={x} onClick={()=>setView(x)} className={view===x?"on":""}>{x[0].toUpperCase()+x.slice(1)}</button>)}</div>
  {view==="expenses"&&<>{data.expenses.length===0?<div className="emptyState"><h2>No expenses yet.</h2><p>Add the first thing someone paid for.</p></div>:<div className="expenseList">{data.expenses.map(e=><div className="expense" key={e.id}><i>●</i><div><b>{e.description}</b><small>{e.originalCurrency} {e.originalAmount} · Paid by {e.payerName} · {e.beneficiaryCount} people</small></div></div>)}</div>}<Link className="primary" href={`/tab/add?id=${t.id}`}>Add expense</Link></>}
  {view==="balances"&&<div className="emptyState"><h2>Balances will appear here.</h2><p>They are calculated from the real expenses added to this Tab.</p></div>}
  {view==="details"&&<><div className="infoCard"><b>{t.name}</b><p>{t.splitMode==="equal"?"Equal split":"Percentage split"} · {data.members.length} members</p><p>Invite code <strong>{t.inviteCode}</strong></p></div><Link className="secondary" href={`/join?code=${encodeURIComponent(t.inviteCode)}`}>Invite people</Link></>}
 </section></main>
}
