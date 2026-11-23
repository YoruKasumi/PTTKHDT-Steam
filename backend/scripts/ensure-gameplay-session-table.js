'use strict';

require('dotenv').config();

const { pool } = require('../src/config/database');

async function ensureGameplaySessionTable(db = pool) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS GAMEPLAYSESSION (
      LicenseID CHAR(36) NOT NULL,
      CustomerID CHAR(36) NOT NULL,
      GameID CHAR(36) NOT NULL,
      StartedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      LastSeenAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (LicenseID),
      KEY idx_gameplay_active (GameID, LastSeenAt),
      CONSTRAINT fk_gameplay_license FOREIGN KEY (LicenseID) REFERENCES LICENSE(LicenseID) ON DELETE CASCADE,
      CONSTRAINT fk_gameplay_customer FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(AccountID) ON DELETE CASCADE,
      CONSTRAINT fk_gameplay_game FOREIGN KEY (GameID) REFERENCES GAME(GameID) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
}

if (require.main === module) {
  ensureGameplaySessionTable()
    .then(() => console.log('GAMEPLAYSESSION ready'))
    .catch((error) => { console.error(`Không thể tạo bảng GAMEPLAYSESSION: ${error.message}`); process.exitCode = 1; })
    .finally(() => pool.end());
}

module.exports = { ensureGameplaySessionTable };
