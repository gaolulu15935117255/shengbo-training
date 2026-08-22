-- 线上已有库：写入 6 门课程及课时（可重复执行）
USE shengbo_training;

INSERT INTO courses (course_code, title, category_code, level, duration_text, price, description, outline, sort_order, status) VALUES
('c1', '育儿嫂上岗基础课', 'nanny', '入门', '6 课时', 0, '了解育儿嫂岗位职责、作息安排、与雇主沟通的基本原则。', '["岗位职责与职业素养","一日流程与交接","沟通话术与边界","常见问题处理"]', 1, 1),
('c2', '0-1 岁婴儿日常护理', 'care', '核心', '8 课时', 9900, '掌握喂养、换尿布、睡眠安抚、脐部护理等日常操作要点。', '["科学喂养","清洁与沐浴","睡眠与安抚","皮肤与脐部护理"]', 2, 1),
('c3', '保姆家政技能精讲', 'housekeeper', '入门', '5 课时', 0, '覆盖居家清洁、衣物护理、厨房卫生与收纳整理的标准做法。', '["清洁标准","衣物护理","厨房卫生","收纳整理"]', 3, 1),
('c4', '辅食添加与营养搭配', 'food', '进阶', '7 课时', 7900, '按月龄学习辅食添加顺序、过敏观察与常见食谱。', '["添加原则","月龄对照","过敏识别","常见食谱"]', 4, 1),
('c5', '婴幼儿安全与急救', 'safety', '必修', '4 课时', 5900, '识别噎食、烫伤、跌倒等高风险场景，学习应急处理步骤。', '["居家安全排查","噎食急救","烫伤处理","何时送医"]', 5, 1),
('c6', '与雇主高效沟通', 'nanny', '进阶', '3 课时', 4900, '学习需求确认、日常汇报、冲突化解，建立信任关系。', '["需求对齐","日报写法","边界表达","冲突化解"]', 6, 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  category_code = VALUES(category_code),
  level = VALUES(level),
  duration_text = VALUES(duration_text),
  price = VALUES(price),
  description = VALUES(description),
  outline = VALUES(outline),
  sort_order = VALUES(sort_order),
  status = 1;

DELETE cl FROM course_lessons cl
JOIN courses c ON c.id = cl.course_id
WHERE c.course_code IN ('c1', 'c2', 'c3', 'c4', 'c5', 'c6');

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
