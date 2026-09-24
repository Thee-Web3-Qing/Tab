import{defineChain,encodeFunctionData,maxUint256,parseUnits}from"viem";
export const ARC_TESTNET=defineChain({id:5042002,name:"Arc Testnet",nativeCurrency:{name:"USDC",symbol:"USDC",decimals:18},rpcUrls:{default:{http:["https://rpc.testnet.arc.network"]}}});
export const ARC_USDC="0x3600000000000000000000000000000000000000" as const;
export const USDC_TRANSFER_ABI=[{type:"function",name:"transfer",stateMutability:"nonpayable",inputs:[{name:"to",type:"address"},{name:"value",type:"uint256"}],outputs:[{name:"",type:"bool"}]}]as const;
export const USDC_ALLOWANCE_ABI=[{type:"function",name:"allowance",stateMutability:"view",inputs:[{name:"owner",type:"address"},{name:"spender",type:"address"}],outputs:[{name:"",type:"uint256"}]}]as const;
export const USDC_APPROVE_ABI=[{type:"function",name:"approve",stateMutability:"nonpayable",inputs:[{name:"spender",type:"address"},{name:"value",type:"uint256"}],outputs:[{name:"",type:"bool"}]}]as const;
export const TAB_SETTLEMENT_ABI=[{type:"function",name:"settle",stateMutability:"nonpayable",inputs:[{name:"recipients",type:"address[]"},{name:"amounts",type:"uint256[]"}],outputs:[]}]as const;
export function encodeUsdcTransfer(to:`0x${string}`,amount:string){return encodeFunctionData({abi:USDC_TRANSFER_ABI,functionName:"transfer",args:[to,parseUnits(amount,6)]})}
export function encodeSettlementApproval(contract:`0x${string}`){return encodeFunctionData({abi:USDC_APPROVE_ABI,functionName:"approve",args:[contract,maxUint256]})}
export function encodeBatchSettlement(recipients:`0x${string}`[],amounts:string[]){return encodeFunctionData({abi:TAB_SETTLEMENT_ABI,functionName:"settle",args:[recipients,amounts.map(x=>parseUnits(x,6))]})}
export type SettlementInstruction={settlementId:string;fromUserId:string;toUserId:string;toWallet:`0x${string}`;amountUsdc:string};
export function assertSettlementReady(locked:boolean,openDisputes:number,allApproved:boolean){if(!locked||openDisputes>0||!allApproved)throw new Error("Tab is not ready to settle");return true}
