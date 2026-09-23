ALTER TABLE receipt_claims ADD COLUMN IF NOT EXISTS allocation_version integer NOT NULL DEFAULT 1;
ALTER TABLE receipt_approvals ADD COLUMN IF NOT EXISTS allocation_version integer NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS receipt_approvals_version_idx ON receipt_approvals(claim_id,allocation_version);