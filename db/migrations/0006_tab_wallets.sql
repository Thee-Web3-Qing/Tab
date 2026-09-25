CREATE TABLE IF NOT EXISTS tab_wallets(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 provider text NOT NULL DEFAULT 'minisend',
 provider_wallet_id text,
 wallet_ref text NOT NULL UNIQUE,
 chain text NOT NULL,
 address text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tab_wallets_user_idx ON tab_wallets(user_id);

CREATE TABLE IF NOT EXISTS wallet_deposits(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 wallet_id uuid REFERENCES tab_wallets(id) ON DELETE SET NULL,
 provider_event_id text NOT NULL UNIQUE,
 wallet_ref text NOT NULL,
 chain text NOT NULL,
 token text NOT NULL DEFAULT 'USDC',
 amount numeric(18,6) NOT NULL,
 tx_hash text,
 status text NOT NULL DEFAULT 'received',
 raw_payload text,
 received_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wallet_deposits_user_idx ON wallet_deposits(user_id);
CREATE INDEX IF NOT EXISTS wallet_deposits_wallet_ref_idx ON wallet_deposits(wallet_ref);
