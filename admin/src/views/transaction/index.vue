<template>
  <div class="transaction-page">
    <div class="filter-bar">
      <el-input v-model="filters.id" placeholder="编号" style="width: 120px" clearable />
      <el-date-picker v-model="filters.build_date" type="month" placeholder="建造时间" style="width: 150px" value-format="YYYY-MM" />
      <el-input v-model="filters.price" placeholder="售价" style="width: 120px" clearable />
      <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
    </div>

    <el-table :data="tableData" border stripe style="width: 100%" size="small" @row-click="showDetail">
      <el-table-column prop="id" label="编号" width="70" />
      <el-table-column prop="ship_no" label="船舶编号" width="140" />
      <el-table-column prop="buyer_name" label="买家" width="90" />
      <el-table-column prop="seller_name" label="卖家" width="90" />
      <el-table-column prop="deadweight" label="载重吨" width="80" />
      <el-table-column prop="gross_tonnage" label="总吨" width="70" />
      <el-table-column prop="build_date" label="建造时间" width="100" />
      <el-table-column prop="engine_brand" label="主机品牌" width="90" />
      <el-table-column prop="engine_power" label="主机功力" width="80">
        <template #default="{ row }">{{ row.engine_power }}KW</template>
      </el-table-column>
      <el-table-column prop="water_type" label="水域" width="70" />
      <el-table-column prop="price" label="成交价" width="110">
        <template #default="{ row }">
          <span style="color: #CC0000; font-weight: bold">{{ row.price }}万元</span>
        </template>
      </el-table-column>
      <el-table-column prop="deal_date" label="成交日期" width="110" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" text size="small" @click.stop="showDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="交易详情" width="700px">
      <div class="detail-grid" v-if="currentItem">
        <div class="detail-item"><span class="dl">编号：</span>{{ currentItem.id }}</div>
        <div class="detail-item"><span class="dl">船舶编号：</span>{{ currentItem.ship_no }}</div>
        <div class="detail-item"><span class="dl">总长：</span>{{ currentItem.total_length }}米</div>
        <div class="detail-item"><span class="dl">型宽：</span>{{ currentItem.width }}米</div>
        <div class="detail-item"><span class="dl">型深：</span>{{ currentItem.depth }}米</div>
        <div class="detail-item"><span class="dl">载重吨：</span>{{ currentItem.deadweight }}吨</div>
        <div class="detail-item"><span class="dl">总吨：</span>{{ currentItem.gross_tonnage }}吨</div>
        <div class="detail-item"><span class="dl">建造时间：</span>{{ currentItem.build_date }}</div>
        <div class="detail-item"><span class="dl">主机品牌：</span>{{ currentItem.engine_brand }}</div>
        <div class="detail-item"><span class="dl">主机功力：</span>{{ currentItem.engine_power }}KW</div>
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
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { mockTransactions } from '../../utils/mock'

const allData = ref([...mockTransactions])
const filters = ref({ id: '', build_date: '', price: '' })
const detailVisible = ref(false)
const currentItem = ref(null)

const tableData = computed(() => {
  let data = allData.value
  if (filters.value.id) data = data.filter(d => String(d.id).includes(filters.value.id))
  if (filters.value.build_date) data = data.filter(d => d.build_date === filters.value.build_date)
  if (filters.value.price) data = data.filter(d => d.price >= Number(filters.value.price))
  return data
})

function handleSearch() {}

function showDetail(row) {
  currentItem.value = row
  detailVisible.value = true
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
