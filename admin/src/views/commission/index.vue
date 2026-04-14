<template>
  <div class="commission-page">
    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="编号/电话" style="width: 160px" clearable />
      <el-select v-model="filters.status" placeholder="状态" style="width: 120px" clearable>
        <el-option label="待处理" :value="0" />
        <el-option label="已处理" :value="1" />
        <el-option label="已关闭" :value="2" />
      </el-select>
      <el-button type="primary" @click="fetchData" :icon="Search">搜索</el-button>
    </div>

    <el-tabs v-model="activeTab" type="card" @tab-change="fetchData">
      <el-tab-pane label="购买请求" name="buy">
        <el-table :data="tableData" border stripe size="small" @row-click="showDetail" v-loading="loading">
          <el-table-column prop="id" label="编号" width="70" />
          <el-table-column prop="contact_name" label="称呼" width="90" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column prop="total_length" label="总长" width="70" />
          <el-table-column prop="deadweight" label="吨位" width="80" />
          <el-table-column prop="gross_tonnage" label="总吨" width="80" />
          <el-table-column prop="engine_brand" label="主机品牌" width="90" />
          <el-table-column prop="engine_power" label="主机力量" width="90">
            <template #default="{ row }">{{ row.engine_power }}千瓦</template>
          </el-table-column>
          <el-table-column prop="budget" label="预算" width="100">
            <template #default="{ row }">
              <span style="color:#CC0000;font-weight:bold" v-if="row.budget">{{ row.budget }}万元</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusMap[row.status]?.type" size="small">{{ statusMap[row.status]?.label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" text size="small" @click.stop="handleProcess(row)" :disabled="row.status !== 0">处理</el-button>
              <el-button type="danger" text size="small" @click.stop="handleClose(row)" :disabled="row.status === 2">关闭</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="出售请求" name="sell">
        <el-table :data="tableData" border stripe size="small" @row-click="showDetail" v-loading="loading">
          <el-table-column prop="id" label="编号" width="70" />
          <el-table-column prop="contact_name" label="称呼" width="90" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column prop="total_length" label="总长" width="70" />
          <el-table-column prop="width" label="型宽" width="70" />
          <el-table-column prop="depth" label="型深" width="70" />
          <el-table-column prop="deadweight" label="载重吨" width="80" />
          <el-table-column prop="gross_tonnage" label="总吨" width="70" />
          <el-table-column prop="build_date" label="建造时间" width="100" />
          <el-table-column prop="ship_type" label="船型" width="80" />
          <el-table-column prop="engine_brand" label="主机品牌" width="90" />
          <el-table-column prop="engine_power" label="主机力量" width="80">
            <template #default="{ row }">{{ row.engine_power }}千瓦</template>
          </el-table-column>
          <el-table-column prop="water_type" label="水域" width="70" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusMap[row.status]?.type" size="small">{{ statusMap[row.status]?.label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" text size="small" @click.stop="handleProcess(row)" :disabled="row.status !== 0">处理</el-button>
              <el-button type="danger" text size="small" @click.stop="handleClose(row)" :disabled="row.status === 2">关闭</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="detailVisible" title="委托详情" width="650px">
      <div class="detail-grid" v-if="currentItem">
        <div class="detail-item"><span class="dl">类型：</span>{{ currentItem.type === 'buy' ? '购买' : '出售' }}</div>
        <div class="detail-item"><span class="dl">称呼：</span>{{ currentItem.contact_name }}</div>
        <div class="detail-item"><span class="dl">电话：</span>{{ currentItem.phone }}</div>
        <div class="detail-item"><span class="dl">总长：</span>{{ currentItem.total_length }}米</div>
        <div class="detail-item"><span class="dl">型宽：</span>{{ currentItem.width }}米</div>
        <div class="detail-item"><span class="dl">型深：</span>{{ currentItem.depth }}米</div>
        <div class="detail-item"><span class="dl">载重吨：</span>{{ currentItem.deadweight }}吨</div>
        <div class="detail-item"><span class="dl">总吨：</span>{{ currentItem.gross_tonnage }}吨</div>
        <div class="detail-item"><span class="dl">主机品牌：</span>{{ currentItem.engine_brand }}</div>
        <div class="detail-item"><span class="dl">主机力量：</span>{{ currentItem.engine_power }}千瓦</div>
        <div class="detail-item" v-if="currentItem.budget"><span class="dl">预算：</span><span style="color:#CC0000;font-weight:bold">{{ currentItem.budget }}万元</span></div>
        <div class="detail-item" v-if="currentItem.remark"><span class="dl">备注：</span>{{ currentItem.remark }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getCommissions, updateCommission } from '../../api/admin'

const tableData = ref([])
const loading = ref(false)
const activeTab = ref('buy')
const filters = ref({ keyword: '', status: null })
const detailVisible = ref(false)
const currentItem = ref(null)

const statusMap = {
  0: { label: '待处理', type: 'warning' },
  1: { label: '已处理', type: 'success' },
  2: { label: '已关闭', type: 'info' }
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

function showDetail(row) {
  currentItem.value = row
  detailVisible.value = true
}

async function handleProcess(row) {
  try {
    const res = await updateCommission(row.id, { status: 1 })
    if (res.code === 200) {
      ElMessage.success('已处理')
      fetchData()
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

async function handleClose(row) {
  try {
    const res = await updateCommission(row.id, { status: 2 })
    if (res.code === 200) {
      ElMessage.success('已关闭')
      fetchData()
    }
  } catch (e) {
    ElMessage.error('操作失败')
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
.detail-grid {
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
