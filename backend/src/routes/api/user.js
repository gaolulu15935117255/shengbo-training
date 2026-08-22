const express = require('express');
const pool = require('../../db/pool');
const { success, fail } = require('../../utils/response');
const { userAuth } = require('../../middleware/auth');

const router = express.Router();

const MEMBERSHIP_LABELS = { month: '月度会员', year: '年度会员', lifetime: '终身会员' };

router.get('/entitlements', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [memberships] = await pool.query(
      'SELECT level, expire_at FROM user_memberships WHERE user_id = ? AND status = 1 AND (expire_at IS NULL OR expire_at > NOW()) ORDER BY id DESC LIMIT 1',
      [userId]
    );
    const [ents] = await pool.query(
      'SELECT entitlement_type, resource_id, expire_at FROM user_entitlements WHERE user_id = ? AND status = 1 AND (expire_at IS NULL OR expire_at > NOW())',
      [userId]
    );
    const [paid] = await pool.query(
      `SELECT DISTINCT p.product_code FROM orders o
       JOIN products p ON p.id = o.product_id
       WHERE o.user_id = ? AND o.status = 'paid'`,
      [userId]
    );

    const m = memberships[0];
    const unlockAll = ents.some((e) => e.entitlement_type === 'all');
    return success(res, {
      hasMembership: !!m || unlockAll,
      membershipLevel: m ? m.level : unlockAll ? 'all' : null,
      membershipLabel: m ? MEMBERSHIP_LABELS[m.level] || '会员' : unlockAll ? '会员' : '普通用户',
      membershipExpireAt: m ? m.expire_at : null,
      unlockAll,
      categories: ents.filter((e) => e.entitlement_type === 'category').map((e) => e.resource_id),
      courses: ents.filter((e) => e.entitlement_type === 'course').map((e) => e.resource_id),
      examPacks: ents.filter((e) => e.entitlement_type === 'exam_pack').map((e) => e.resource_id),
      purchasedProductIds: paid.map((p) => p.product_code),
    });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

module.exports = router;
