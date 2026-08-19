const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../../db/pool');
const { success, fail, paginate, parsePagination } = require('../../utils/response');

const router = express.Router();

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
    nickName: row.nick_name,
  };
}

router.get('/', async (req, res) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const { status, keyword, userId } = req.query;
    const conditions = ['1=1'];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('o.status = ?');
      params.push(status);
    }
    if (userId) {
      conditions.push('o.user_id = ?');
      params.push(userId);
    }
    if (keyword) {
      conditions.push('(o.order_no LIKE ? OR o.product_title LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM orders o ${where}`,
      params
    );
    const [rows] = await pool.query(
      `SELECT o.*, u.nick_name FROM orders o LEFT JOIN users u ON u.id = o.user_id ${where} ORDER BY o.id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    return success(res, paginate(rows.map(mapOrder), page, pageSize, total));
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.get('/:orderNo', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, u.nick_name, u.openid, p.product_code
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN products p ON p.id = o.product_id
       WHERE o.order_no = ?`,
      [req.params.orderNo]
    );
    if (!rows.length) return fail(res, 40400, '订单不存在');

    const order = mapOrder(rows[0]);
    order.productCode = rows[0].product_code;
    order.openid = rows[0].openid;

    const [payments] = await pool.query('SELECT * FROM order_payments WHERE order_id = ?', [order.id]);
    order.payments = payments.map((p) => ({
      id: p.id,
      payChannel: p.pay_channel,
      transactionId: p.transaction_id,
      amount: p.amount,
      status: p.status,
      paidAt: p.paid_at,
    }));

    const [refunds] = await pool.query('SELECT * FROM refund_records WHERE order_id = ?', [order.id]);
    order.refunds = refunds;

    return success(res, order);
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.post('/:orderNo/refund', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { reason, amount } = req.body || {};
    const orderNo = req.params.orderNo;

    const [orders] = await conn.query('SELECT * FROM orders WHERE order_no = ? FOR UPDATE', [orderNo]);
    if (!orders.length) return fail(res, 40400, '订单不存在');

    const order = orders[0];
    if (order.status !== 'paid') {
      return fail(res, 60003, '订单状态不允许操作');
    }

    const refundAmount = amount || order.amount;
    const refundNo = `RF${Date.now()}${uuidv4().slice(0, 6).toUpperCase()}`;

    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO refund_records (order_id, refund_no, amount, reason, operator_id, status, refunded_at)
       VALUES (?, ?, ?, ?, ?, 'success', NOW())`,
      [order.id, refundNo, refundAmount, reason || '管理员退款', req.admin.id]
    );

    await conn.query(
      "UPDATE orders SET status = 'refunded', refunded_at = NOW() WHERE id = ?",
      [order.id]
    );

    await conn.commit();

    return success(res, {
      refundNo,
      orderNo,
      amount: refundAmount,
      status: 'success',
      message: '退款已受理（stub，未对接微信支付退款 API）',
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  } finally {
    conn.release();
  }
});

module.exports = router;
