-- 圣博培训 V2.0 完整 DDL（28 张表）
-- MySQL 8.0+ / utf8mb4_unicode_ci

CREATE DATABASE IF NOT EXISTS shengbo_training
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE shengbo_training;

-- ============================================================
-- 系统模块
-- ============================================================

CREATE TABLE admin_roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(32) NOT NULL COMMENT 'super_admin/operator/finance',
  name VARCHAR(64) NOT NULL,
  permissions JSON DEFAULT NULL COMMENT '权限码数组',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(128) NOT NULL,
  real_name VARCHAR(64) DEFAULT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0禁用',
  last_login_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_username (username),
  KEY idx_role_id (role_id),
  CONSTRAINT fk_admins_role FOREIGN KEY (role_id) REFERENCES admin_roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE system_configs (
  config_key VARCHAR(64) NOT NULL,
  config_value TEXT DEFAULT NULL,
  description VARCHAR(256) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 用户模块
-- ============================================================

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL,
  unionid VARCHAR(64) DEFAULT NULL,
  nick_name VARCHAR(64) DEFAULT NULL,
  avatar_url VARCHAR(512) DEFAULT NULL,
  gender TINYINT DEFAULT 0 COMMENT '0未知 1男 2女',
  phone VARCHAR(20) DEFAULT NULL,
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1正常 0禁用',
  last_login_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_openid (openid),
  KEY idx_status (status),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(128) NOT NULL,
  expires_at DATETIME NOT NULL,
  client_type VARCHAR(16) NOT NULL DEFAULT 'miniapp',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_token (token),
  KEY idx_user_id (user_id),
  KEY idx_expires_at (expires_at),
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_memberships (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  level VARCHAR(16) NOT NULL COMMENT 'month/year/lifetime',
  source_product_id BIGINT UNSIGNED DEFAULT NULL,
  source_order_id BIGINT UNSIGNED DEFAULT NULL,
  started_at DATETIME NOT NULL,
  expire_at DATETIME DEFAULT NULL COMMENT 'NULL=终身',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1有效 0过期 2取消',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_status (user_id, status),
  KEY idx_expire_at (expire_at),
  CONSTRAINT fk_user_memberships_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_entitlements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  entitlement_type VARCHAR(32) NOT NULL COMMENT 'category/course/exam_pack/all',
  resource_id VARCHAR(64) DEFAULT NULL,
  source_product_id BIGINT UNSIGNED DEFAULT NULL,
  source_order_id BIGINT UNSIGNED DEFAULT NULL,
  expire_at DATETIME DEFAULT NULL,
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1有效 0失效',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_type (user_id, entitlement_type, status),
  UNIQUE KEY uk_user_resource (user_id, entitlement_type, resource_id, source_order_id),
  CONSTRAINT fk_user_entitlements_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_stats (
  user_id BIGINT UNSIGNED NOT NULL,
  total_answered INT UNSIGNED NOT NULL DEFAULT 0,
  total_correct INT UNSIGNED NOT NULL DEFAULT 0,
  exam_high_score INT UNSIGNED NOT NULL DEFAULT 0,
  study_days INT UNSIGNED NOT NULL DEFAULT 1,
  last_study_date DATE DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_stats_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 商城模块
-- ============================================================

CREATE TABLE products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_code VARCHAR(32) NOT NULL,
  type VARCHAR(16) NOT NULL COMMENT 'course/package/membership/exam',
  title VARCHAR(128) NOT NULL,
  cover_url VARCHAR(512) DEFAULT NULL,
  cover_color VARCHAR(16) DEFAULT NULL,
  price INT UNSIGNED NOT NULL COMMENT '售价（分）',
  original_price INT UNSIGNED NOT NULL COMMENT '原价（分）',
  description TEXT DEFAULT NULL,
  benefits JSON DEFAULT NULL,
  target_audience VARCHAR(128) DEFAULT NULL,
  membership_level VARCHAR(16) DEFAULT NULL COMMENT 'month/year/lifetime',
  membership_days INT DEFAULT NULL COMMENT '-1=终身',
  sales_count INT UNSIGNED NOT NULL DEFAULT 0,
  rating DECIMAL(3,1) NOT NULL DEFAULT 5.0,
  sort_order INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1上架 0下架',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_product_code (product_code),
  KEY idx_type_status (type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_entitlements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  entitlement_type VARCHAR(32) NOT NULL,
  resource_id VARCHAR(64) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_product_id (product_id),
  CONSTRAINT fk_product_entitlements_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no VARCHAR(32) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  product_title VARCHAR(128) NOT NULL,
  amount INT UNSIGNED NOT NULL COMMENT '应付金额（分）',
  status VARCHAR(16) NOT NULL DEFAULT 'pending' COMMENT 'pending/paid/closed/refunded',
  pay_expire_at DATETIME DEFAULT NULL,
  paid_at DATETIME DEFAULT NULL,
  closed_at DATETIME DEFAULT NULL,
  refunded_at DATETIME DEFAULT NULL,
  remark VARCHAR(256) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_order_no (order_no),
  KEY idx_user_status (user_id, status),
  KEY idx_created_at (created_at),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  pay_channel VARCHAR(16) NOT NULL DEFAULT 'wechat',
  transaction_id VARCHAR(64) DEFAULT NULL,
  prepay_id VARCHAR(64) DEFAULT NULL,
  amount INT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending' COMMENT 'pending/success/fail',
  notify_raw JSON DEFAULT NULL,
  paid_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_transaction_id (transaction_id),
  KEY idx_order_id (order_id),
  CONSTRAINT fk_order_payments_order FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT fk_order_payments_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refund_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  refund_no VARCHAR(32) NOT NULL,
  amount INT UNSIGNED NOT NULL,
  reason VARCHAR(256) DEFAULT NULL,
  operator_id BIGINT UNSIGNED DEFAULT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending' COMMENT 'pending/success/fail',
  refunded_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_refund_no (refund_no),
  KEY idx_order_id (order_id),
  CONSTRAINT fk_refund_records_order FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT fk_refund_records_operator FOREIGN KEY (operator_id) REFERENCES admins (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 内容模块
-- ============================================================

CREATE TABLE courses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_code VARCHAR(32) NOT NULL,
  title VARCHAR(128) NOT NULL,
  category_code VARCHAR(32) NOT NULL,
  level VARCHAR(16) DEFAULT NULL,
  duration_text VARCHAR(32) DEFAULT NULL,
  price INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '分，0=免费',
  description TEXT DEFAULT NULL,
  outline JSON DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_course_code (course_code),
  KEY idx_category_status (category_code, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_lessons (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(128) NOT NULL,
  duration_text VARCHAR(16) DEFAULT NULL,
  content_type VARCHAR(16) NOT NULL DEFAULT 'article' COMMENT 'article/video',
  content_url VARCHAR(512) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_course_id (course_id),
  CONSTRAINT fk_course_lessons_course FOREIGN KEY (course_id) REFERENCES courses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_courses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  progress TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0~100',
  learned_lessons JSON DEFAULT NULL,
  started_at DATETIME DEFAULT NULL,
  completed_at DATETIME DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_course (user_id, course_id),
  CONSTRAINT fk_user_courses_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_user_courses_course FOREIGN KEY (course_id) REFERENCES courses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE banners (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(128) NOT NULL,
  image_url VARCHAR(512) DEFAULT NULL,
  link_url VARCHAR(512) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  start_at DATETIME DEFAULT NULL,
  end_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE announcements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(128) NOT NULL,
  content TEXT DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  start_at DATETIME DEFAULT NULL,
  end_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(128) NOT NULL,
  content TEXT DEFAULT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_read (user_id, is_read),
  CONSTRAINT fk_user_messages_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 题库模块
-- ============================================================

CREATE TABLE quiz_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_code VARCHAR(32) NOT NULL,
  name VARCHAR(64) NOT NULL,
  icon VARCHAR(16) DEFAULT NULL,
  description VARCHAR(256) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_category_code (category_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_subcategories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NOT NULL,
  sub_code VARCHAR(32) NOT NULL,
  name VARCHAR(64) NOT NULL,
  is_free TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_category_sub (category_id, sub_code),
  CONSTRAINT fk_quiz_subcategories_category FOREIGN KEY (category_id) REFERENCES quiz_categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE import_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id BIGINT UNSIGNED NOT NULL,
  file_name VARCHAR(256) NOT NULL,
  file_url VARCHAR(512) NOT NULL DEFAULT '',
  file_type VARCHAR(16) NOT NULL COMMENT 'xlsx/docx/txt',
  category_id BIGINT UNSIGNED DEFAULT NULL,
  subcategory_id BIGINT UNSIGNED DEFAULT NULL,
  default_is_free TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'pending' COMMENT 'pending/preview/importing/success/partial/fail',
  total_rows INT NOT NULL DEFAULT 0,
  success_rows INT NOT NULL DEFAULT 0,
  fail_rows INT NOT NULL DEFAULT 0,
  error_summary TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_admin_id (admin_id),
  KEY idx_status (status),
  CONSTRAINT fk_import_jobs_admin FOREIGN KEY (admin_id) REFERENCES admins (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  question_code VARCHAR(32) NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  subcategory_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(16) NOT NULL COMMENT 'single/multiple/judge',
  stem TEXT NOT NULL,
  options JSON NOT NULL,
  answer JSON NOT NULL,
  analysis TEXT DEFAULT NULL,
  knowledge VARCHAR(128) DEFAULT NULL,
  is_free TINYINT(1) NOT NULL DEFAULT 0,
  difficulty TINYINT DEFAULT 1,
  status VARCHAR(16) NOT NULL DEFAULT 'draft' COMMENT 'draft/published/offline',
  import_job_id BIGINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_question_code (question_code),
  KEY idx_sub_status (subcategory_id, status),
  KEY idx_category_status (category_id, status),
  FULLTEXT KEY idx_stem (stem),
  CONSTRAINT fk_questions_category FOREIGN KEY (category_id) REFERENCES quiz_categories (id),
  CONSTRAINT fk_questions_subcategory FOREIGN KEY (subcategory_id) REFERENCES quiz_subcategories (id),
  CONSTRAINT fk_questions_import_job FOREIGN KEY (import_job_id) REFERENCES import_jobs (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE import_job_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  import_job_id BIGINT UNSIGNED NOT NULL,
  row_no INT NOT NULL,
  raw_data JSON DEFAULT NULL,
  parsed_data JSON DEFAULT NULL,
  question_id BIGINT UNSIGNED DEFAULT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'fail' COMMENT 'success/fail/skipped',
  error_message VARCHAR(512) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_import_job_id (import_job_id),
  CONSTRAINT fk_import_job_items_job FOREIGN KEY (import_job_id) REFERENCES import_jobs (id),
  CONSTRAINT fk_import_job_items_question FOREIGN KEY (question_id) REFERENCES questions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_wrong_questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  wrong_count INT UNSIGNED NOT NULL DEFAULT 1,
  last_wrong_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cleared_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_question (user_id, question_id),
  KEY idx_user_id (user_id),
  CONSTRAINT fk_user_wrong_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_user_wrong_question FOREIGN KEY (question_id) REFERENCES questions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_favorites (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_question (user_id, question_id),
  CONSTRAINT fk_user_favorites_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_user_favorites_question FOREIGN KEY (question_id) REFERENCES questions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  mode VARCHAR(16) NOT NULL COMMENT 'chapter/special/mock/wrong/favorite',
  category_id BIGINT UNSIGNED DEFAULT NULL,
  subcategory_id BIGINT UNSIGNED DEFAULT NULL,
  total_count INT UNSIGNED NOT NULL,
  correct_count INT UNSIGNED NOT NULL,
  score INT UNSIGNED NOT NULL COMMENT '0~100',
  duration_sec INT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_created (user_id, created_at DESC),
  CONSTRAINT fk_quiz_records_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_answer_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  record_id BIGINT UNSIGNED DEFAULT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  user_answer JSON NOT NULL,
  is_correct TINYINT(1) NOT NULL,
  answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_question (user_id, question_id),
  KEY idx_record_id (record_id),
  CONSTRAINT fk_quiz_answer_logs_record FOREIGN KEY (record_id) REFERENCES quiz_records (id),
  CONSTRAINT fk_quiz_answer_logs_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_quiz_answer_logs_question FOREIGN KEY (question_id) REFERENCES questions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
