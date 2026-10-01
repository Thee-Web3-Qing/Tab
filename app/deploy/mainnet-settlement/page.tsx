"use client";
import Link from"next/link";
import{useEffect,useState}from"react";
import{createPublicClient,createWalletClient,custom,formatUnits,http}from"viem";
import{ARC_MAINNET,ARC_USDC}from"@/lib/arc";

const FEE_WALLET="0xc499E174895a4c2D7A2e12dcfacfCFB8F7CC701e" as const;
const client=createPublicClient({chain:ARC_MAINNET,transport:http("https://rpc.mainnet.arc.io")});

export default function MainnetSettlementDeployer(){
 const[address,setAddress]=useState<`0x${string}`|null>(null),[gasBalance,setGasBalance]=useState<number|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[hash,setHash]=useState(""),[contract,setContract]=useState("");

 async function refreshBalance(a:`0x${string}`){
  try{const b=await client.getBalance({address:a});setGasBalance(Number(formatUnits(b,18)))}catch{setGasBalance(null)}
 }

 async function connect(){
  setError("");
  try{
   const provider=(window as any).ethereum;
   if(!provider)throw new Error("No EVM wallet was found in this browser. Open this page inside MetaMask or another wallet browser.");
   try{await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x13b2"}]})}
   catch(e:any){
    if(e?.code!==4902)throw e;
    await provider.request({method:"wallet_addEthereumChain",params:[{chainId:"0x13b2",chainName:"Arc Mainnet",nativeCurrency:{name:"USDC",symbol:"USDC",decimals:18},rpcUrls:["https://rpc.mainnet.arc.io"],blockExplorerUrls:["https://explorer.arc.io"]}]});
   }
   const accounts=await provider.request({method:"eth_requestAccounts"});
   const a=String(accounts?.[0]||"") as `0x${string}`;
   if(!/^0x[a-fA-F0-9]{40}$/.test(a))throw new Error("Wallet did not return a valid address.");
   setAddress(a);await refreshBalance(a);
  }catch(e){setError(e instanceof Error?e.message:"Could not connect wallet")}
 }

 useEffect(()=>{void(async()=>{const provider=(window as any).ethereum;if(!provider)return;try{const accounts=await provider.request({method:"eth_accounts"});const a=String(accounts?.[0]||"") as `0x${string}`;if(/^0x[a-fA-F0-9]{40}$/.test(a)){setAddress(a);await refreshBalance(a)}}catch{}})()},[]);

 async function deploy(){
  setBusy(true);setError("");setHash("");setContract("");
  try{
   const provider=(window as any).ethereum;
   if(!provider||!address)throw new Error("Connect your deployment wallet first.");
   if((gasBalance??0)<=0)throw new Error("Fund this wallet with Arc Mainnet USDC for gas first.");
   const r=await fetch("/generated/tab-settlement.json",{cache:"no-store"}),artifact=await r.json();
   if(!r.ok||!artifact?.bytecode||!artifact?.abi)throw new Error("Settlement contract artifact is unavailable.");
   const walletClient=createWalletClient({account:address,chain:ARC_MAINNET,transport:custom(provider)});
   const tx=await walletClient.deployContract({abi:artifact.abi,bytecode:artifact.bytecode,args:[ARC_USDC,FEE_WALLET],account:address});
   setHash(tx);
   const receipt=await client.waitForTransactionReceipt({hash:tx,confirmations:1});
   if(receipt.status!=="success"||!receipt.contractAddress)throw new Error("Deployment did not return a contract address.");
   setContract(receipt.contractAddress);
  }catch(e){setError(e instanceof Error?e.message:"Deployment failed")}finally{setBusy(false)}
 }

 async function copy(v:string){await navigator.clipboard.writeText(v)}

 return <main className="deploySettlement"><Link href="/me" className="heroBack">‹</Link><span className="deployBadge">Arc Mainnet</span><h1>Deploy TabSettlement</h1><p>Connect a dedicated external EVM wallet. This page no longer uses Privy.</p><section className="deployCard"><div><span>Network</span><b>Arc Mainnet · Chain 5042</b></div><div><span>USDC</span><code>{ARC_USDC}</code></div><div><span>Tab fee wallet</span><code>{FEE_WALLET}</code></div><div><span>Fee model</span><b>0.5% base · 0.03 USDC floor · 3% max</b></div></section><section className="deployWallet"><small>External deployment wallet</small><b>{address||"Not connected"}</b>{address&&<button onClick={()=>copy(address)}>Copy address</button>}<p>Arc gas balance: {gasBalance==null?"—":gasBalance.toFixed(6)} USDC</p></section>{!address?<button className="primary" onClick={connect}>Connect wallet</button>:!contract?<button className="primary" disabled={busy||gasBalance==null||gasBalance<=0} onClick={deploy}>{busy?"Deploying…":gasBalance!=null&&gasBalance<=0?"Fund this wallet first":"Deploy Mainnet contract"}</button>:<section className="deploySuccess"><span>Deployment successful</span><h2>{contract}</h2><button onClick={()=>copy(contract)}>Copy contract address</button><p>Send me this CA and I’ll wire it into production settlement.</p></section>}{hash&&<section className="deployResult"><small>Deployment transaction</small><code>{hash}</code></section>}{error&&<p className="error">{error}</p>}<small className="deployWarning">Arc uses USDC as its native gas token. Deploy only once.</small></main>
}