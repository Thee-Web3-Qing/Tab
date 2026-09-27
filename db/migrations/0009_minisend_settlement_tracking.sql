ALTER TABLE wallet_deposits ADD COLUMN IF NOT EXISTS provider_deposit_id text;
ALTER TABLE wallet_deposits ADD COLUMN IF NOT EXISTS settlement_status text;
ALTER TABLE wallet_deposits ADD COLUMN IF NOT EXISTS settlement_chain text;
ALTER TABLE wallet_deposits ADD COLUMN IF NOT EXISTS settlement_amount numeric(18,6);
ALTER TABLE wallet_deposits ADD COLUMN IF NOT EXISTS settlement_tx_hash text;
CREATE INDEX IF NOT EXISTS wallet_deposits_provider_deposit_idx ON wallet_deposits(provider_deposit_id);
