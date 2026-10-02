"use client";
import{usePrivy}from"@privy-io/react-auth";
import{usePathname}from"next/navigation";
import type{ReactNode}from"react";
import{BrandMark}from"@/components/brand-mark";
export function AuthGate({children}:{children:ReactNode}){
 const{ready,authenticated,login}=usePrivy(),path=usePathname(),publicInvite=path.startsWith("/join")||path.startsWith("/deploy/");
 if(publicInvite)return <>{children}</>;
 if(!ready)return <main className="landing loadingLanding"><BrandMark/><p>Opening Tab…</p></main>;
 if(!authenticated)return <main className="landing">
  <nav className="landingNav"><BrandMark/><button onClick={login}>Sign in</button></nav>
  <section className="landingHero">
   <div className="landingHeroCopy"><span className="landingEyebrow">Shared spending without the awkward maths</span><h1>Spend together.<br/><em>Stay even.</em></h1><p>For dinners, trips, roommates and every “I’ll get the next one.” Tab keeps track of who paid, who owes, and gets everyone settled.</p><div className="landingCtas"><button className="landingPrimary" onClick={login}>Start a Tab <span>→</span></button><a href="#how">See how it works</a></div></div>
   <div className="landingScene"><div className="landingPhoto"><div className="landingPhotoShade"/><div className="landingFloat top"><small>Friday dinner</small><b>5 friends · 4 expenses</b></div><div className="landingFloat bottom"><span>Everyone’s even</span><b>✓</b></div></div></div>
  </section>
  <section className="landingProof"><span>DINNERS</span><span>TRIPS</span><span>ROOMMATES</span><span>COUPLES</span></section>
  <section className="landingStories"><div className="storyImage storyWeekend"><span>Weekend away</span><b>Split the trip, not the friendship.</b></div><div className="storyImage storyHome"><span>At home</span><b>Rent, groceries and everything in between.</b></div><div className="storyImage storyProject"><span>With your people</span><b>One Tab for whatever you are doing together.</b></div></section>
  <section className="landingHow" id="how"><span className="landingEyebrow">How Tab works</span><h2>One shared space.<br/>No spreadsheet energy.</h2><div className="landingSteps"><article><b>01</b><h3>Start a Tab</h3><p>Create one for the dinner, trip, house or group and invite everyone in.</p></article><article><b>02</b><h3>Add what you paid</h3><p>The payer adds the expense. Split equally or set exactly who owes what.</p></article><article><b>03</b><h3>Settle once</h3><p>When the group is done, Tab works out the cleanest way to make everyone even.</p></article></div></section>
  <section className="landingWallet"><div className="landingWalletVisual"><div className="miniWallet"><small>TAB WALLET</small><strong>$84.20</strong><span>USDC · Arc</span></div><div className="settledChip">✓ Settled</div></div><div className="landingWalletCopy"><span className="landingEyebrow">From “I owe you” to done</span><h2>Settle inside Tab.</h2><p>Your Tab Wallet keeps settlement in one place. Group debts settle in USDC on Arc, while MiniSend powers wallet infrastructure and off-ramp access so the experience can stay simple for everyday users.</p><div className="partnerRow"><b>Settlement</b><span>Arc</span><i>+</i><b>Off-ramp partner</b><span>MiniSend</span></div></div></section>
  <section className="landingFeatureGrid"><article><span>01</span><h3>Flexible splits</h3><p>Equal split, percentages, or only the people who actually shared the expense.</p></article><article><span>02</span><h3>Receipts attached</h3><p>Keep the proof with the expense, whether it came from paper or your bank app.</p></article><article><span>03</span><h3>Ask a friend to settle</h3><p>Short on funds? Send a private request for a friend to help cover your settlement.</p></article><article><span>04</span><h3>Close together</h3><p>Tabs stay social. Members review expenses and agree before the final settlement.</p></article></section>
  <section className="landingMoment"><div><span className="landingEyebrow">Made for real friendships</span><h2>Less “how much do I owe you?”</h2><p>Keep the group chat for the actual gist. Tab remembers the money part.</p></div><button onClick={login}>Get started free →</button></section>
  <footer className="landingFooter"><BrandMark/><p>Shared spending, simplified.</p><button onClick={login}>Sign in</button></footer>
 </main>;
 return <>{children}</>
}