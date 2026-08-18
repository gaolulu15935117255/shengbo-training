const categories = [
  { id: "all", name: "全部" },
  { id: "nanny", name: "育儿嫂" },
  { id: "housekeeper", name: "保姆" },
  { id: "care", name: "婴幼儿护理" },
  { id: "food", name: "辅食营养" },
  { id: "safety", name: "安全急救" }
]

const courses = [
  {
    id: "c1",
    title: "育儿嫂上岗基础课",
    category: "nanny",
    duration: "6 课时",
    level: "入门",
    price: 0,
    free: true,
    desc: "了解育儿嫂岗位职责、作息安排、与雇主沟通的基本原则。",
    outline: ["岗位职责与职业素养", "一日流程与交接", "沟通话术与边界", "常见问题处理"],
    lessons: [
      { title: "岗位职责与职业素养", duration: "15分钟" },
      { title: "一日流程与交接", duration: "20分钟" },
      { title: "沟通话术与边界", duration: "18分钟" },
      { title: "常见问题处理", duration: "22分钟" }
    ]
  },
  {
    id: "c2",
    title: "0-1 岁婴儿日常护理",
    category: "care",
    duration: "8 课时",
    level: "核心",
    price: 99,
    free: false,
    desc: "掌握喂养、换尿布、睡眠安抚、脐部护理等日常操作要点。",
    outline: ["科学喂养", "清洁与沐浴", "睡眠与安抚", "皮肤与脐部护理"],
    lessons: [
      { title: "科学喂养", duration: "25分钟" },
      { title: "清洁与沐浴", duration: "20分钟" },
      { title: "睡眠与安抚", duration: "18分钟" },
      { title: "皮肤与脐部护理", duration: "22分钟" }
    ]
  },
  {
    id: "c3",
    title: "保姆家政技能精讲",
    category: "housekeeper",
    duration: "5 课时",
    level: "入门",
    price: 0,
    free: true,
    desc: "覆盖居家清洁、衣物护理、厨房卫生与收纳整理的标准做法。",
    outline: ["清洁标准", "衣物护理", "厨房卫生", "收纳整理"],
    lessons: [
      { title: "清洁标准", duration: "20分钟" },
      { title: "衣物护理", duration: "18分钟" },
      { title: "厨房卫生", duration: "22分钟" },
      { title: "收纳整理", duration: "20分钟" }
    ]
  },
  {
    id: "c4",
    title: "辅食添加与营养搭配",
    category: "food",
    duration: "7 课时",
    level: "进阶",
    price: 79,
    free: false,
    desc: "按月龄学习辅食添加顺序、过敏观察与常见食谱。",
    outline: ["添加原则", "月龄对照", "过敏识别", "常见食谱"],
    lessons: [
      { title: "添加原则", duration: "20分钟" },
      { title: "月龄对照", duration: "25分钟" },
      { title: "过敏识别", duration: "18分钟" },
      { title: "常见食谱", duration: "30分钟" }
    ]
  },
  {
    id: "c5",
    title: "婴幼儿安全与急救",
    category: "safety",
    duration: "4 课时",
    level: "必修",
    price: 59,
    free: false,
    desc: "识别噎食、烫伤、跌倒等高风险场景，学习应急处理步骤。",
    outline: ["居家安全排查", "噎食急救", "烫伤处理", "何时送医"],
    lessons: [
      { title: "居家安全排查", duration: "18分钟" },
      { title: "噎食急救", duration: "25分钟" },
      { title: "烫伤处理", duration: "15分钟" },
      { title: "何时送医", duration: "12分钟" }
    ]
  },
  {
    id: "c6",
    title: "与雇主高效沟通",
    category: "nanny",
    duration: "3 课时",
    level: "进阶",
    price: 49,
    free: false,
    desc: "学习需求确认、日常汇报、冲突化解，建立信任关系。",
    outline: ["需求对齐", "日报写法", "边界表达", "冲突化解"],
    lessons: [
      { title: "需求对齐", duration: "15分钟" },
      { title: "日报写法", duration: "12分钟" },
      { title: "边界表达", duration: "18分钟" },
      { title: "冲突化解", duration: "20分钟" }
    ]
  }
]

function getCourseById(id) {
  return courses.find((item) => item.id === id) || null
}

function getCoursesByCategory(categoryId) {
  if (!categoryId || categoryId === "all") {
    return courses
  }
  return courses.filter((item) => item.category === categoryId)
}

function getFeaturedCourses() {
  return courses.filter((item) => item.level === "核心" || item.level === "必修").slice(0, 4)
}

module.exports = {
  categories,
  courses,
  getCourseById,
  getCoursesByCategory,
  getFeaturedCourses
}
