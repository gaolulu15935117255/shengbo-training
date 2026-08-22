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

const tokenCache = { token: '', expireAt: 0 };

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expireAt - 60 * 1000) {
    return tokenCache.token;
  }
  const appId = config.wechat.appId;
  const secret = config.wechat.appSecret;
  if (!appId || !secret) {
    const err = new Error('未配置微信 AppSecret，无法获取手机号');
    err.code = 'NO_SECRET';
    throw err;
  }

  const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
  url.searchParams.set('grant_type', 'client_credential');
  url.searchParams.set('appid', appId);
  url.searchParams.set('secret', secret);

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 8000);
  let data;
  try {
    const res = await fetch(url, { signal: ac.signal });
    data = await res.json();
  } catch (err) {
    const wrapped = new Error('微信服务暂不可用');
    wrapped.cause = err;
    throw wrapped;
  } finally {
    clearTimeout(timer);
  }

  if (!data || !data.access_token) {
    throw new Error((data && data.errmsg) || '获取微信 access_token 失败');
  }
  tokenCache.token = data.access_token;
  tokenCache.expireAt = Date.now() + (Number(data.expires_in) || 7200) * 1000;
  return tokenCache.token;
}

async function getPhoneNumberByCode(code) {
  const token = await getAccessToken();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 8000);
  let data;
  try {
    const res = await fetch(
      `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        signal: ac.signal,
      }
    );
    data = await res.json();
  } catch (err) {
    const wrapped = new Error('微信手机号服务暂不可用');
    wrapped.cause = err;
    throw wrapped;
  } finally {
    clearTimeout(timer);
  }

  if (data && data.errcode === 40001) {
    tokenCache.token = '';
    tokenCache.expireAt = 0;
  }

  if (!data || (data.errcode && data.errcode !== 0)) {
    const messages = {
      40029: '手机号授权码无效，请重试',
      40129: '授权码已使用，请重新点击绑定',
      48001: '小程序未开通获取手机号权限',
      40001: '微信凭证失效，请稍后重试',
    };
    const err = new Error(
      messages[data && data.errcode] || (data && data.errmsg) || '获取手机号失败'
    );
    err.wxErrcode = data && data.errcode;
    throw err;
  }

  const info = data.phone_info || {};
  const phone = info.purePhoneNumber || info.phoneNumber;
  if (!phone) {
    throw new Error('未返回手机号');
  }
  return String(phone);
}

module.exports = { code2Session, getAccessToken, getPhoneNumberByCode };

