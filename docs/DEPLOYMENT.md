# Deployment gate
Tab is intentionally not deployed until the full loop is tested.

Vercel runtime variables:
- DATABASE_URL
- DATABASE_URL_UNPOOLED
- NEXT_PUBLIC_PRIVY_APP_ID
- PRIVY_APP_SECRET

Never expose PRIVY_APP_SECRET with NEXT_PUBLIC_. Before production: promote reviewed Neon schema, configure Privy origins, verify embedded wallets and invite return flow, payer-only authorization, historical FX, unanimous membership/close rules, ledger invalidation, current Arc mainnet configuration and USDC contract, then run a small real settlement. No Tab-owned omnibus treasury is required for V1.
