require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('../src/config');

async function runSqlFile(connection, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  try {
    await connection.query(sql);
  } catch (err) {
    if (['ER_TABLE_EXISTS_ERROR', 'ER_DB_CREATE_EXISTS', 'ER_DUP_ENTRY'].includes(err.code)) {
      console.warn(`跳过部分重复数据: ${err.message}`);
    } else {
      throw err;
    }
  }
}

async function main() {
  console.log('正在初始化数据库...');

  const rootConfig = {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  };

  const rootConn = await mysql.createConnection(rootConfig);
  await rootConn.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await rootConn.end();

  const conn = await mysql.createConnection({
    ...rootConfig,
    database: config.db.database,
    multipleStatements: true,
  });

  const schemaPath = path.join(__dirname, '../sql/schema.sql');
  const seedPath = path.join(__dirname, '../sql/seed.sql');

  console.log('执行 schema.sql ...');
  await runSqlFile(conn, schemaPath);

  console.log('执行 seed.sql ...');
  await runSqlFile(conn, seedPath);

  const passwordHash = await bcrypt.hash('admin123', 10);
  await conn.query('UPDATE admins SET password_hash = ? WHERE username = ?', [passwordHash, 'admin']);

  console.log('管理员账号已设置: admin / admin123');
  await conn.end();
  console.log('数据库初始化完成!');
}

main().catch((err) => {
  console.error('初始化失败:', err.message);
  process.exit(1);
});
