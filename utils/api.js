const { get, post, del } = require("./request")

const authApi = {
  login(data) {
    return post("/api/auth/login", data)
  },
  profile() {
    return get("/api/auth/profile")
  },
  logout() {
    return post("/api/auth/logout")
  }
}

const contentApi = {
  home() {
    return get("/api/content/home")
  },
  announcement(id) {
    return get(`/api/content/announcements/${id}`)
  }
}

const quizApi = {
  categories() {
    return get("/api/quiz/categories")
  },
  questionIds(params) {
    return get("/api/quiz/questions/ids", params)
  },
  questionsBatch(ids, withAnswer = true) {
    return get("/api/quiz/questions/batch", {
      ids: ids.join(","),
      withAnswer: withAnswer ? "true" : "false"
    })
  },
  submitAnswer(questionId, userAnswer) {
    return post(`/api/quiz/questions/${questionId}/submit`, { userAnswer })
  },
  wrongIds() {
    return get("/api/quiz/wrong")
  },
  clearWrong() {
    return del("/api/quiz/wrong")
  },
  favoriteIds() {
    return get("/api/quiz/favorites")
  },
  toggleFavorite(questionId) {
    return post(`/api/quiz/favorites/${questionId}`)
  }
}

const productsApi = {
  list(params) {
    return get("/api/products", params)
  },
  detail(productCode) {
    return get(`/api/products/${productCode}`)
  }
}

module.exports = { authApi, contentApi, quizApi, productsApi }
