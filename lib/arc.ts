export const ARC_MAINNET={chainId:5042002,name:"Arc",nativeCurrency:{name:"USDC",symbol:"USDC",decimals:18},rpcUrl:"https://rpc.arc.network"} as const;
// Settlement adapter boundary. Wallet authorization is intentionally user-controlled.
// Wire Privy + verified Arc addresses before enabling production transfers.
export type SettlementInstruction={fromUserId:string;toUserId:string;amountUsdc:string};
export function assertSettlementReady(locked:boolean,openDisputes:number,allApproved:boolean){if(!locked||openDisputes>0||!allApproved)throw new Error("Tab is not ready to settle");return true}