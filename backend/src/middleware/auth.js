const { verifyAdminToken, verifyUserToken } = require('../utils/jwt');
const { fail } = require('../utils/response');
const pool = require('../db/pool');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

async function adminAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return fail(res, 40100, '未登录或 token 失效', null, 401);
    }
    const payload = verifyAdminToken(token);
    const [rows] = await pool.query(
      'SELECT id, username, real_name, role_id, status FROM admins WHERE id = ? AND status = 1',
      [payload.adminId]
    );
    if (!rows.length) {
      return fail(res, 40100, '未登录或 token 失效', null, 401);
    }
    req.admin = rows[0];
    next();
  } catch {
    return fail(res, 40100, '未登录或 token 失效', null, 401);
  }
}

async function userAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return fail(res, 40100, '未登录或 token 失效', null, 401);
    }
    const payload = verifyUserToken(token);
    const [sessions] = await pool.query(
      'SELECT s.*, u.openid, u.nick_name, u.avatar_url, u.status AS user_status FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > NOW() AND u.deleted_at IS NULL',
      [token]
    );
    if (!sessions.length || sessions[0].user_status !== 1) {
      return fail(res, 40100, '未登录或 token 失效', null, 401);
    }
    req.user = {
      id: sessions[0].user_id,
      openid: sessions[0].openid,
      nickName: sessions[0].nick_name,
      avatarUrl: sessions[0].avatar_url,
    };
    req.token = token;
    next();
  } catch {
    return fail(res, 40100, '未登录或 token 失效', null, 401);
  }
}

function optionalUserAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return next();
  }
  userAuth(req, res, next);
}

module.exports = { adminAuth, userAuth, optionalUserAuth, extractToken };
