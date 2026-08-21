const crypto = require('crypto');
const config = require('../config');

function mockOpenidFromCode(code) {
  return `mock_${crypto.createHash('sha256').update(String(code)).digest('hex').slice(0, 28)}`;
}

async function code2Session(code) {
  const appId = config.wechat.appId;
  const secret = config.wechat.appSecret;

  if (!appId || !secret) {
    console.warn('[wechat] 未配置 WECHAT_APPID / WECHAT_APP_SECRET，使用 mock openid');
    return { openid: mockOpenidFromCode(code), unionid: null, mock: true };
  }

  const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
  url.searchParams.set('appid', appId);
  url.searchParams.set('secret', secret);
  url.searchParams.set('js_code', code);
  url.searchParams.set('grant_type', 'authorization_code');

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 8000);
  let data;
  try {
    const res = await fetch(url, { signal: ac.signal });
    data = await res.json();
  } catch (err) {
    const wrapped = new Error('微信登录服务暂不可用');
    wrapped.cause = err;
    throw wrapped;
  } finally {
    clearTimeout(timer);
  }

  if (!data || !data.openid) {
    const messages = {
      40013: 'AppID 无效',
      40125: 'AppSecret 无效，请检查服务器配置',
      40029: '登录凭证无效，请重试',
      40163: '登录凭证已使用，请重试',
      40226: '当前账号无法登录',
      45011: '请求过于频繁，请稍后重试',
    };
    const err = new Error(
      messages[data && data.errcode] || (data && data.errmsg) || '微信登录 code 无效'
    );
    err.wxErrcode = data && data.errcode;
    throw err;
  }

  return { openid: data.openid, unionid: data.unionid || null, mock: false };
}

module.exports = { code2Session };
