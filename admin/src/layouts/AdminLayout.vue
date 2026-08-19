<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="sidebar">
      <div class="brand">
        <div class="brand-icon">圣</div>
        <span class="brand-text">圣博培训</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="sidebar-menu"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <el-header class="header">
        <span class="header-title">{{ currentTitle }}</span>
        <div class="header-right">
          <span class="admin-name">{{ authStore.admin?.username || '管理员' }}</span>
          <el-button text type="primary" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Odometer,
  Document,
  Upload,
  ShoppingBag,
  List,
  User
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const menuItems = [
  { path: '/dashboard', title: '仪表盘', icon: Odometer },
  { path: '/questions', title: '题库管理', icon: Document },
  { path: '/import', title: '题库导入', icon: Upload },
  { path: '/products', title: '商品管理', icon: ShoppingBag },
  { path: '/orders', title: '订单管理', icon: List },
  { path: '/users', title: '用户管理', icon: User }
]

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '管理后台')

function handleLogout() {
  authStore.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  background: var(--sb-bg);
}

.sidebar {
  background: var(--sb-sidebar-bg);
  border-right: 1px solid var(--sb-border);
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-bottom: 1px solid var(--sb-border);
}

.brand-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--sb-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.brand-text {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.sidebar-menu {
  border-right: none;
  padding: 8px;
  flex: 1;
  background: transparent;
}

.sidebar-menu .el-menu-item {
  border-radius: 8px;
  margin-bottom: 4px;
  height: 44px;
}

.sidebar-menu .el-menu-item.is-active {
  background: rgba(0, 122, 255, 0.1);
  color: var(--sb-accent);
}

.main-container {
  flex-direction: column;
}

.header {
  height: 56px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--sb-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-name {
  color: var(--sb-text-secondary);
  font-size: 14px;
}

.main-content {
  padding: 24px;
  overflow: auto;
}
</style>
