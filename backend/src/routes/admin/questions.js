const express = require('express');
const pool = require('../../db/pool');
const { success, fail, paginate, parsePagination } = require('../../utils/response');

const router = express.Router();

function mapQuestion(row) {
  return {
    id: row.id,
    questionCode: row.question_code,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    type: row.type,
    stem: row.stem,
    options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
    answer: typeof row.answer === 'string' ? JSON.parse(row.answer) : row.answer,
    analysis: row.analysis,
    knowledge: row.knowledge,
    isFree: !!row.is_free,
    difficulty: row.difficulty,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/', async (req, res) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const { keyword, categoryId, subcategoryId, status, type } = req.query;
    const conditions = ['q.deleted_at IS NULL'];
    const params = [];

    if (keyword) {
      conditions.push('(q.stem LIKE ? OR q.question_code LIKE ? OR q.knowledge LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }
    if (categoryId) {
      conditions.push('q.category_id = ?');
      params.push(categoryId);
    }
    if (subcategoryId) {
      conditions.push('q.subcategory_id = ?');
      params.push(subcategoryId);
    }
    if (status) {
      conditions.push('q.status = ?');
      params.push(status);
    }
    if (type) {
      conditions.push('q.type = ?');
      params.push(type);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM questions q ${where}`,
      params
    );
    const [rows] = await pool.query(
      `SELECT q.* FROM questions q ${where} ORDER BY q.id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    return success(res, paginate(rows.map(mapQuestion), page, pageSize, total));
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const required = ['questionCode', 'categoryId', 'subcategoryId', 'type', 'stem', 'options', 'answer'];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || body[key] === '') {
        return fail(res, 40001, `参数错误：${key} 不能为空`);
      }
    }

    const [result] = await pool.query(
      `INSERT INTO questions (question_code, category_id, subcategory_id, type, stem, options, answer, analysis, knowledge, is_free, difficulty, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.questionCode,
        body.categoryId,
        body.subcategoryId,
        body.type,
        body.stem,
        JSON.stringify(body.options),
        JSON.stringify(body.answer),
        body.analysis || null,
        body.knowledge || null,
        body.isFree ? 1 : 0,
        body.difficulty || 1,
        body.status || 'draft',
      ]
    );

    const [rows] = await pool.query('SELECT * FROM questions WHERE id = ?', [result.insertId]);
    return success(res, mapQuestion(rows[0]), '创建成功');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return fail(res, 40900, '题目编码已存在');
    }
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.put('/batch-status', async (req, res) => {
  try {
    const { questionIds, status } = req.body || {};
    if (!Array.isArray(questionIds) || !questionIds.length) {
      return fail(res, 40001, 'questionIds 不能为空');
    }
    if (!['draft', 'published', 'offline'].includes(status)) {
      return fail(res, 40001, 'status 无效');
    }
    const placeholders = questionIds.map(() => '?').join(',');
    const [result] = await pool.query(
      `UPDATE questions SET status = ? WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      [status, ...questionIds]
    );
    return success(res, { updated: result.affectedRows });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};
    const fields = [];
    const params = [];

    const mapping = {
      questionCode: 'question_code',
      categoryId: 'category_id',
      subcategoryId: 'subcategory_id',
      type: 'type',
      stem: 'stem',
      analysis: 'analysis',
      knowledge: 'knowledge',
      difficulty: 'difficulty',
      status: 'status',
    };

    for (const [key, col] of Object.entries(mapping)) {
      if (body[key] !== undefined) {
        fields.push(`${col} = ?`);
        params.push(body[key]);
      }
    }
    if (body.options !== undefined) {
      fields.push('options = ?');
      params.push(JSON.stringify(body.options));
    }
    if (body.answer !== undefined) {
      fields.push('answer = ?');
      params.push(JSON.stringify(body.answer));
    }
    if (body.isFree !== undefined) {
      fields.push('is_free = ?');
      params.push(body.isFree ? 1 : 0);
    }

    if (!fields.length) {
      return fail(res, 40001, '没有可更新的字段');
    }

    params.push(id);
    const [result] = await pool.query(
      `UPDATE questions SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      params
    );
    if (!result.affectedRows) {
      return fail(res, 40400, '题目不存在');
    }

    const [rows] = await pool.query('SELECT * FROM questions WHERE id = ?', [id]);
    return success(res, mapQuestion(rows[0]));
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE questions SET deleted_at = NOW(), status = ? WHERE id = ? AND deleted_at IS NULL',
      ['offline', req.params.id]
    );
    if (!result.affectedRows) {
      return fail(res, 40400, '题目不存在');
    }
    return success(res, null, '删除成功');
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

module.exports = router;
