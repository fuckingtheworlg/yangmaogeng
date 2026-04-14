<template>
  <div class="ship-page">
    <!-- 筛选条件栏 -->
    <div class="filter-bar">
      <el-input v-model="filters.ship_no" placeholder="编号" style="width: 150px" size="default" clearable />
      <el-input v-model="filters.deadweight" placeholder="载货/吨" style="width: 120px" size="default" clearable />
      <el-input v-model="filters.gross_tonnage" placeholder="总吨位" style="width: 120px" size="default" clearable />
      <el-input v-model="filters.depth" placeholder="吨度" style="width: 100px" size="default" clearable />
      <el-date-picker v-model="filters.build_date" type="month" placeholder="建造时间" style="width: 150px" size="default" value-format="YYYY-MM" />
      <el-input v-model="filters.price" placeholder="售价" style="width: 120px" size="default" clearable />
      <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
      <el-button type="danger" @click="handleAdd" :icon="Plus">新增</el-button>
    </div>

    <!-- 数据表格 -->
    <el-table :data="tableData" border stripe style="width: 100%" size="small" @row-click="handleRowClick">
      <el-table-column prop="ship_no" label="编号" width="140" />
      <el-table-column prop="ship_type" label="船型" width="80" />
      <el-table-column prop="total_length" label="总长" width="70" />
      <el-table-column prop="width" label="型宽" width="70" />
      <el-table-column prop="depth" label="型深" width="70" />
      <el-table-column prop="deadweight" label="载荷吨" width="80" />
      <el-table-column prop="gross_tonnage" label="总吨" width="70" />
      <el-table-column prop="build_date" label="建造时间" width="100" />
      <el-table-column prop="build_province" label="建造省" width="80" />
      <el-table-column prop="engine_brand" label="主机品牌" width="90" />
      <el-table-column prop="engine_power" label="主机功力" width="90">
        <template #default="{ row }">{{ row.engine_power }}KW</template>
      </el-table-column>
      <el-table-column prop="water_type" label="内河/近海" width="90" />
      <el-table-column prop="ship_condition" label="船况" width="70" />
      <el-table-column prop="price" label="估价" width="100">
        <template #default="{ row }">
          <span style="color: #CC0000; font-weight: bold">{{ row.price }}万元</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" text size="small" @click.stop="handleEdit(row)">编辑</el-button>
          <el-button type="danger" text size="small" @click.stop="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="船舶详情" width="700px">
      <div class="detail-grid" v-if="currentShip">
        <div class="detail-item"><span class="dl">编号：</span>{{ currentShip.ship_no }}</div>
        <div class="detail-item"><span class="dl">船型：</span>{{ currentShip.ship_type }}</div>
        <div class="detail-item"><span class="dl">总长：</span>{{ currentShip.total_length }}米</div>
        <div class="detail-item"><span class="dl">型宽：</span>{{ currentShip.width }}米</div>
        <div class="detail-item"><span class="dl">型深：</span>{{ currentShip.depth }}米</div>
        <div class="detail-item"><span class="dl">载荷吨：</span>{{ currentShip.deadweight }}吨</div>
        <div class="detail-item"><span class="dl">总吨：</span>{{ currentShip.gross_tonnage }}吨</div>
        <div class="detail-item"><span class="dl">建造时间：</span>{{ currentShip.build_date }}</div>
        <div class="detail-item"><span class="dl">建造省：</span>{{ currentShip.build_province }}</div>
        <div class="detail-item"><span class="dl">港籍：</span>{{ currentShip.port_registry }}</div>
        <div class="detail-item"><span class="dl">主机品牌：</span>{{ currentShip.engine_brand }}</div>
        <div class="detail-item"><span class="dl">主机功力：</span>{{ currentShip.engine_power }}KW</div>
        <div class="detail-item"><span class="dl">水域：</span>{{ currentShip.water_type }}</div>
        <div class="detail-item"><span class="dl">船况：</span>{{ currentShip.ship_condition }}</div>
        <div class="detail-item"><span class="dl">估价：</span><span style="color:#CC0000;font-weight:bold">{{ currentShip.price }}万元</span></div>
        <div class="detail-item"><span class="dl">联系人：</span>{{ currentShip.contact_name }}</div>
        <div class="detail-item"><span class="dl">电话：</span>{{ currentShip.contact_phone }}</div>
      </div>
    </el-dialog>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="formVisible" :title="isEdit ? '编辑船舶' : '新增船舶'" width="700px">
      <el-form :model="shipForm" label-width="100px" size="default">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="船舶编号"><el-input v-model="shipForm.ship_no" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="船型">
              <el-select v-model="shipForm.ship_type" style="width: 100%">
                <el-option label="川船" value="川船" />
                <el-option label="海船" value="海船" />
                <el-option label="散货船" value="散货船" />
                <el-option label="集装箱船" value="集装箱船" />
                <el-option label="油船" value="油船" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="总长(米)"><el-input-number v-model="shipForm.total_length" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="型宽(米)"><el-input-number v-model="shipForm.width" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="型深(米)"><el-input-number v-model="shipForm.depth" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="载重吨"><el-input-number v-model="shipForm.deadweight" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="总吨"><el-input-number v-model="shipForm.gross_tonnage" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="建造时间"><el-date-picker v-model="shipForm.build_date" type="month" value-format="YYYY-MM" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="建造省份"><el-input v-model="shipForm.build_province" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="港籍"><el-input v-model="shipForm.port_registry" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="水域类型">
              <el-select v-model="shipForm.water_type" style="width: 100%">
                <el-option label="内河" value="内河" /><el-option label="近海" value="近海" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="主机品牌"><el-input v-model="shipForm.engine_brand" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="主机功力(KW)"><el-input-number v-model="shipForm.engine_power" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="船况"><el-input v-model="shipForm.ship_condition" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="估价(万元)"><el-input-number v-model="shipForm.price" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="联系人"><el-input v-model="shipForm.contact_name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="联系电话"><el-input v-model="shipForm.contact_phone" /></el-form-item></el-col>
        </el-row>
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
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mockShips } from '../../utils/mock'

const allData = ref([...mockShips])
const filters = ref({ ship_no: '', deadweight: '', gross_tonnage: '', depth: '', build_date: '', price: '' })
const detailVisible = ref(false)
const formVisible = ref(false)
const isEdit = ref(false)
const currentShip = ref(null)

const emptyForm = { ship_no: '', ship_type: '川船', total_length: 0, width: 0, depth: 0, deadweight: 0, gross_tonnage: 0, build_date: '', build_province: '', port_registry: '', engine_brand: '', engine_power: 0, water_type: '内河', ship_condition: '', price: 0, contact_name: '', contact_phone: '' }
const shipForm = ref({ ...emptyForm })

const tableData = computed(() => {
  let data = allData.value
  const f = filters.value
  if (f.ship_no) data = data.filter(d => d.ship_no.includes(f.ship_no))
  if (f.deadweight) data = data.filter(d => d.deadweight >= Number(f.deadweight))
  if (f.gross_tonnage) data = data.filter(d => d.gross_tonnage >= Number(f.gross_tonnage))
  if (f.build_date) data = data.filter(d => d.build_date === f.build_date)
  if (f.price) data = data.filter(d => d.price >= Number(f.price))
  return data
})

function handleSearch() {}

function handleRowClick(row) {
  currentShip.value = row
  detailVisible.value = true
}

function handleAdd() {
  isEdit.value = false
  shipForm.value = { ...emptyForm }
  formVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  shipForm.value = { ...row }
  formVisible.value = true
}

function handleSave() {
  if (isEdit.value) {
    const idx = allData.value.findIndex(d => d.id === shipForm.value.id)
    if (idx !== -1) allData.value[idx] = { ...shipForm.value }
    ElMessage.success('编辑成功')
  } else {
    const newId = Math.max(...allData.value.map(d => d.id)) + 1
    allData.value.unshift({ ...shipForm.value, id: newId })
    ElMessage.success('新增成功')
  }
  formVisible.value = false
}

function handleDelete(row) {
  ElMessageBox.confirm('确定删除该船舶数据？', '提示', { type: 'warning' }).then(() => {
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
  flex-wrap: wrap;
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
