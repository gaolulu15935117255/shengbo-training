require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { fail } = require('./utils/response');
const { adminAuth } = require('./middleware/auth');

const adminAuthRoutes = require('./routes/admin/auth');
const adminQuestionsRoutes = require('./routes/admin/questions');
const adminImportRoutes = require('./routes/admin/import');
const adminProductsRoutes = require('./routes/admin/products');
const adminOrdersRoutes = require('./routes/admin/orders');
const adminUsersRoutes = require('./routes/admin/users');
const adminDashboardRoutes = require('./routes/admin/dashboard');

const apiAuthRoutes = require('./routes/api/auth');
const apiQuizRoutes = require('./routes/api/quiz');
const apiContentRoutes = require('./routes/api/content');
const apiProductsRoutes = require('./routes/api/products');

const app = express();

app.use(cors());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ code: 0, message: 'ok', data: { status: 'up', env: config.nodeEnv } });
});

const publicDir = path.join(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

app.use('/api/auth', apiAuthRoutes);
app.use('/api/quiz', apiQuizRoutes);
app.use('/api/content', apiContentRoutes);
app.use('/api/products', apiProductsRoutes);

app.use('/api/admin/auth', adminAuthRoutes);

app.use('/api/admin/questions', adminAuth, adminQuestionsRoutes);
app.use('/api/admin/quiz/import', adminAuth, adminImportRoutes);
app.use('/api/admin/products', adminAuth, adminProductsRoutes);
app.use('/api/admin/orders', adminAuth, adminOrdersRoutes);
app.use('/api/admin/users', adminAuth, adminUsersRoutes);
app.use('/api/admin/dashboard', adminAuth, adminDashboardRoutes);

if (config.adminStaticDir) {
  const staticPath = path.resolve(config.adminStaticDir);
  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      if (/^\/MP_verify_[A-Za-z0-9]+\.txt$/.test(req.path)) return next();
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }
}

app.use((_req, res) => {
  fail(res, 40400, '接口不存在', null, 404);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return fail(res, 40001, '文件大小超出限制');
  }
  fail(res, 50000, '服务器内部错误', null, 500);
});

app.listen(config.port, () => {
  console.log(`圣博培训 API 运行于 http://localhost:${config.port}`);
});

module.exports = app;
