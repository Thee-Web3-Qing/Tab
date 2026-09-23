# Tab

**Spend together. Settle once.**

Mobile-first shared spending and settlement.

## Product rules
- No Tab, no expense.
- Only the payer can create their payment.
- Split rule is chosen when the Tab is created: equal or percentage.
- Expenses include only the people who benefited.
- Membership changes require group approval.
- Close is unanimous and tied to a ledger version.
- Ledger edits reset close approvals.
- Disputes pause close.
- Historical FX is locked per expense.
- Arc is the settlement rail, not the visible product identity.

## Infrastructure
- Next.js mobile-first app
- Neon / Lakebase Postgres for data only. Never deployment.
- Privy embedded wallets planned
- Arc USDC final settlement
