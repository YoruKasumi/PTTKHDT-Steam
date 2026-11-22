-- One-time migration for existing installations.
-- Run against the application database before deploying the per-game refund code.

ALTER TABLE ORDERS
  MODIFY COLUMN Status ENUM('Completed','PartiallyRefunded','Refunded')
  NOT NULL DEFAULT 'Completed';

ALTER TABLE LICENSE
  ADD COLUMN RevokedReason ENUM('Refund','AccountSuspended') NULL AFTER RevokedAt;

ALTER TABLE LICENSE_DEVICE
  ADD COLUMN RevokedReason ENUM('Refund','AccountSuspended','User') NULL AFTER Status;

ALTER TABLE REFUNDREQUEST
  ADD COLUMN GameID CHAR(36) NULL AFTER OrderID,
  ADD KEY idx_refund_order_game_status (OrderID, GameID, Status),
  ADD CONSTRAINT fk_refund_game FOREIGN KEY (GameID) REFERENCES GAME(GameID);

ALTER TABLE `TRANSACTION`
  ADD COLUMN Detail TEXT NULL AFTER Status;

-- Existing refunded orders used one request for the entire order. Preserve that
-- information on their revoked purchase licenses; legacy request GameID remains NULL.
UPDATE LICENSE AS license
JOIN ORDERITEM AS item ON item.GameID = license.GameID
JOIN ORDERS AS orders
  ON orders.OrderID = item.OrderID
 AND orders.CustomerID = license.CustomerID
SET license.RevokedReason = 'Refund'
WHERE orders.Status = 'Refunded'
  AND license.Source = 'Purchase'
  AND license.Status = 'Revoked'
  AND license.RevokedReason IS NULL;

-- Historical revoked devices have no reliable reason; mark them non-restorable.
UPDATE LICENSE_DEVICE
SET RevokedReason = 'User'
WHERE Status = 'Revoked' AND RevokedReason IS NULL;
