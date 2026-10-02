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
  <section className="landingHow" id="how"><span className="landingEyebrow">How Tab works</span><h2>One shared space.<br/>No spreadsheet energy.</h2><div className="landingSteps"><article><b>01</b><h3>Start a Tab</h3><p>Create one for the dinner, trip, house or group and invite everyone in.</p></article><article><b>02</b><h3>Add what you paid</h3><p>The payer adds the expense. Split equally or set exactly who owes what.</p></article><article><b>03</b><h3>Settle once</h3><p>When the group is done, Tab works out the cleanest way to make everyone even.</p></article></div></section>
  <section className="landingMoment"><div><span className="landingEyebrow">Made for real friendships</span><h2>Less “how much do I owe you?”</h2><p>Keep the group chat for the actual gist. Tab remembers the money part.</p></div><button onClick={login}>Get started free →</button></section>
  <footer className="landingFooter"><BrandMark/><p>Shared spending, simplified.</p><button onClick={login}>Sign in</button></footer>
 </main>;
 return <>{children}</>
}