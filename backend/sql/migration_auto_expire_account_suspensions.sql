-- Run once on existing databases before deploying automatic suspension expiry.
ALTER TABLE ACCOUNT
  ADD COLUMN SuspendUntil DATETIME NULL AFTER Status,
  ADD KEY idx_account_suspension_expiry (Status, SuspendUntil);

-- Automated expiry events have no human account as their actor.
ALTER TABLE AUDITLOG
  MODIFY COLUMN AccountID CHAR(36) NULL;
