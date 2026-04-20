<template>
  <div class="transaction-page">
    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="编号/船号" style="width: 160px" clearable />
      <el-input v-model="filters.deadweight" placeholder="载货吨" style="width: 120px" clearable />
      <el-input v-model="filters.price" placeholder="售价" style="width: 120px" clearable />
      <el-button type="primary" @click="fetchData" :icon="Search">搜索</el-button>
      <el-button type="danger" :icon="Plus" @click="openAdd">新增交易</el-button>
    </div>

    <el-table :data="tableData" border stripe style="width: 100%" size="small" @row-click="showDetail" v-loading="loading">
      <el-table-column prop="code" label="编号" width="130" />
      <el-table-column prop="ship_no" label="船舶编号" width="140" />
      <el-table-column prop="ship_name" label="船号" width="120" />
      <el-table-column prop="total_length" label="总长" width="70" />
      <el-table-column prop="width" label="型宽" width="70" />
      <el-table-column prop="depth" label="型深" width="70" />
      <el-table-column prop="deadweight" label="载货吨" width="80" />
      <el-table-column label="照片" width="80">
        <template #default="{ row }">
          <el-image
            v-if="firstImage(row.ship_images)"
            :src="resolveUrl(firstImage(row.ship_images))"
            :preview-src-list="parseList(row.ship_images).map(resolveUrl)"
            fit="cover"
            style="width:44px;height:44px;border-radius:4px"
            preview-teleported
          />
          <span v-else style="color:#bbb">-</span>
        </template>
      </el-table-column>
      <el-table-column label="证书" width="80">
        <template #default="{ row }">
          <el-image
            v-if="firstImage(row.ship_certificates)"
            :src="resolveUrl(firstImage(row.ship_certificates))"
            :preview-src-list="parseList(row.ship_certificates).map(resolveUrl)"
            fit="cover"
            style="width:44px;height:44px;border-radius:4px"
            preview-teleported
          />
          <span v-else style="color:#bbb">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="buyer_name" label="购买人" width="90" />
      <el-table-column prop="buyer_phone" label="电话" width="130" />
      <el-table-column prop="price" label="成交价格" width="120">
        <template #default="{ row }">
          <span style="color: #CC0000; font-weight: bold">{{ row.price }}万元</span>
        </template>
      </el-table-column>
      <el-table-column prop="deal_date" label="成交日期" width="110" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" text size="small" @click.stop="openEdit(row)">修改</el-button>
          <el-button type="danger" text size="small" @click.stop="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑交易弹窗 -->
    <el-dialog v-model="editVisible" :title="editMode === 'add' ? '新增交易记录' : '修改交易记录'" width="640px">
      <el-form :model="editForm" label-width="110px" v-if="editForm">
        <el-form-item label="选择船舶" v-if="editMode === 'add'">
          <el-select v-model="editForm.ship_id" filterable style="width:100%" placeholder="搜索船舶编号/船号" @change="onPickShip">
            <el-option
              v-for="s in shipOptions"
              :key="s.id"
              :label="`${s.ship_no}${s.ship_name ? ' · ' + s.ship_name : ''} · ${s.deadweight}吨`"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="买家姓名"><el-input v-model="editForm.buyer_name" /></el-form-item>
        <el-form-item label="买家电话"><el-input v-model="editForm.buyer_phone" /></el-form-item>
        <el-form-item label="卖家姓名"><el-input v-model="editForm.seller_name" /></el-form-item>
        <el-form-item label="卖家电话"><el-input v-model="editForm.seller_phone" /></el-form-item>
        <el-form-item label="成交价(万元)"><el-input-number v-model="editForm.price" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="成交日期"><el-date-picker v-model="editForm.deal_date" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="editForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="danger" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="交易详情" width="700px">
      <div class="detail-grid" v-if="currentItem">
        <div class="detail-item"><span class="dl">编号：</span>{{ currentItem.code }}</div>
        <div class="detail-item"><span class="dl">船舶编号：</span>{{ currentItem.ship_no }}</div>
        <div class="detail-item"><span class="dl">船号：</span>{{ currentItem.ship_name || '-' }}</div>
        <div class="detail-item"><span class="dl">总长：</span>{{ currentItem.total_length }}米</div>
        <div class="detail-item"><span class="dl">型宽：</span>{{ currentItem.width }}米</div>
        <div class="detail-item"><span class="dl">型深：</span>{{ currentItem.depth }}米</div>
        <div class="detail-item"><span class="dl">载货吨：</span>{{ currentItem.deadweight }}吨</div>
        <div class="detail-item"><span class="dl">总吨：</span>{{ currentItem.gross_tonnage }}吨</div>
        <div class="detail-item"><span class="dl">建造时间：</span>{{ currentItem.ship_build_date }}</div>
        <div class="detail-item"><span class="dl">主机品牌：</span>{{ currentItem.engine_brand }}</div>
        <div class="detail-item"><span class="dl">主机功率：</span>{{ currentItem.engine_power }}千瓦</div>
        <div class="detail-item"><span class="dl">水域：</span>{{ currentItem.water_type }}</div>
        <div class="detail-item"><span class="dl">成交价：</span><span style="color:#CC0000;font-weight:bold">{{ currentItem.price }}万元</span></div>
        <div class="detail-item"><span class="dl">成交日期：</span>{{ currentItem.deal_date }}</div>
      </div>
      <el-divider />
      <div class="contact-section" v-if="currentItem">
        <div class="detail-item"><span class="dl">买家：</span>{{ currentItem.buyer_name }}</div>
        <div class="detail-item"><span class="dl">买家电话：</span>{{ currentItem.buyer_phone }}</div>
        <div class="detail-item"><span class="dl">卖家：</span>{{ currentItem.seller_name }}</div>
        <div class="detail-item"><span class="dl">卖家电话：</span>{{ currentItem.seller_phone }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTransactions, addTransaction, updateTransaction, deleteTransaction, getShips } from '../../api/admin'

const API_BASE = 'http://47.114.89.50'
const tableData = ref([])
const loading = ref(false)
const saving = ref(false)
const filters = ref({ keyword: '', deadweight: '', price: '' })
const detailVisible = ref(false)
const currentItem = ref(null)

function parseList(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter(Boolean)
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.filter(Boolean) : []
  } catch {
    return []
  }
}
function firstImage(raw) {
  const list = parseList(raw)
  return list.length ? list[0] : ''
}
function resolveUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/uploads')) return API_BASE + url
  return url
}

async function fetchData() {
  loading.value = true
  try {
    const params = {}
    if (filters.value.keyword) params.keyword = filters.value.keyword
    if (filters.value.deadweight) params.deadweight = filters.value.deadweight
    if (filters.value.price) params.price = filters.value.price
    const res = await getTransactions(params)
    if (res.code === 200) {
      tableData.value = res.data.list || []
    }
  } catch (e) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

function showDetail(row) {
  currentItem.value = row
  detailVisible.value = true
}

const editVisible = ref(false)
const editMode = ref('add')
const editForm = ref(null)
const shipOptions = ref([])

async function loadShipOptions() {
  if (shipOptions.value.length > 0) return
  const res = await getShips({ pageSize: 200 })
  if (res.code === 200) shipOptions.value = res.data.list || []
}

async function openAdd() {
  editMode.value = 'add'
  editForm.value = {
    ship_id: null,
    buyer_name: '',
    buyer_phone: '',
    seller_name: '',
    seller_phone: '',
    price: 0,
    deal_date: new Date().toISOString().split('T')[0],
    remark: ''
  }
  await loadShipOptions()
  editVisible.value = true
}

function onPickShip(shipId) {
  const s = shipOptions.value.find(x => x.id === shipId)
  if (s) {
    editForm.value.seller_name = s.contact_name || ''
    editForm.value.seller_phone = s.contact_phone || ''
    editForm.value.price = parseFloat(s.price) || 0
  }
}

function openEdit(row) {
  editMode.value = 'edit'
  editForm.value = {
    id: row.id,
    buyer_name: row.buyer_name || '',
    buyer_phone: row.buyer_phone || '',
    seller_name: row.seller_name || '',
    seller_phone: row.seller_phone || '',
    price: parseFloat(row.price) || 0,
    deal_date: row.deal_date || '',
    remark: row.remark || ''
  }
  editVisible.value = true
}

async function handleSave() {
  if (editMode.value === 'add' && !editForm.value.ship_id) {
    ElMessage.warning('请选择船舶')
    return
  }
  if (!editForm.value.buyer_name || !editForm.value.price) {
    ElMessage.warning('请填写买家和成交价')
    return
  }
  saving.value = true
  try {
    const res = editMode.value === 'add'
      ? await addTransaction(editForm.value)
      : await updateTransaction(editForm.value.id, editForm.value)
    if (res.code === 200) {
      ElMessage.success('已保存')
      editVisible.value = false
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
  ElMessageBox.confirm('确定删除该交易记录？', '提示', { type: 'warning' }).then(async () => {
    try {
      const res = await deleteTransaction(row.id)
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
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.contact-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.detail-item {
  font-size: 14px;
  color: #333;
  padding: 4px 0;
}
.dl {
  color: #999;
}
</style>
