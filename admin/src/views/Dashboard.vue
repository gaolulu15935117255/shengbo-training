<template>
  <div v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">仪表盘</h2>
    </div>

    <el-row :gutter="16" class="stat-row">
      <el-col v-for="item in statCards" :key="item.key" :xs="24" :sm="12" :md="8" :lg="6">
        <div class="stat-card">
          <div class="stat-icon" :style="{ background: item.color }">
            <el-icon :size="22"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="page-card overview-card">
      <h3>数据概览</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="今日新增用户">{{ stats.todayNewUsers ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="今日订单数">{{ stats.todayOrders ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="今日收入（元）">{{ formatYuan(stats.todayRevenue) }}</el-descriptions-item>
        <el-descriptions-item label="待处理订单">{{ stats.pendingOrders ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="已发布题目">{{ stats.publishedQuestions ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="上架商品">{{ stats.activeProducts ?? '-' }}</el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { User, ShoppingBag, Document, Money } from '@element-plus/icons-vue'
import request from '@/utils/request'

const loading = ref(false)
const stats = ref({})

const statCards = computed(() => [
  { key: 'users', label: '用户总数', value: stats.value.userCount ?? '-', icon: User, color: '#007AFF' },
  { key: 'orders', label: '订单总数', value: stats.value.orderCount ?? '-', icon: ShoppingBag, color: '#34C759' },
  { key: 'questions', label: '题目总数', value: stats.value.questionCount ?? '-', icon: Document, color: '#FF9500' },
  { key: 'revenue', label: '累计收入（元）', value: formatYuan(stats.value.totalRevenue), icon: Money, color: '#AF52DE' }
])

function formatYuan(fen) {
  if (fen == null) return '-'
  return (fen / 100).toFixed(2)
}

async function fetchStats() {
  loading.value = true
  try {
    stats.value = (await request.get('/admin/dashboard/stats')) || {}
  } catch {
    stats.value = {}
  } finally {
    loading.value = false
  }
}

onMounted(fetchStats)
</script>

<style scoped>
.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: var(--sb-radius);
  box-shadow: var(--sb-shadow);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--sb-text-secondary);
  margin-top: 4px;
}

.overview-card h3 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
}
</style>
