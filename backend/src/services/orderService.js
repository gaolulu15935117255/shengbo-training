const pool = require('../db/pool');

const STATUS_LABELS = {
  pending: '待支付',
  paid: '已支付',
  closed: '已关闭',
  refunded: '已退款',
};

function mapOrder(row) {
  return {
    id: row.id,
    orderNo: row.order_no,
    userId: row.user_id,
    productId: row.product_id,
    productCode: row.product_code || null,
    productTitle: row.product_title,
    amount: row.amount,
    amountYuan: (row.amount / 100).toFixed(2),
    status: row.status,
    statusLabel: STATUS_LABELS[row.status] || row.status,
    payExpireAt: row.pay_expire_at,
    paidAt: row.paid_at,
    closedAt: row.closed_at,
    refundedAt: row.refunded_at,
    remark: row.remark,
    createdAt: row.created_at,
    nickName: row.nick_name || null,
    userNickName: row.nick_name || null,
  };
}

function generateOrderNo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const seq = String(Date.now()).slice(-8);
  const rand = Math.floor(Math.random() * 90 + 10);
  return `SB${y}${m}${day}${seq}${rand}`;
}

async function closeExpiredOrders(conn = pool) {
  await conn.query(
    "UPDATE orders SET status = 'closed', closed_at = NOW() WHERE status = 'pending' AND pay_expire_at IS NOT NULL AND pay_expire_at < NOW()"
  );
}

function addDays(base, days) {
  const date = new Date(base.getTime());
  date.setDate(date.getDate() + days);
  return date;
}

function formatMysqlDateTime(date) {
  if (!date) return null;
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function grantOrderEntitlements(conn, order, product) {
  const [currentMem] = await conn.query(
    'SELECT expire_at FROM user_memberships WHERE user_id = ? AND status = 1 AND (expire_at IS NULL OR expire_at > NOW()) ORDER BY id DESC LIMIT 1',
    [order.user_id]
  );

  let expireAt = null;
  const days = product.membership_days;
  const isLifetime = product.membership_level === 'lifetime' || days === -1;
  if (product.type === 'membership') {
    if (isLifetime) {
      expireAt = null;
    } else {
      const add = Number(days) > 0 ? Number(days) : 30;
      const base =
        currentMem[0] && currentMem[0].expire_at && new Date(currentMem[0].expire_at) > new Date()
          ? new Date(currentMem[0].expire_at)
          : new Date();
      expireAt = addDays(base, add);
    }
    await conn.query(
      `INSERT INTO user_memberships (user_id, level, source_product_id, source_order_id, started_at, expire_at, status)
       VALUES (?, ?, ?, ?, NOW(), ?, 1)`,
      [
        order.user_id,
        product.membership_level || 'month',
        product.id,
        order.id,
        expireAt ? formatMysqlDateTime(expireAt) : null,
      ]
    );
  }

  const [ents] = await conn.query(
    'SELECT entitlement_type, resource_id FROM product_entitlements WHERE product_id = ?',
    [product.id]
  );

  const list = ents.length
    ? ents
    : product.type === 'membership'
      ? [{ entitlement_type: 'all', resource_id: null }]
      : [];

  for (const ent of list) {
    const resourceId = ent.resource_id || (ent.entitlement_type === 'all' ? 'all' : null);
    const entExpire =
      ent.entitlement_type === 'all' && expireAt ? formatMysqlDateTime(expireAt) : null;
    await conn.query(
      `INSERT INTO user_entitlements
         (user_id, entitlement_type, resource_id, source_product_id, source_order_id, expire_at, status)
       VALUES (?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE status = 1, expire_at = VALUES(expire_at)`,
      [order.user_id, ent.entitlement_type, resourceId, product.id, order.id, entExpire]
    );
  }
}

async function revokeOrderEntitlements(conn, orderId) {
  await conn.query('UPDATE user_entitlements SET status = 0 WHERE source_order_id = ?', [orderId]);
  await conn.query('UPDATE user_memberships SET status = 2 WHERE source_order_id = ?', [orderId]);
}

async function fulfillPaidOrder(orderNo, payInfo = {}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM orders WHERE order_no = ? FOR UPDATE', [orderNo]);
    if (!rows.length) {
      await conn.rollback();
      return null;
    }
    const order = rows[0];
    if (order.status === 'paid') {
      await conn.commit();
      return order;
    }
    if (order.status !== 'pending') {
      await conn.rollback();
      const err = new Error('订单状态不允许支付');
      err.code = 60003;
      throw err;
    }

    await conn.query(
      "UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ?",
      [order.id]
    );

    const transactionId = payInfo.transactionId || `mock_${order.order_no}`;
    const [payments] = await conn.query('SELECT id FROM order_payments WHERE order_id = ? LIMIT 1', [
      order.id,
    ]);
    if (payments.length) {
      await conn.query(
        `UPDATE order_payments
         SET transaction_id = ?, prepay_id = COALESCE(?, prepay_id), status = 'success',
             notify_raw = ?, paid_at = NOW()
         WHERE id = ?`,
        [
          transactionId,
          payInfo.prepayId || null,
          payInfo.notifyRaw ? JSON.stringify(payInfo.notifyRaw) : null,
          payments[0].id,
        ]
      );
    } else {
      await conn.query(
        `INSERT INTO order_payments
           (order_id, user_id, pay_channel, transaction_id, prepay_id, amount, status, notify_raw, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, 'success', ?, NOW())`,
        [
          order.id,
          order.user_id,
          payInfo.payChannel || 'wechat',
          transactionId,
          payInfo.prepayId || null,
          order.amount,
          payInfo.notifyRaw ? JSON.stringify(payInfo.notifyRaw) : null,
        ]
      );
    }

    const [products] = await conn.query('SELECT * FROM products WHERE id = ?', [order.product_id]);
    if (products.length) {
      await grantOrderEntitlements(conn, order, products[0]);
      await conn.query('UPDATE products SET sales_count = sales_count + 1 WHERE id = ?', [products[0].id]);
    }

    await conn.commit();
    order.status = 'paid';
    return order;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function createOrder(userId, productCode) {
  await closeExpiredOrders();
  const [products] = await pool.query(
    'SELECT * FROM products WHERE product_code = ? AND status = 1 AND deleted_at IS NULL',
    [productCode]
  );
  if (!products.length) {
    const err = new Error('商品不存在');
    err.code = 40400;
    throw err;
  }
  const product = products[0];

  const [paid] = await pool.query(
    "SELECT id FROM orders WHERE user_id = ? AND product_id = ? AND status = 'paid' LIMIT 1",
    [userId, product.id]
  );
  if (paid.length && product.type !== 'membership') {
    const err = new Error('您已购买该商品');
    err.code = 40900;
    throw err;
  }

  const [pending] = await pool.query(
    "SELECT * FROM orders WHERE user_id = ? AND product_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1",
    [userId, product.id]
  );
  if (pending.length) {
    return pending[0];
  }

  const orderNo = generateOrderNo();
  const [result] = await pool.query(
    `INSERT INTO orders (order_no, user_id, product_id, product_title, amount, status, pay_expire_at)
     VALUES (?, ?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
    [orderNo, userId, product.id, product.title, product.price]
  );
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function savePrepay(orderId, userId, amount, prepayId) {
  const [existing] = await pool.query(
    "SELECT id FROM order_payments WHERE order_id = ? AND status = 'pending' LIMIT 1",
    [orderId]
  );
  if (existing.length) {
    await pool.query('UPDATE order_payments SET prepay_id = ? WHERE id = ?', [prepayId, existing[0].id]);
    return;
  }
  await pool.query(
    `INSERT INTO order_payments (order_id, user_id, pay_channel, prepay_id, amount, status)
     VALUES (?, ?, 'wechat', ?, ?, 'pending')`,
    [orderId, userId, prepayId, amount]
  );
}

async function getOrderForUser(orderNo, userId) {
  const [rows] = await pool.query(
    `SELECT o.*, p.product_code FROM orders o
     JOIN products p ON p.id = o.product_id
     WHERE o.order_no = ? AND o.user_id = ?`,
    [orderNo, userId]
  );
  return rows[0] || null;
}

async function refundPaidOrder(orderNo, { reason, amount, operatorId, transactionId } = {}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM orders WHERE order_no = ? FOR UPDATE', [orderNo]);
    if (!rows.length) {
      const err = new Error('订单不存在');
      err.code = 40400;
      throw err;
    }
    const order = rows[0];
    if (order.status !== 'paid') {
      const err = new Error('订单状态不允许退款');
      err.code = 60003;
      throw err;
    }

    const refundAmount = amount || order.amount;
    const refundNo = `RF${Date.now()}${String(order.id).padStart(6, '0')}`.slice(0, 32);

    await conn.query(
      `INSERT INTO refund_records (order_id, refund_no, amount, reason, operator_id, status, refunded_at)
       VALUES (?, ?, ?, ?, ?, 'success', NOW())`,
      [order.id, refundNo, refundAmount, reason || '管理员退款', operatorId || null]
    );
    await conn.query(
      "UPDATE orders SET status = 'refunded', refunded_at = NOW() WHERE id = ?",
      [order.id]
    );
    await revokeOrderEntitlements(conn, order.id);
    await conn.query(
      'UPDATE products SET sales_count = GREATEST(CAST(sales_count AS SIGNED) - 1, 0) WHERE id = ?',
      [order.product_id]
    );

    await conn.commit();
    return { order, refundNo, refundAmount, transactionId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  STATUS_LABELS,
  mapOrder,
  closeExpiredOrders,
  fulfillPaidOrder,
  createOrder,
  savePrepay,
  getOrderForUser,
  refundPaidOrder,
  generateOrderNo,
};
