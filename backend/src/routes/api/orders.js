const express = require('express');
const pool = require('../../db/pool');
const { success, fail, paginate, parsePagination } = require('../../utils/response');
const { userAuth } = require('../../middleware/auth');
const wechatPay = require('../../utils/wechatPay');
const orderService = require('../../services/orderService');

const router = express.Router();

async function syncWechatPaid(order) {
  if (wechatPay.isMockMode() || order.status !== 'pending' || !wechatPay.isConfigured()) {
    return order;
  }
  try {
    const result = await wechatPay.queryByOutTradeNo(order.order_no);
    if (result.trade_state === 'SUCCESS') {
      await orderService.fulfillPaidOrder(order.order_no, {
        transactionId: result.transaction_id,
        notifyRaw: result,
      });
      return { ...order, status: 'paid', paid_at: new Date() };
    }
  } catch (err) {
    console.error('[pay] query order failed', err.message);
  }
  return order;
}

router.post('/create', userAuth, async (req, res) => {
  try {
    const productCode = (req.body && (req.body.productCode || req.body.productId)) || '';
    if (!productCode) return fail(res, 40001, 'productCode 不能为空');
    const order = await orderService.createOrder(req.user.id, String(productCode));
    return success(res, orderService.mapOrder(order));
  } catch (err) {
    if (err.code === 40400) return fail(res, 40400, err.message);
    if (err.code === 40900) return fail(res, 40900, err.message);
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.get('/', userAuth, async (req, res) => {
  try {
    await orderService.closeExpiredOrders();
    const { page, pageSize, offset } = parsePagination(req.query);
    const status = req.query.status;
    const conditions = ['o.user_id = ?'];
    const params = [req.user.id];
    if (status && status !== 'all') {
      conditions.push('o.status = ?');
      params.push(status);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM orders o ${where}`,
      params
    );
    const [rows] = await pool.query(
      `SELECT o.*, p.product_code FROM orders o
       JOIN products p ON p.id = o.product_id
       ${where} ORDER BY o.id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    return success(res, paginate(rows.map(orderService.mapOrder), page, pageSize, total));
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.get('/:orderNo/status', userAuth, async (req, res) => {
  try {
    await orderService.closeExpiredOrders();
    let order = await orderService.getOrderForUser(req.params.orderNo, req.user.id);
    if (!order) return fail(res, 40400, '订单不存在');
    order = await syncWechatPaid(order);
    const fresh = await orderService.getOrderForUser(req.params.orderNo, req.user.id);
    return success(res, orderService.mapOrder(fresh || order));
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.post('/:orderNo/repay', userAuth, async (req, res) => {
  req.body = { ...(req.body || {}), orderNo: req.params.orderNo };
  return createPrepay(req, res);
});

async function createPrepay(req, res) {
  try {
    await orderService.closeExpiredOrders();
    const orderNo = (req.body && req.body.orderNo) || req.params.orderNo;
    if (!orderNo) return fail(res, 40001, 'orderNo 不能为空');

    const order = await orderService.getOrderForUser(orderNo, req.user.id);
    if (!order) return fail(res, 40400, '订单不存在');
    if (order.status === 'paid') {
      return fail(res, 40900, '订单已支付');
    }
    if (order.status !== 'pending') {
      return fail(res, 60003, '订单已关闭，请重新下单');
    }

    if (order.amount === 0 || wechatPay.isMockMode()) {
      await orderService.fulfillPaidOrder(order.order_no, {
        transactionId: `mock_${order.order_no}`,
        payChannel: order.amount === 0 ? 'free' : 'mock',
      });
      const paid = await orderService.getOrderForUser(order.order_no, req.user.id);
      return success(res, {
        mockPaid: true,
        orderNo: order.order_no,
        ...orderService.mapOrder(paid),
      });
    }

    if (!wechatPay.isConfigured()) {
      return fail(res, 60002, '未配置微信支付商户号');
    }

    const openid = req.user.openid;
    if (!openid) return fail(res, 60002, '缺少用户 openid，请重新登录');

    try {
      const prepayId = await wechatPay.createJsapiPrepay({
        orderNo: order.order_no,
        description: order.product_title,
        amountFen: order.amount,
        openid,
        notifyUrl: wechatPay.getNotifyUrl(req),
      });
      await orderService.savePrepay(order.id, req.user.id, order.amount, prepayId);
      return success(res, {
        mockPaid: false,
        orderNo: order.order_no,
        ...wechatPay.buildMiniPayParams(prepayId),
      });
    } catch (wxErr) {
      console.error('[pay] prepay', wxErr.wx || wxErr);
      if (wxErr.wx && wxErr.wx.code === 'ORDERPAID') {
        await orderService.fulfillPaidOrder(order.order_no, { notifyRaw: wxErr.wx });
        const paid = await orderService.getOrderForUser(order.order_no, req.user.id);
        return success(res, { mockPaid: true, orderNo: order.order_no, ...orderService.mapOrder(paid) });
      }
      return fail(res, 60002, wxErr.message || '微信支付下单失败');
    }
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
}

router.post('/:orderNo/prepay', userAuth, createPrepay);

module.exports = { router, createPrepay };
