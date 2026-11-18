require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/database');

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Steam Store API đang chạy tại http://localhost:${PORT}`));

process.on('SIGINT', async () => {
  server.close();
  await pool.end();
  process.exit(0);
});
