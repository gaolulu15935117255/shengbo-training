const productTypes = [
  { id: "all", name: "全部" },
  { id: "course", name: "专项课程" },
  { id: "package", name: "全科班" },
  { id: "membership", name: "会员套餐" },
  { id: "exam", name: "冲刺题库" }
]

const products = [
  {
    id: "p1",
    type: "course",
    title: "育儿嫂护理专项课",
    cover: "#E8F2FF",
    price: 199,
    originalPrice: 399,
    sales: 1280,
    rating: 4.9,
    desc: "系统学习新生儿护理、辅食制作、产妇护理核心技能，配套专项题库无限刷。",
    benefits: ["解锁育儿嫂专项题库", "6门精品课程", "错题本+收藏功能", "永久有效"],
    unlockCategories: ["nanny"],
    unlockCourses: ["c1", "c2", "c4", "c6"],
    target: "在职育儿嫂、意向从业者"
  },
  {
    id: "p2",
    type: "course",
    title: "保姆家政专项课",
    cover: "#EDE8FF",
    price: 149,
    originalPrice: 299,
    sales: 960,
    rating: 4.8,
    desc: "家居保洁、衣物收纳、烹饪礼仪全掌握，助力保姆快速上岗。",
    benefits: ["解锁保姆家政专项题库", "4门精品课程", "模拟考试3套", "永久有效"],
    unlockCategories: ["housekeeper"],
    unlockCourses: ["c3"],
    target: "居家保姆、家政从业者"
  },
  {
    id: "p3",
    type: "package",
    title: "育儿嫂全科系统班",
    cover: "#E8FAF0",
    price: 599,
    originalPrice: 1299,
    sales: 520,
    rating: 4.9,
    desc: "育儿嫂岗位全品类课程+全套题库+模拟真题，一站式备考。",
    benefits: ["育儿嫂全部题库", "全部育儿嫂课程", "10套模拟试卷", "考前押题卷"],
    unlockCategories: ["nanny"],
    unlockCourses: ["c1", "c2", "c4", "c5", "c6"],
    target: "零基础学员、考证备考"
  },
  {
    id: "p4",
    type: "package",
    title: "保姆全科系统班",
    cover: "#FFF4E8",
    price: 499,
    originalPrice: 999,
    sales: 380,
    rating: 4.7,
    desc: "保姆家政全技能覆盖，从保洁到烹饪，从礼仪到安全。",
    benefits: ["保姆全部题库", "全部保姆课程", "8套模拟试卷", "永久有效"],
    unlockCategories: ["housekeeper"],
    unlockCourses: ["c3", "c5"],
    target: "家政新手、技能提升"
  },
  {
    id: "p5",
    type: "membership",
    title: "月度会员",
    cover: "#FFF0E8",
    price: 49,
    originalPrice: 99,
    sales: 2100,
    rating: 4.8,
    desc: "30天全站题库+全部课程畅学，适合短期备考。",
    benefits: ["全站题库解锁", "全部课程学习", "模拟考试不限次", "30天有效"],
    membershipLevel: "month",
    membershipDays: 30,
    unlockAll: true,
    target: "短期备考学员"
  },
  {
    id: "p6",
    type: "membership",
    title: "年度会员",
    cover: "#E8F2FF",
    price: 299,
    originalPrice: 599,
    sales: 860,
    rating: 4.9,
    desc: "365天全站资源畅学，性价比之选。",
    benefits: ["全站题库解锁", "全部课程学习", "模拟考试不限次", "365天有效", "专属学习报告"],
    membershipLevel: "year",
    membershipDays: 365,
    unlockAll: true,
    target: "长期学习学员"
  },
  {
    id: "p7",
    type: "membership",
    title: "终身会员",
    cover: "#F5F5F7",
    price: 999,
    originalPrice: 1999,
    sales: 320,
    rating: 5.0,
    desc: "一次购买，终身畅学全站所有资源。",
    benefits: ["全站永久解锁", "新课上架免费学", "新题更新免费刷", "优先客服支持"],
    membershipLevel: "lifetime",
    membershipDays: -1,
    unlockAll: true,
    target: "深度学习者"
  },
  {
    id: "p8",
    type: "exam",
    title: "育儿嫂考前押题卷",
    cover: "#FFEBEE",
    price: 39,
    originalPrice: 79,
    sales: 680,
    rating: 4.7,
    desc: "精选高频考点押题，还原真实考试场景。",
    benefits: ["5套押题试卷", "详细答案解析", "考点归纳手册", "永久有效"],
    unlockExamPacks: ["nanny_exam"],
    target: "即将考证学员"
  }
]

function getProductById(id) {
  return products.find((item) => item.id === id) || null
}

function getProductsByType(type) {
  if (!type || type === "all") return products
  return products.filter((item) => item.type === type)
}

module.exports = {
  productTypes,
  products,
  getProductById,
  getProductsByType
}
