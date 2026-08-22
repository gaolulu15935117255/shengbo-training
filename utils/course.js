const config = require("../config/api")
const storage = require("./storage")
const auth = require("./auth")
const { coursesApi, userApi } = require("./api")
const { formatPrice } = require("./util")

function mapCourse(item) {
  const yuan = item.priceYuan != null
    ? Number(item.priceYuan)
    : item.price > 100
      ? item.price / 100
      : Number(item.price) || 0
  const free = item.free != null ? !!item.free : yuan === 0
  return {
    id: item.courseCode || item.id,
    courseCode: item.courseCode || item.id,
    title: item.title,
    category: item.category || item.categoryCode,
    duration: item.durationText || item.duration,
    level: item.level,
    price: yuan,
    priceText: formatPrice(yuan),
    free,
    desc: item.desc || item.description || "",
    outline: item.outline || [],
    lessons: (item.lessons || []).map((lesson, index) => ({
      id: lesson.id || index + 1,
      title: lesson.title,
      duration: lesson.durationText || lesson.duration,
      learned: !!lesson.learned
    })),
    locked: item.locked != null ? !!item.locked : !item.hasAccess && !free,
    hasAccess: item.hasAccess != null ? !!item.hasAccess : free,
    progressText: item.learned && item.progress ? ` · 已学 ${item.progress}%` : "",
  }
}

function getLocalCourses(category) {
  const data = require("../data/courses")
  const list = data.getCoursesByCategory(category)
  return list.map((item) => mapCourse({
    ...item,
    courseCode: item.id,
    durationText: item.duration,
    hasAccess: item.free,
    locked: !item.free
  }))
}

function listCourses(category) {
  if (!config.useApi) {
    return Promise.resolve({
      list: getLocalCourses(category),
      categories: require("../data/courses").categories
    })
  }
  return coursesApi.list({ category: category || "all", page: 1, pageSize: 50 }).then((data) => ({
    list: (data.list || []).map(mapCourse),
    categories: data.categories || require("../data/courses").categories
  }))
}

function getCourseDetail(courseCode) {
  if (!config.useApi) {
    const course = require("../data/courses").getCourseById(courseCode)
    if (!course) return Promise.reject(new Error("课程不存在"))
    return Promise.resolve(mapCourse({
      ...course,
      courseCode: course.id,
      durationText: course.duration,
      hasAccess: course.free,
      locked: !course.free,
      learned: (getApp().globalData.learnedIds || []).includes(course.id)
    }))
  }
  return coursesApi.detail(courseCode).then(mapCourse)
}

function listMyCourses() {
  if (!config.useApi || !auth.getToken()) {
    const learnedIds = getApp().globalData.learnedIds || storage.get(storage.KEYS.LEARNED, [])
    return Promise.resolve(getLocalCourses("all").filter((item) => learnedIds.includes(item.id)))
  }
  return userApi.courses().then((data) => (data.list || []).map(mapCourse))
}

function startCourse(courseCode, extra) {
  const app = getApp()
  if (app && app.markLearnedLocal) {
    app.markLearnedLocal(courseCode)
  } else if (app) {
    const ids = app.globalData.learnedIds || []
    if (!ids.includes(courseCode)) {
      ids.push(courseCode)
      app.globalData.learnedIds = ids
      storage.set(storage.KEYS.LEARNED, ids)
    }
  }
  if (!config.useApi || !auth.getToken()) {
    return Promise.resolve({ learned: true, progress: extra && extra.progress ? extra.progress : 0 })
  }
  return userApi.updateCourseProgress(courseCode, extra || {})
}

function syncLocalLearnedToCloud() {
  if (!config.useApi || !auth.getToken()) return Promise.resolve()
  const ids = storage.get(storage.KEYS.LEARNED, [])
  if (!ids.length) return Promise.resolve()
  return userApi.courses().then((data) => {
    const remote = new Set((data.list || []).map((item) => item.courseCode || item.id))
    const pending = ids.filter((id) => !remote.has(id))
    return Promise.all(pending.map((id) => userApi.updateCourseProgress(id, {}).catch(() => {})))
  }).catch(() => {})
}

module.exports = {
  mapCourse,
  listCourses,
  getCourseDetail,
  listMyCourses,
  startCourse,
  syncLocalLearnedToCloud
}
