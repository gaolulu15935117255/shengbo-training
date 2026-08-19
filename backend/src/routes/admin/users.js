const express = require('express');
const pool = require('../../db/pool');
const { success, fail, paginate, parsePagination } = require('../../utils/response');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const { keyword, status } = req.query;
    const conditions = ['u.deleted_at IS NULL'];
    const params = [];

    if (keyword) {
      conditions.push('(u.nick_name LIKE ? OR u.openid LIKE ? OR u.phone LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }
    if (status !== undefined && status !== '') {
      conditions.push('u.status = ?');
      params.push(parseInt(status, 10));
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users u ${where}`, params);
    const [rows] = await pool.query(
      `SELECT u.id, u.openid, u.nick_name, u.avatar_url, u.phone, u.status, u.last_login_at, u.created_at
       FROM users u ${where} ORDER BY u.id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return success(res, paginate(rows.map((u) => ({
      id: u.id,
      openid: u.openid,
      nickName: u.nick_name,
      avatarUrl: u.avatar_url,
      phone: u.phone,
      status: u.status,
      lastLoginAt: u.last_login_at,
      createdAt: u.created_at,
    })), page, pageSize, total));
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
      [userId]
    );
    if (!users.length) return fail(res, 40400, '用户不存在');

    const u = users[0];
    const [memberships] = await pool.query(
      'SELECT * FROM user_memberships WHERE user_id = ? ORDER BY id DESC LIMIT 5',
      [userId]
    );
    const [entitlements] = await pool.query(
      'SELECT * FROM user_entitlements WHERE user_id = ? AND status = 1',
      [userId]
    );
    const [stats] = await pool.query('SELECT * FROM user_stats WHERE user_id = ?', [userId]);
    const [[orderCount]] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM orders WHERE user_id = ?',
      [userId]
    );

    return success(res, {
      id: u.id,
      openid: u.openid,
      nickName: u.nick_name,
      avatarUrl: u.avatar_url,
      phone: u.phone,
      status: u.status,
      lastLoginAt: u.last_login_at,
      createdAt: u.created_at,
      memberships,
      entitlements: entitlements.map((e) => ({
        id: e.id,
        entitlementType: e.entitlement_type,
        resourceId: e.resource_id,
        expireAt: e.expire_at,
        status: e.status,
      })),
      stats: stats[0] || null,
      orderCount: orderCount.cnt,
    });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.post('/:id/grant', async (req, res) => {
  try {
    const userId = req.params.id;
    const { entitlementType, resourceId, expireAt, remark } = req.body || {};

    if (!entitlementType) {
      return fail(res, 40001, 'entitlementType 不能为空');
    }

    const [users] = await pool.query('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL', [userId]);
    if (!users.length) return fail(res, 40400, '用户不存在');

    const [result] = await pool.query(
      `INSERT INTO user_entitlements (user_id, entitlement_type, resource_id, expire_at, status)
       VALUES (?, ?, ?, ?, 1)`,
      [userId, entitlementType, resourceId || null, expireAt || null]
    );

    if (entitlementType === 'all' && expireAt) {
      await pool.query(
        `INSERT INTO user_memberships (user_id, level, started_at, expire_at, status)
         VALUES (?, 'year', NOW(), ?, 1)`,
        [userId, expireAt]
      );
    }

    return success(res, {
      id: result.insertId,
      userId: parseInt(userId, 10),
      entitlementType,
      resourceId: resourceId || null,
      expireAt: expireAt || null,
      remark: remark || null,
    }, '权益开通成功');
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

module.exports = router;
