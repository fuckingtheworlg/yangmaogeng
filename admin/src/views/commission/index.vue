<template>
  <div class="commission-page">
    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="编号/电话" style="width: 160px" clearable />
      <el-select v-model="filters.status" placeholder="状态" style="width: 120px" clearable>
        <el-option label="待处理" :value="0" />
        <el-option label="已达成" :value="1" />
        <el-option label="已成交" :value="2" />
        <el-option label="已拒绝" :value="3" />
        <el-option label="已失效" :value="4" />
      </el-select>
      <el-button type="primary" @click="fetchData" :icon="Search">搜索</el-button>
    </div>

    <el-tabs v-model="activeTab" type="card" @tab-change="fetchData">
      <el-tab-pane label="购买请求" name="buy">
        <el-table :data="tableData" border stripe size="small" v-loading="loading">
          <el-table-column prop="id" label="编号" width="80">
            <template #default="{ row }">GM{{ codeOf(row) }}</template>
          </el-table-column>
          <el-table-column prop="contact_name" label="姓名" width="90" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column prop="total_length" label="总长" width="70" />
          <el-table-column prop="deadweight" label="载货吨" width="80" />
          <el-table-column prop="gross_tonnage" label="总吨" width="80" />
          <el-table-column prop="build_date" label="建造时间" width="100" />
          <el-table-column prop="build_province" label="建造地点" width="90" />
          <el-table-column prop="engine_brand" label="主机品牌" width="90" />
          <el-table-column prop="engine_power" label="主机功率" width="90">
            <template #default="{ row }">{{ row.engine_power }}千瓦</template>
          </el-table-column>
          <el-table-column prop="water_type" label="水域" width="70" />
          <el-table-column prop="ship_type" label="船型" width="80" />
          <el-table-column prop="budget" label="求购预算" width="100">
            <template #default="{ row }">
              <span style="color:#CC0000;font-weight:bold" v-if="row.budget">{{ row.budget }}万元</span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
          <el-table-column label="匹配编号" min-width="180">
            <template #default="{ row }">
              <el-tag
                v-for="sid in parseIds(row.matched_ship_ids)"
                :key="sid"
                size="small"
                style="margin-right: 4px; cursor: pointer"
                @click="goShip(sid)"
              >{{ sid }}</el-tag>
              <el-button v-if="row.status === 0" type="primary" text size="small" @click="openMatch(row)">
                {{ parseIds(row.matched_ship_ids).length ? '修改' : '匹配' }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusMap[row.status]?.type" size="small">{{ statusMap[row.status]?.label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button type="success" text size="small" @click="setStatus(row, 1)" :disabled="row.status !== 0">达成</el-button>
              <el-button type="warning" text size="small" @click="setStatus(row, 3)" :disabled="row.status !== 0">拒绝</el-button>
              <el-button type="info" text size="small" @click="setStatus(row, 4)" :disabled="row.status === 2">失效</el-button>
              <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="出售请求" name="sell">
        <el-table :data="tableData" border stripe size="small" v-loading="loading">
          <el-table-column prop="id" label="编号" width="80">
            <template #default="{ row }">CS{{ codeOf(row) }}</template>
          </el-table-column>
          <el-table-column prop="contact_name" label="姓名" width="90" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column prop="total_length" label="总长" width="70" />
          <el-table-column prop="width" label="型宽" width="70" />
          <el-table-column prop="depth" label="型深" width="70" />
          <el-table-column prop="deadweight" label="载重吨" width="80" />
          <el-table-column prop="gross_tonnage" label="总吨" width="70" />
          <el-table-column prop="build_date" label="建造时间" width="100" />
          <el-table-column prop="build_province" label="建造地点" width="90" />
          <el-table-column prop="engine_brand" label="主机品牌" width="90" />
          <el-table-column prop="engine_power" label="主机功率" width="80">
            <template #default="{ row }">{{ row.engine_power }}千瓦</template>
          </el-table-column>
          <el-table-column prop="water_type" label="水域" width="70" />
          <el-table-column prop="ship_type" label="船型" width="80" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusMap[row.status]?.type" size="small">{{ statusMap[row.status]?.label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" text size="small" @click="openImport(row)" :disabled="row.status !== 0">导入船舶库</el-button>
              <el-button type="warning" text size="small" @click="setStatus(row, 3)" :disabled="row.status !== 0">拒绝</el-button>
              <el-button type="info" text size="small" @click="setStatus(row, 4)" :disabled="row.status === 2">失效</el-button>
              <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 匹配船舶弹窗 -->
    <el-dialog v-model="matchVisible" title="匹配船舶" width="540px">
      <el-alert type="info" :closable="false" style="margin-bottom: 12px">
        在下方勾选匹配船舶，保存后将出现在"匹配编号"列。
      </el-alert>
      <el-select v-model="matchSelected" multiple filterable style="width: 100%" placeholder="选择匹配船舶">
        <el-option v-for="s in shipOptions" :key="s.id" :label="`${s.ship_no} · ${s.deadweight}吨`" :value="s.id" />
      </el-select>
      <template #footer>
        <el-button @click="matchVisible = false">取消</el-button>
        <el-button type="danger" @click="handleSaveMatch" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入船舶库弹窗 -->
    <el-dialog v-model="importVisible" title="导入至船舶信息库" width="720px">
      <el-form :model="importForm" label-width="100px" v-if="importForm">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="船舶编号"><el-input v-model="importForm.ship_no" placeholder="留空自动生成" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="船型"><el-input v-model="importForm.ship_type" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="总长(米)"><el-input-number v-model="importForm.total_length" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="型宽(米)"><el-input-number v-model="importForm.width" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="型深(米)"><el-input-number v-model="importForm.depth" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="载重吨"><el-input-number v-model="importForm.deadweight" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="总吨"><el-input-number v-model="importForm.gross_tonnage" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="建造时间"><el-input v-model="importForm.build_date" placeholder="YYYY-MM" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="建造地点"><el-input v-model="importForm.build_province" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="主机品牌"><el-input v-model="importForm.engine_brand" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="主机功率"><el-input-number v-model="importForm.engine_power" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="水域">
              <el-select v-model="importForm.water_type" style="width:100%">
                <el-option label="内河" value="内河" />
                <el-option label="沿海" value="沿海" />
                <el-option label="远洋" value="远洋" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="起价(万元)"><el-input-number v-model="importForm.price" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="danger" @click="handleImport" :loading="saving">确定导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCommissions, updateCommission, importCommissionToShip, getShips } from '../../api/admin'

const router = useRouter()
const tableData = ref([])
const loading = ref(false)
const saving = ref(false)
const activeTab = ref('buy')
const filters = ref({ keyword: '', status: null })

const statusMap = {
  0: { label: '待处理', type: 'warning' },
  1: { label: '已达成', type: 'success' },
  2: { label: '已成交', type: 'primary' },
  3: { label: '已拒绝', type: 'danger' },
  4: { label: '已失效', type: 'info' }
}

function codeOf(row) {
  const year = row.created_at ? new Date(row.created_at).getFullYear() : new Date().getFullYear()
  return `${year}${String(row.id).padStart(4, '0')}`
}

function parseIds(str) {
  if (!str) return []
  return String(str).split(',').filter(Boolean).map(s => s.trim())
}

function goShip(id) {
  router.push({ path: '/ship', query: { id } })
}

async function fetchData() {
  loading.value = true
  try {
    const params = { type: activeTab.value }
    if (filters.value.keyword) params.keyword = filters.value.keyword
    if (filters.value.status !== null && filters.value.status !== '') params.status = filters.value.status
    const res = await getCommissions(params)
    if (res.code === 200) {
      tableData.value = res.data.list || []
    }
  } catch (e) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

async function setStatus(row, status) {
  try {
    const res = await updateCommission(row.id, { status })
    if (res.code === 200) {
      ElMessage.success('已更新')
      fetchData()
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

function handleDelete(row) {
  ElMessageBox.confirm('确定删除该委托？', '提示', { type: 'warning' }).then(async () => {
    try {
      const res = await updateCommission(row.id, { status: 4 })
      if (res.code === 200) {
        ElMessage.success('已标记为失效')
        fetchData()
      }
    } catch (e) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

// 匹配弹窗
const matchVisible = ref(false)
const matchSelected = ref([])
const matchingRow = ref(null)
const shipOptions = ref([])

async function openMatch(row) {
  matchingRow.value = row
  matchSelected.value = parseIds(row.matched_ship_ids).map(Number)
  if (shipOptions.value.length === 0) {
    const res = await getShips({ pageSize: 100 })
    if (res.code === 200) shipOptions.value = res.data.list || []
  }
  matchVisible.value = true
}

async function handleSaveMatch() {
  saving.value = true
  try {
    const res = await updateCommission(matchingRow.value.id, {
      matched_ship_ids: matchSelected.value.join(',')
    })
    if (res.code === 200) {
      ElMessage.success('匹配已保存')
      matchVisible.value = false
      fetchData()
    }
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    saving.value = false
  }
}

// 导入船舶弹窗
const importVisible = ref(false)
const importForm = ref(null)
const importingRow = ref(null)

function openImport(row) {
  importingRow.value = row
  importForm.value = {
    ship_no: '',
    ship_type: row.ship_type || '',
    total_length: parseFloat(row.total_length) || 0,
    width: parseFloat(row.width) || 0,
    depth: parseFloat(row.depth) || 0,
    deadweight: row.deadweight || 0,
    gross_tonnage: row.gross_tonnage || 0,
    build_date: row.build_date || '',
    build_province: row.build_province || '',
    engine_brand: row.engine_brand || '',
    engine_power: row.engine_power || 0,
    water_type: row.water_type || '内河',
    price: row.budget || 0
  }
  importVisible.value = true
}

async function handleImport() {
  saving.value = true
  try {
    const res = await importCommissionToShip(importingRow.value.id, importForm.value)
    if (res.code === 200) {
      ElMessage.success(`已导入船舶库：${res.data.ship_no}`)
      importVisible.value = false
      fetchData()
    } else {
      ElMessage.error(res.message || '导入失败')
    }
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    saving.value = false
  }
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
