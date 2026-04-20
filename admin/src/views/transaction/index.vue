<template>
  <div class="transaction-page">
    <div class="filter-bar">
      <el-input v-model="filters.id" placeholder="编号" style="width: 120px" clearable />
      <el-date-picker v-model="filters.build_date" type="month" placeholder="建造时间" style="width: 150px" value-format="YYYY-MM" />
      <el-input v-model="filters.price" placeholder="售价" style="width: 120px" clearable />
      <el-button type="primary" @click="fetchData" :icon="Search">搜索</el-button>
    </div>

    <el-table :data="tableData" border stripe style="width: 100%" size="small" @row-click="showDetail" v-loading="loading">
      <el-table-column prop="id" label="编号" width="70" />
      <el-table-column prop="ship_no" label="船舶编号" width="140" />
      <el-table-column prop="buyer_name" label="买家" width="90" />
      <el-table-column prop="seller_name" label="卖家" width="90" />
      <el-table-column prop="deadweight" label="载重吨" width="80" />
      <el-table-column prop="gross_tonnage" label="总吨" width="70" />
      <el-table-column prop="ship_build_date" label="建造时间" width="100" />
      <el-table-column prop="engine_brand" label="主机品牌" width="90" />
      <el-table-column prop="engine_power" label="主机力量" width="80">
        <template #default="{ row }">{{ row.engine_power }}千瓦</template>
      </el-table-column>
      <el-table-column prop="water_type" label="水域" width="70" />
      <el-table-column prop="price" label="成交价" width="110">
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

    <el-dialog v-model="editVisible" title="修改交易记录" width="540px">
      <el-form :model="editForm" label-width="100px" v-if="editForm">
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
        <div class="detail-item"><span class="dl">编号：</span>{{ currentItem.id }}</div>
        <div class="detail-item"><span class="dl">船舶编号：</span>{{ currentItem.ship_no }}</div>
        <div class="detail-item"><span class="dl">载重吨：</span>{{ currentItem.deadweight }}吨</div>
        <div class="detail-item"><span class="dl">总吨：</span>{{ currentItem.gross_tonnage }}吨</div>
        <div class="detail-item"><span class="dl">建造时间：</span>{{ currentItem.ship_build_date }}</div>
        <div class="detail-item"><span class="dl">主机品牌：</span>{{ currentItem.engine_brand }}</div>
        <div class="detail-item"><span class="dl">主机力量：</span>{{ currentItem.engine_power }}千瓦</div>
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
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTransactions, updateTransaction, deleteTransaction } from '../../api/admin'

const tableData = ref([])
const loading = ref(false)
const saving = ref(false)
const filters = ref({ id: '', build_date: '', price: '' })
const detailVisible = ref(false)
const currentItem = ref(null)
const editVisible = ref(false)
const editForm = ref(null)

function openEdit(row) {
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
  saving.value = true
  try {
    const res = await updateTransaction(editForm.value.id, editForm.value)
    if (res.code === 200) {
      ElMessage.success('已保存')
      editVisible.value = false
      fetchData()
    }
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function fetchData() {
  loading.value = true
  try {
    const params = {}
    if (filters.value.id) params.id = filters.value.id
    if (filters.value.build_date) params.build_date = filters.value.build_date
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
