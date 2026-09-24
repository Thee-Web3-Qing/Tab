# TabSettlement on Arc Testnet

TabSettlement turns a user's full outgoing Tab settlement into one atomic contract call.

- USDC: `0x3600000000000000000000000000000000000000`
- Chain ID: `5042002`
- Tab fee: `0.5%`
- Fee wallet: immutable constructor argument
- Admin/owner functions: none

## Deploy

Compile `contracts/TabSettlement.sol` with Solidity 0.8.24 and deploy it to Arc Testnet with:

1. `usdc_`: `0x3600000000000000000000000000000000000000`
2. `feeWallet_`: the public Arc/EVM address that should receive Tab fees

Then set the deployed address in Vercel:

`NEXT_PUBLIC_TAB_SETTLEMENT_CONTRACT=0x...`

A user authorizes this contract once from their Tab wallet. After that, each **Settle all** is one wallet confirmation and one atomic transaction. The contract can only pull funds from `msg.sender`, and has no owner withdrawal path.
