require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { courses } = require('../../data/courses');
const pool = require('../src/db/pool');

async function main() {
  console.log(`正在写入 ${courses.length} 门课程...`);
  for (let i = 0; i < courses.length; i += 1) {
    const course = courses[i];
    const priceFen = Number(course.price) > 0 ? Math.round(Number(course.price) * 100) : 0;
    await pool.query(
      `INSERT INTO courses
         (course_code, title, category_code, level, duration_text, price, description, outline, sort_order, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         category_code = VALUES(category_code),
         level = VALUES(level),
         duration_text = VALUES(duration_text),
         price = VALUES(price),
         description = VALUES(description),
         outline = VALUES(outline),
         sort_order = VALUES(sort_order),
         status = 1`,
      [
        course.id,
        course.title,
        course.category,
        course.level,
        course.duration,
        priceFen,
        course.desc || '',
        JSON.stringify(course.outline || []),
        i + 1,
      ]
    );

    const [rows] = await pool.query('SELECT id FROM courses WHERE course_code = ?', [course.id]);
    const courseId = rows[0].id;
    await pool.query('DELETE FROM course_lessons WHERE course_id = ?', [courseId]);
    const lessons = course.lessons || [];
    for (let j = 0; j < lessons.length; j += 1) {
      const lesson = lessons[j];
      await pool.query(
        `INSERT INTO course_lessons (course_id, title, duration_text, content_type, sort_order, status)
         VALUES (?, ?, ?, 'article', ?, 1)`,
        [courseId, lesson.title, lesson.duration || '', j + 1]
      );
    }
    console.log(`  ${course.id} ${course.title}（${lessons.length} 课时）`);
  }
  await pool.end();
  console.log('课程种子数据已写入。');
}

main().catch((err) => {
  console.error('写入课程失败:', err);
  process.exit(1);
});
