"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {AppNav} from "@/components/app-nav";

type TabRow={id:string;name:string;emoji?:string|null;status:string;membership:string};

export default function Home(){
 const {getAccessToken,user}=usePrivy();
 const [tabs,setTabs]=useState<TabRow[]>([]);
 const [loading,setLoading]=useState(true);
 const name=(user?.google?.name||user?.email?.address?.split("@")[0]||"there").split(" ")[0];
 useEffect(()=>{(async()=>{try{const token=await getAccessToken();if(!token)return;const res=await fetch("/api/tabs",{headers:{Authorization:`Bearer ${token}`}});if(res.ok){const data=await res.json();setTabs(data.tabs??[])}}finally{setLoading(false)}})()},[getAccessToken]);
 return <main className="shell home">
  <header className="homeHead"><div><small>Welcome back,</small><h1>{name} 👋</h1></div><div className="avatar photo">{name[0]?.toUpperCase()}</div></header>
  <p className="eyebrow">Your tabs</p>
  {loading?<div className="infoCard"><b>Loading your Tabs…</b></div>:tabs.length===0?
   <section className="emptyState"><h2>Nothing to settle yet.</h2><p>Start a Tab the next time you’re spending together.</p><Link className="primary" href="/create">+ Create a Tab</Link><Link className="secondary" href="/join">Join a Tab</Link></section>:
   <section className="tabCards">{tabs.map(tab=><Link key={tab.id} href={`/tab?id=${tab.id}`} className="tabCard"><div className="tabCardCopy"><h2>{tab.name} {tab.emoji??""}</h2><p>{tab.status}</p><small>{tab.membership==="active"?"You're in this Tab":tab.membership}</small></div></Link>)}</section>}
  <Link href="/create" className="fab">+</Link><AppNav active="home"/>
 </main>
}
