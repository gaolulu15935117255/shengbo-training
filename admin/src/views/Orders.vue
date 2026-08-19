<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">订单管理</h2>
    </div>

    <div class="page-card">
      <div class="filter-bar">
        <el-input
          v-model="filters.orderNo"
          placeholder="订单号"
          clearable
          style="width: 180px"
          @keyup.enter="fetchList"
        />
        <el-select v-model="filters.status" placeholder="订单状态" clearable style="width: 130px">
          <el-option label="待支付" value="pending" />
          <el-option label="已支付" value="paid" />
          <el-option label="已关闭" value="closed" />
          <el-option label="已退款" value="refunded" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="fetchList">查询</el-button>
        <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="list">
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="productTitle" label="商品" min-width="160" show-overflow-tooltip />
        <el-table-column label="金额" width="100">
          <template #default="{ row }">¥{{ row.amountYuan || formatYuan(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ row.statusLabel || statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="userNickName" label="用户" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.orderNo)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="fetchList"
        @size-change="fetchList"
      />
    </div>

    <el-drawer v-model="drawerVisible" title="订单详情" size="480px">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="商品">{{ detail.productTitle }}</el-descriptions-item>
            <el-descriptions-item label="金额">¥{{ detail.amountYuan || formatYuan(detail.amount) }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusTagType(detail.status)" size="small">
                {{ detail.statusLabel || statusLabel(detail.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户">{{ detail.userNickName || detail.userId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(detail.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ formatTime(detail.paidAt) || '-' }}</el-descriptions-item>
            <el-descriptions-item v-if="detail.refundedAt" label="退款时间">
              {{ formatTime(detail.refundedAt) }}
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="detail.status === 'paid'" class="drawer-actions">
            <el-popconfirm title="确定发起退款？" @confirm="handleRefund(detail.orderNo)">
              <template #reference>
                <el-button type="danger" :loading="refunding">发起退款</el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const detailLoading = ref(false)
const refunding = ref(false)
const drawerVisible = ref(false)
const list = ref([])
const detail = ref(null)

const filters = reactive({ orderNo: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

function formatYuan(fen) {
  if (fen == null) return '0.00'
  return (fen / 100).toFixed(2)
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-CN')
}

function statusLabel(status) {
  return { pending: '待支付', paid: '已支付', closed: '已关闭', refunded: '已退款' }[status] || status
}

function statusTagType(status) {
  return { pending: 'warning', paid: 'success', closed: 'info', refunded: 'danger' }[status] || ''
}

function resetFilters() {
  filters.orderNo = ''
  filters.status = ''
  pagination.page = 1
  fetchList()
}

async function fetchList() {
  loading.value = true
  try {
    const data = await request.get('/admin/orders', {
      params: {
        orderNo: filters.orderNo || undefined,
        status: filters.status || undefined,
        page: pagination.page,
        pageSize: pagination.pageSize
      }
    })
    list.value = data?.list || []
    pagination.total = data?.pagination?.total || 0
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

async function openDetail(orderNo) {
  drawerVisible.value = true
  detail.value = null
  detailLoading.value = true
  try {
    detail.value = await request.get(`/admin/orders/${orderNo}`)
  } catch {
    drawerVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

async function handleRefund(orderNo) {
  refunding.value = true
  try {
    await request.post(`/admin/orders/${orderNo}/refund`)
    ElMessage.success('退款已发起')
    detail.value = await request.get(`/admin/orders/${orderNo}`)
    fetchList()
  } catch {
    // handled
  } finally {
    refunding.value = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.drawer-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--sb-border);
}
</style>
