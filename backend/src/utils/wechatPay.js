const crypto = require('crypto');
const fs = require('fs');
const config = require('../config');
const { getPublicBaseUrl } = require('./publicUrl');

const WECHAT_HOST = 'https://api.mch.weixin.qq.com';
const platformCertCache = { certs: new Map(), fetchedAt: 0 };

function loadPrivateKey() {
  const inline = (config.wechatPay.privateKey || '').replace(/\\n/g, '\n').trim();
  if (inline) return inline;
  const keyPath = config.wechatPay.privateKeyPath;
  if (keyPath && fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath, 'utf8');
  }
  return '';
}

function isConfigured() {
  return !!(
    config.wechat.appId &&
    config.wechatPay.mchId &&
    config.wechatPay.serialNo &&
    config.wechatPay.apiV3Key &&
    loadPrivateKey()
  );
}

function isMockMode() {
  if (config.wechatPay.mock) return true;
  return !isConfigured();
}

function getNotifyUrl(req) {
  if (config.wechatPay.notifyUrl) return config.wechatPay.notifyUrl;
  return `${getPublicBaseUrl(req)}/api/pay/notify`;
}

function nonceStr() {
  return crypto.randomBytes(16).toString('hex');
}

function signMessage(message) {
  const key = loadPrivateKey();
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(message);
  signer.end();
  return signer.sign(key, 'base64');
}

function authorization(method, pathnameWithQuery, body = '') {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = nonceStr();
  const message = `${method}\n${pathnameWithQuery}\n${timestamp}\n${nonce}\n${body}\n`;
  const signature = signMessage(message);
  return {
    timestamp,
    nonce,
    header: `WECHATPAY2-SHA256-RSA2048 mchid="${config.wechatPay.mchId}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${config.wechatPay.serialNo}"`,
  };
}

function aesGcmDecrypt(associatedData, nonce, ciphertext) {
  const key = Buffer.from(config.wechatPay.apiV3Key, 'utf8');
  const buf = Buffer.from(ciphertext, 'base64');
  const authTag = buf.subarray(buf.length - 16);
  const data = buf.subarray(0, buf.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(nonce, 'utf8'));
  decipher.setAuthTag(authTag);
  decipher.setAAD(Buffer.from(associatedData, 'utf8'));
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

async function wechatRequest(method, pathname, bodyObj) {
  const body = bodyObj ? JSON.stringify(bodyObj) : '';
  const { header } = authorization(method, pathname, body);
  const res = await fetch(`${WECHAT_HOST}${pathname}`, {
    method,
    headers: {
      Authorization: header,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'shengbo-training/2.0',
    },
    body: body || undefined,
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data.message || data.code || `微信支付接口错误 ${res.status}`);
    err.wx = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

async function refreshPlatformCerts() {
  if (Date.now() - platformCertCache.fetchedAt < 12 * 3600 * 1000 && platformCertCache.certs.size) {
    return platformCertCache.certs;
  }
  const data = await wechatRequest('GET', '/v3/certificates');
  const next = new Map();
  for (const item of data.data || []) {
    const cipher = item.encrypt_certificate || {};
    const pem = aesGcmDecrypt(cipher.associated_data, cipher.nonce, cipher.ciphertext);
    next.set(item.serial_no, pem);
  }
  if (next.size) {
    platformCertCache.certs = next;
    platformCertCache.fetchedAt = Date.now();
  }
  return platformCertCache.certs;
}

async function verifyNotifySignature(headers, rawBody) {
  const timestamp = headers['wechatpay-timestamp'];
  const nonce = headers['wechatpay-nonce'];
  const signature = headers['wechatpay-signature'];
  const serial = headers['wechatpay-serial'];
  if (!timestamp || !nonce || !signature || !serial) {
    throw new Error('缺少微信支付回调签名头');
  }
  let certs = await refreshPlatformCerts();
  if (!certs.get(serial)) {
    platformCertCache.fetchedAt = 0;
    certs = await refreshPlatformCerts();
  }
  const pem = certs.get(serial);
  if (!pem) throw new Error('未找到微信支付平台证书');
  const publicKey = crypto.createPublicKey(pem);
  const message = `${timestamp}\n${nonce}\n${rawBody}\n`;
  const ok = crypto.verify(
    'sha256',
    Buffer.from(message),
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(signature, 'base64')
  );
  if (!ok) throw new Error('微信支付回调验签失败');
}

async function decryptNotify(headers, rawBody) {
  await verifyNotifySignature(headers, rawBody);
  const payload = JSON.parse(rawBody);
  const resource = payload.resource || {};
  const plain = aesGcmDecrypt(resource.associated_data, resource.nonce, resource.ciphertext);
  return JSON.parse(plain);
}

async function createJsapiPrepay({ orderNo, description, amountFen, openid, notifyUrl }) {
  const data = await wechatRequest('POST', '/v3/pay/transactions/jsapi', {
    appid: config.wechat.appId,
    mchid: config.wechatPay.mchId,
    description: String(description || '圣博培训').slice(0, 127),
    out_trade_no: orderNo,
    notify_url: notifyUrl,
    amount: { total: amountFen, currency: 'CNY' },
    payer: { openid },
  });
  return data.prepay_id;
}

function buildMiniPayParams(prepayId) {
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonce = nonceStr();
  const pkg = `prepay_id=${prepayId}`;
  const paySign = signMessage(`${config.wechat.appId}\n${timeStamp}\n${nonce}\n${pkg}\n`);
  return {
    timeStamp,
    nonceStr: nonce,
    package: pkg,
    signType: 'RSA',
    paySign,
  };
}

async function queryByOutTradeNo(orderNo) {
  const pathname = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderNo)}?mchid=${config.wechatPay.mchId}`;
  return wechatRequest('GET', pathname);
}

async function createRefund({ refundNo, orderNo, transactionId, refundFen, totalFen, reason }) {
  const body = {
    out_refund_no: refundNo,
    reason: String(reason || '管理员退款').slice(0, 80),
    amount: {
      refund: refundFen,
      total: totalFen,
      currency: 'CNY',
    },
  };
  if (transactionId) body.transaction_id = transactionId;
  else body.out_trade_no = orderNo;
  return wechatRequest('POST', '/v3/refund/domestic/refunds', body);
}

module.exports = {
  isConfigured,
  isMockMode,
  getNotifyUrl,
  createJsapiPrepay,
  buildMiniPayParams,
  decryptNotify,
  queryByOutTradeNo,
  createRefund,
};
