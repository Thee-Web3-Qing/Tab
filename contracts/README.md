# TabSettlement on Arc

TabSettlement turns a user's full outgoing Tab settlement into one atomic USDC settlement call.

- USDC: `0x3600000000000000000000000000000000000000`
- Arc Testnet chain ID: `5042002`
- Arc Mainnet chain ID: `5042`
- Tab fee: dynamic effective fee from `0.5%` to `3%`
- Minimum fee floor: `0.03 USDC`
- Fee wallet: immutable constructor argument
- Admin/owner withdrawal functions: none

## Fee model

The contract starts from a 0.5% fee. If that would collect less than 0.03 USDC, the fee rises only enough to reach the 0.03 USDC floor, subject to a hard 3% maximum.

Examples:

- 1 USDC settlement → 0.03 USDC fee (3%)
- 2 USDC settlement → 0.03 USDC fee (1.5%)
- 5 USDC settlement → 0.03 USDC fee (0.6%)
- 10 USDC settlement → 0.05 USDC fee (0.5%)
- 100 USDC settlement → 0.50 USDC fee (0.5%)

Creditors always receive their exact locked settlement amounts. The Tab fee is charged on top.

## Deploy

Compile `contracts/TabSettlement.sol` with Solidity 0.8.24 and deploy separately to Arc Testnet and Arc Mainnet with:

1. `usdc_`: `0x3600000000000000000000000000000000000000`
2. `feeWallet_`: the public Arc/EVM address that should receive Tab fees

Then set the deployed addresses in Vercel:

- Testnet: `NEXT_PUBLIC_TAB_SETTLEMENT_CONTRACT=0x...`
- Mainnet: `NEXT_PUBLIC_TAB_SETTLEMENT_CONTRACT_MAINNET=0x...`

A user authorizes the deployed settlement contract once. Each **Settle all** is one atomic transaction after authorization.
