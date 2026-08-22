const storage = require("./storage")
const config = require("../config/api")
const auth = require("./auth")
const { quizApi } = require("./api")
const { getTypeLabel } = require("../data/questions")

function scopedKey(baseKey) {
  const user = auth.getUser()
  if (user && user.id) return `${baseKey}_u${user.id}`
  return `${baseKey}_guest`
}

function readScoped(baseKey, defaultValue) {
  const scoped = storage.get(scopedKey(baseKey), null)
  if (scoped !== null && scoped !== undefined && scoped !== "") return scoped
  if (!auth.getUser() || !auth.getUser().id) {
    return storage.get(baseKey, defaultValue)
  }
  return defaultValue
}

function writeScoped(baseKey, value) {
  storage.set(scopedKey(baseKey), value)
}

function getWrongIds() {
  return readScoped(storage.KEYS.WRONG, [])
}

function getFavoriteIds() {
  return readScoped(storage.KEYS.FAVORITE, [])
}

function getRecords() {
  return readScoped(storage.KEYS.RECORDS, [])
}

function getQuizStats() {
  return readScoped(storage.KEYS.QUIZ_STATS, {
    totalAnswered: 0,
    totalCorrect: 0,
    examHighScore: 0,
    studyDays: 1,
    lastStudyDate: ""
  })
}

function addWrong(questionId) {
  const ids = getWrongIds()
  if (!ids.includes(questionId)) {
    ids.push(questionId)
    writeScoped(storage.KEYS.WRONG, ids)
  }
}

function removeWrong(questionId) {
  const ids = getWrongIds().filter((id) => id !== questionId)
  writeScoped(storage.KEYS.WRONG, ids)
}

function clearWrong() {
  writeScoped(storage.KEYS.WRONG, [])
}

function toggleFavorite(questionId) {
  const ids = getFavoriteIds()
  const index = ids.indexOf(questionId)
  if (index >= 0) {
    ids.splice(index, 1)
    writeScoped(storage.KEYS.FAVORITE, ids)
    return false
  }
  ids.push(questionId)
  writeScoped(storage.KEYS.FAVORITE, ids)
  return true
}

function isFavorite(questionId) {
  return getFavoriteIds().includes(questionId)
}

function checkAnswer(question, userAnswer) {
  if (!question || !Array.isArray(userAnswer)) return false
  const correct = question.answer.slice().sort()
  const user = userAnswer.slice().sort()
  if (correct.length !== user.length) return false
  return correct.every((val, i) => val === user[i])
}

function saveRecord(record) {
  const records = getRecords()
  records.unshift({
    id: `r${Date.now()}`,
    ...record,
    time: Date.now()
  })
  if (records.length > 50) records.length = 50
  writeScoped(storage.KEYS.RECORDS, records)
  updateStats(record)

  if (config.useApi && auth.getToken()) {
    return quizApi
      .saveRecord({
        mode: record.mode,
        categoryId: record.categoryId || null,
        subcategoryId: record.subcategoryId || null,
        totalCount: record.total || 0,
        correctCount: record.correct || 0,
        score: record.score || 0,
        durationSec: record.duration || null
      })
      .catch(() => {})
  }
  return Promise.resolve()
}

function updateStats(record) {
  const stats = getQuizStats()
  stats.totalAnswered += record.total || 0
  stats.totalCorrect += record.correct || 0
  if (record.mode === "mock" && record.score > stats.examHighScore) {
    stats.examHighScore = record.score
  }
  const today = formatDate(new Date())
  if (stats.lastStudyDate !== today) {
    if (stats.lastStudyDate) stats.studyDays += 1
    stats.lastStudyDate = today
  }
  writeScoped(storage.KEYS.QUIZ_STATS, stats)
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function getAccuracy() {
  const stats = getQuizStats()
  if (stats.totalAnswered === 0) return 0
  return Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}

function getOptionLabel(index) {
  return String.fromCharCode(65 + index)
}

function syncWrongIds() {
  if (!config.useApi || !auth.getToken()) {
    return Promise.resolve(getWrongIds())
  }
  return quizApi.wrongIds().then((data) => {
    const ids = data.questionIds || []
    writeScoped(storage.KEYS.WRONG, ids)
    return ids
  })
}

function syncFavoriteIds() {
  if (!config.useApi || !auth.getToken()) {
    return Promise.resolve(getFavoriteIds())
  }
  return quizApi.favoriteIds().then((data) => {
    const ids = data.questionIds || []
    writeScoped(storage.KEYS.FAVORITE, ids)
    return ids
  })
}

function syncRecords() {
  if (!config.useApi || !auth.getToken()) {
    return Promise.resolve(getRecords())
  }
  return quizApi.records({ page: 1, pageSize: 50 }).then((data) => {
    const list = (data.list || []).map((item) => ({
      id: item.id,
      mode: item.mode,
      total: item.total,
      correct: item.correct,
      score: item.score,
      duration: item.duration,
      time: item.time ? new Date(item.time).getTime() : Date.now()
    }))
    writeScoped(storage.KEYS.RECORDS, list)
    return list
  })
}

function syncAllUserData() {
  if (!config.useApi || !auth.getToken()) {
    return Promise.resolve()
  }
  return Promise.all([
    syncWrongIds().catch(() => {}),
    syncFavoriteIds().catch(() => {}),
    syncRecords().catch(() => {})
  ])
}

function clearWrongRemote() {
  if (config.useApi && auth.getToken()) {
    return quizApi.clearWrong().then(() => clearWrong())
  }
  clearWrong()
  return Promise.resolve()
}

function toggleFavoriteRemote(questionId) {
  if (config.useApi && auth.getToken()) {
    return quizApi.toggleFavorite(questionId).then((data) => {
      const ids = getFavoriteIds()
      if (data.favorited) {
        if (!ids.includes(questionId)) ids.push(questionId)
      } else {
        const index = ids.indexOf(questionId)
        if (index >= 0) ids.splice(index, 1)
      }
      writeScoped(storage.KEYS.FAVORITE, ids)
      return data.favorited
    })
  }
  return Promise.resolve(toggleFavorite(questionId))
}

module.exports = {
  getWrongIds,
  getFavoriteIds,
  getRecords,
  getQuizStats,
  addWrong,
  removeWrong,
  clearWrong,
  clearWrongRemote,
  toggleFavorite,
  toggleFavoriteRemote,
  syncWrongIds,
  syncFavoriteIds,
  syncRecords,
  syncAllUserData,
  isFavorite,
  checkAnswer,
  saveRecord,
  getAccuracy,
  formatDuration,
  getOptionLabel,
  getTypeLabel
}
