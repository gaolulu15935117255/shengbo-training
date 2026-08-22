const express = require('express');
const pool = require('../../db/pool');
const { success, fail, paginate, parsePagination } = require('../../utils/response');
const wechatPay = require('../../utils/wechatPay');
const orderService = require('../../services/orderService');

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
    userNickName: row.nick_name,
  };
}

router.get('/', async (req, res) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const { status, keyword, userId, orderNo } = req.query;
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
    const search = keyword || orderNo;
    if (search) {
      conditions.push('(o.order_no LIKE ? OR o.product_title LIKE ?)');
      const kw = `%${search}%`;
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
  try {
    const { reason, amount } = req.body || {};
    const orderNo = req.params.orderNo;

    const [orders] = await pool.query('SELECT * FROM orders WHERE order_no = ?', [orderNo]);
    if (!orders.length) return fail(res, 40400, '订单不存在');
    const order = orders[0];
    if (order.status !== 'paid') {
      return fail(res, 60003, '订单状态不允许操作');
    }

    const [payments] = await pool.query(
      "SELECT transaction_id, pay_channel FROM order_payments WHERE order_id = ? AND status = 'success' ORDER BY id DESC LIMIT 1",
      [order.id]
    );
    const payment = payments[0];
    const transactionId = payment && payment.transaction_id;
    const isMockPay =
      wechatPay.isMockMode() ||
      (transactionId && String(transactionId).startsWith('mock_')) ||
      (payment && payment.pay_channel === 'mock');

    if (!isMockPay) {
      if (!wechatPay.isConfigured()) {
        return fail(res, 60002, '未配置微信支付，无法原路退款');
      }
      try {
        await wechatPay.createRefund({
          refundNo: `RF${Date.now()}${String(order.id).padStart(6, '0')}`.slice(0, 32),
          orderNo: order.order_no,
          transactionId: transactionId && !String(transactionId).startsWith('mock_') ? transactionId : null,
          refundFen: amount || order.amount,
          totalFen: order.amount,
          reason: reason || '管理员退款',
        });
      } catch (wxErr) {
        const detail = JSON.stringify((wxErr && wxErr.wx) || wxErr.message || '');
        if (!/已退款|已全额退款/.test(detail)) {
          console.error('[refund] wechat', wxErr.wx || wxErr);
          return fail(res, 60002, wxErr.message || '微信退款失败');
        }
      }
    }

    const result = await orderService.refundPaidOrder(orderNo, {
      reason,
      amount,
      operatorId: req.admin.id,
      transactionId,
    });

    return success(res, {
      refundNo: result.refundNo,
      orderNo,
      amount: result.refundAmount,
      status: 'success',
      message: isMockPay ? '已退款并收回权益（模拟支付）' : '已退款并收回权益',
    });
  } catch (err) {
    if (err.code === 40400) return fail(res, 40400, err.message);
    if (err.code === 60003) return fail(res, 60003, err.message);
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

module.exports = router;
