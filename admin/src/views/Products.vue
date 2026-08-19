<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">商品管理</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增商品</el-button>
    </div>

    <div class="page-card">
      <div class="filter-bar">
        <el-select v-model="filters.type" placeholder="商品类型" clearable style="width: 140px">
          <el-option label="课程" value="course" />
          <el-option label="套餐" value="package" />
          <el-option label="会员" value="membership" />
          <el-option label="题库" value="exam" />
        </el-select>
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px">
          <el-option label="上架" value="active" />
          <el-option label="下架" value="inactive" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="fetchList">查询</el-button>
      </div>

      <el-table v-loading="loading" :data="list">
        <el-table-column prop="productCode" label="编码" width="100" />
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="90">
          <template #default="{ row }">{{ typeLabel(row.type) }}</template>
        </el-table-column>
        <el-table-column label="价格" width="100">
          <template #default="{ row }">¥{{ row.priceYuan || formatYuan(row.price) }}</template>
        </el-table-column>
        <el-table-column prop="salesCount" label="销量" width="80" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 'active'"
              active-text="上架"
              inactive-text="下架"
              inline-prompt
              :loading="row._toggling"
              @change="(val) => toggleStatus(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
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

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑商品' : '新增商品'"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="商品编码" prop="productCode">
          <el-input v-model="form.productCode" :disabled="!!editingId" />
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="课程" value="course" />
            <el-option label="套餐" value="package" />
            <el-option label="会员" value="membership" />
            <el-option label="题库" value="exam" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格（元）" prop="priceYuan">
          <el-input-number v-model="form.priceYuan" :min="0" :precision="2" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="原价（元）">
          <el-input-number v-model="form.originalPriceYuan" :min="0" :precision="2" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="封面色">
          <el-color-picker v-model="form.coverColor" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.desc" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="active">上架</el-radio>
            <el-radio value="inactive">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()
const list = ref([])

const filters = reactive({ type: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const defaultForm = () => ({
  productCode: '',
  title: '',
  type: 'course',
  priceYuan: 0,
  originalPriceYuan: 0,
  coverColor: '#007AFF',
  desc: '',
  status: 'active'
})

const form = reactive(defaultForm())

const formRules = {
  productCode: [{ required: true, message: '请输入商品编码', trigger: 'blur' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  priceYuan: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

function typeLabel(type) {
  return { course: '课程', package: '套餐', membership: '会员', exam: '题库' }[type] || type
}

function formatYuan(fen) {
  if (fen == null) return '0.00'
  return (fen / 100).toFixed(2)
}

async function fetchList() {
  loading.value = true
  try {
    const data = await request.get('/admin/products', {
      params: {
        type: filters.type || undefined,
        status: filters.status || undefined,
        page: pagination.page,
        pageSize: pagination.pageSize
      }
    })
    list.value = (data?.list || []).map((item) => ({ ...item, _toggling: false }))
    pagination.total = data?.pagination?.total || 0
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function openDialog(row) {
  editingId.value = row?.id || null
  Object.assign(form, defaultForm())
  if (row) {
    form.productCode = row.productCode
    form.title = row.title
    form.type = row.type
    form.priceYuan = row.price ? row.price / 100 : parseFloat(row.priceYuan || 0)
    form.originalPriceYuan = row.originalPrice ? row.originalPrice / 100 : 0
    form.coverColor = row.coverColor || '#007AFF'
    form.desc = row.desc || ''
    form.status = row.status || 'active'
  }
  dialogVisible.value = true
}

function buildPayload() {
  return {
    productCode: form.productCode,
    title: form.title,
    type: form.type,
    price: Math.round(form.priceYuan * 100),
    originalPrice: Math.round(form.originalPriceYuan * 100),
    coverColor: form.coverColor,
    desc: form.desc,
    status: form.status
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const payload = buildPayload()
    if (editingId.value) {
      await request.put(`/admin/products/${editingId.value}`, payload)
      ElMessage.success('更新成功')
    } else {
      await request.post('/admin/products', payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch {
    // handled
  } finally {
    submitting.value = false
  }
}

async function toggleStatus(row, active) {
  row._toggling = true
  try {
    await request.put(`/admin/products/${row.id}/status`, {
      status: active ? 'active' : 'inactive'
    })
    row.status = active ? 'active' : 'inactive'
    ElMessage.success(active ? '已上架' : '已下架')
  } catch {
    // revert handled by not updating
  } finally {
    row._toggling = false
  }
}

onMounted(fetchList)
</script>
