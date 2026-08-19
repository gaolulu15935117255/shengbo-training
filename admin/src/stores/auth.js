import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/request'

const TOKEN_KEY = 'admin_token'
const ADMIN_KEY = 'admin_info'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const admin = ref(JSON.parse(localStorage.getItem(ADMIN_KEY) || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(data) {
    token.value = data.token
    admin.value = data.admin || { username: data.username }
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin.value))
  }

  function logout() {
    token.value = ''
    admin.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ADMIN_KEY)
  }

  async function login(username, password) {
    const data = await request.post('/admin/auth/login', { username, password })
    setAuth(data)
    return data
  }

  return { token, admin, isLoggedIn, login, logout, setAuth }
})
