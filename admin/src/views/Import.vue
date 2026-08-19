<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">题库导入</h2>
    </div>

    <div class="page-card upload-section">
      <h3>上传 Excel 文件</h3>
      <p class="hint">支持 .xlsx 格式，上传后可预览并确认导入</p>

      <el-form :inline="true" class="upload-form">
        <el-form-item label="品类 ID">
          <el-input-number v-model="uploadParams.categoryId" :min="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="子分类 ID">
          <el-input-number v-model="uploadParams.subcategoryId" :min="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="默认免费">
          <el-switch v-model="uploadParams.defaultIsFree" />
        </el-form-item>
      </el-form>

      <el-upload
        ref="uploadRef"
        drag
        :auto-upload="false"
        :limit="1"
        accept=".xlsx,.xls"
        :on-change="handleFileChange"
        :on-exceed="handleExceed"
      >
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">仅支持 xlsx / xls 文件</div>
        </template>
      </el-upload>

      <el-button
        type="primary"
        :loading="previewLoading"
        :disabled="!selectedFile"
        class="preview-btn"
        @click="handlePreview"
      >
        预览数据
      </el-button>
    </div>

    <div v-if="previewData" class="page-card preview-section">
      <div class="preview-header">
        <h3>预览结果</h3>
        <div class="preview-stats">
          <el-tag type="info">共 {{ previewData.totalRows }} 行</el-tag>
          <el-tag type="success">有效 {{ previewData.validRows }} 行</el-tag>
          <el-tag type="danger">无效 {{ previewData.invalidRows }} 行</el-tag>
        </div>
      </div>

      <el-table :data="previewData.items" max-height="480" border>
        <el-table-column prop="rowNo" label="行号" width="70" />
        <el-table-column prop="valid" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.valid ? 'success' : 'danger'" size="small">
              {{ row.valid ? '有效' : '无效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="题干" min-width="200">
          <template #default="{ row }">
            {{ row.parsed?.stem || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="题型" width="80">
          <template #default="{ row }">
            {{ typeLabel(row.parsed?.type) }}
          </template>
        </el-table-column>
        <el-table-column label="子分类" width="120">
          <template #default="{ row }">
            {{ row.parsed?.subcategoryName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="错误信息" min-width="160">
          <template #default="{ row }">
            <span v-if="row.errors?.length" class="error-text">{{ row.errors.join('；') }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="confirm-bar">
        <el-checkbox v-model="skipInvalidRows">跳过无效行</el-checkbox>
        <el-button type="primary" :loading="confirmLoading" @click="handleConfirm">
          确认导入
        </el-button>
      </div>

      <div v-if="importResult" class="import-result">
        <el-alert
          :title="`导入完成：成功 ${importResult.successRows} 行，失败 ${importResult.failRows} 行`"
          :type="importResult.status === 'success' ? 'success' : 'warning'"
          show-icon
          :closable="false"
        />
        <p v-if="importResult.importJobId">任务 ID：{{ importResult.importJobId }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const uploadRef = ref()
const selectedFile = ref(null)
const previewLoading = ref(false)
const confirmLoading = ref(false)
const previewData = ref(null)
const importResult = ref(null)
const skipInvalidRows = ref(true)

const uploadParams = reactive({
  categoryId: 1,
  subcategoryId: null,
  defaultIsFree: false
})

function typeLabel(type) {
  return { single: '单选', multiple: '多选', judge: '判断' }[type] || type || '-'
}

function handleFileChange(file) {
  selectedFile.value = file.raw
  previewData.value = null
  importResult.value = null
}

function handleExceed() {
  ElMessage.warning('只能上传一个文件，请先移除当前文件')
}

async function handlePreview() {
  if (!selectedFile.value) return

  previewLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    if (uploadParams.categoryId) formData.append('categoryId', uploadParams.categoryId)
    if (uploadParams.subcategoryId) formData.append('subcategoryId', uploadParams.subcategoryId)
    formData.append('defaultIsFree', uploadParams.defaultIsFree)

    previewData.value = await request.post('/admin/quiz/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    ElMessage.success('预览完成')
  } catch {
    previewData.value = null
  } finally {
    previewLoading.value = false
  }
}

async function handleConfirm() {
  if (!previewData.value?.previewId) return

  confirmLoading.value = true
  try {
    importResult.value = await request.post('/admin/quiz/import/confirm', {
      previewId: previewData.value.previewId,
      categoryId: uploadParams.categoryId,
      subcategoryId: uploadParams.subcategoryId,
      defaultIsFree: uploadParams.defaultIsFree,
      skipInvalidRows: skipInvalidRows.value
    })
    ElMessage.success('导入任务已提交')
  } catch {
    importResult.value = null
  } finally {
    confirmLoading.value = false
  }
}
</script>

<style scoped>
.upload-section h3,
.preview-section h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.hint {
  color: var(--sb-text-secondary);
  font-size: 14px;
  margin: 0 0 16px;
}

.upload-form {
  margin-bottom: 16px;
}

.upload-icon {
  font-size: 48px;
  color: var(--sb-accent);
  margin-bottom: 8px;
}

.preview-btn {
  margin-top: 16px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.preview-stats {
  display: flex;
  gap: 8px;
}

.preview-section {
  margin-top: 20px;
}

.error-text {
  color: #ff3b30;
  font-size: 13px;
}

.confirm-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}

.import-result {
  margin-top: 16px;
}

.import-result p {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--sb-text-secondary);
}
</style>
