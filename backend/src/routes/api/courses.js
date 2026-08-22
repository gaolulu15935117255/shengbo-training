const express = require('express');
const pool = require('../../db/pool');
const { success, fail, paginate, parsePagination } = require('../../utils/response');
const { optionalUserAuth } = require('../../middleware/auth');
const courseService = require('../../services/courseService');

const router = express.Router();

router.get('/', optionalUserAuth, async (req, res) => {
  try {
    const { page, pageSize, offset } = parsePagination({
      page: req.query.page,
      pageSize: req.query.pageSize || 50,
    });
    const category = req.query.category;
    const conditions = ['status = 1'];
    const params = [];
    if (category && category !== 'all') {
      conditions.push('category_code = ?');
      params.push(category);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM courses ${where}`, params);
    const [rows] = await pool.query(
      `SELECT * FROM courses ${where} ORDER BY sort_order ASC, id ASC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const userId = req.user?.id || null;
    const ctx = await courseService.getAccessContext(userId);
    const progressMap = await courseService.getProgressMap(userId, rows.map((r) => r.id));

    const list = rows.map((row) => {
      const progress = progressMap.get(row.id);
      return courseService.mapCourse(row, {
        hasAccess: courseService.hasCourseAccess(row, ctx),
        learned: !!progress,
        progress: progress ? progress.progress : 0,
        learnedLessonIds: progress ? progress.learnedLessonIds : [],
      });
    });

    return success(res, {
      ...paginate(list, page, pageSize, total),
      categories: courseService.CATEGORIES,
    });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.get('/:courseCode', optionalUserAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM courses WHERE course_code = ? AND status = 1',
      [req.params.courseCode]
    );
    if (!rows.length) return fail(res, 40400, '课程不存在');

    const row = rows[0];
    const userId = req.user?.id || null;
    const ctx = await courseService.getAccessContext(userId);
    const lessons = await courseService.getLessons(row.id);
    const progressMap = await courseService.getProgressMap(userId, [row.id]);
    const progress = progressMap.get(row.id);
    const learnedIds = new Set((progress && progress.learnedLessonIds) || []);
    const hasAccess = courseService.hasCourseAccess(row, ctx);

    return success(res, {
      ...courseService.mapCourse(row, {
        hasAccess,
        learned: !!progress,
        progress: progress ? progress.progress : 0,
        learnedLessonIds: progress ? progress.learnedLessonIds : [],
      }),
      lessons: lessons.map((l) => ({
        ...l,
        learned: learnedIds.has(l.id),
      })),
    });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

module.exports = router;
