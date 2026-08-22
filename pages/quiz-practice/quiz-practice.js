const { getTypeLabel } = require("../../data/questions")
const {
  checkAnswer,
  addWrong,
  toggleFavoriteRemote,
  isFavorite,
  getOptionLabel,
  saveRecord,
  getWrongIds,
  getFavoriteIds,
  syncWrongIds,
  syncFavoriteIds
} = require("../../utils/quiz")
const { quizApi } = require("../../utils/api")
const auth = require("../../utils/auth")
const config = require("../../config/api")

Page({
  data: {
    mode: "chapter",
    questions: [],
    currentIndex: 0,
    current: null,
    userAnswer: [],
    submitted: false,
    isCorrect: false,
    favorited: false,
    typeLabel: "",
    progress: "",
    mockTimer: 0,
    mockTimeLimit: 1800,
    timerDisplay: "30:00",
    progressPercent: 0,
    optionStates: [],
    loading: true
  },

  timer: null,
  startTime: 0,
  correctCount: 0,

  onLoad(options) {
    this.options = options
    if (config.useApi) {
      auth
        .requireLogin()
        .then(() => this.loadQuestions(options))
        .catch((err) => {
          if (!err || err.code !== "LOGIN_CANCEL") {
            wx.showToast({ title: (err && err.message) || "请先登录", icon: "none" })
          }
          setTimeout(() => wx.navigateBack(), 400)
        })
      return
    }
    this.loadQuestions(options)
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer)
  },

  loadQuestions(options) {
    const { mode, subcategoryId, categoryId } = options

    if (!config.useApi) {
      this.loadLocalQuestions(options)
      return
    }

    wx.showLoading({ title: "加载题目..." })

    let idsPromise
    if (mode === "wrong") {
      idsPromise = syncWrongIds().then((ids) => ({ questionIds: ids }))
    } else if (mode === "favorite") {
      idsPromise = syncFavoriteIds().then((ids) => ({ questionIds: ids }))
    } else {
      const params = { mode: mode || "chapter" }
      if (subcategoryId) params.subcategoryId = subcategoryId
      if (categoryId) params.categoryId = categoryId
      if (mode === "mock") params.limit = 10
      idsPromise = quizApi.questionIds(params)
    }

    idsPromise
      .then((data) => {
        const ids = data.questionIds || []
        if (!ids.length) {
          wx.hideLoading()
          wx.showToast({ title: "暂无可用题目", icon: "none" })
          setTimeout(() => wx.navigateBack(), 1500)
          return null
        }
        return quizApi.questionsBatch(ids, true)
      })
      .then((questions) => {
        wx.hideLoading()
        if (!questions || !questions.length) return
        this.initPractice(mode || "chapter", questions)
      })
      .catch((err) => {
        wx.hideLoading()
        if (err.code === 40300) {
          wx.showModal({
            title: "需要解锁",
            content: err.message || "该内容为付费资源",
            confirmText: "去购买",
            success: (res) => {
              if (res.confirm) wx.navigateTo({ url: "/pages/shop/shop" })
              else wx.navigateBack()
            }
          })
          return
        }
        wx.showToast({ title: err.message || "加载失败", icon: "none" })
        setTimeout(() => wx.navigateBack(), 1500)
      })
  },

  loadLocalQuestions(options) {
    const {
      getQuestionsBySubcategory,
      getQuestionsByCategory,
      getMockExamQuestions,
      getQuestionById
    } = require("../../data/questions")
    const { hasQuizAccess } = require("../../utils/permission")

    const { mode, subcategory, category } = options
    let questions = []

    if (mode === "chapter" && subcategory) {
      questions = getQuestionsBySubcategory(subcategory)
    } else if (mode === "special" && category) {
      questions = getQuestionsByCategory(category).filter((q) => !q.free)
    } else if (mode === "mock" && category) {
      questions = getMockExamQuestions(category, 10)
    } else if (mode === "wrong") {
      questions = getWrongIds().map(getQuestionById).filter(Boolean)
    } else if (mode === "favorite") {
      questions = getFavoriteIds().map(getQuestionById).filter(Boolean)
    }

    questions = questions.filter((q) => hasQuizAccess(q))

    if (!questions.length) {
      wx.showToast({ title: "暂无可用题目", icon: "none" })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.initPractice(mode || "chapter", questions)
  },

  initPractice(mode, questions) {
    const titles = {
      chapter: "章节练习",
      special: "专项刷题",
      mock: "模拟考试",
      wrong: "错题重做",
      favorite: "收藏练习"
    }

    this.correctCount = 0
    this.setData({
      mode,
      questions,
      currentIndex: 0,
      userAnswer: [],
      submitted: false,
      isCorrect: false,
      loading: false,
      ...this.buildQuestionState(questions[0], 0, questions.length)
    })

    wx.setNavigationBarTitle({ title: titles[mode] || "刷题" })

    if (mode === "mock") {
      this.startTime = Date.now()
      this.startMockTimer()
    }
  },

  startMockTimer() {
    let elapsed = 0
    this.timer = setInterval(() => {
      elapsed += 1
      const remaining = this.data.mockTimeLimit - elapsed
      if (remaining <= 0) {
        clearInterval(this.timer)
        this.finishMock()
        return
      }
      const m = Math.floor(remaining / 60)
      const s = remaining % 60
      this.setData({
        mockTimer: elapsed,
        timerDisplay: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      })
    }, 1000)
  },

  selectOption(e) {
    if (this.data.submitted) return
    const index = Number(e.currentTarget.dataset.index)
    const current = this.data.current
    let userAnswer = this.data.userAnswer.slice()

    if (current.type === "multiple") {
      const pos = userAnswer.indexOf(index)
      if (pos >= 0) userAnswer.splice(pos, 1)
      else userAnswer.push(index)
    } else {
      userAnswer = [index]
    }

    this.setData({
      userAnswer,
      optionStates: this.buildOptionStates(current, userAnswer, false)
    })
  },

  submitAnswer() {
    if (this.data.userAnswer.length === 0) {
      wx.showToast({ title: "请选择答案", icon: "none" })
      return
    }

    const current = this.data.current
    const userAnswer = this.data.userAnswer

    const applyResult = (isCorrect, answerOverride) => {
      if (isCorrect) this.correctCount += 1
      else addWrong(current.id)

      const answer = answerOverride || current.answer
      this.setData({
        submitted: true,
        isCorrect,
        current: { ...current, answer },
        answerText: answer.map((i) => getOptionLabel(i)).join("、"),
        optionStates: this.buildOptionStates({ ...current, answer }, userAnswer, true)
      })
    }

    if (config.useApi && auth.getToken()) {
      quizApi
        .submitAnswer(current.id, userAnswer)
        .then((data) => applyResult(data.isCorrect, data.answer))
        .catch(() => {
          applyResult(checkAnswer(current, userAnswer))
        })
    } else {
      applyResult(checkAnswer(current, userAnswer))
    }
  },

  nextQuestion() {
    const nextIndex = this.data.currentIndex + 1
    if (nextIndex >= this.data.questions.length) {
      if (this.data.mode === "mock") this.finishMock()
      else this.finishPractice()
      return
    }

    const current = this.data.questions[nextIndex]
    this.setData({
      currentIndex: nextIndex,
      userAnswer: [],
      submitted: false,
      isCorrect: false,
      ...this.buildQuestionState(current, nextIndex, this.data.questions.length)
    })
  },

  buildQuestionState(current, index, total) {
    const answerText = (current.answer || []).map((i) => getOptionLabel(i)).join("、")
    return {
      current,
      typeLabel: current.typeLabel || getTypeLabel(current.type),
      progress: `${index + 1}/${total}`,
      progressPercent: Math.round(((index + 1) / total) * 100),
      favorited: isFavorite(current.id),
      answerText,
      optionStates: this.buildOptionStates(current, [], false)
    }
  },

  buildOptionStates(current, userAnswer, submitted) {
    return current.options.map((text, index) => {
      const selected = userAnswer.indexOf(index) >= 0
      const isAnswer = (current.answer || []).indexOf(index) >= 0
      let optionClass = "option"
      let labelClass = "opt-label-wrap"

      if (submitted) {
        if (isAnswer) optionClass += " option-correct"
        else if (selected) optionClass += " option-wrong"
      } else if (selected) {
        optionClass += " option-selected"
        labelClass += " opt-label-selected"
      }

      return {
        text,
        label: getOptionLabel(index),
        optionClass,
        labelClass,
        showCheck: !submitted && selected
      }
    })
  },

  toggleFav() {
    toggleFavoriteRemote(this.data.current.id).then((favorited) => {
      this.setData({ favorited })
      wx.showToast({ title: favorited ? "已收藏" : "已取消", icon: "none" })
    })
  },

  buildRecordPayload(extra) {
    const categoryId = parseInt((this.options && this.options.categoryId) || "", 10)
    const subcategoryId = parseInt((this.options && this.options.subcategoryId) || "", 10)
    return {
      categoryId: Number.isFinite(categoryId) ? categoryId : null,
      subcategoryId: Number.isFinite(subcategoryId) ? subcategoryId : null,
      ...(extra || {})
    }
  },

  finishPractice() {
    const total = this.data.questions.length
    saveRecord(
      this.buildRecordPayload({
        mode: this.data.mode,
        total,
        correct: this.correctCount,
        score: Math.round((this.correctCount / total) * 100)
      })
    )
    wx.redirectTo({
      url: `/pages/quiz-result/quiz-result?correct=${this.correctCount}&total=${total}&mode=${this.data.mode}`
    })
  },

  finishMock() {
    if (this.timer) clearInterval(this.timer)
    const total = this.data.questions.length
    const elapsed = Math.round((Date.now() - this.startTime) / 1000)
    const score = Math.round((this.correctCount / total) * 100)
    saveRecord(
      this.buildRecordPayload({
        mode: "mock",
        total,
        correct: this.correctCount,
        score,
        duration: elapsed
      })
    )
    wx.redirectTo({
      url: `/pages/quiz-result/quiz-result?correct=${this.correctCount}&total=${total}&mode=mock&duration=${elapsed}&score=${score}`
    })
  }
})
