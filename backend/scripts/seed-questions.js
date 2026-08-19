require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const path = require('path');
const pool = require('../src/db/pool');

async function loadQuestionsModule() {
  const questionsPath = path.join(__dirname, '../../data/questions.js');
  return require(questionsPath);
}

async function buildCategoryMaps(conn) {
  const [categories] = await conn.query('SELECT id, category_code FROM quiz_categories');
  const [subcategories] = await conn.query(
    'SELECT id, category_id, sub_code FROM quiz_subcategories'
  );

  const categoryMap = new Map(categories.map((c) => [c.category_code, c.id]));
  const subMap = new Map();
  for (const s of subcategories) {
    subMap.set(s.sub_code, { id: s.id, categoryId: s.category_id });
  }
  return { categoryMap, subMap };
}

async function main() {
  console.log('正在导入题库...');

  const { questions } = await loadQuestionsModule();
  const conn = await pool.getConnection();

  try {
    const { categoryMap, subMap } = await buildCategoryMaps(conn);
    let inserted = 0;
    let skipped = 0;

    await conn.beginTransaction();

    for (const q of questions) {
      const categoryId = categoryMap.get(q.category);
      const sub = subMap.get(q.subcategory);

      if (!categoryId || !sub) {
        console.warn(`跳过 ${q.id}: 无法匹配分类 ${q.category}/${q.subcategory}`);
        skipped += 1;
        continue;
      }

      const [existing] = await conn.query(
        'SELECT id FROM questions WHERE question_code = ?',
        [q.id]
      );
      if (existing.length) {
        skipped += 1;
        continue;
      }

      await conn.query(
        `INSERT INTO questions (question_code, category_id, subcategory_id, type, stem, options, answer, analysis, knowledge, is_free, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
        [
          q.id,
          categoryId,
          sub.id,
          q.type,
          q.stem,
          JSON.stringify(q.options),
          JSON.stringify(q.answer),
          q.analysis || null,
          q.knowledge || null,
          q.free ? 1 : 0,
        ]
      );
      inserted += 1;
    }

    await conn.commit();
    console.log(`导入完成: 新增 ${inserted} 题, 跳过 ${skipped} 题`);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('导入失败:', err.message);
  process.exit(1);
});
