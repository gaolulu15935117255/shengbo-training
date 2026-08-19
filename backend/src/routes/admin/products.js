const express = require('express');
const pool = require('../../db/pool');
const { success, fail, paginate, parsePagination } = require('../../utils/response');

const router = express.Router();

function mapProduct(row) {
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
    description: row.description,
    benefits: row.benefits ? (typeof row.benefits === 'string' ? JSON.parse(row.benefits) : row.benefits) : [],
    targetAudience: row.target_audience,
    membershipLevel: row.membership_level,
    membershipDays: row.membership_days,
    salesCount: row.sales_count,
    rating: parseFloat(row.rating),
    sortOrder: row.sort_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/', async (req, res) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const { type, status, keyword } = req.query;
    const conditions = ['deleted_at IS NULL'];
    const params = [];

    if (type && type !== 'all') {
      conditions.push('type = ?');
      params.push(type);
    }
    if (status !== undefined && status !== '') {
      conditions.push('status = ?');
      params.push(parseInt(status, 10));
    }
    if (keyword) {
      conditions.push('(title LIKE ? OR product_code LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM products ${where}`, params);
    const [rows] = await pool.query(
      `SELECT * FROM products ${where} ORDER BY sort_order ASC, id ASC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    return success(res, paginate(rows.map(mapProduct), page, pageSize, total));
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.productCode || !b.type || !b.title || b.price === undefined) {
      return fail(res, 40001, 'productCode、type、title、price 不能为空');
    }

    const [result] = await pool.query(
      `INSERT INTO products (product_code, type, title, cover_url, cover_color, price, original_price, description, benefits, target_audience, membership_level, membership_days, sort_order, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.productCode,
        b.type,
        b.title,
        b.coverUrl || null,
        b.coverColor || null,
        b.price,
        b.originalPrice || b.price,
        b.description || null,
        b.benefits ? JSON.stringify(b.benefits) : null,
        b.targetAudience || null,
        b.membershipLevel || null,
        b.membershipDays ?? null,
        b.sortOrder || 0,
        b.status !== undefined ? b.status : 1,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    return success(res, mapProduct(rows[0]), '创建成功');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return fail(res, 40900, '商品编码已存在');
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {};
    if (![0, 1].includes(status)) {
      return fail(res, 40001, 'status 必须为 0 或 1');
    }
    const [result] = await pool.query(
      'UPDATE products SET status = ? WHERE id = ? AND deleted_at IS NULL',
      [status, req.params.id]
    );
    if (!result.affectedRows) return fail(res, 40400, '商品不存在');
    return success(res, { id: parseInt(req.params.id, 10), status });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.put('/:id/entitlements', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const productId = req.params.id;
    const { entitlements } = req.body || {};
    if (!Array.isArray(entitlements)) {
      return fail(res, 40001, 'entitlements 必须为数组');
    }

    const [products] = await conn.query('SELECT id FROM products WHERE id = ? AND deleted_at IS NULL', [productId]);
    if (!products.length) return fail(res, 40400, '商品不存在');

    await conn.beginTransaction();
    await conn.query('DELETE FROM product_entitlements WHERE product_id = ?', [productId]);
    for (const e of entitlements) {
      await conn.query(
        'INSERT INTO product_entitlements (product_id, entitlement_type, resource_id) VALUES (?, ?, ?)',
        [productId, e.entitlementType, e.resourceId || null]
      );
    }
    await conn.commit();

    const [rows] = await conn.query('SELECT * FROM product_entitlements WHERE product_id = ?', [productId]);
    return success(res, rows.map((r) => ({
      id: r.id,
      entitlementType: r.entitlement_type,
      resourceId: r.resource_id,
    })));
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  } finally {
    conn.release();
  }
});

router.put('/:id', async (req, res) => {
  try {
    const b = req.body || {};
    const fields = [];
    const params = [];
    const mapping = {
      productCode: 'product_code',
      type: 'type',
      title: 'title',
      coverUrl: 'cover_url',
      coverColor: 'cover_color',
      price: 'price',
      originalPrice: 'original_price',
      description: 'description',
      targetAudience: 'target_audience',
      membershipLevel: 'membership_level',
      membershipDays: 'membership_days',
      sortOrder: 'sort_order',
      status: 'status',
    };

    for (const [k, col] of Object.entries(mapping)) {
      if (b[k] !== undefined) {
        fields.push(`${col} = ?`);
        params.push(b[k]);
      }
    }
    if (b.benefits !== undefined) {
      fields.push('benefits = ?');
      params.push(JSON.stringify(b.benefits));
    }

    if (!fields.length) return fail(res, 40001, '没有可更新的字段');

    params.push(req.params.id);
    const [result] = await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      params
    );
    if (!result.affectedRows) return fail(res, 40400, '商品不存在');

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    return success(res, mapProduct(rows[0]));
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

module.exports = router;
