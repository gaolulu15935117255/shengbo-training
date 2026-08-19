require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shengbo_training',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-user-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },

  adminJwt: {
    secret: process.env.ADMIN_JWT_SECRET || 'dev-admin-secret',
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d',
  },

  adminStaticDir: process.env.ADMIN_STATIC_DIR || null,
  uploadDir: process.env.UPLOAD_DIR || require('path').join(__dirname, '../uploads'),
};
