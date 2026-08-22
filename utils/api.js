const { get, post, put, del, uploadFile } = require("./request")

const authApi = {
  login(data) {
    return post("/api/auth/login", data)
  },
  profile() {
    return get("/api/auth/profile")
  },
  updateProfile(data) {
    return put("/api/auth/profile", data)
  },
  uploadAvatar(filePath) {
    return uploadFile("/api/auth/avatar", filePath, "file")
  },
  bindPhone(data) {
    return post("/api/auth/phone", data)
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
  },
  records(params) {
    return get("/api/quiz/records", params)
  },
  saveRecord(data) {
    return post("/api/quiz/records", data)
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

const ordersApi = {
  create(data) {
    return post("/api/orders/create", data)
  },
  list(params) {
    return get("/api/orders", params)
  },
  status(orderNo) {
    return get(`/api/orders/${orderNo}/status`)
  },
  repay(orderNo) {
    return post(`/api/orders/${orderNo}/repay`)
  }
}

const payApi = {
  prepay(data) {
    return post("/api/pay/prepay", data)
  }
}

const userApi = {
  entitlements() {
    return get("/api/user/entitlements")
  },
  courses() {
    return get("/api/user/courses")
  },
  updateCourseProgress(courseCode, data) {
    return post(`/api/user/courses/${courseCode}/progress`, data || {})
  },
  messages(params) {
    return get("/api/user/messages", params)
  },
  readMessage(id) {
    return put(`/api/user/messages/${id}/read`)
  }
}

const coursesApi = {
  list(params) {
    return get("/api/courses", params)
  },
  detail(courseCode) {
    return get(`/api/courses/${courseCode}`)
  }
}

module.exports = { authApi, contentApi, quizApi, productsApi, ordersApi, payApi, userApi, coursesApi }
