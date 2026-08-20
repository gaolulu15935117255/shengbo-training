const config = require("../config/api")
const storage = require("./storage")

function request(options) {
  if (!config.useApi) {
    return Promise.reject(new Error("API 未启用"))
  }

  const token = storage.get(storage.KEYS.TOKEN, "")

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.baseUrl}${options.url}`,
      method: options.method || "GET",
      data: options.data,
      header: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.header || {})
      },
      success(res) {
        const body = res.data
        if (body && body.code === 0) {
          resolve(body.data)
          return
        }
        if (body && body.code === 40100) {
          storage.remove(storage.KEYS.TOKEN)
        }
        const err = new Error((body && body.message) || "请求失败")
        err.code = body && body.code
        err.data = body && body.data
        reject(err)
      },
      fail(err) {
        reject(new Error(err.errMsg || "网络请求失败"))
      }
    })
  })
}

function get(url, data) {
  return request({ url, method: "GET", data })
}

function post(url, data) {
  return request({ url, method: "POST", data })
}

function del(url) {
  return request({ url, method: "DELETE" })
}

module.exports = { request, get, post, del }
