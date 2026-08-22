const express = require('express');
const { userAuth } = require('../../middleware/auth');
const { success, fail } = require('../../utils/response');
const wechatPay = require('../../utils/wechatPay');
const orderService = require('../../services/orderService');
const { createPrepay } = require('./orders');

const router = express.Router();

router.post('/prepay', userAuth, createPrepay);

async function handlePayNotify(req, res) {
  try {
    const raw = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body || {});

    if (wechatPay.isMockMode() && !wechatPay.isConfigured()) {
      return res.json({ code: 'SUCCESS', message: '成功' });
    }

    const data = await wechatPay.decryptNotify(req.headers, raw);
    if (data.trade_state === 'SUCCESS' && data.out_trade_no) {
      await orderService.fulfillPaidOrder(data.out_trade_no, {
        transactionId: data.transaction_id,
        notifyRaw: data,
      });
    }
    return res.json({ code: 'SUCCESS', message: '成功' });
  } catch (err) {
    console.error('[pay] notify', err);
    return res.status(500).json({ code: 'FAIL', message: err.message || '处理失败' });
  }
}

module.exports = { router, handlePayNotify };
