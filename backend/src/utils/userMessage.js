const pool = require('../db/pool');

async function insertUserMessage(userId, title, content, conn = pool) {
  if (!userId || !title) return null;
  const [result] = await conn.query(
    'INSERT INTO user_messages (user_id, title, content) VALUES (?, ?, ?)',
    [userId, title, content || '']
  );
  return result.insertId;
}

async function ensureWelcomeMessages(userId, conn = pool) {
  const [[{ cnt }]] = await conn.query(
    'SELECT COUNT(*) AS cnt FROM user_messages WHERE user_id = ?',
    [userId]
  );
  if (cnt > 0) return;
  await conn.query(
    'INSERT INTO user_messages (user_id, title, content) VALUES (?, ?, ?), (?, ?, ?)',
    [
      userId,
      '欢迎使用圣博培训',
      '感谢您选择圣博培训，开始您的学习之旅吧！登录后刷题、课程进度和消息都会保存在云端，换机不丢失。',
      userId,
      '免费题库已开放',
      '基础章节题库免费开放，快去刷题吧！付费章节购买课程或开通会员后即可解锁。',
    ]
  );
}

function maskPhone(phone) {
  const s = String(phone || '').replace(/\s/g, '');
  if (!s) return '';
  if (s.length < 7) return '****';
  return `${s.slice(0, 3)}****${s.slice(-4)}`;
}

module.exports = { insertUserMessage, ensureWelcomeMessages, maskPhone };
