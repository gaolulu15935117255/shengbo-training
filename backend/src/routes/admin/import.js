const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../../db/pool');
const config = require('../../config');
const { parseImportFile } = require('../../utils/importParser');
const { success, fail } = require('../../utils/response');

const router = express.Router();

const previewStore = new Map();

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function resolveSubcategoryId(categoryId, subcategoryName, defaultSubcategoryId) {
  if (subcategoryName && categoryId) {
    const [rows] = await pool.query(
      'SELECT id FROM quiz_subcategories WHERE category_id = ? AND name = ? LIMIT 1',
      [categoryId, subcategoryName]
    );
    if (rows.length) return rows[0].id;
  }
  return defaultSubcategoryId || null;
}

async function getNextQuestionCode(conn) {
  const [rows] = await conn.query(
    "SELECT question_code FROM questions WHERE question_code LIKE 'q%' ORDER BY id DESC LIMIT 1"
  );
  if (!rows.length) return 1;
  const last = rows[0].question_code;
  return (parseInt(last.replace(/\D/g, ''), 10) || 0) + 1;
}

router.post('/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return fail(res, 40001, '请上传文件');
    }

    const ext = path.extname(req.file.originalname).slice(1).toLowerCase();
    const buffer = fs.readFileSync(req.file.path);
    const items = parseImportFile(buffer, ext);

    const previewId = `preview_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    previewStore.set(previewId, {
      adminId: req.admin.id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: ext,
      categoryId: req.body.categoryId ? parseInt(req.body.categoryId, 10) : null,
      subcategoryId: req.body.subcategoryId ? parseInt(req.body.subcategoryId, 10) : null,
      defaultIsFree: req.body.defaultIsFree === 'true' || req.body.defaultIsFree === true,
      items,
      createdAt: Date.now(),
    });

    setTimeout(() => previewStore.delete(previewId), 3600000);

    const validRows = items.filter((i) => i.valid).length;
    return success(res, {
      previewId,
      totalRows: items.length,
      validRows,
      invalidRows: items.length - validRows,
      items: items.map(({ rowNo, valid, parsed, errors }) => ({ rowNo, valid, parsed, errors })),
    });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.post('/confirm', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { previewId, categoryId, subcategoryId, defaultIsFree, skipInvalidRows, corrections } = req.body || {};
    if (!previewId) {
      return fail(res, 40001, 'previewId 不能为空');
    }

    const preview = previewStore.get(previewId);
    if (!preview) {
      return fail(res, 40400, '预览数据不存在或已过期');
    }
    if (preview.adminId !== req.admin.id) {
      return fail(res, 40300, '无权限访问该资源');
    }

    const finalCategoryId = categoryId || preview.categoryId;
    const finalSubcategoryId = subcategoryId || preview.subcategoryId;
    const finalIsFree = defaultIsFree !== undefined ? defaultIsFree : preview.defaultIsFree;

    if (!finalCategoryId || !finalSubcategoryId) {
      return fail(res, 40001, 'categoryId 和 subcategoryId 不能为空');
    }

    const correctionMap = new Map((corrections || []).map((c) => [c.rowNo, c.parsed]));

    await conn.beginTransaction();

    const [jobResult] = await conn.query(
      `INSERT INTO import_jobs (admin_id, file_name, file_url, file_type, category_id, subcategory_id, default_is_free, status, total_rows)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'importing', ?)`,
      [
        req.admin.id,
        preview.fileName,
        preview.filePath,
        preview.fileType,
        finalCategoryId,
        finalSubcategoryId,
        finalIsFree ? 1 : 0,
        preview.items.length,
      ]
    );
    const importJobId = jobResult.insertId;

    let successRows = 0;
    let failRows = 0;
    let nextCodeNum = await getNextQuestionCode(conn);

    for (const item of preview.items) {
      let parsed = item.valid ? item.parsed : null;
      if (correctionMap.has(item.rowNo)) {
        parsed = correctionMap.get(item.rowNo);
      } else if (!item.valid && skipInvalidRows) {
        await conn.query(
          `INSERT INTO import_job_items (import_job_id, row_no, raw_data, status, error_message)
           VALUES (?, ?, ?, 'skipped', ?)`,
          [importJobId, item.rowNo, JSON.stringify(item.raw), item.errors.join('; ')]
        );
        failRows += 1;
        continue;
      }

      if (!parsed) {
        await conn.query(
          `INSERT INTO import_job_items (import_job_id, row_no, raw_data, status, error_message)
           VALUES (?, ?, ?, 'fail', ?)`,
          [importJobId, item.rowNo, JSON.stringify(item.raw), item.errors.join('; ')]
        );
        failRows += 1;
        continue;
      }

      const targetSubId = await resolveSubcategoryId(finalCategoryId, parsed.subcategoryName, finalSubcategoryId);
      if (!targetSubId) {
        await conn.query(
          `INSERT INTO import_job_items (import_job_id, row_no, raw_data, parsed_data, status, error_message)
           VALUES (?, ?, ?, ?, 'fail', ?)`,
          [importJobId, item.rowNo, JSON.stringify(item.raw), JSON.stringify(parsed), '无法匹配子章节']
        );
        failRows += 1;
        continue;
      }

      const questionCode = `q${String(nextCodeNum).padStart(3, '0')}`;
      nextCodeNum += 1;
      try {
        const [qResult] = await conn.query(
          `INSERT INTO questions (question_code, category_id, subcategory_id, type, stem, options, answer, analysis, knowledge, is_free, status, import_job_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)`,
          [
            questionCode,
            finalCategoryId,
            targetSubId,
            parsed.type,
            parsed.stem,
            JSON.stringify(parsed.options),
            JSON.stringify(parsed.answer),
            parsed.analysis,
            parsed.knowledge,
            finalIsFree ? 1 : 0,
            importJobId,
          ]
        );

        await conn.query(
          `INSERT INTO import_job_items (import_job_id, row_no, raw_data, parsed_data, question_id, status)
           VALUES (?, ?, ?, ?, ?, 'success')`,
          [importJobId, item.rowNo, JSON.stringify(item.raw), JSON.stringify(parsed), qResult.insertId]
        );
        successRows += 1;
      } catch (e) {
        await conn.query(
          `INSERT INTO import_job_items (import_job_id, row_no, raw_data, parsed_data, status, error_message)
           VALUES (?, ?, ?, ?, 'fail', ?)`,
          [importJobId, item.rowNo, JSON.stringify(item.raw), JSON.stringify(parsed), e.message]
        );
        failRows += 1;
      }
    }

    let status = 'success';
    if (failRows > 0 && successRows > 0) status = 'partial';
    else if (failRows > 0 && successRows === 0) status = 'fail';

    await conn.query(
      `UPDATE import_jobs SET status = ?, success_rows = ?, fail_rows = ?, finished_at = NOW() WHERE id = ?`,
      [status, successRows, failRows, importJobId]
    );

    await conn.commit();
    previewStore.delete(previewId);

    return success(res, { importJobId, successRows, failRows, status });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  } finally {
    conn.release();
  }
});

router.get('/jobs/:importJobId', async (req, res) => {
  try {
    const jobId = req.params.importJobId;
    const [jobs] = await pool.query('SELECT * FROM import_jobs WHERE id = ?', [jobId]);
    if (!jobs.length) {
      return fail(res, 40400, '导入任务不存在');
    }

    const job = jobs[0];
    const [items] = await pool.query(
      'SELECT * FROM import_job_items WHERE import_job_id = ? ORDER BY row_no',
      [jobId]
    );

    return success(res, {
      id: job.id,
      fileName: job.file_name,
      status: job.status,
      totalRows: job.total_rows,
      successRows: job.success_rows,
      failRows: job.fail_rows,
      errorSummary: job.error_summary,
      createdAt: job.created_at,
      finishedAt: job.finished_at,
      items: items.map((i) => ({
        rowNo: i.row_no,
        status: i.status,
        errorMessage: i.error_message,
        questionId: i.question_id,
        parsed: i.parsed_data ? (typeof i.parsed_data === 'string' ? JSON.parse(i.parsed_data) : i.parsed_data) : null,
      })),
    });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

module.exports = router;
