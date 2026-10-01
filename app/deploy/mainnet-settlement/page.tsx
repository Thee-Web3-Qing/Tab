"use client";
import Link from"next/link";
import{useState}from"react";
import{useSendTransaction,useWallets}from"@privy-io/react-auth";
import{createPublicClient,encodeDeployData,http}from"viem";
import{ARC_MAINNET,ARC_USDC}from"@/lib/arc";

const FEE_WALLET="0x5204deaf171dbf7bf6590db9409b6b6c64dc4eea" as const;

export default function MainnetSettlementDeployer(){
 const{wallets}=useWallets(),{sendTransaction}=useSendTransaction();
 const[busy,setBusy]=useState(false),[error,setError]=useState(""),[hash,setHash]=useState(""),[contract,setContract]=useState("");
 async function deploy(){
  setBusy(true);setError("");setHash("");setContract("");
  try{
   const wallet=wallets.find(w=>w.walletClientType==="privy")||wallets[0];
   if(!wallet)throw new Error("Connect your Tab wallet first.");
   const r=await fetch("/generated/tab-settlement.json",{cache:"no-store"}),artifact=await r.json();
   if(!r.ok||!artifact?.bytecode||!artifact?.abi)throw new Error("Settlement contract artifact is unavailable.");
   const data=encodeDeployData({abi:artifact.abi,bytecode:artifact.bytecode,args:[ARC_USDC,FEE_WALLET]});
   const sent=await sendTransaction({data,chainId:5042} as any,{address:wallet.address});
   setHash(sent.hash);
   const client=createPublicClient({chain:ARC_MAINNET,transport:http("https://rpc.mainnet.arc.io")});
   const receipt=await client.waitForTransactionReceipt({hash:sent.hash as `0x${string}`,confirmations:1});
   if(receipt.status!=="success"||!receipt.contractAddress)throw new Error("Deployment did not return a contract address.");
   setContract(receipt.contractAddress);
  }catch(e){setError(e instanceof Error?e.message:"Deployment failed")}finally{setBusy(false)}
 }
 async function copy(v:string){await navigator.clipboard.writeText(v)}
 return <main className="deploySettlement"><Link href="/me" className="heroBack">‹</Link><span className="deployBadge">Arc Mainnet</span><h1>Deploy TabSettlement</h1><p>This deploys the production settlement contract. The fee wallet is immutable after deployment.</p><section className="deployCard"><div><span>Network</span><b>Arc Mainnet · Chain 5042</b></div><div><span>USDC</span><code>{ARC_USDC}</code></div><div><span>Tab fee wallet</span><code>{FEE_WALLET}</code></div><div><span>Fee model</span><b>0.5% base · 0.03 USDC floor · 3% max</b></div></section>{!contract?<button className="primary" disabled={busy} onClick={deploy}>{busy?"Deploying…":"Deploy Mainnet contract"}</button>:<section className="deploySuccess"><span>Deployment successful</span><h2>{contract}</h2><button onClick={()=>copy(contract)}>Copy contract address</button><p>Send me this CA and I’ll wire it into production settlement.</p></section>}{hash&&<section className="deployResult"><small>Deployment transaction</small><code>{hash}</code></section>}{error&&<p className="error">{error}</p>}<small className="deployWarning">Deploy only once.</small></main>
}