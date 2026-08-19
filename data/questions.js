const extraQuestions = require("./questions-extra")

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

const baseQuestions = [
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
  },
  {
    id: "q17",
    category: "nanny",
    subcategory: "n_newborn",
    type: "single",
    stem: "正常足月新生儿的腋下体温范围约为？",
    options: ["35.0-36.0℃", "36.0-37.5℃", "37.5-38.5℃", "38.5-39.5℃"],
    answer: [1],
    analysis: "新生儿正常腋下体温约36.0-37.5℃。超过37.5℃需警惕发热，应及时告知家长并观察。",
    knowledge: "新生儿护理·体温",
    free: true
  },
  {
    id: "q18",
    category: "nanny",
    subcategory: "n_newborn",
    type: "single",
    stem: "新生儿脐带护理时，消毒应如何进行？",
    options: [
      "从脐窝向内涂抹香油保湿",
      "从脐带根部向外螺旋消毒",
      "洗澡后不用擦干脐部",
      "有分泌物时直接涂爽身粉"
    ],
    answer: [1],
    analysis: "脐带消毒应从根部向外螺旋擦拭，每日1-2次，保持干燥。未脱落前避免盆浴，防止感染。",
    knowledge: "新生儿护理·脐带",
    free: true
  },
  {
    id: "q19",
    category: "nanny",
    subcategory: "n_newborn",
    type: "single",
    stem: "给新生儿洗澡，适宜的水温是？",
    options: ["30-32℃", "34-36℃", "38-40℃", "42-44℃"],
    answer: [2],
    analysis: "婴儿洗澡水温应控制在38-40℃，可先放凉水再放热水试温，避免烫伤或受凉。",
    knowledge: "新生儿护理·洗澡",
    free: true
  },
  {
    id: "q20",
    category: "nanny",
    subcategory: "n_newborn",
    type: "single",
    stem: "新生儿正常每分钟呼吸次数约为？",
    options: ["20-30次", "30-40次", "40-60次", "60-80次"],
    answer: [2],
    analysis: "新生儿呼吸中枢尚未发育完善，正常呼吸约40-60次/分钟，节律可不规则，需与窘迫表现区分。",
    knowledge: "新生儿护理·观察",
    free: true
  },
  {
    id: "q21",
    category: "nanny",
    subcategory: "n_newborn",
    type: "judge",
    stem: "新生儿出生后应立即喂糖水，以预防低血糖。",
    options: ["正确", "错误"],
    answer: [1],
    analysis: "健康足月儿应优先母乳喂养，无需喂糖水。喂糖水可能影响吸吮意愿并增加肠胃负担。",
    knowledge: "新生儿护理·喂养",
    free: true
  },
  {
    id: "q22",
    category: "nanny",
    subcategory: "n_newborn",
    type: "judge",
    stem: "预防新生儿红臀，便后应温水清洗并彻底晾干后再包尿布。",
    options: ["正确", "错误"],
    answer: [0],
    analysis: "红臀预防关键是勤换尿布、便后温水清洗、彻底晾干，必要时涂护臀膏并适当暴露臀部通风。",
    knowledge: "新生儿护理·皮肤",
    free: true
  },
  {
    id: "q23",
    category: "nanny",
    subcategory: "n_newborn",
    type: "single",
    stem: "婴儿每次喂奶后出现轻微溢奶，正确的处理是？",
    options: [
      "立即让其平躺休息",
      "竖抱轻拍后背帮助打嗝",
      "马上喂水冲下",
      "用力摇晃婴儿"
    ],
    answer: [1],
    analysis: "溢奶后应竖抱轻拍后背帮助排气，清理口鼻残留奶液，避免平躺导致呛咳。",
    knowledge: "新生儿护理·溢奶",
    free: true
  },
  {
    id: "q24",
    category: "nanny",
    subcategory: "n_newborn",
    type: "single",
    stem: "新生儿室内适宜温度一般应保持在？",
    options: ["18-20℃", "22-26℃", "28-30℃", "30-32℃"],
    answer: [1],
    analysis: "新生儿体温调节能力弱，室内宜保持22-26℃，注意保暖但避免过度包裹。",
    knowledge: "新生儿护理·环境",
    free: true
  },
  {
    id: "q25",
    category: "nanny",
    subcategory: "n_newborn",
    type: "judge",
    stem: "1岁以内婴儿可以使用蜂蜜调水饮用。",
    options: ["正确", "错误"],
    answer: [1],
    analysis: "1岁以内婴儿不宜吃蜂蜜，因可能含有肉毒杆菌芽孢，存在肉毒中毒风险。",
    knowledge: "新生儿护理·喂养禁忌",
    free: true
  },
  {
    id: "q26",
    category: "nanny",
    subcategory: "n_newborn",
    type: "multiple",
    stem: "新生儿日常护理中，需要及时告知家长的情况包括？（多选）",
    options: ["体温超过37.5℃", "连续24小时不排便", "拒奶或频繁呕吐", "嗜睡、叫不醒或抽搐"],
    answer: [0, 1, 2, 3],
    analysis: "发热、长时间不排便、拒奶呕吐及精神反应异常均可能提示疾病，应及时反馈家长并建议就医。",
    knowledge: "新生儿护理·异常观察",
    free: true
  },
  {
    id: "q27",
    category: "nanny",
    subcategory: "n_food",
    type: "single",
    stem: "6个月婴儿开始添加辅食时，优先推荐的第一口辅食是？",
    options: ["果汁", "高铁米粉", "全蛋", "鱼肉泥"],
    answer: [1],
    analysis: "6月龄起优先添加高铁米粉等富铁食物，以满足快速生长对铁的需求，再逐步添加其他种类。",
    knowledge: "辅食制作·第一口辅食",
    free: false
  },
  {
    id: "q28",
    category: "nanny",
    subcategory: "n_food",
    type: "judge",
    stem: "给1岁以内婴儿制作辅食，不需要额外添加盐、糖等调味品。",
    options: ["正确", "错误"],
    answer: [0],
    analysis: "婴幼儿肾脏负担能力有限，1岁内辅食不应额外添加盐、糖及调味品，原味即可。",
    knowledge: "辅食制作·调味原则",
    free: false
  },
  {
    id: "q29",
    category: "nanny",
    subcategory: "n_food",
    type: "single",
    stem: "添加新辅食时，正确的做法是？",
    options: [
      "一次添加多种新食物",
      "每次只添加一种，观察3-5天",
      "过敏后立刻再次尝试",
      "无需记录添加情况"
    ],
    answer: [1],
    analysis: "新辅食应逐一添加，每种观察3-5天无异常再添加下一种，便于排查过敏原。",
    knowledge: "辅食制作·添加方法",
    free: false
  },
  {
    id: "q30",
    category: "nanny",
    subcategory: "n_food",
    type: "judge",
    stem: "冲调婴儿配方奶时，应先加水后加奶粉。",
    options: ["正确", "错误"],
    answer: [0],
    analysis: "冲调配方奶应先加温水至所需刻度，再按说明加入奶粉，避免浓度过高或过低。",
    knowledge: "辅食制作·配方奶",
    free: false
  },
  {
    id: "q31",
    category: "nanny",
    subcategory: "n_food",
    type: "single",
    stem: "冲调配方奶的适宜水温约为？",
    options: ["30-35℃", "38-40℃", "45-50℃", "55-60℃"],
    answer: [1],
    analysis: "配方奶冲调水温约38-40℃为宜，过热会破坏营养，过凉影响溶解和消化。",
    knowledge: "辅食制作·配方奶",
    free: false
  },
  {
    id: "q32",
    category: "nanny",
    subcategory: "n_newborn",
    type: "multiple",
    stem: "给婴幼儿洗澡的正确操作包括？（多选）",
    options: [
      "提前备好衣物和毛巾",
      "先放凉水再放热水试温",
      "洗澡后及时擦干褶皱部位",
      "可在饭后立即洗澡"
    ],
    answer: [0, 1, 2],
    analysis: "洗澡前应备齐物品，先凉后热调试水温，洗后擦干褶皱防受凉。不宜在喂奶后立即洗澡。",
    knowledge: "新生儿护理·洗澡",
    free: false
  },
  {
    id: "q33",
    category: "nanny",
    subcategory: "n_edu",
    type: "single",
    stem: "2个月左右婴儿适合进行的粗大动作练习是？",
    options: ["独立行走", "练习抬头", "跳绳", "写字"],
    answer: [1],
    analysis: "2月龄可在俯卧位练习抬头，6月龄左右练坐，10月龄左右练站，应遵循发育规律。",
    knowledge: "早教启蒙·粗大动作",
    free: false
  },
  {
    id: "q34",
    category: "nanny",
    subcategory: "n_edu",
    type: "judge",
    stem: "给婴儿做抚触，应选择在两次喂奶中间、情绪平稳时进行。",
    options: ["正确", "错误"],
    answer: [0],
    analysis: "抚触宜在宝宝清醒、情绪稳定时进行，避开刚喂奶后1小时内，防止吐奶。",
    knowledge: "早教启蒙·抚触",
    free: false
  },
  {
    id: "q35",
    category: "nanny",
    subcategory: "n_edu",
    type: "judge",
    stem: "婴儿睡眠时床上可放置柔软枕头和毛绒玩具以增加安全感。",
    options: ["正确", "错误"],
    answer: [1],
    analysis: "1岁内婴儿睡眠应少用枕头，床上避免软物、毛绒玩具，防止遮挡口鼻导致窒息。",
    knowledge: "早教启蒙·睡眠安全",
    free: false
  },
  {
    id: "q36",
    category: "nanny",
    subcategory: "n_edu",
    type: "single",
    stem: "3个月婴儿可以开始练习的动作是？",
    options: ["翻身体", "骑自行车", "游泳500米", "独立吃饭"],
    answer: [0],
    analysis: "3月龄可在看护下练习翻身，育儿嫂应在旁保护，防止跌落。",
    knowledge: "早教启蒙·粗大动作",
    free: false
  },
  {
    id: "q37",
    category: "nanny",
    subcategory: "n_edu",
    type: "judge",
    stem: "育儿嫂应每天记录婴儿的饮食、睡眠、大小便情况并及时反馈家长。",
    options: ["正确", "错误"],
    answer: [0],
    analysis: "日常记录有助于家长掌握宝宝状态，也是专业育儿嫂的基本工作习惯。",
    knowledge: "早教启蒙·沟通记录",
    free: false
  },
  {
    id: "q38",
    category: "nanny",
    subcategory: "n_maternal",
    type: "single",
    stem: "顺产产妇产后一般多久可以下床轻微活动？",
    options: ["立即剧烈运动", "6-12小时左右", "1个月后", "整个月子都卧床"],
    answer: [1],
    analysis: "顺产产妇通常产后6-12小时可在协助下轻微活动，有助于恶露排出和恢复，但避免劳累。",
    knowledge: "产妇护理·活动",
    free: false
  },
  {
    id: "q39",
    category: "nanny",
    subcategory: "n_maternal",
    type: "single",
    stem: "产妇产后血性恶露持续时间一般为？",
    options: ["1-2天", "3-5天", "1-2周", "1-2个月"],
    answer: [1],
    analysis: "血性恶露一般持续3-5天，之后转为浆液性、白色恶露，约4-6周干净。",
    knowledge: "产妇护理·恶露",
    free: false
  },
  {
    id: "q40",
    category: "nanny",
    subcategory: "n_maternal",
    type: "judge",
    stem: "哺乳期产妇可以饮酒以促进血液循环。",
    options: ["正确", "错误"],
    answer: [1],
    analysis: "酒精可通过乳汁影响婴儿，哺乳期应禁酒，并避免回奶食物如大量韭菜、麦芽等。",
    knowledge: "产妇护理·饮食",
    free: false
  },
  {
    id: "q41",
    category: "nanny",
    subcategory: "n_maternal",
    type: "single",
    stem: "产妇产后涨奶、堵奶时，首选的处理方式是？",
    options: [
      "立即停止哺乳",
      "热敷配合正确哺乳或挤奶",
      "用力暴力按摩",
      "自行服用不明药物"
    ],
    answer: [1],
    analysis: "涨奶堵奶可通过热敷、正确含接、及时排空乳汁缓解，严重时告知家长就医。",
    knowledge: "产妇护理·哺乳",
    free: false
  },
  {
    id: "q42",
    category: "nanny",
    subcategory: "n_maternal",
    type: "judge",
    stem: "产后产妇可以正常刷牙洗脸，保持口腔和个人卫生。",
    options: ["正确", "错误"],
    answer: [0],
    analysis: "产后应维持基本个人卫生，用温水刷牙洗脸，有利于身体恢复和预防感染。",
    knowledge: "产妇护理·卫生",
    free: false
  },
  {
    id: "q43",
    category: "nanny",
    subcategory: "n_emergency",
    type: "single",
    stem: "婴儿发烧超过38.5℃，正确的处理是？",
    options: [
      "自行加大成人退烧药剂量",
      "用酒精擦拭全身降温",
      "告知家长并遵医嘱处理",
      "厚被子捂汗"
    ],
    answer: [2],
    analysis: "婴儿高热应及时告知家长，在医生指导下使用婴幼儿专用退烧药，不可自行用药或酒精擦浴。",
    knowledge: "应急处理·发热",
    free: false
  },
  {
    id: "q44",
    category: "nanny",
    subcategory: "n_emergency",
    type: "judge",
    stem: "婴儿发烧时，可用酒精擦拭身体进行物理降温。",
    options: ["正确", "错误"],
    answer: [1],
    analysis: "婴儿皮肤娇嫩，酒精可经皮吸收导致中毒，物理降温应使用温水擦拭额、颈、腋下等部位。",
    knowledge: "应急处理·发热",
    free: false
  },
  {
    id: "q45",
    category: "nanny",
    subcategory: "n_emergency",
    type: "single",
    stem: "婴幼儿发生轻度呛奶，正确的体位引流操作是？",
    options: [
      "仰卧平躺拍背",
      "俯卧在腿上，头低脚高，拍肩胛骨",
      "竖抱用力挤压腹部",
      "侧躺剧烈摇晃"
    ],
    answer: [1],
    analysis: "轻度呛奶可将婴儿俯卧在手臂或腿上，头低脚高，轻拍肩胛骨之间，促使奶液排出。",
    knowledge: "应急处理·呛奶",
    free: false
  },
  {
    id: "q46",
    category: "nanny",
    subcategory: "n_emergency",
    type: "multiple",
    stem: "以下哪些情况需要立即带婴儿就医？（多选）",
    options: ["频繁呕吐伴精神萎靡", "呼吸急促或发绀", "抽搐或叫不醒", "轻微单次溢奶"],
    answer: [0, 1, 2],
    analysis: "频繁呕吐、精神差、呼吸异常、抽搐等均为危险信号，需立即就医；单次轻微溢奶可先观察。",
    knowledge: "应急处理·就医指征",
    free: false
  },
  {
    id: "q47",
    category: "nanny",
    subcategory: "n_emergency",
    type: "judge",
    stem: "幼儿磕碰后出现肿块，应立即热敷促进消肿。",
    options: ["正确", "错误"],
    answer: [1],
    analysis: "磕碰初期应冷敷减轻肿胀，24-48小时后再考虑热敷，立即热敷可能加重出血肿胀。",
    knowledge: "应急处理·外伤",
    free: false
  },
  {
    id: "q48",
    category: "housekeeper",
    subcategory: "h_clean",
    type: "single",
    stem: "清洁玻璃时，正确的做法是？",
    options: [
      "用硬物刮擦去污",
      "先用湿布擦再用干布抛光",
      "直接用强酸清洁",
      "不擦边框只擦中间"
    ],
    answer: [1],
    analysis: "玻璃清洁宜先用湿布去除污渍，再用干布或专用工具抛光，避免硬物刮花。",
    knowledge: "家居保洁·玻璃",
    free: true
  },
  {
    id: "q49",
    category: "housekeeper",
    subcategory: "h_clean",
    type: "judge",
    stem: "厨房清洁应遵循先上后下、先里后外的原则。",
    options: ["正确", "错误"],
    answer: [0],
    analysis: "先清洁高处和内部区域，再清洁低处和外部，避免重复污染，是厨房保洁的基本顺序。",
    knowledge: "家居保洁·流程",
    free: true
  },
  {
    id: "q50",
    category: "housekeeper",
    subcategory: "h_clean",
    type: "single",
    stem: "卫生间清洁完毕后，最重要的收尾步骤是？",
    options: ["保持潮湿封闭", "通风干燥并归位用品", "混合多种清洁剂", "不做任何处理"],
    answer: [1],
    analysis: "卫生间清洁后应通风干燥，将工具和用品归位，减少细菌滋生和滑倒风险。",
    knowledge: "家居保洁·卫生间",
    free: true
  },
  {
    id: "q51",
    category: "housekeeper",
    subcategory: "h_clean",
    type: "multiple",
    stem: "居室日常消毒的正确做法包括？（多选）",
    options: ["餐具煮沸或消毒柜消毒", "定期开窗通风", "84消毒液随意大浓度喷洒", "卫生间重点清洁"],
    answer: [0, 1, 3],
    analysis: "餐具消毒、通风换气、卫生间重点清洁是日常消毒要点，消毒剂应按说明稀释使用。",
    knowledge: "家居保洁·消毒",
    free: true
  },
  {
    id: "q52",
    category: "housekeeper",
    subcategory: "h_storage",
    type: "single",
    stem: "厨房收纳时，生熟食材应如何存放？",
    options: ["混放节省空间", "分开放置，生肉放冰箱下层", "全部放台面", "与生熟无关"],
    answer: [1],
    analysis: "生熟应分开存放，生肉海鲜宜放冰箱下层，防止汁液滴落污染其他食物。",
    knowledge: "衣物收纳·厨房",
    free: false
  },
  {
    id: "q53",
    category: "housekeeper",
    subcategory: "h_storage",
    type: "judge",
    stem: "玄关收纳应遵循常用物品随手可取、不常用物品上置的原则。",
    options: ["正确", "错误"],
    answer: [0],
    analysis: "玄关收纳应方便进出，鞋包等常用物放低处，季节性物品可放高处，保持通道畅通。",
    knowledge: "衣物收纳·玄关",
    free: false
  },
  {
    id: "q54",
    category: "housekeeper",
    subcategory: "h_storage",
    type: "single",
    stem: "衣柜内衣物收纳，最合理的分类方式是？",
    options: [
      "全部堆在一起",
      "按季节、类型、使用频率分类",
      "只按颜色分类",
      "不需要分类"
    ],
    answer: [1],
    analysis: "衣柜收纳宜按季节、类型和使用频率分类，常穿衣物放在易取位置，提高整理效率。",
    knowledge: "衣物收纳·衣柜",
    free: false
  },
  {
    id: "q55",
    category: "housekeeper",
    subcategory: "h_storage",
    type: "judge",
    stem: "丝绸类衣物洗净后可以直接放在强烈阳光下曝晒。",
    options: ["正确", "错误"],
    answer: [1],
    analysis: "丝绸类织物不耐曝晒，应在阴凉通风处晾干，避免褪色和纤维损伤。",
    knowledge: "衣物收纳·晾晒",
    free: false
  },
  {
    id: "q56",
    category: "housekeeper",
    subcategory: "h_cook",
    type: "single",
    stem: "淘米煮饭时，加水量的一般经验是？",
    options: [
      "水面高出米面约1指节",
      "只要少量水",
      "水越多越好",
      "不需要加水"
    ],
    answer: [0],
    analysis: "煮饭时水面通常高出米面约1指节（或按米种调整），过少夹生，过多软烂。",
    knowledge: "烹饪·主食",
    free: false
  },
  {
    id: "q57",
    category: "housekeeper",
    subcategory: "h_cook",
    type: "judge",
    stem: "蔬菜应先洗后切，以减少营养流失。",
    options: ["正确", "错误"],
    answer: [0],
    analysis: "蔬菜应先整棵清洗再切配，避免切后冲洗导致水溶性维生素流失。",
    knowledge: "烹饪·切配",
    free: false
  },
  {
    id: "q58",
    category: "housekeeper",
    subcategory: "h_cook",
    type: "single",
    stem: "炒制绿叶蔬菜时，为保持色泽和口感应？",
    options: ["长时间大火焖煮", "大火快炒及时出锅", "先泡盐水2小时再炒", "不用洗直接炒"],
    answer: [1],
    analysis: "绿叶菜宜大火快炒、及时出锅，减少维生素破坏，保持脆嫩色泽。",
    knowledge: "烹饪·烹调方法",
    free: false
  },
  {
    id: "q59",
    category: "housekeeper",
    subcategory: "h_cook",
    type: "judge",
    stem: "隔夜剩菜应在充分加热后食用，且不宜反复加热超过一次。",
    options: ["正确", "错误"],
    answer: [0],
    analysis: "剩菜应冷藏保存，食用前彻底加热，且不宜反复加热，以免细菌繁殖和营养劣变。",
    knowledge: "烹饪·食品安全",
    free: false
  },
  {
    id: "q60",
    category: "housekeeper",
    subcategory: "h_cook",
    type: "multiple",
    stem: "选购食品时应注意哪些要点？（多选）",
    options: ["查看生产日期和保质期", "选择正规渠道购买", "只买包装破损的特价品", "肉类需检疫合格"],
    answer: [0, 1, 3],
    analysis: "选购食品应看生产日期、保质期和检疫标识，从正规渠道购买，不购包装破损商品。",
    knowledge: "烹饪·采购",
    free: false
  },
  {
    id: "q61",
    category: "housekeeper",
    subcategory: "h_safety",
    type: "single",
    stem: "使用燃气灶时，发现燃气泄漏首先应？",
    options: ["立即开关电器", "关闭气源并开窗通风", "点火检查", "用水冲洗管道"],
    answer: [1],
    analysis: "燃气泄漏时应立即关闭气源、开窗通风，勿开关电器产生火花，到室外报警。",
    knowledge: "家电安全·燃气",
    free: false
  },
  {
    id: "q62",
    category: "housekeeper",
    subcategory: "h_safety",
    type: "judge",
    stem: "家用电器着火时，应先切断电源再灭火。",
    options: ["正确", "错误"],
    answer: [0],
    analysis: "电器起火应先断电源，再用干粉或二氧化碳灭火器，不可用水扑救带电设备。",
    knowledge: "家电安全·防火",
    free: false
  },
  {
    id: "q63",
    category: "housekeeper",
    subcategory: "h_safety",
    type: "single",
    stem: "洗衣机使用时应注意？",
    options: [
      "超载洗涤节省时间",
      "按容量放入衣物并关好门",
      "洗完后长期不排水",
      "洗涤时打开顶盖操作"
    ],
    answer: [1],
    analysis: "洗衣机应按额定容量放入衣物，门关好后再启动，避免超载损坏机器或漏水。",
    knowledge: "家电安全·洗衣机",
    free: false
  },
  {
    id: "q64",
    category: "housekeeper",
    subcategory: "h_safety",
    type: "multiple",
    stem: "家庭防火的安全措施包括？（多选）",
    options: ["厨房用火不离人", "定期检查燃气软管", "在楼道堆放杂物", "配备灭火器"],
    answer: [0, 1, 3],
    analysis: "用火不离人、检查燃气、配备灭火器材是基本防火措施，楼道不应堆放杂物阻碍逃生。",
    knowledge: "家电安全·防火",
    free: false
  },
  {
    id: "q65",
    category: "housekeeper",
    subcategory: "h_etiquette",
    type: "single",
    stem: "家政服务员接待来访客人时，应提前准备好？",
    options: ["玩具", "茶具或饮水", "雇主私人物品", "医疗用品"],
    answer: [1],
    analysis: "待客前应准备好茶具或饮水，保持整洁，体现专业礼仪。",
    knowledge: "礼仪规范·待客",
    free: false
  },
  {
    id: "q66",
    category: "housekeeper",
    subcategory: "h_etiquette",
    type: "judge",
    stem: "如果孩子犯错，家政服务员可以用吓唬、打骂的方式纠正。",
    options: ["正确", "错误"],
    answer: [1],
    analysis: "不得打骂、吓唬儿童，应耐心引导并及时与雇主沟通，采用科学的教育方式。",
    knowledge: "礼仪规范·儿童相处",
    free: false
  },
  {
    id: "q67",
    category: "housekeeper",
    subcategory: "h_etiquette",
    type: "single",
    stem: "在服务过程中，对雇主家庭信息应如何处理？",
    options: ["随意告诉他人", "严格保密", "发到社交媒体", "仅告诉亲戚"],
    answer: [1],
    analysis: "雇主家庭地址、收入、隐私等信息属于职业保密范围，不得外泄。",
    knowledge: "礼仪规范·保密",
    free: false
  },
  {
    id: "q68",
    category: "housekeeper",
    subcategory: "h_etiquette",
    type: "judge",
    stem: "上户服务时应尊重雇主的生活习惯和宗教信仰。",
    options: ["正确", "错误"],
    answer: [0],
    analysis: "尊重雇主习俗和信仰是基本职业素养，在不违背安全与法律前提下适应家庭习惯。",
    knowledge: "礼仪规范·尊重",
    free: false
  },
  {
    id: "q69",
    category: "nanny",
    subcategory: "n_newborn",
    type: "single",
    stem: "正常足月新生儿的出生体重范围约为？",
    options: ["1500-2000g", "2500-4000g", "4500-5000g", "5000g以上"],
    answer: [1],
    analysis: "足月儿正常出生体重约2500-4000g，低于2500g为低出生体重，需加强观察。",
    knowledge: "新生儿护理·体重",
    free: true
  },
  {
    id: "q70",
    category: "nanny",
    subcategory: "n_newborn",
    type: "single",
    stem: "新生儿脐带残端正常脱落时间一般为？",
    options: ["1-2天", "7-14天", "3-4周", "2个月"],
    answer: [1],
    analysis: "脐带残端一般在出生后7-14天自然脱落，期间保持干燥并每日消毒观察。",
    knowledge: "新生儿护理·脐带",
    free: true
  }
]

const questions = [...baseQuestions, ...extraQuestions]

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
