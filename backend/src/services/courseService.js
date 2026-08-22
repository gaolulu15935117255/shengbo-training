const pool = require('../db/pool');

const CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'nanny', name: '育儿嫂' },
  { id: 'housekeeper', name: '保姆' },
  { id: 'care', name: '婴幼儿护理' },
  { id: 'food', name: '辅食营养' },
  { id: 'safety', name: '安全急救' },
];

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function getAccessContext(userId) {
  const ctx = {
    userId: userId || null,
    membership: false,
    unlockAll: false,
    categories: new Set(),
    courses: new Set(),
  };
  if (!userId) return ctx;

  const [memberships] = await pool.query(
    'SELECT 1 FROM user_memberships WHERE user_id = ? AND status = 1 AND (expire_at IS NULL OR expire_at > NOW()) LIMIT 1',
    [userId]
  );
  ctx.membership = memberships.length > 0;

  const [ents] = await pool.query(
    `SELECT entitlement_type, resource_id FROM user_entitlements
     WHERE user_id = ? AND status = 1 AND (expire_at IS NULL OR expire_at > NOW())`,
    [userId]
  );
  for (const ent of ents) {
    if (ent.entitlement_type === 'all') ctx.unlockAll = true;
    if (ent.entitlement_type === 'category' && ent.resource_id) ctx.categories.add(ent.resource_id);
    if (ent.entitlement_type === 'course' && ent.resource_id) ctx.courses.add(ent.resource_id);
  }
  return ctx;
}

function hasCourseAccess(course, ctx) {
  if (!course) return false;
  if (Number(course.price) === 0) return true;
  if (!ctx || !ctx.userId) return false;
  if (ctx.membership || ctx.unlockAll) return true;
  if (ctx.courses.has(course.course_code)) return true;
  if (ctx.categories.has(course.category_code)) return true;
  return false;
}

function mapCourse(row, extras = {}) {
  const price = Number(row.price) || 0;
  const outline = parseJson(row.outline, []);
  return {
    id: row.id,
    courseCode: row.course_code,
    title: row.title,
    category: row.category_code,
    level: row.level,
    durationText: row.duration_text,
    price,
    priceYuan: (price / 100).toFixed(price % 100 === 0 ? 0 : 2),
    free: price === 0,
    desc: row.description || '',
    outline: Array.isArray(outline) ? outline : [],
    hasAccess: extras.hasAccess === true,
    locked: extras.hasAccess !== true && price > 0,
    learned: !!extras.learned,
    progress: extras.progress || 0,
    learnedLessonIds: extras.learnedLessonIds || [],
  };
}

async function getLessons(courseId) {
  const [rows] = await pool.query(
    'SELECT id, title, duration_text, sort_order FROM course_lessons WHERE course_id = ? AND status = 1 ORDER BY sort_order ASC, id ASC',
    [courseId]
  );
  return rows.map((l) => ({
    id: l.id,
    title: l.title,
    durationText: l.duration_text,
  }));
}

async function getProgressMap(userId, courseIds) {
  const map = new Map();
  if (!userId || !courseIds.length) return map;
  const placeholders = courseIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT course_id, progress, learned_lessons, started_at, completed_at
     FROM user_courses WHERE user_id = ? AND course_id IN (${placeholders})`,
    [userId, ...courseIds]
  );
  for (const row of rows) {
    map.set(row.course_id, {
      progress: row.progress || 0,
      learnedLessonIds: parseJson(row.learned_lessons, []) || [],
      startedAt: row.started_at,
      completedAt: row.completed_at,
    });
  }
  return map;
}

async function upsertProgress(userId, course, { progress, learnedLessonIds } = {}) {
  const lessons = await getLessons(course.id);
  const total = lessons.length || 1;
  const existingMap = await getProgressMap(userId, [course.id]);
  const existing = existingMap.get(course.id) || { progress: 0, learnedLessonIds: [] };

  let ids = Array.isArray(learnedLessonIds) ? learnedLessonIds.map((id) => parseInt(id, 10)).filter(Boolean) : null;
  if (ids) {
    const valid = new Set(lessons.map((l) => l.id));
    ids = [...new Set(ids.filter((id) => valid.has(id)))];
  } else {
    ids = existing.learnedLessonIds || [];
  }

  let nextProgress = existing.progress || 0;
  if (typeof progress === 'number' && Number.isFinite(progress)) {
    nextProgress = Math.max(0, Math.min(100, Math.round(progress)));
  } else if (ids.length) {
    nextProgress = Math.round((ids.length / total) * 100);
  }
  if (ids.length && nextProgress < 1) nextProgress = Math.max(nextProgress, 1);
  const completedAt = nextProgress >= 100 ? new Date() : null;

  await pool.query(
    `INSERT INTO user_courses (user_id, course_id, progress, learned_lessons, started_at, completed_at)
     VALUES (?, ?, ?, ?, NOW(), ?)
     ON DUPLICATE KEY UPDATE
       progress = VALUES(progress),
       learned_lessons = VALUES(learned_lessons),
       started_at = COALESCE(user_courses.started_at, NOW()),
       completed_at = VALUES(completed_at)`,
    [userId, course.id, nextProgress, JSON.stringify(ids), completedAt]
  );

  return {
    progress: nextProgress,
    learnedLessonIds: ids,
    learned: true,
    completed: nextProgress >= 100,
  };
}

module.exports = {
  CATEGORIES,
  parseJson,
  getAccessContext,
  hasCourseAccess,
  mapCourse,
  getLessons,
  getProgressMap,
  upsertProgress,
};
