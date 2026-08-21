-- 修复登录后立刻 401：JWT 约 200 字符，原 token VARCHAR(128) 会被截断
ALTER TABLE user_sessions
  MODIFY COLUMN token VARCHAR(512) NOT NULL;
