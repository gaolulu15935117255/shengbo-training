# 圣博育儿保姆培训小程序

面向育儿嫂、保姆从业者的线上培训刷题付费微信小程序，基于 PRD V1.0 需求开发。

## 功能模块

### 首页（品牌宣传）
- Banner 轮播、学员数据统计、公告滚动
- 培训品类入口（育儿嫂 / 保姆家政）
- 品牌介绍、热门商品推荐、精品课程
- 一键拨号、微信咨询、地址导航

### 题库刷题（核心）
- 育儿嫂 / 保姆两大题库分类，章节细分
- 章节练习、专项刷题、模拟考试（限时）
- 错题本、收藏题目、答题记录
- 免费 / 付费权限控制，关联商城解锁

### 虚拟商城
- 专项课程、全科班、会员套餐、冲刺题库包
- 商品详情、模拟支付、自动开通权限
- 订单记录查询

### 个人中心
- 微信授权登录、会员身份展示
- 学习数据统计（刷题量、正确率、学习天数）
- 我的课程、订单、消息通知
- 关于我们

## 本地运行

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入项目，目录指向 `shengbo-training`
3. AppID 可先使用测试号，正式环境在 `project.config.json` 替换

## 目录结构

```
pages/
  index/              首页
  quiz/               题库中心
  quiz-category/      题库分类详情
  quiz-practice/      刷题答题
  quiz-result/        练习结果
  quiz-wrong/         错题本
  quiz-favorite/      收藏题目
  quiz-records/       答题记录
  shop/               商城
  shop-detail/        商品详情
  orders/             订单列表
  courses/            课程列表
  course-detail/      课程详情
  mine/               个人中心
  about/              关于我们
  messages/           消息通知
  announcement/       公告详情
data/                 本地 mock 数据
utils/                工具（权限、订单、刷题、存储）
components/tab-bar/   底部导航
```

## 技术说明

- 当前为 **前端完整版**，数据使用本地 mock + `wx.storage` 持久化
- 支付为 **模拟支付**，接入真实微信支付需后端配合
- 后台管理系统（题库导入、商品管理等）需单独开发 Web 端 + API

## 后续对接

1. 搭建后端 API（用户、题库、商品、订单、支付）
2. 接入微信支付
3. 开发后台管理系统（品牌配置、文档导入题库、商品管理）
4. V1.1：视频课程播放、排行榜、优惠券
