require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/database');
const { accountService } = require('./services');
const startSuspensionExpiryJob = require('./utils/suspensionExpiryJob');

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Steam Store API đang chạy tại http://localhost:${PORT}`));
const stopSuspensionExpiryJob = startSuspensionExpiryJob(accountService);

async function shutdown() {
  stopSuspensionExpiryJob();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await pool.end();
  process.exit(0);
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
