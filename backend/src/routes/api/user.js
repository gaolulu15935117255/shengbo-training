const express = require('express');
const pool = require('../../db/pool');
const { success, fail, paginate, parsePagination } = require('../../utils/response');
const { userAuth } = require('../../middleware/auth');
const courseService = require('../../services/courseService');
const { ensureWelcomeMessages } = require('../../utils/userMessage');

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

router.get('/courses', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT c.*, uc.progress, uc.learned_lessons, uc.started_at, uc.completed_at
       FROM user_courses uc
       JOIN courses c ON c.id = uc.course_id
       WHERE uc.user_id = ? AND c.status = 1
       ORDER BY uc.updated_at DESC`,
      [userId]
    );
    const ctx = await courseService.getAccessContext(userId);
    const list = [];
    for (const row of rows) {
      const learnedLessonIds = courseService.parseJson(row.learned_lessons, []) || [];
      list.push(
        courseService.mapCourse(row, {
          hasAccess: courseService.hasCourseAccess(row, ctx),
          learned: true,
          progress: row.progress || 0,
          learnedLessonIds,
        })
      );
    }
    return success(res, { list });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.post('/courses/:courseCode/progress', userAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM courses WHERE course_code = ? AND status = 1',
      [req.params.courseCode]
    );
    if (!rows.length) return fail(res, 40400, '课程不存在');

    const course = rows[0];
    const ctx = await courseService.getAccessContext(req.user.id);
    if (!courseService.hasCourseAccess(course, ctx)) {
      return fail(res, 40300, '该课程为付费内容，请先购买或开通会员');
    }

    const body = req.body || {};
    let ids = body.learnedLessonIds;
    if (body.learnedLessonId && !ids) {
      const progressMap = await courseService.getProgressMap(req.user.id, [course.id]);
      const current = (progressMap.get(course.id) || {}).learnedLessonIds || [];
      ids = [...current, parseInt(body.learnedLessonId, 10)];
    }

    const result = await courseService.upsertProgress(req.user.id, course, {
      progress: body.progress,
      learnedLessonIds: ids,
    });
    return success(res, result);
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.get('/messages', userAuth, async (req, res) => {
  try {
    await ensureWelcomeMessages(req.user.id);
    const { page, pageSize, offset } = parsePagination(req.query);
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM user_messages WHERE user_id = ?',
      [req.user.id]
    );
    const [[{ unreadCount }]] = await pool.query(
      'SELECT COUNT(*) AS unreadCount FROM user_messages WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    const [rows] = await pool.query(
      `SELECT id, title, content, is_read, read_at, created_at
       FROM user_messages WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, pageSize, offset]
    );
    return success(res, {
      ...paginate(
        rows.map((m) => ({
          id: m.id,
          title: m.title,
          content: m.content,
          read: !!m.is_read,
          readAt: m.read_at,
          createdAt: m.created_at,
        })),
        page,
        pageSize,
        total
      ),
      unreadCount,
    });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.put('/messages/:id/read', userAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return fail(res, 40001, '消息 ID 无效');
    const [result] = await pool.query(
      'UPDATE user_messages SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (!result.affectedRows) return fail(res, 40400, '消息不存在');
    const [[{ unreadCount }]] = await pool.query(
      'SELECT COUNT(*) AS unreadCount FROM user_messages WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    return success(res, { unreadCount });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

module.exports = router;
