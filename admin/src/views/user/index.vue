<template>
  <div class="user-page">
    <div class="filter-bar">
      <el-input v-model="filters.id" placeholder="编号" style="width: 120px" clearable />
      <el-input v-model="filters.phone" placeholder="电话" style="width: 160px" clearable />
      <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
    </div>

    <el-table :data="tableData" border stripe style="width: 100%" size="small">
      <el-table-column prop="id" label="编号" width="80" />
      <el-table-column prop="nickname" label="用户名" width="120" />
      <el-table-column prop="phone" label="电话" width="140" />
      <el-table-column prop="commission_ids" label="委托编号" min-width="200" />
      <el-table-column prop="favorite_ids" label="关注编号" min-width="200" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" text size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="formVisible" title="编辑用户" width="500px">
      <el-form :model="userForm" label-width="80px">
        <el-form-item label="用户名"><el-input v-model="userForm.nickname" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="userForm.phone" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="danger" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mockUsers } from '../../utils/mock'

const allData = ref([...mockUsers])
const filters = ref({ id: '', phone: '' })
const formVisible = ref(false)
const userForm = ref({ nickname: '', phone: '' })

const tableData = computed(() => {
  let data = allData.value
  if (filters.value.id) data = data.filter(d => String(d.id).includes(filters.value.id))
  if (filters.value.phone) data = data.filter(d => d.phone.includes(filters.value.phone))
  return data
})

function handleSearch() {}

function handleEdit(row) {
  userForm.value = { ...row }
  formVisible.value = true
}

function handleSave() {
  const idx = allData.value.findIndex(d => d.id === userForm.value.id)
  if (idx !== -1) allData.value[idx] = { ...userForm.value }
  ElMessage.success('保存成功')
  formVisible.value = false
}

function handleDelete(row) {
  ElMessageBox.confirm('确定删除该用户？', '提示', { type: 'warning' }).then(() => {
    allData.value = allData.value.filter(d => d.id !== row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}
</style>
