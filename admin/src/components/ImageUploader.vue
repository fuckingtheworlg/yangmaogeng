<template>
  <div class="image-uploader">
    <div class="img-list">
      <div class="img-item" v-for="(url, idx) in list" :key="idx">
        <el-image
          :src="resolveUrl(url)"
          :preview-src-list="list.map(resolveUrl)"
          :initial-index="idx"
          fit="cover"
          class="img-thumb"
          :hide-on-click-modal="true"
          preview-teleported
        />
        <div class="img-del" @click="remove(idx)">×</div>
      </div>
      <el-upload
        v-if="list.length < max"
        class="img-add"
        :action="action"
        name="file"
        :headers="headers"
        :show-file-list="false"
        :before-upload="beforeUpload"
        :on-success="onSuccess"
        :on-error="onError"
        accept="image/*"
      >
        <el-icon><Plus /></el-icon>
      </el-upload>
    </div>
    <div class="hint" v-if="hint">{{ hint }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  max: { type: Number, default: 9 },
  hint: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const action = '/api/upload'

const headers = computed(() => {
  const token = localStorage.getItem('admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

const list = computed(() => Array.isArray(props.modelValue) ? props.modelValue : [])

function resolveUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/uploads')) return url
  return url
}

function beforeUpload(file) {
  const isImg = /^image\//.test(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isImg) { ElMessage.warning('仅支持图片'); return false }
  if (!isLt10M) { ElMessage.warning('图片需小于 10MB'); return false }
  return true
}

function onSuccess(res) {
  if (res && res.code === 200 && res.data?.url) {
    emit('update:modelValue', [...list.value, res.data.url])
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(res?.message || '上传失败')
  }
}

function onError() {
  ElMessage.error('上传失败')
}

function remove(idx) {
  const copy = list.value.slice()
  copy.splice(idx, 1)
  emit('update:modelValue', copy)
}
</script>

<style scoped>
.image-uploader {
  width: 100%;
}
.img-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.img-item {
  position: relative;
  width: 92px;
  height: 92px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
}
.img-thumb {
  width: 100%;
  height: 100%;
}
.img-del {
  position: absolute;
  top: 0;
  right: 0;
  width: 22px;
  height: 22px;
  line-height: 20px;
  text-align: center;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  border-radius: 0 0 0 4px;
}
.img-add {
  width: 92px;
  height: 92px;
}
.img-add :deep(.el-upload) {
  width: 92px;
  height: 92px;
  border: 1px dashed #d0d7de;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
  transition: border-color 0.2s;
}
.img-add :deep(.el-upload:hover) {
  border-color: #409eff;
  color: #409eff;
}
.hint {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}
</style>
