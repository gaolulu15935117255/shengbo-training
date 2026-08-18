const storage = require("./storage")
const { getTypeLabel } = require("../data/questions")

function getWrongIds() {
  return storage.get(storage.KEYS.WRONG, [])
}

function getFavoriteIds() {
  return storage.get(storage.KEYS.FAVORITE, [])
}

function getRecords() {
  return storage.get(storage.KEYS.RECORDS, [])
}

function getQuizStats() {
  return storage.get(storage.KEYS.QUIZ_STATS, {
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
    storage.set(storage.KEYS.WRONG, ids)
  }
}

function removeWrong(questionId) {
  const ids = getWrongIds().filter((id) => id !== questionId)
  storage.set(storage.KEYS.WRONG, ids)
}

function clearWrong() {
  storage.set(storage.KEYS.WRONG, [])
}

function toggleFavorite(questionId) {
  const ids = getFavoriteIds()
  const index = ids.indexOf(questionId)
  if (index >= 0) {
    ids.splice(index, 1)
    storage.set(storage.KEYS.FAVORITE, ids)
    return false
  }
  ids.push(questionId)
  storage.set(storage.KEYS.FAVORITE, ids)
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
  storage.set(storage.KEYS.RECORDS, records)
  updateStats(record)
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
  storage.set(storage.KEYS.QUIZ_STATS, stats)
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

module.exports = {
  getWrongIds,
  getFavoriteIds,
  getRecords,
  getQuizStats,
  addWrong,
  removeWrong,
  clearWrong,
  toggleFavorite,
  isFavorite,
  checkAnswer,
  saveRecord,
  getAccuracy,
  formatDuration,
  getOptionLabel,
  getTypeLabel
}
