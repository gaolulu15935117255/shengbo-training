const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const pool = require('../../db/pool');
const { signUserToken, getExpiresInSeconds, hashToken } = require('../../utils/jwt');
const { code2Session, getPhoneNumberByCode } = require('../../utils/wechat');
const config = require('../../config');
const { success, fail } = require('../../utils/response');
const { userAuth } = require('../../middleware/auth');
const { toPublicUrl, sanitizeNickName, sanitizeAvatarUrl, sanitizeGender } = require('../../utils/publicUrl');
const { ensureWelcomeMessages, maskPhone } = require('../../utils/userMessage');

const router = express.Router();

const avatarDir = path.join(config.uploadDir, 'avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: avatarDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
      cb(null, `${Date.now()}_${uuidv4().replace(/-/g, '').slice(0, 12)}${safeExt}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/octet-stream'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('仅支持 jpg/png/webp 头像'));
  },
});

const MEMBERSHIP_LABELS = { month: '月度会员', year: '年度会员', lifetime: '终身会员' };

async function getActiveMembership(userId) {
  const [memberships] = await pool.query(
    'SELECT level, expire_at FROM user_memberships WHERE user_id = ? AND status = 1 AND (expire_at IS NULL OR expire_at > NOW()) ORDER BY id DESC LIMIT 1',
    [userId]
  );
  return memberships[0] || null;
}

function mapLoginUser(userId, userRow, membership) {
  return {
    id: userId,
    nickName: userRow.nick_name,
    avatarUrl: userRow.avatar_url,
    gender: userRow.gender || 0,
    phone: maskPhone(userRow.phone),
    phoneBound: !!userRow.phone,
    membershipLabel: membership ? MEMBERSHIP_LABELS[membership.level] || '会员' : '普通用户',
    membershipExpire: membership?.expire_at || null,
  };
}

router.post('/login', async (req, res) => {
  try {
    const { code } = req.body || {};
    const nickName = sanitizeNickName(req.body && req.body.nickName);
    const avatarUrl = sanitizeAvatarUrl(req.body && req.body.avatarUrl);
    const gender = sanitizeGender(req.body && req.body.gender);
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
      'SELECT id, nick_name, avatar_url, gender, status FROM users WHERE openid = ? AND deleted_at IS NULL',
      [openid]
    );

    if (existing.length) {
      userId = existing[0].id;
      if (existing[0].status !== 1) {
        return fail(res, 40300, '账号已被禁用');
      }
      await pool.query(
        'UPDATE users SET nick_name = COALESCE(?, nick_name), avatar_url = COALESCE(?, avatar_url), gender = COALESCE(?, gender), unionid = COALESCE(?, unionid), last_login_at = NOW() WHERE id = ?',
        [nickName, avatarUrl, gender, unionid, userId]
      );
    } else {
      const [result] = await pool.query(
        'INSERT INTO users (openid, unionid, nick_name, avatar_url, gender, last_login_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [openid, unionid, nickName || '微信用户', avatarUrl, gender || 0]
      );
      userId = result.insertId;
      await pool.query('INSERT INTO user_stats (user_id) VALUES (?)', [userId]);
    }

    await ensureWelcomeMessages(userId);

    const token = signUserToken({ userId, openid });
    const expiresIn = getExpiresInSeconds(config.jwt.expiresIn);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await pool.query(
      'INSERT INTO user_sessions (user_id, token, expires_at, client_type) VALUES (?, ?, ?, ?)',
      [userId, hashToken(token), expiresAt, 'miniapp']
    );

    const membership = await getActiveMembership(userId);
    const [userRows] = await pool.query('SELECT nick_name, avatar_url, gender, phone FROM users WHERE id = ?', [userId]);

    return success(res, {
      token,
      expiresIn,
      user: mapLoginUser(userId, userRows[0], membership),
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
      'SELECT id, nick_name, avatar_url, gender, phone FROM users WHERE id = ?',
      [userId]
    );
    const [memberships] = await pool.query(
      'SELECT level, expire_at FROM user_memberships WHERE user_id = ? AND status = 1 AND (expire_at IS NULL OR expire_at > NOW()) ORDER BY id DESC LIMIT 1',
      [userId]
    );
    const [stats] = await pool.query('SELECT * FROM user_stats WHERE user_id = ?', [userId]);

    const m = memberships[0];
    const s = stats[0] || { total_answered: 0, total_correct: 0, exam_high_score: 0, study_days: 0 };

    return success(res, {
      id: users[0].id,
      nickName: users[0].nick_name,
      avatarUrl: users[0].avatar_url,
      gender: users[0].gender || 0,
      phone: maskPhone(users[0].phone),
      phoneBound: !!users[0].phone,
      membership: m
        ? {
            level: m.level,
            label: MEMBERSHIP_LABELS[m.level] || m.level,
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

router.put('/profile', userAuth, async (req, res) => {
  try {
    const nickName = sanitizeNickName(req.body && req.body.nickName);
    const avatarUrl = sanitizeAvatarUrl(req.body && req.body.avatarUrl);
    const gender = sanitizeGender(req.body && req.body.gender);
    if (!nickName && !avatarUrl && gender == null) {
      return fail(res, 40001, '请提供昵称或头像');
    }

    await pool.query(
      'UPDATE users SET nick_name = COALESCE(?, nick_name), avatar_url = COALESCE(?, avatar_url), gender = COALESCE(?, gender) WHERE id = ?',
      [nickName, avatarUrl, gender, req.user.id]
    );

    const [userRows] = await pool.query('SELECT nick_name, avatar_url, gender, phone FROM users WHERE id = ?', [req.user.id]);
    const membership = await getActiveMembership(req.user.id);
    return success(res, mapLoginUser(req.user.id, userRows[0], membership));
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.post('/avatar', userAuth, (req, res) => {
  avatarUpload.single('file')(req, res, async (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? '头像不能超过 2MB' : err.message || '头像上传失败';
      return fail(res, 40001, message);
    }
    try {
      if (!req.file) {
        return fail(res, 40001, '请选择头像文件');
      }
      const avatarUrl = toPublicUrl(req, `/uploads/avatars/${req.file.filename}`);
      await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id]);
      return success(res, { avatarUrl });
    } catch (uploadErr) {
      console.error(uploadErr);
      return fail(res, 50000, '服务器内部错误', null, 500);
    }
  });
});

router.post('/phone', userAuth, async (req, res) => {
  try {
    const code = req.body && req.body.code;
    if (!code) {
      return fail(res, 40001, '手机号授权码不能为空');
    }
    let phone;
    try {
      phone = await getPhoneNumberByCode(code);
    } catch (wxErr) {
      console.error(wxErr);
      return fail(res, 60001, wxErr.message || '获取手机号失败');
    }

    await pool.query('UPDATE users SET phone = ? WHERE id = ?', [phone, req.user.id]);
    const [userRows] = await pool.query(
      'SELECT nick_name, avatar_url, gender, phone FROM users WHERE id = ?',
      [req.user.id]
    );
    const membership = await getActiveMembership(req.user.id);
    return success(res, mapLoginUser(req.user.id, userRows[0], membership));
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
