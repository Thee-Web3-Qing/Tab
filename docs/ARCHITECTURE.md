# Tab V1 architecture

## Trust
Only the authenticated payer may create their own expense. Beneficiaries determine responsibility. Membership changes are unanimous. Close approval is for a specific ledger version. Any balance-changing mutation increments the ledger version and invalidates old close approvals. Open disputes block locking.

## Splits
A Tab chooses equal or percentage splitting at creation. Percentage weights apply only across beneficiaries selected for an expense and are normalized among that selected subset. This supports a 70/30 relationship while excluding a person from an expense they did not benefit from.

## FX
Store original amount/currency, payment timestamp, FX timestamp, rate to USD and locked USD value. Historical values are never recomputed from current FX. Current FX is display-only.

## Lifecycle
active → closing → locked → settling → settled. Members can be pending, active, inactive or removed. Inactivation preserves prior expense participation.

## Settlement
Net balances are minimized into final transfers only after unanimous approval. The settlement transfer is a group netting instruction, not a claim that the sender originally owed the recipient. Arc/USDC is behind the settlement layer.

## Future
Pay with Tab and treasury/off-ramp routing are deliberately outside V1. The ledger is compatible with adding verified payment sources later.
