"use client";
import Link from"next/link";
import{useEffect,useMemo,useState}from"react";
import{usePrivy,useSendTransaction,useWallets}from"@privy-io/react-auth";
import{createPublicClient,encodeDeployData,formatUnits,http}from"viem";
import{ARC_MAINNET,ARC_USDC}from"@/lib/arc";

const FEE_WALLET="0x5204deaf171dbf7bf6590db9409b6b6c64dc4eea" as const;
const client=createPublicClient({chain:ARC_MAINNET,transport:http("https://rpc.mainnet.arc.io")});

export default function MainnetSettlementDeployer(){
 const{wallets}=useWallets(),{getAccessToken}=usePrivy(),{sendTransaction}=useSendTransaction();
 const[busy,setBusy]=useState(false),[error,setError]=useState(""),[hash,setHash]=useState(""),[contract,setContract]=useState(""),[gasBalance,setGasBalance]=useState<number|null>(null),[tabWallet,setTabWallet]=useState("");
 const deployer=useMemo(()=>wallets.find(w=>w.walletClientType==="privy")||wallets[0],[wallets]);
 useEffect(()=>{if(!deployer?.address)return;let live=true;void(async()=>{try{const b=await client.getBalance({address:deployer.address as `0x${string}`});if(live)setGasBalance(Number(formatUnits(b,18)))}catch{if(live)setGasBalance(null)}try{const t=await getAccessToken(),r=await fetch("/api/wallet/minisend",{headers:{Authorization:"Bearer "+t}}),j=await r.json();if(r.ok&&live)setTabWallet(j.wallets?.[0]?.address||"")}catch{}})();return()=>{live=false}},[deployer?.address,getAccessToken]);
 async function deploy(){
  setBusy(true);setError("");setHash("");setContract("");
  try{
   const wallet=deployer;
   if(!wallet)throw new Error("Your deployment wallet is not ready.");
   if((gasBalance??0)<=0)throw new Error("Fund the deployment wallet shown below with Arc Mainnet USDC for gas first.");
   const r=await fetch("/generated/tab-settlement.json",{cache:"no-store"}),artifact=await r.json();
   if(!r.ok||!artifact?.bytecode||!artifact?.abi)throw new Error("Settlement contract artifact is unavailable.");
   const data=encodeDeployData({abi:artifact.abi,bytecode:artifact.bytecode,args:[ARC_USDC,FEE_WALLET]});
   const sent=await sendTransaction({data,chainId:5042} as any,{address:wallet.address});
   setHash(sent.hash);
   const receipt=await client.waitForTransactionReceipt({hash:sent.hash as `0x${string}`,confirmations:1});
   if(receipt.status!=="success"||!receipt.contractAddress)throw new Error("Deployment did not return a contract address.");
   setContract(receipt.contractAddress);
  }catch(e){setError(e instanceof Error?e.message:"Deployment failed")}finally{setBusy(false)}
 }
 async function copy(v:string){await navigator.clipboard.writeText(v)}
 const same=!!deployer?.address&&!!tabWallet&&deployer.address.toLowerCase()===tabWallet.toLowerCase();
 return <main className="deploySettlement"><Link href="/me" className="heroBack">‹</Link><span className="deployBadge">Arc Mainnet</span><h1>Deploy TabSettlement</h1><p>This deploys the production settlement contract. The fee wallet is immutable after deployment.</p><section className="deployCard"><div><span>Network</span><b>Arc Mainnet · Chain 5042</b></div><div><span>USDC</span><code>{ARC_USDC}</code></div><div><span>Tab fee wallet</span><code>{FEE_WALLET}</code></div><div><span>Fee model</span><b>0.5% base · 0.03 USDC floor · 3% max</b></div></section><section className="deployWallet"><small>Deployment wallet</small><b>{deployer?.address||"Loading…"}</b>{deployer?.address&&<button onClick={()=>copy(deployer.address)}>Copy address</button>}<p>Arc gas balance: {gasBalance==null?"—":gasBalance.toFixed(6)} USDC</p>{tabWallet&&!same&&<p>Your Tab Wallet balance is held at a different MiniSend address ({tabWallet.slice(0,6)}…{tabWallet.slice(-4)}). That balance does not automatically fund this browser deployment wallet.</p>}</section>{!contract?<button className="primary" disabled={busy||!deployer||gasBalance==null||gasBalance<=0} onClick={deploy}>{busy?"Deploying…":gasBalance!=null&&gasBalance<=0?"Fund deployment wallet first":"Deploy Mainnet contract"}</button>:<section className="deploySuccess"><span>Deployment successful</span><h2>{contract}</h2><button onClick={()=>copy(contract)}>Copy contract address</button><p>Send me this CA and I’ll wire it into production settlement.</p></section>}{hash&&<section className="deployResult"><small>Deployment transaction</small><code>{hash}</code></section>}{error&&<p className="error">{error}</p>}<small className="deployWarning">Arc uses USDC as its native gas token. Deploy only once.</small></main>
}