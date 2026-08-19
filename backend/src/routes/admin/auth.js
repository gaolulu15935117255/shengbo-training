const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../../db/pool');
const { signAdminToken, getExpiresInSeconds } = require('../../utils/jwt');
const config = require('../../config');
const { success, fail } = require('../../utils/response');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return fail(res, 40001, '用户名和密码不能为空');
    }

    const [rows] = await pool.query(
      'SELECT a.*, r.code AS role_code, r.name AS role_name FROM admins a JOIN admin_roles r ON r.id = a.role_id WHERE a.username = ? AND a.status = 1',
      [username]
    );
    if (!rows.length) {
      return fail(res, 40100, '用户名或密码错误', null, 401);
    }

    const admin = rows[0];
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      return fail(res, 40100, '用户名或密码错误', null, 401);
    }

    await pool.query('UPDATE admins SET last_login_at = NOW() WHERE id = ?', [admin.id]);

    const token = signAdminToken({ adminId: admin.id, role: admin.role_code });
    return success(res, {
      token,
      expiresIn: getExpiresInSeconds(config.adminJwt.expiresIn),
      admin: {
        id: admin.id,
        username: admin.username,
        realName: admin.real_name,
        role: admin.role_code,
        roleName: admin.role_name,
      },
    });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

module.exports = router;
