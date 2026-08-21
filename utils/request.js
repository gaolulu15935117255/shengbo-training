const config = require("../config/api")
const storage = require("./storage")

function mapNetworkError(errMsg) {
  const msg = errMsg || ""
  if (msg.indexOf("url not in domain list") !== -1) {
    return "请求域名未配置，请在公众平台添加 api.yanmakeji.top"
  }
  if (msg.indexOf("ssl") !== -1 || msg.indexOf("TLS") !== -1) {
    return "HTTPS 证书校验失败"
  }
  if (msg.indexOf("timeout") !== -1) {
    return "请求超时，请检查网络"
  }
  return msg || "网络请求失败"
}

function request(options, isRetry) {
  if (!config.useApi) {
    return Promise.reject(new Error("API 未启用"))
  }

  const token = isRetry ? "" : storage.get(storage.KEYS.TOKEN, "")

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
          const method = (options.method || "GET").toUpperCase()
          if (!isRetry && token && method === "GET") {
            request(options, true).then(resolve, reject)
            return
          }
        }
        const err = new Error((body && body.message) || "请求失败")
        err.code = body && body.code
        err.data = body && body.data
        reject(err)
      },
      fail(err) {
        reject(new Error(mapNetworkError(err.errMsg)))
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
