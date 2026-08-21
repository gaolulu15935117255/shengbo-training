const express = require('express');
const pool = require('../../db/pool');
const { signUserToken, getExpiresInSeconds, hashToken } = require('../../utils/jwt');
const { code2Session } = require('../../utils/wechat');
const config = require('../../config');
const { success, fail } = require('../../utils/response');
const { userAuth } = require('../../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { code, nickName, avatarUrl } = req.body || {};
    if (!code) {
      return fail(res, 40001, 'code 不能为空');
    }

    let session;
    try {
      session = await code2Session(code);
    } catch (wxErr) {
      console.error(wxErr);
      return fail(res, 60001, wxErr.message || '微信登录 code 无效');
    }

    const { openid, unionid } = session;
    let userId;

    const [existing] = await pool.query(
      'SELECT id, nick_name, avatar_url, status FROM users WHERE openid = ? AND deleted_at IS NULL',
      [openid]
    );

    if (existing.length) {
      userId = existing[0].id;
      if (existing[0].status !== 1) {
        return fail(res, 40300, '账号已被禁用');
      }
      await pool.query(
        'UPDATE users SET nick_name = COALESCE(?, nick_name), avatar_url = COALESCE(?, avatar_url), unionid = COALESCE(?, unionid), last_login_at = NOW() WHERE id = ?',
        [nickName || null, avatarUrl || null, unionid, userId]
      );
    } else {
      const [result] = await pool.query(
        'INSERT INTO users (openid, unionid, nick_name, avatar_url, last_login_at) VALUES (?, ?, ?, ?, NOW())',
        [openid, unionid, nickName || '微信用户', avatarUrl || null]
      );
      userId = result.insertId;
      await pool.query('INSERT INTO user_stats (user_id) VALUES (?)', [userId]);
    }

    const token = signUserToken({ userId, openid });
    const expiresIn = getExpiresInSeconds(config.jwt.expiresIn);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await pool.query(
      'INSERT INTO user_sessions (user_id, token, expires_at, client_type) VALUES (?, ?, ?, ?)',
      [userId, hashToken(token), expiresAt, 'miniapp']
    );

    const [memberships] = await pool.query(
      'SELECT level, expire_at FROM user_memberships WHERE user_id = ? AND status = 1 AND (expire_at IS NULL OR expire_at > NOW()) ORDER BY id DESC LIMIT 1',
      [userId]
    );

    const membershipLabels = { month: '月度会员', year: '年度会员', lifetime: '终身会员' };
    const membership = memberships[0];

    const [userRows] = await pool.query('SELECT nick_name, avatar_url FROM users WHERE id = ?', [userId]);

    return success(res, {
      token,
      expiresIn,
      user: {
        id: userId,
        nickName: userRows[0].nick_name,
        avatarUrl: userRows[0].avatar_url,
        membershipLabel: membership ? membershipLabels[membership.level] || '会员' : '普通用户',
        membershipExpire: membership?.expire_at || null,
      },
    });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.get('/profile', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await pool.query(
      'SELECT id, nick_name, avatar_url FROM users WHERE id = ?',
      [userId]
    );
    const [memberships] = await pool.query(
      'SELECT level, expire_at FROM user_memberships WHERE user_id = ? AND status = 1 AND (expire_at IS NULL OR expire_at > NOW()) ORDER BY id DESC LIMIT 1',
      [userId]
    );
    const [stats] = await pool.query('SELECT * FROM user_stats WHERE user_id = ?', [userId]);

    const membershipLabels = { month: '月度会员', year: '年度会员', lifetime: '终身会员' };
    const m = memberships[0];
    const s = stats[0] || { total_answered: 0, total_correct: 0, exam_high_score: 0, study_days: 0 };

    return success(res, {
      id: users[0].id,
      nickName: users[0].nick_name,
      avatarUrl: users[0].avatar_url,
      membership: m
        ? {
            level: m.level,
            label: membershipLabels[m.level] || m.level,
            expireAt: m.expire_at,
            isActive: true,
          }
        : { level: null, label: '普通用户', expireAt: null, isActive: false },
      stats: {
        totalAnswered: s.total_answered,
        accuracy: s.total_answered ? Math.round((s.total_correct / s.total_answered) * 100) : 0,
        examHighScore: s.exam_high_score,
        studyDays: s.study_days,
      },
    });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.post('/logout', userAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM user_sessions WHERE token IN (?, ?)', [hashToken(req.token), req.token]);
    return success(res, null);
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

module.exports = router;
