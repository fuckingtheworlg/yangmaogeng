<template>
  <div class="user-page">
    <div class="filter-bar">
      <el-input v-model="filters.id" placeholder="编号" style="width: 120px" clearable />
      <el-input v-model="filters.phone" placeholder="电话" style="width: 160px" clearable />
      <el-button type="primary" @click="fetchData" :icon="Search">搜索</el-button>
    </div>

    <el-table :data="tableData" border stripe style="width: 100%" size="small" v-loading="loading">
      <el-table-column label="编号" width="100">
        <template #default="{ row }">{{ String(row.id).padStart(5, '0') }}</template>
      </el-table-column>
      <el-table-column prop="nickname" label="用户名" width="140" />
      <el-table-column prop="phone" label="电话" width="140" />
      <el-table-column label="委托编号" min-width="260">
        <template #default="{ row }">
          <el-tag
            v-for="code in parseIds(row.commission_codes)"
            :key="code"
            size="small"
            effect="plain"
            :type="code.startsWith('GM') ? 'warning' : 'success'"
            style="margin: 2px 4px 2px 0; cursor: pointer"
            @click="goCommission(code)"
          >{{ code }}</el-tag>
          <span v-if="!parseIds(row.commission_codes).length" style="color:#bbb">-</span>
        </template>
      </el-table-column>
      <el-table-column label="关注编号" min-width="260">
        <template #default="{ row }">
          <el-tag
            v-for="sn in parseIds(row.favorite_ship_nos)"
            :key="sn"
            type="info"
            size="small"
            effect="plain"
            style="margin: 2px 4px 2px 0; cursor: pointer"
            @click="goShipByNo(sn)"
          >{{ sn }}</el-tag>
          <span v-if="!parseIds(row.favorite_ship_nos).length" style="color:#bbb">-</span>
        </template>
      </el-table-column>
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
        <el-button type="danger" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsers, updateUser, deleteUser } from '../../api/admin'

const router = useRouter()

function parseIds(str) {
  if (!str) return []
  return String(str).split(',').filter(Boolean).map(s => s.trim())
}

function goCommission(code) {
  router.push({ path: '/commission', query: { keyword: code } })
}

function goShipByNo(shipNo) {
  router.push({ path: '/ship', query: { ship_no: shipNo } })
}

const tableData = ref([])
const loading = ref(false)
const saving = ref(false)
const filters = ref({ id: '', phone: '' })
const formVisible = ref(false)
const userForm = ref({ nickname: '', phone: '' })

async function fetchData() {
  loading.value = true
  try {
    const params = {}
    if (filters.value.id) params.id = filters.value.id
    if (filters.value.phone) params.phone = filters.value.phone
    const res = await getUsers(params)
    if (res.code === 200) {
      tableData.value = res.data.list || []
    }
  } catch (e) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

function handleEdit(row) {
  userForm.value = { ...row }
  formVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    const res = await updateUser(userForm.value.id, { nickname: userForm.value.nickname, phone: userForm.value.phone })
    if (res.code === 200) {
      ElMessage.success('保存成功')
      formVisible.value = false
      fetchData()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm('确定删除该用户？', '提示', { type: 'warning' }).then(async () => {
    try {
      const res = await deleteUser(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchData()
      }
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => fetchData())
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
