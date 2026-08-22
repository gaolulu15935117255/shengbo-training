const express = require('express');
const pool = require('../../db/pool');
const { success, fail, paginate, parsePagination } = require('../../utils/response');
const { optionalUserAuth, userAuth } = require('../../middleware/auth');

const router = express.Router();

const TYPE_LABELS = { single: '单选题', multiple: '多选题', judge: '判断题' };

function optionLabel(index) {
  return String.fromCharCode(65 + index);
}

function parseJsonField(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return JSON.parse(value);
  return value;
}

function mapQuestion(row, withAnswer = true, favorited = false) {
  const options = parseJsonField(row.options);
  const answer = parseJsonField(row.answer);
  const result = {
    id: row.id,
    questionCode: row.question_code,
    type: row.type,
    typeLabel: TYPE_LABELS[row.type] || row.type,
    stem: row.stem,
    options,
    knowledge: row.knowledge,
    favorited,
  };
  if (withAnswer) {
    result.answer = answer;
    result.answerText = answer.map(optionLabel).join('、');
    result.analysis = row.analysis;
  }
  return result;
}

async function getFavoriteSet(userId) {
  if (!userId) return new Set();
  const [rows] = await pool.query('SELECT question_id FROM user_favorites WHERE user_id = ?', [userId]);
  return new Set(rows.map((r) => r.question_id));
}

async function userHasSubcategoryAccess(userId, subcategoryId) {
  const [subs] = await pool.query(
    'SELECT s.is_free, s.category_id, c.category_code FROM quiz_subcategories s JOIN quiz_categories c ON c.id = s.category_id WHERE s.id = ?',
    [subcategoryId]
  );
  if (!subs.length) return false;
  if (subs[0].is_free) return true;
  if (!userId) return false;

  const [allEnt] = await pool.query(
    "SELECT 1 FROM user_entitlements WHERE user_id = ? AND status = 1 AND entitlement_type = 'all' AND (expire_at IS NULL OR expire_at > NOW()) LIMIT 1",
    [userId]
  );
  if (allEnt.length) return true;

  const [catEnt] = await pool.query(
    "SELECT 1 FROM user_entitlements WHERE user_id = ? AND status = 1 AND entitlement_type = 'category' AND resource_id = ? AND (expire_at IS NULL OR expire_at > NOW()) LIMIT 1",
    [userId, subs[0].category_code]
  );
  return catEnt.length > 0;
}

router.get('/categories', optionalUserAuth, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const [categories] = await pool.query(
      'SELECT * FROM quiz_categories WHERE status = 1 ORDER BY sort_order ASC'
    );

    const result = [];
    for (const cat of categories) {
      const [subs] = await pool.query(
        `SELECT s.*, (SELECT COUNT(*) FROM questions q WHERE q.subcategory_id = s.id AND q.status = 'published' AND q.deleted_at IS NULL) AS question_count
         FROM quiz_subcategories s WHERE s.category_id = ? AND s.status = 1 ORDER BY s.sort_order ASC`,
        [cat.id]
      );

      const subcategories = [];
      for (const s of subs) {
        let locked = !s.is_free;
        if (userId) {
          const hasAccess = await userHasSubcategoryAccess(userId, s.id);
          locked = !hasAccess;
        } else if (s.is_free) {
          locked = false;
        }

        subcategories.push({
          id: s.id,
          subCode: s.sub_code,
          name: s.name,
          questionCount: s.question_count,
          isFree: !!s.is_free,
          locked,
        });
      }

      result.push({
        id: cat.id,
        categoryCode: cat.category_code,
        name: cat.name,
        icon: cat.icon,
        desc: cat.description,
        subcategories,
      });
    }

    return success(res, result);
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.get('/questions/ids', optionalUserAuth, async (req, res) => {
  try {
    const { subcategoryId, categoryId, mode, limit } = req.query;
    const questionLimit = parseInt(limit, 10) || (mode === 'mock' ? 10 : 1000);

    if (!subcategoryId && !categoryId) {
      return fail(res, 40001, 'subcategoryId 或 categoryId 不能为空');
    }

    let targetSubId = subcategoryId ? parseInt(subcategoryId, 10) : null;

    if (targetSubId) {
      const hasAccess = await userHasSubcategoryAccess(req.user?.id || null, targetSubId);
      if (!hasAccess) {
        return fail(res, 40300, '该内容为付费资源，请购买对应课程或开通会员', {
          hasAccess: false,
          suggestProductCode: 'p1',
        });
      }
    }

    let sql = "SELECT id FROM questions WHERE status = 'published' AND deleted_at IS NULL";
    const params = [];

    if (targetSubId) {
      sql += ' AND subcategory_id = ?';
      params.push(targetSubId);
    } else if (categoryId) {
      sql += ' AND category_id = ?';
      params.push(parseInt(categoryId, 10));
    }

    if (mode === 'mock') {
      sql += ' ORDER BY RAND() LIMIT ?';
      params.push(questionLimit);
    } else {
      sql += ' ORDER BY id ASC LIMIT ?';
      params.push(questionLimit);
    }

    const [rows] = await pool.query(sql, params);
    return success(res, {
      questionIds: rows.map((r) => r.id),
      total: rows.length,
      hasAccess: true,
    });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.get('/questions/batch', optionalUserAuth, async (req, res) => {
  try {
    const idsRaw = req.query.ids;
    if (!idsRaw) return fail(res, 40001, 'ids 不能为空');

    const ids = String(idsRaw)
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (!ids.length) return fail(res, 40001, 'ids 格式无效');

    const withAnswer = req.query.withAnswer !== 'false';
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT * FROM questions WHERE id IN (${placeholders}) AND status = 'published' AND deleted_at IS NULL`,
      ids
    );

    const favoriteSet = await getFavoriteSet(req.user?.id || null);
    const mapped = rows.map((row) => mapQuestion(row, withAnswer, favoriteSet.has(row.id)));
    mapped.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

    return success(res, mapped);
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.get('/questions/:questionId', optionalUserAuth, async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId, 10);
    if (!Number.isFinite(questionId)) return fail(res, 40001, 'questionId 无效');

    const [rows] = await pool.query(
      "SELECT * FROM questions WHERE id = ? AND status = 'published' AND deleted_at IS NULL",
      [questionId]
    );
    if (!rows.length) return fail(res, 40400, '题目不存在');

    const withAnswer = req.query.withAnswer !== 'false';
    const favoriteSet = await getFavoriteSet(req.user?.id || null);
    return success(res, mapQuestion(rows[0], withAnswer, favoriteSet.has(questionId)));
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.post('/questions/:questionId/submit', userAuth, async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId, 10);
    const { userAnswer } = req.body || {};
    if (!Number.isFinite(questionId)) return fail(res, 40001, 'questionId 无效');
    if (!Array.isArray(userAnswer)) return fail(res, 40001, 'userAnswer 必须为数组');

    const [rows] = await pool.query(
      "SELECT * FROM questions WHERE id = ? AND status = 'published' AND deleted_at IS NULL",
      [questionId]
    );
    if (!rows.length) return fail(res, 40400, '题目不存在');

    const answer = parseJsonField(rows[0].answer);
    const sortedCorrect = answer.slice().sort((a, b) => a - b);
    const sortedUser = userAnswer.slice().sort((a, b) => a - b);
    const isCorrect =
      sortedCorrect.length === sortedUser.length &&
      sortedCorrect.every((val, i) => val === sortedUser[i]);

    const userId = req.user.id;

    await pool.query(
      'INSERT INTO quiz_answer_logs (user_id, question_id, user_answer, is_correct) VALUES (?, ?, ?, ?)',
      [userId, questionId, JSON.stringify(userAnswer), isCorrect ? 1 : 0]
    );

    await pool.query(
      `INSERT INTO user_stats (user_id, total_answered, total_correct, study_days, last_study_date)
       VALUES (?, 1, ?, 1, CURDATE())
       ON DUPLICATE KEY UPDATE
         total_answered = total_answered + 1,
         total_correct = total_correct + VALUES(total_correct),
         study_days = IF(last_study_date = CURDATE(), study_days, study_days + 1),
         last_study_date = CURDATE()`,
      [userId, isCorrect ? 1 : 0]
    );

    if (!isCorrect) {
      await pool.query(
        `INSERT INTO user_wrong_questions (user_id, question_id, wrong_count, last_wrong_at)
         VALUES (?, ?, 1, NOW())
         ON DUPLICATE KEY UPDATE wrong_count = wrong_count + 1, last_wrong_at = NOW(), cleared_at = NULL`,
        [userId, questionId]
      );
    }

    return success(res, {
      isCorrect,
      answer,
      answerText: answer.map(optionLabel).join('、'),
      analysis: rows[0].analysis,
    });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.get('/wrong', userAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT question_id FROM user_wrong_questions WHERE user_id = ? AND cleared_at IS NULL ORDER BY last_wrong_at DESC',
      [req.user.id]
    );
    return success(res, { questionIds: rows.map((r) => r.question_id) });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.delete('/wrong', userAuth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE user_wrong_questions SET cleared_at = NOW() WHERE user_id = ? AND cleared_at IS NULL',
      [req.user.id]
    );
    return success(res, null);
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.get('/favorites', userAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT question_id FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    return success(res, { questionIds: rows.map((r) => r.question_id) });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.post('/favorites/:questionId', userAuth, async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId, 10);
    if (!Number.isFinite(questionId)) return fail(res, 40001, 'questionId 无效');

    const [existing] = await pool.query(
      'SELECT id FROM user_favorites WHERE user_id = ? AND question_id = ?',
      [req.user.id, questionId]
    );

    if (existing.length) {
      await pool.query('DELETE FROM user_favorites WHERE user_id = ? AND question_id = ?', [
        req.user.id,
        questionId,
      ]);
      return success(res, { favorited: false });
    }

    await pool.query('INSERT INTO user_favorites (user_id, question_id) VALUES (?, ?)', [
      req.user.id,
      questionId,
    ]);
    return success(res, { favorited: true });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

const MODE_LABELS = {
  chapter: '章节练习',
  special: '专项刷题',
  mock: '模拟考试',
  wrong: '错题重做',
  favorite: '收藏练习',
};

function parseOptionalId(value) {
  const id = parseInt(value, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

router.get('/records', userAuth, async (req, res) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM quiz_records WHERE user_id = ?',
      [req.user.id]
    );
    const [rows] = await pool.query(
      'SELECT id, mode, category_id, subcategory_id, total_count, correct_count, score, duration_sec, created_at FROM quiz_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, pageSize, offset]
    );

    return success(
      res,
      paginate(
        rows.map((row) => ({
          id: row.id,
          mode: row.mode,
          modeLabel: MODE_LABELS[row.mode] || row.mode,
          categoryId: row.category_id,
          subcategoryId: row.subcategory_id,
          total: row.total_count,
          correct: row.correct_count,
          score: row.score,
          duration: row.duration_sec,
          time: row.created_at,
          createdAt: row.created_at,
        })),
        page,
        pageSize,
        total
      )
    );
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.post('/records', userAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const mode = String(body.mode || '').trim();
    const totalCount = parseInt(body.totalCount, 10);
    const correctCount = parseInt(body.correctCount, 10);
    const score = parseInt(body.score, 10);
    const durationSec = body.durationSec == null ? null : parseInt(body.durationSec, 10);

    if (!mode) return fail(res, 40001, 'mode 不能为空');
    if (!Number.isFinite(totalCount) || totalCount < 0) return fail(res, 40001, 'totalCount 无效');
    if (!Number.isFinite(correctCount) || correctCount < 0) return fail(res, 40001, 'correctCount 无效');

    const categoryId = parseOptionalId(body.categoryId);
    const subcategoryId = parseOptionalId(body.subcategoryId);
    const safeScore = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0;
    const safeDuration = Number.isFinite(durationSec) && durationSec >= 0 ? durationSec : null;

    const [result] = await pool.query(
      `INSERT INTO quiz_records (user_id, mode, category_id, subcategory_id, total_count, correct_count, score, duration_sec)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, mode.slice(0, 16), categoryId, subcategoryId, totalCount, correctCount, safeScore, safeDuration]
    );

    if (mode === 'mock') {
      await pool.query(
        `INSERT INTO user_stats (user_id, exam_high_score, last_study_date)
         VALUES (?, ?, CURDATE())
         ON DUPLICATE KEY UPDATE exam_high_score = GREATEST(exam_high_score, VALUES(exam_high_score))`,
        [req.user.id, safeScore]
      );
    }

    return success(res, { id: result.insertId });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

module.exports = router;
