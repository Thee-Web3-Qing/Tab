import fs from"node:fs";import path from"node:path";import solc from"solc";
const root=process.cwd(),contractPath=path.join(root,"contracts","TabSettlement.sol"),source=fs.readFileSync(contractPath,"utf8");
const input={language:"Solidity",sources:{"TabSettlement.sol":{content:source}},settings:{optimizer:{enabled:true,runs:200},outputSelection:{"*":{"*":["abi","evm.bytecode.object"]}}}};
const output=JSON.parse(solc.compile(JSON.stringify(input))),errors=(output.errors||[]).filter(e=>e.severity==="error");
if(errors.length){console.error(errors.map(e=>e.formattedMessage).join("\n"));process.exit(1)}
const artifact=output.contracts?.["TabSettlement.sol"]?.TabSettlement;if(!artifact?.evm?.bytecode?.object)throw new Error("TabSettlement bytecode was not generated");
const outDir=path.join(root,"public","generated");fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(path.join(outDir,"tab-settlement.json"),JSON.stringify({abi:artifact.abi,bytecode:"0x"+artifact.evm.bytecode.object}));
console.log("TabSettlement artifact generated");
