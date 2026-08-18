const quizCategories = [
  {
    id: "nanny",
    name: "育儿嫂专项",
    icon: "👶",
    desc: "新生儿护理、辅食制作、早教启蒙、产妇护理",
    subcategories: [
      { id: "n_newborn", name: "新生儿护理", free: true },
      { id: "n_food", name: "辅食制作", free: false },
      { id: "n_edu", name: "早教启蒙", free: false },
      { id: "n_maternal", name: "产妇护理", free: false },
      { id: "n_emergency", name: "应急处理", free: false }
    ]
  },
  {
    id: "housekeeper",
    name: "保姆家政专项",
    icon: "🏠",
    desc: "家居保洁、衣物收纳、烹饪礼仪、老人陪护",
    subcategories: [
      { id: "h_clean", name: "家居保洁", free: true },
      { id: "h_storage", name: "衣物收纳", free: false },
      { id: "h_cook", name: "家常菜烹饪", free: false },
      { id: "h_safety", name: "家电安全", free: false },
      { id: "h_etiquette", name: "礼仪规范", free: false }
    ]
  }
]

const practiceModes = [
  { id: "chapter", name: "章节练习", desc: "按知识点逐节刷题", icon: "📖" },
  { id: "special", name: "专项刷题", desc: "针对薄弱知识点", icon: "🎯" },
  { id: "mock", name: "模拟考试", desc: "限时全真模拟", icon: "📝" },
  { id: "wrong", name: "错题重做", desc: "巩固易错题目", icon: "❌" },
  { id: "favorite", name: "收藏题目", desc: "重点题随时复习", icon: "⭐" },
  { id: "records", name: "答题记录", desc: "查看历史成绩", icon: "📊" }
]

const questions = [
  {
    id: "q1",
    category: "nanny",
    subcategory: "n_newborn",
    type: "single",
    stem: "新生儿每天睡眠时间大约是多少？",
    options: ["8-10小时", "12-14小时", "16-18小时", "20-22小时"],
    answer: [2],
    analysis: "新生儿每天睡眠时间约16-18小时，呈多次短睡模式，这是正常的发育需求。",
    knowledge: "新生儿护理·睡眠",
    free: true
  },
  {
    id: "q2",
    category: "nanny",
    subcategory: "n_newborn",
    type: "judge",
    stem: "新生儿脐带未脱落前，可以用盆浴方式洗澡。",
    options: ["正确", "错误"],
    answer: [1],
    analysis: "脐带未脱落前应使用擦浴，避免盆浴导致脐部浸水引发感染。",
    knowledge: "新生儿护理·清洁",
    free: true
  },
  {
    id: "q3",
    category: "nanny",
    subcategory: "n_newborn",
    type: "single",
    stem: "给新生儿换尿布的正确顺序是？",
    options: [
      "先擦前端再擦后端",
      "先擦后端再擦前端",
      "随意擦拭即可",
      "只擦可见区域"
    ],
    answer: [1],
    analysis: "女婴应从前向后擦，避免将粪便带入会阴部引发感染。",
    knowledge: "新生儿护理·清洁",
    free: true
  },
  {
    id: "q4",
    category: "nanny",
    subcategory: "n_food",
    type: "single",
    stem: "婴儿添加辅食的适宜月龄是？",
    options: ["3-4个月", "4-5个月", "6个月左右", "8-9个月"],
    answer: [2],
    analysis: "WHO建议纯母乳喂养至6个月，6个月左右开始添加辅食，过早添加可能增加过敏风险。",
    knowledge: "辅食制作·添加原则",
    free: false
  },
  {
    id: "q5",
    category: "nanny",
    subcategory: "n_food",
    type: "multiple",
    stem: "以下哪些属于常见的高过敏风险食物？（多选）",
    options: ["鸡蛋", "牛奶", "花生", "大米"],
    answer: [0, 1, 2],
    analysis: "鸡蛋、牛奶、花生是常见过敏原，添加时应逐一尝试并观察3-5天。",
    knowledge: "辅食制作·过敏识别",
    free: false
  },
  {
    id: "q6",
    category: "nanny",
    subcategory: "n_emergency",
    type: "single",
    stem: "婴儿发生噎食时，首先应采取的措施是？",
    options: [
      "拍背法",
      "海姆立克急救法（婴儿版）",
      "立即送医不管",
      "喂水冲下"
    ],
    answer: [1],
    analysis: "婴儿噎食应使用海姆立克婴儿版急救法，切勿喂水，以免加重堵塞。",
    knowledge: "应急处理·噎食",
    free: false
  },
  {
    id: "q7",
    category: "nanny",
    subcategory: "n_maternal",
    type: "judge",
    stem: "产后产妇应完全卧床，不能有任何活动。",
    options: ["正确", "错误"],
    answer: [1],
    analysis: "产后应尽早适当活动，促进恶露排出和子宫恢复，但避免剧烈运动。",
    knowledge: "产妇护理·恢复",
    free: false
  },
  {
    id: "q8",
    category: "nanny",
    subcategory: "n_edu",
    type: "single",
    stem: "0-1岁婴儿早期教育最重要的是？",
    options: ["识字教学", "感官刺激与亲子互动", "背诵古诗", "观看电视"],
    answer: [1],
    analysis: "0-1岁应注重感官刺激、语言交流和亲子互动，而非知识灌输。",
    knowledge: "早教启蒙·原则",
    free: false
  },
  {
    id: "q9",
    category: "housekeeper",
    subcategory: "h_clean",
    type: "single",
    stem: "厨房油污清洁应优先使用？",
    options: ["强酸清洁剂", "专用去油污剂", "普通清水", "84消毒液"],
    answer: [1],
    analysis: "厨房油污应使用专用去油污剂，强酸或84消毒液可能损坏台面或残留有害物。",
    knowledge: "家居保洁·厨房",
    free: true
  },
  {
    id: "q10",
    category: "housekeeper",
    subcategory: "h_clean",
    type: "judge",
    stem: "清洁卫生间时，洁厕灵和84消毒液可以混合使用以增强效果。",
    options: ["正确", "错误"],
    answer: [1],
    analysis: "洁厕灵（含盐酸）与84消毒液（含次氯酸钠）混合会产生有毒氯气，严禁混用。",
    knowledge: "家居保洁·安全",
    free: true
  },
  {
    id: "q11",
    category: "housekeeper",
    subcategory: "h_storage",
    type: "single",
    stem: "换季衣物收纳前最重要的步骤是？",
    options: ["直接折叠入箱", "清洗晾干后再收纳", "喷洒大量香水", "与当季衣物混放"],
    answer: [1],
    analysis: "换季衣物需清洗晾干后再收纳，防止虫蛀和霉变。",
    knowledge: "衣物收纳·换季",
    free: false
  },
  {
    id: "q12",
    category: "housekeeper",
    subcategory: "h_cook",
    type: "multiple",
    stem: "以下哪些属于安全烹饪原则？（多选）",
    options: ["生熟砧板分开", "肉类完全煮熟", "剩菜反复加热多次", "保持厨房通风"],
    answer: [0, 1, 3],
    analysis: "生熟分开、完全煮熟、保持通风是基本安全原则，剩菜不宜反复加热超过一次。",
    knowledge: "烹饪·安全",
    free: false
  },
  {
    id: "q13",
    category: "housekeeper",
    subcategory: "h_safety",
    type: "single",
    stem: "使用电热水壶时应注意？",
    options: [
      "水装至满溢",
      "无水干烧",
      "不超过最大水位线",
      "放在易燃物旁边"
    ],
    answer: [2],
    analysis: "电热水壶加水不应超过最大水位线，避免沸腾时溢出造成烫伤或短路。",
    knowledge: "家电安全·厨房电器",
    free: false
  },
  {
    id: "q14",
    category: "housekeeper",
    subcategory: "h_etiquette",
    type: "judge",
    stem: "在雇主家中，可以随意进入任何房间无需敲门。",
    options: ["正确", "错误"],
    answer: [1],
    analysis: "进入雇主私人空间前应敲门示意，尊重隐私是基本职业礼仪。",
    knowledge: "礼仪规范·隐私",
    free: false
  },
  {
    id: "q15",
    category: "nanny",
    subcategory: "n_newborn",
    type: "single",
    stem: "新生儿黄疸出现的时间通常是？",
    options: ["出生后24小时内", "出生后2-3天", "出生后2周", "出生后1个月"],
    answer: [1],
    analysis: "生理性黄疸多在出生后2-3天出现，7-10天消退。24小时内出现需警惕病理性黄疸。",
    knowledge: "新生儿护理·黄疸",
    free: true
  },
  {
    id: "q16",
    category: "housekeeper",
    subcategory: "h_clean",
    type: "single",
    stem: "地板清洁的正确顺序是？",
    options: [
      "先湿拖再干拖",
      "先扫/吸尘再湿拖",
      "直接湿拖",
      "只用干拖把"
    ],
    answer: [1],
    analysis: "应先扫或吸尘去除颗粒物，再湿拖，避免颗粒物划伤地板。",
    knowledge: "家居保洁·地面",
    free: true
  }
]

function getCategoryById(id) {
  return quizCategories.find((item) => item.id === id) || null
}

function getQuestionsBySubcategory(subcategoryId) {
  return questions.filter((item) => item.subcategory === subcategoryId)
}

function getQuestionsByCategory(categoryId) {
  return questions.filter((item) => item.category === categoryId)
}

function getQuestionById(id) {
  return questions.find((item) => item.id === id) || null
}

function getFreeQuestions() {
  return questions.filter((item) => item.free)
}

function getMockExamQuestions(categoryId, count = 10) {
  const pool = getQuestionsByCategory(categoryId)
  const shuffled = pool.slice().sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

function getTypeLabel(type) {
  const map = { single: "单选题", multiple: "多选题", judge: "判断题" }
  return map[type] || type
}

module.exports = {
  quizCategories,
  practiceModes,
  questions,
  getCategoryById,
  getQuestionsBySubcategory,
  getQuestionsByCategory,
  getQuestionById,
  getFreeQuestions,
  getMockExamQuestions,
  getTypeLabel
}
