<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
    </div>

    <div class="page-card">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索昵称 / ID"
          clearable
          style="width: 220px"
          @keyup.enter="fetchList"
        />
        <el-button type="primary" :icon="Search" @click="fetchList">查询</el-button>
        <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="list">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" min-width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="32" :src="row.avatarUrl">{{ row.nickName?.[0] || 'U' }}</el-avatar>
              <span>{{ row.nickName || '未设置' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="membershipLabel" label="会员等级" width="120" />
        <el-table-column label="会员到期" width="120">
          <template #default="{ row }">
            {{ row.membershipExpire ? formatDate(row.membershipExpire) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.id)">详情</el-button>
            <el-button link type="success" @click="openGrantDialog(row)">开通权益</el-button>
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

    <el-drawer v-model="drawerVisible" title="用户详情" size="480px">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <div class="detail-header">
            <el-avatar :size="64" :src="detail.avatarUrl">{{ detail.nickName?.[0] || 'U' }}</el-avatar>
            <div>
              <h3>{{ detail.nickName || '未设置昵称' }}</h3>
              <p>ID: {{ detail.id }}</p>
            </div>
          </div>

          <el-descriptions :column="1" border class="detail-desc">
            <el-descriptions-item label="会员等级">
              {{ detail.membership?.label || detail.membershipLabel || '普通用户' }}
            </el-descriptions-item>
            <el-descriptions-item label="会员到期">
              {{ detail.membership?.expireAt ? formatTime(detail.membership.expireAt) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ formatTime(detail.createdAt) }}</el-descriptions-item>
          </el-descriptions>

          <div v-if="detail.stats" class="stats-block">
            <h4>学习统计</h4>
            <el-row :gutter="12">
              <el-col :span="12">
                <div class="mini-stat">
                  <span class="val">{{ detail.stats.totalAnswered ?? 0 }}</span>
                  <span class="lbl">答题数</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="mini-stat">
                  <span class="val">{{ detail.stats.accuracy ?? 0 }}%</span>
                  <span class="lbl">正确率</span>
                </div>
              </el-col>
            </el-row>
          </div>

          <el-button type="primary" class="grant-btn" @click="openGrantDialog(detail)">
            手动开通权益
          </el-button>
        </template>
      </div>
    </el-drawer>

    <el-dialog v-model="grantVisible" title="手动开通权益" width="480px" destroy-on-close>
      <el-form ref="grantFormRef" :model="grantForm" :rules="grantRules" label-width="90px">
        <el-form-item label="用户">
          <span>{{ grantUser?.nickName || grantUser?.id }}</span>
        </el-form-item>
        <el-form-item label="权益类型" prop="entitlementType">
          <el-select v-model="grantForm.entitlementType" style="width: 100%">
            <el-option label="全部解锁" value="all" />
            <el-option label="品类" value="category" />
            <el-option label="课程" value="course" />
            <el-option label="题库包" value="examPack" />
            <el-option label="会员" value="membership" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="grantForm.entitlementType !== 'all'" label="资源 ID">
          <el-input v-model="grantForm.resourceId" placeholder="如 nanny / c1 / nanny_exam" />
        </el-form-item>
        <el-form-item label="到期时间">
          <el-date-picker
            v-model="grantForm.expireAt"
            type="datetime"
            placeholder="选择到期时间"
            style="width: 100%"
            value-format="YYYY-MM-DDTHH:mm:ss+08:00"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="grantForm.remark" type="textarea" :rows="2" placeholder="如：活动赠送" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="grantVisible = false">取消</el-button>
        <el-button type="primary" :loading="grantLoading" @click="handleGrant">确认开通</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const detailLoading = ref(false)
const grantLoading = ref(false)
const drawerVisible = ref(false)
const grantVisible = ref(false)
const grantFormRef = ref()
const list = ref([])
const detail = ref(null)
const grantUser = ref(null)

const filters = reactive({ keyword: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const grantForm = reactive({
  entitlementType: 'all',
  resourceId: '',
  expireAt: '',
  remark: ''
})

const grantRules = {
  entitlementType: [{ required: true, message: '请选择权益类型', trigger: 'change' }]
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-CN')
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('zh-CN')
}

function resetFilters() {
  filters.keyword = ''
  pagination.page = 1
  fetchList()
}

async function fetchList() {
  loading.value = true
  try {
    const data = await request.get('/admin/users', {
      params: {
        keyword: filters.keyword || undefined,
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

async function openDetail(id) {
  drawerVisible.value = true
  detail.value = null
  detailLoading.value = true
  try {
    detail.value = await request.get(`/admin/users/${id}`)
  } catch {
    drawerVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

function openGrantDialog(user) {
  grantUser.value = user
  grantForm.entitlementType = 'all'
  grantForm.resourceId = ''
  grantForm.expireAt = ''
  grantForm.remark = ''
  grantVisible.value = true
}

async function handleGrant() {
  const valid = await grantFormRef.value?.validate().catch(() => false)
  if (!valid || !grantUser.value) return

  grantLoading.value = true
  try {
    await request.post(`/admin/users/${grantUser.value.id}/grant`, {
      entitlementType: grantForm.entitlementType,
      resourceId: grantForm.entitlementType === 'all' ? null : grantForm.resourceId || null,
      expireAt: grantForm.expireAt || null,
      remark: grantForm.remark
    })
    ElMessage.success('权益开通成功')
    grantVisible.value = false
    fetchList()
    if (drawerVisible.value && detail.value?.id === grantUser.value.id) {
      openDetail(grantUser.value.id)
    }
  } catch {
    // handled
  } finally {
    grantLoading.value = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-header h3 {
  margin: 0 0 4px;
  font-size: 18px;
}

.detail-header p {
  margin: 0;
  color: var(--sb-text-secondary);
  font-size: 13px;
}

.detail-desc {
  margin-bottom: 20px;
}

.stats-block h4 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
}

.mini-stat {
  background: var(--sb-bg);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.mini-stat .val {
  display: block;
  font-size: 20px;
  font-weight: 600;
}

.mini-stat .lbl {
  font-size: 12px;
  color: var(--sb-text-secondary);
}

.grant-btn {
  margin-top: 16px;
  width: 100%;
}
</style>
