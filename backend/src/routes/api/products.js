const express = require('express');
const pool = require('../../db/pool');
const { success, fail, paginate, parsePagination } = require('../../utils/response');
const { optionalUserAuth } = require('../../middleware/auth');

const router = express.Router();

function mapProduct(row, purchased = false) {
  return {
    id: row.id,
    productCode: row.product_code,
    type: row.type,
    title: row.title,
    coverUrl: row.cover_url,
    coverColor: row.cover_color,
    price: row.price,
    originalPrice: row.original_price,
    priceYuan: (row.price / 100).toFixed(2),
    salesCount: row.sales_count,
    rating: parseFloat(row.rating),
    desc: row.description,
    benefits: row.benefits ? (typeof row.benefits === 'string' ? JSON.parse(row.benefits) : row.benefits) : [],
    target: row.target_audience,
    purchased,
  };
}

router.get('/', optionalUserAuth, async (req, res) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const { type } = req.query;
    const conditions = ['status = 1', 'deleted_at IS NULL'];
    const params = [];

    if (type && type !== 'all') {
      conditions.push('type = ?');
      params.push(type);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM products ${where}`, params);
    const [rows] = await pool.query(
      `SELECT * FROM products ${where} ORDER BY sort_order ASC, id ASC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    let purchasedCodes = new Set();
    let unlockAll = false;
    if (req.user) {
      const [orders] = await pool.query(
        "SELECT DISTINCT p.product_code FROM orders o JOIN products p ON p.id = o.product_id WHERE o.user_id = ? AND o.status = 'paid'",
        [req.user.id]
      );
      purchasedCodes = new Set(orders.map((o) => o.product_code));
      const [allEnt] = await pool.query(
        "SELECT 1 FROM user_entitlements WHERE user_id = ? AND status = 1 AND entitlement_type = 'all' AND (expire_at IS NULL OR expire_at > NOW()) LIMIT 1",
        [req.user.id]
      );
      unlockAll = allEnt.length > 0;
    }

    const list = rows.map((r) => mapProduct(r, unlockAll || purchasedCodes.has(r.product_code)));
    return success(res, paginate(list, page, pageSize, total));
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.get('/:productCode', optionalUserAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE product_code = ? AND status = 1 AND deleted_at IS NULL',
      [req.params.productCode]
    );
    if (!rows.length) return fail(res, 40400, '商品不存在');

    let purchased = false;
    if (req.user) {
      const [orders] = await pool.query(
        "SELECT 1 FROM orders o JOIN products p ON p.id = o.product_id WHERE o.user_id = ? AND p.product_code = ? AND o.status = 'paid' LIMIT 1",
        [req.user.id, req.params.productCode]
      );
      const [allEnt] = await pool.query(
        "SELECT 1 FROM user_entitlements WHERE user_id = ? AND status = 1 AND entitlement_type = 'all' AND (expire_at IS NULL OR expire_at > NOW()) LIMIT 1",
        [req.user.id]
      );
      purchased = orders.length > 0 || allEnt.length > 0;
    }

    const item = mapProduct(rows[0], purchased);
    item.detail = rows[0].description;
    return success(res, item);
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

module.exports = router;
