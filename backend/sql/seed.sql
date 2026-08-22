USE shengbo_training;

-- 管理员角色
INSERT INTO admin_roles (id, code, name, permissions) VALUES
(1, 'super_admin', '超级管理员', '["*"]'),
(2, 'operator', '运营', '["questions","products","content","users:read"]'),
(3, 'finance', '财务', '["orders","refund","users:read"]');

-- 默认管理员（密码由 init-db.js 脚本设置为 admin123）
INSERT INTO admins (id, username, password_hash, real_name, role_id, status) VALUES
(1, 'admin', 'PLACEHOLDER', '系统管理员', 1, 1);

-- 题库大类与子章节（对齐 V1 data/questions.js）
INSERT INTO quiz_categories (id, category_code, name, icon, description, sort_order, status) VALUES
(1, 'nanny', '育儿嫂专项', '👶', '新生儿护理、辅食制作、早教启蒙、产妇护理', 1, 1),
(2, 'housekeeper', '保姆家政专项', '🏠', '家居保洁、衣物收纳、烹饪礼仪、老人陪护', 2, 1);

INSERT INTO quiz_subcategories (id, category_id, sub_code, name, is_free, sort_order, status) VALUES
(101, 1, 'n_newborn', '新生儿护理', 1, 1, 1),
(102, 1, 'n_food', '辅食制作', 0, 2, 1),
(103, 1, 'n_edu', '早教启蒙', 0, 3, 1),
(104, 1, 'n_maternal', '产妇护理', 0, 4, 1),
(105, 1, 'n_emergency', '应急处理', 0, 5, 1),
(201, 2, 'h_clean', '家居保洁', 1, 1, 1),
(202, 2, 'h_storage', '衣物收纳', 0, 2, 1),
(203, 2, 'h_cook', '家常菜烹饪', 0, 3, 1),
(204, 2, 'h_safety', '家电安全', 0, 4, 1),
(205, 2, 'h_etiquette', '礼仪规范', 0, 5, 1);

-- 示例商品（对齐 V1 data/products.js，金额单位：分）
INSERT INTO products (id, product_code, type, title, cover_color, price, original_price, description, benefits, target_audience, membership_level, membership_days, sales_count, rating, sort_order, status) VALUES
(1, 'p1', 'course', '育儿嫂护理专项课', '#E8F2FF', 19900, 39900,
 '系统学习新生儿护理、辅食制作、产妇护理核心技能，配套专项题库无限刷。',
 '["解锁育儿嫂专项题库", "6门精品课程", "错题本+收藏功能", "永久有效"]',
 '在职育儿嫂、意向从业者', NULL, NULL, 1280, 4.9, 1, 1),
(2, 'p2', 'course', '保姆家政专项课', '#EDE8FF', 14900, 29900,
 '家居保洁、衣物收纳、烹饪礼仪全掌握，助力保姆快速上岗。',
 '["解锁保姆家政专项题库", "4门精品课程", "模拟考试3套", "永久有效"]',
 '居家保姆、家政从业者', NULL, NULL, 960, 4.8, 2, 1),
(3, 'p3', 'package', '育儿嫂全科系统班', '#E8FAF0', 59900, 129900,
 '育儿嫂岗位全品类课程+全套题库+模拟真题，一站式备考。',
 '["育儿嫂全部题库", "全部育儿嫂课程", "10套模拟试卷", "考前押题卷"]',
 '零基础学员、考证备考', NULL, NULL, 520, 4.9, 3, 1),
(4, 'p4', 'package', '保姆全科系统班', '#FFF4E8', 49900, 99900,
 '保姆家政全技能覆盖，从保洁到烹饪，从礼仪到安全。',
 '["保姆全部题库", "全部保姆课程", "8套模拟试卷", "永久有效"]',
 '家政新手、技能提升', NULL, NULL, 380, 4.7, 4, 1),
(5, 'p5', 'membership', '月度会员', '#FFF0E8', 4900, 9900,
 '30天全站题库+全部课程畅学，适合短期备考。',
 '["全站题库解锁", "全部课程学习", "模拟考试不限次", "30天有效"]',
 '短期备考学员', 'month', 30, 2100, 4.8, 5, 1),
(6, 'p6', 'membership', '年度会员', '#E8F2FF', 29900, 59900,
 '365天全站资源畅学，性价比之选。',
 '["全站题库解锁", "全部课程学习", "模拟考试不限次", "365天有效", "专属学习报告"]',
 '长期学习学员', 'year', 365, 860, 4.9, 6, 1),
(7, 'p7', 'membership', '终身会员', '#F5F5F7', 99900, 199900,
 '一次购买，终身畅学全站所有资源。',
 '["全站永久解锁", "新课上架免费学", "新题更新免费刷", "优先客服支持"]',
 '深度学习者', 'lifetime', -1, 320, 5.0, 7, 1),
(8, 'p8', 'exam', '育儿嫂考前押题卷', '#FFEBEE', 3900, 7900,
 '精选高频考点押题，还原真实考试场景。',
 '["5套押题试卷", "详细答案解析", "考点归纳手册", "永久有效"]',
 '即将考证学员', NULL, NULL, 680, 4.7, 8, 1);

-- 商品权益配置
INSERT INTO product_entitlements (product_id, entitlement_type, resource_id) VALUES
(1, 'category', 'nanny'),
(1, 'course', 'c1'), (1, 'course', 'c2'), (1, 'course', 'c4'), (1, 'course', 'c6'),
(2, 'category', 'housekeeper'),
(2, 'course', 'c3'),
(3, 'category', 'nanny'),
(3, 'course', 'c1'), (3, 'course', 'c2'), (3, 'course', 'c4'), (3, 'course', 'c5'), (3, 'course', 'c6'),
(4, 'category', 'housekeeper'),
(4, 'course', 'c3'), (4, 'course', 'c5'),
(5, 'all', NULL),
(6, 'all', NULL),
(7, 'all', NULL),
(8, 'exam_pack', 'nanny_exam');

-- 系统配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
('pay.refund_days', '7', '支付后允许退款天数'),
('app.name', '圣博培训', '应用名称');

-- 示例首页内容
INSERT INTO banners (title, image_url, link_url, sort_order, status) VALUES
('圣博培训 · 专业家政考证', '/images/banner1.jpg', '/pages/shop/shop', 1, 1);

INSERT INTO announcements (title, content, sort_order, status) VALUES
('2026年春季班招生开启', '育儿嫂、保姆全科系统班火热招生中，欢迎咨询报名。', 1, 1);

-- 课程（对齐 V1 data/courses.js，金额单位：分）
INSERT INTO courses (course_code, title, category_code, level, duration_text, price, description, outline, sort_order, status) VALUES
('c1', '育儿嫂上岗基础课', 'nanny', '入门', '6 课时', 0, '了解育儿嫂岗位职责、作息安排、与雇主沟通的基本原则。', '["岗位职责与职业素养","一日流程与交接","沟通话术与边界","常见问题处理"]', 1, 1),
('c2', '0-1 岁婴儿日常护理', 'care', '核心',  '8 课时', 9900, '掌握喂养、换尿布、睡眠安抚、脐部护理等日常操作要点。', '["科学喂养","清洁与沐浴","睡眠与安抚","皮肤与脐部护理"]', 2, 1),
('c3', '保姆家政技能精讲', 'housekeeper', '入门', '5 课时', 0, '覆盖居家清洁、衣物护理、厨房卫生与收纳整理的标准做法。', '["清洁标准","衣物护理","厨房卫生","收纳整理"]', 3, 1),
('c4', '辅食添加与营养搭配', 'food', '进阶', '7 课时', 7900, '按月龄学习辅食添加顺序、过敏观察与常见食谱。', '["添加原则","月龄对照","过敏识别","常见食谱"]', 4, 1),
('c5', '婴幼儿安全与急救', 'safety', '必修', '4 课时', 5900, '识别噎食、烫伤、跌倒等高风险场景，学习应急处理步骤。', '["居家安全排查","噎食急救","烫伤处理","何时送医"]', 5, 1),
('c6', '与雇主高效沟通', 'nanny', '进阶', '3 课时', 4900, '学习需求确认、日常汇报、冲突化解，建立信任关系。', '["需求对齐","日报写法","边界表达","冲突化解"]', 6, 1);

INSERT INTO course_lessons (course_id, title, duration_text, content_type, sort_order, status)
SELECT id, '岗位职责与职业素养', '15分钟', 'article', 1, 1 FROM courses WHERE course_code = 'c1'
UNION ALL SELECT id, '一日流程与交接', '20分钟', 'article', 2, 1 FROM courses WHERE course_code = 'c1'
UNION ALL SELECT id, '沟通话术与边界', '18分钟', 'article', 3, 1 FROM courses WHERE course_code = 'c1'
UNION ALL SELECT id, '常见问题处理', '22分钟', 'article', 4, 1 FROM courses WHERE course_code = 'c1'
UNION ALL SELECT id, '科学喂养', '25分钟', 'article', 1, 1 FROM courses WHERE course_code = 'c2'
UNION ALL SELECT id, '清洁与沐浴', '20分钟', 'article', 2, 1 FROM courses WHERE course_code = 'c2'
UNION ALL SELECT id, '睡眠与安抚', '18分钟', 'article', 3, 1 FROM courses WHERE course_code = 'c2'
UNION ALL SELECT id, '皮肤与脐部护理', '22分钟', 'article', 4, 1 FROM courses WHERE course_code = 'c2'
UNION ALL SELECT id, '清洁标准', '20分钟', 'article', 1, 1 FROM courses WHERE course_code = 'c3'
UNION ALL SELECT id, '衣物护理', '18分钟', 'article', 2, 1 FROM courses WHERE course_code = 'c3'
UNION ALL SELECT id, '厨房卫生', '22分钟', 'article', 3, 1 FROM courses WHERE course_code = 'c3'
UNION ALL SELECT id, '收纳整理', '20分钟', 'article', 4, 1 FROM courses WHERE course_code = 'c3'
UNION ALL SELECT id, '添加原则', '20分钟', 'article', 1, 1 FROM courses WHERE course_code = 'c4'
UNION ALL SELECT id, '月龄对照', '25分钟', 'article', 2, 1 FROM courses WHERE course_code = 'c4'
UNION ALL SELECT id, '过敏识别', '18分钟', 'article', 3, 1 FROM courses WHERE course_code = 'c4'
UNION ALL SELECT id, '常见食谱', '30分钟', 'article', 4, 1 FROM courses WHERE course_code = 'c4'
UNION ALL SELECT id, '居家安全排查', '18分钟', 'article', 1, 1 FROM courses WHERE course_code = 'c5'
UNION ALL SELECT id, '噎食急救', '25分钟', 'article', 2, 1 FROM courses WHERE course_code = 'c5'
UNION ALL SELECT id, '烫伤处理', '15分钟', 'article', 3, 1 FROM courses WHERE course_code = 'c5'
UNION ALL SELECT id, '何时送医', '12分钟', 'article', 4, 1 FROM courses WHERE course_code = 'c5'
UNION ALL SELECT id, '需求对齐', '15分钟', 'article', 1, 1 FROM courses WHERE course_code = 'c6'
UNION ALL SELECT id, '日报写法', '12分钟', 'article', 2, 1 FROM courses WHERE course_code = 'c6'
UNION ALL SELECT id, '边界表达', '18分钟', 'article', 3, 1 FROM courses WHERE course_code = 'c6'
UNION ALL SELECT id, '冲突化解', '20分钟', 'article', 4, 1 FROM courses WHERE course_code = 'c6';
