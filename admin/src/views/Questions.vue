<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">题库管理</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增题目</el-button>
    </div>

    <div class="page-card">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索题干"
          clearable
          style="width: 220px"
          @keyup.enter="fetchList"
        />
        <el-select v-model="filters.type" placeholder="题型" clearable style="width: 120px">
          <el-option label="单选" value="single" />
          <el-option label="多选" value="multiple" />
          <el-option label="判断" value="judge" />
        </el-select>
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px">
          <el-option label="已发布" value="published" />
          <el-option label="草稿" value="draft" />
          <el-option label="已下架" value="offline" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="fetchList">查询</el-button>
        <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
      </div>

      <div class="batch-bar">
        <el-button
          type="success"
          :disabled="!selectedIds.length"
          @click="batchUpdateStatus('published')"
        >
          批量发布
        </el-button>
        <el-button
          type="warning"
          :disabled="!selectedIds.length"
          @click="batchUpdateStatus('offline')"
        >
          批量下架
        </el-button>
        <span v-if="selectedIds.length" class="selected-tip">已选 {{ selectedIds.length }} 项</span>
      </div>

      <el-table
        v-loading="loading"
        :data="list"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="题型" width="80">
          <template #default="{ row }">{{ typeLabel(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="stem" label="题干" min-width="240" show-overflow-tooltip />
        <el-table-column prop="categoryName" label="分类" width="120" />
        <el-table-column prop="subcategoryName" label="子分类" width="120" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isFree" label="免费" width="70">
          <template #default="{ row }">{{ row.isFree ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除该题目？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
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
      :title="editingId ? '编辑题目' : '新增题目'"
      width="640px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="题型" prop="type">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="单选" value="single" />
            <el-option label="多选" value="multiple" />
            <el-option label="判断" value="judge" />
          </el-select>
        </el-form-item>
        <el-form-item label="题干" prop="stem">
          <el-input v-model="form.stem" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item v-if="form.type !== 'judge'" label="选项">
          <div class="options-editor">
            <div v-for="(opt, idx) in form.options" :key="idx" class="option-row">
              <span class="option-label">{{ String.fromCharCode(65 + idx) }}</span>
              <el-input v-model="form.options[idx]" placeholder="选项内容" />
              <el-button
                v-if="form.options.length > 2"
                :icon="Delete"
                circle
                text
                type="danger"
                @click="removeOption(idx)"
              />
            </div>
            <el-button v-if="form.options.length < 6" text type="primary" @click="addOption">
              + 添加选项
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="答案" prop="answer">
          <el-select
            v-if="form.type === 'single' || form.type === 'judge'"
            v-model="form.answerSingle"
            style="width: 100%"
          >
            <el-option
              v-for="(opt, idx) in answerOptions"
              :key="idx"
              :label="opt.label"
              :value="idx"
            />
          </el-select>
          <el-select
            v-else
            v-model="form.answerMultiple"
            multiple
            style="width: 100%"
          >
            <el-option
              v-for="(opt, idx) in answerOptions"
              :key="idx"
              :label="opt.label"
              :value="idx"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="解析">
          <el-input v-model="form.analysis" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="知识点">
          <el-input v-model="form.knowledge" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="draft">草稿</el-radio>
            <el-radio value="published">发布</el-radio>
            <el-radio value="offline">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="免费">
          <el-switch v-model="form.isFree" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Search, Refresh, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()
const list = ref([])
const selectedIds = ref([])

const filters = reactive({ keyword: '', type: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const defaultForm = () => ({
  type: 'single',
  stem: '',
  options: ['', '', '', ''],
  answerSingle: 0,
  answerMultiple: [],
  analysis: '',
  knowledge: '',
  status: 'draft',
  isFree: false,
  categoryId: null,
  subcategoryId: null
})

const form = reactive(defaultForm())

const formRules = {
  type: [{ required: true, message: '请选择题型', trigger: 'change' }],
  stem: [{ required: true, message: '请输入题干', trigger: 'blur' }]
}

const answerOptions = computed(() => {
  if (form.type === 'judge') {
    return [{ label: '正确' }, { label: '错误' }]
  }
  return form.options.map((opt, idx) => ({
    label: `${String.fromCharCode(65 + idx)}. ${opt || '(空)'}`
  }))
})

function typeLabel(type) {
  return { single: '单选', multiple: '多选', judge: '判断' }[type] || type
}

function statusLabel(status) {
  return { published: '已发布', draft: '草稿', offline: '已下架' }[status] || status
}

function statusTagType(status) {
  return { published: 'success', draft: 'info', offline: 'warning' }[status] || ''
}

function handleSelectionChange(rows) {
  selectedIds.value = rows.map((r) => r.id)
}

function addOption() {
  form.options.push('')
}

function removeOption(idx) {
  form.options.splice(idx, 1)
}

function resetFilters() {
  filters.keyword = ''
  filters.type = ''
  filters.status = ''
  pagination.page = 1
  fetchList()
}

async function fetchList() {
  loading.value = true
  try {
    const data = await request.get('/admin/questions', {
      params: {
        keyword: filters.keyword || undefined,
        type: filters.type || undefined,
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

function openDialog(row) {
  editingId.value = row?.id || null
  Object.assign(form, defaultForm())
  if (row) {
    form.type = row.type
    form.stem = row.stem
    form.options = row.options?.length ? [...row.options] : ['', '', '', '']
    form.analysis = row.analysis || ''
    form.knowledge = row.knowledge || ''
    form.status = row.status || 'draft'
    form.isFree = !!row.isFree
    form.categoryId = row.categoryId
    form.subcategoryId = row.subcategoryId
    if (row.type === 'multiple') {
      form.answerMultiple = row.answer || []
    } else {
      form.answerSingle = row.answer?.[0] ?? 0
    }
  }
  dialogVisible.value = true
}

function buildPayload() {
  const answer =
    form.type === 'multiple' ? form.answerMultiple : [form.answerSingle]
  return {
    type: form.type,
    stem: form.stem,
    options: form.type === 'judge' ? ['正确', '错误'] : form.options.filter(Boolean),
    answer,
    analysis: form.analysis,
    knowledge: form.knowledge,
    status: form.status,
    isFree: form.isFree,
    categoryId: form.categoryId,
    subcategoryId: form.subcategoryId
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const payload = buildPayload()
    if (editingId.value) {
      await request.put(`/admin/questions/${editingId.value}`, payload)
      ElMessage.success('更新成功')
    } else {
      await request.post('/admin/questions', payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch {
    // handled by interceptor
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id) {
  try {
    await request.delete(`/admin/questions/${id}`)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
    // handled
  }
}

async function batchUpdateStatus(status) {
  try {
    await request.put('/admin/questions/batch-status', {
      questionIds: selectedIds.value,
      status
    })
    ElMessage.success(status === 'published' ? '批量发布成功' : '批量下架成功')
    selectedIds.value = []
    fetchList()
  } catch {
    // handled
  }
}

onMounted(fetchList)
</script>

<style scoped>
.batch-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.selected-tip {
  font-size: 13px;
  color: var(--sb-text-secondary);
}

.options-editor {
  width: 100%;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.option-label {
  width: 20px;
  font-weight: 600;
  color: var(--sb-text-secondary);
}
</style>
