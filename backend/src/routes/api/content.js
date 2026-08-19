const express = require('express');
const pool = require('../../db/pool');
const { success, fail } = require('../../utils/response');

const router = express.Router();

router.get('/home', async (_req, res) => {
  try {
    const [banners] = await pool.query(
      'SELECT id, title, image_url, link_url FROM banners WHERE status = 1 ORDER BY sort_order ASC LIMIT 5'
    );
    const [announcements] = await pool.query(
      'SELECT id, title, created_at FROM announcements WHERE status = 1 ORDER BY sort_order ASC LIMIT 5'
    );
    const [hotProducts] = await pool.query(
      'SELECT id, product_code, title, cover_color, price, original_price, sales_count, rating FROM products WHERE status = 1 AND deleted_at IS NULL ORDER BY sales_count DESC LIMIT 4'
    );
    const [courses] = await pool.query(
      'SELECT id, course_code, title, category_code, level, duration_text, price FROM courses WHERE status = 1 ORDER BY sort_order ASC LIMIT 4'
    );

    return success(res, {
      banners: banners.map((b) => ({
        id: b.id,
        title: b.title,
        imageUrl: b.image_url,
        linkUrl: b.link_url,
      })),
      stats: [
        { value: '8600+', label: '累计学员' },
        { value: '12000+', label: '题库题目' },
        { value: '98%', label: '学员好评' },
      ],
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        date: a.created_at ? a.created_at.toISOString().slice(0, 10) : null,
      })),
      hotProducts: hotProducts.map((p) => ({
        id: p.id,
        productCode: p.product_code,
        title: p.title,
        coverColor: p.cover_color,
        price: p.price,
        priceYuan: (p.price / 100).toFixed(2),
        salesCount: p.sales_count,
        rating: parseFloat(p.rating),
      })),
      featuredCourses: courses.map((c) => ({
        id: c.id,
        courseCode: c.course_code,
        title: c.title,
        category: c.category_code,
        level: c.level,
        durationText: c.duration_text,
        price: c.price,
        free: c.price === 0,
      })),
    });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

router.get('/announcements/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM announcements WHERE id = ? AND status = 1', [req.params.id]);
    if (!rows.length) return fail(res, 40400, '公告不存在');
    const a = rows[0];
    return success(res, {
      id: a.id,
      title: a.title,
      content: a.content,
      createdAt: a.created_at,
    });
  } catch (err) {
    console.error(err);
    return fail(res, 50000, '服务器内部错误', null, 500);
  }
});

module.exports = router;
