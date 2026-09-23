import {calculatePositions,minimizeTransfers} from "../lib/ledger";
const p=calculatePositions([
{payerId:"Qing",lockedUsdValue:60,beneficiaryIds:["Qing","Tobi","Maya"]},
{payerId:"Tobi",lockedUsdValue:80,beneficiaryIds:["Tobi","Zuri"]},
{payerId:"David",lockedUsdValue:120,beneficiaryIds:["David","Qing"]},
{payerId:"Zuri",lockedUsdValue:300,beneficiaryIds:["Zuri","Qing","Tobi"]}
],null);
const by=Object.fromEntries(p.map(x=>[x.userId,Math.round(x.net)]));
if(by.Qing!==-120||by.Tobi!==-80||by.Maya!==-20||by.Zuri!==160||by.David!==60)throw new Error(JSON.stringify(by));
const t=minimizeTransfers(p);if(t.length!==4)throw new Error("Expected four minimized transfers");