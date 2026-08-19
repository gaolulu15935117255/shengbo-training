const banners = [
  {
    id: "b1",
    title: "圣博培训 · 专业家政上岗",
    subtitle: "育儿嫂 · 保姆 · 持证上岗",
    tag: "品牌推荐",
    theme: "blue",
    link: "/pages/shop/shop"
  },
  {
    id: "b2",
    title: "春季考证班火热招生",
    subtitle: "报名即赠基础题库 · 限时优惠",
    tag: "限时活动",
    theme: "purple",
    link: "/pages/shop/shop?type=membership"
  },
  {
    id: "b3",
    title: "智能刷题 · 高效备考",
    subtitle: "章节练习 · 模拟考试 · 错题巩固",
    tag: "学习工具",
    theme: "teal",
    link: "/pages/quiz/quiz"
  }
]

const brandInfo = {
  name: "圣博培训",
  slogan: "专注育儿嫂、保姆职业技能培训",
  intro:
    "圣博培训深耕家政行业多年，拥有正规办学资质与专业师资团队。我们致力于为育儿嫂、居家保姆及意向从业者提供系统化、标准化的线上培训与考证服务，帮助学员快速掌握岗位核心技能，顺利持证上岗。",
  highlights: [
    { icon: "证", label: "正规资质", desc: "人社备案培训机构" },
    { icon: "师", label: "专业师资", desc: "10年+行业经验讲师" },
    { icon: "场", label: "实训场地", desc: "2000㎡实操教学基地" },
    { icon: "誉", label: "学员口碑", desc: "累计服务学员 8600+" }
  ],
  honors: ["家政服务培训示范机构", "2024年度优秀培训机构", "持证上岗合作单位"]
}

const stats = [
  { value: "8600+", label: "累计学员" },
  { value: "92%", label: "持证上岗率" },
  { value: "98%", label: "学员好评" },
  { value: "120+", label: "合作机构" }
]

const announcements = [
  {
    id: "a1",
    title: "2026年春季育儿嫂考证班3月15日开班",
    date: "2026-03-01",
    content:
      "圣博培训2026年春季育儿嫂考证班将于3月15日正式开班，涵盖新生儿护理、辅食制作、产妇护理等核心模块。线上刷题+线下实操，欢迎预约试听。"
  },
  {
    id: "a2",
    title: "家政行业新规：持证上岗要求说明",
    date: "2026-02-20",
    content:
      "根据最新行业规范，育儿嫂、保姆等家政从业人员需完成系统培训并持有相应职业资格证书方可上岗。圣博培训提供一站式培训考证服务。"
  },
  {
    id: "a3",
    title: "题库更新：新增100道模拟真题",
    date: "2026-02-10",
    content: "育儿嫂专项题库新增100道模拟真题，覆盖新生儿护理、应急处理等高频考点，会员用户可免费刷题。"
  }
]

const contact = {
  phone: "400-888-6688",
  wechat: "shengbo_peixun",
  address: "广东省广州市天河区培训大道168号圣博培训基地",
  latitude: 23.1291,
  longitude: 113.2644
}

module.exports = {
  banners,
  brandInfo,
  stats,
  announcements,
  contact
}
