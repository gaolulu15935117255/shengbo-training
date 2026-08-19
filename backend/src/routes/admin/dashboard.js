const express = require('express');
const pool = require('../../db/pool');
const { success, fail } = require('../../utils/response');

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const [[users]] = await pool.query(
      'SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL'
    );
    const [[questions]] = await pool.query(
      "SELECT COUNT(*) AS total FROM questions WHERE deleted_at IS NULL AND status = 'published'"
    );
    const [[orders]] = await pool.query('SELECT COUNT(*) AS total FROM orders');
    const [[paidOrders]] = await pool.query(
      "SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS revenue FROM orders WHERE status = 'paid'"
    );
    const [[products]] = await pool.query(
      'SELECT COUNT(*) AS total FROM products WHERE deleted_at IS NULL AND status = 1'
    );
    const [[importJobs]] = await pool.query('SELECT COUNT(*) AS total FROM import_jobs');
    const [[todayUsers]] = await pool.query(
      'SELECT COUNT(*) AS total FROM users WHERE DATE(created_at) = CURDATE() AND deleted_at IS NULL'
    );
    const [[todayOrders]] = await pool.query(
      "SELECT COUNT(*) AS total FROM orders WHERE DATE(created_at) = CURDATE()"
    );

    return success(res, {
      users: { total: users.total, today: todayUsers.total },
      questions: { published: questions.total },
      orders: {
        total: orders.total,
        paid: paidOrders.total,
        revenue: paidOrders.revenue,
        revenueYuan: (paidOrders.revenue / 100).toFixed(2),
        today: todayOrders.total,
      },
      products: { active: products.total },
      importJobs: { total: importJobs.total },
    });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

module.exports = router;
