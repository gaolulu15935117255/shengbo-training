const express = require('express');
const pool = require('../../db/pool');
const { success, fail } = require('../../utils/response');
const { optionalUserAuth } = require('../../middleware/auth');

const router = express.Router();

async function userHasSubcategoryAccess(userId, subcategoryId) {
  if (!userId) return false;

  const [subs] = await pool.query(
    'SELECT s.is_free, s.category_id, c.category_code FROM quiz_subcategories s JOIN quiz_categories c ON c.id = s.category_id WHERE s.id = ?',
    [subcategoryId]
  );
  if (!subs.length) return false;
  if (subs[0].is_free) return true;

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

module.exports = router;
