<template>
  <div class="ship-page">
    <div class="filter-bar">
      <el-input v-model="filters.ship_no" placeholder="编号" style="width: 150px" size="default" clearable />
      <el-input v-model="filters.deadweight" placeholder="载货/吨" style="width: 120px" size="default" clearable />
      <el-input v-model="filters.gross_tonnage" placeholder="总吨位" style="width: 120px" size="default" clearable />
      <el-input v-model="filters.depth" placeholder="吨度" style="width: 100px" size="default" clearable />
      <el-date-picker v-model="filters.build_date" type="month" placeholder="建造时间" style="width: 150px" size="default" value-format="YYYY-MM" />
      <el-input v-model="filters.price" placeholder="售价" style="width: 120px" size="default" clearable />
      <el-button type="primary" @click="fetchShips" :icon="Search">搜索</el-button>
      <el-button type="danger" @click="handleAdd" :icon="Plus">新增</el-button>
    </div>

    <el-table :data="tableData" border stripe style="width: 100%" size="small" @row-click="handleRowClick" v-loading="loading">
      <el-table-column prop="ship_no" label="编号" width="140" />
      <el-table-column prop="ship_name" label="船号" width="120" />
      <el-table-column prop="total_length" label="总长" width="70" />
      <el-table-column prop="width" label="型宽" width="70" />
      <el-table-column prop="depth" label="型深" width="70" />
      <el-table-column prop="deadweight" label="载货吨" width="80" />
      <el-table-column prop="gross_tonnage" label="总吨位" width="80" />
      <el-table-column prop="net_tonnage" label="净吨" width="70" />
      <el-table-column prop="port_registry" label="港籍" width="80" />
      <el-table-column prop="build_date" label="建造时间" width="100" />
      <el-table-column prop="build_province" label="建造地点" width="90" />
      <el-table-column prop="engine_brand" label="主机品牌" width="90" />
      <el-table-column prop="engine_power" label="主机功率" width="90">
        <template #default="{ row }">{{ row.engine_power }}千瓦</template>
      </el-table-column>
      <el-table-column prop="engine_count" label="主机数量" width="90">
        <template #default="{ row }">{{ row.engine_count || 1 }}台</template>
      </el-table-column>
      <el-table-column prop="water_type" label="内河/海船" width="90" />
      <el-table-column prop="ship_type" label="船型" width="80" />
      <el-table-column prop="price" label="售价" width="100">
        <template #default="{ row }">
          <span style="color: #CC0000; font-weight: bold">{{ formatPrice(row.price) }}万元</span>
        </template>
      </el-table-column>
      <el-table-column label="照片" width="80">
        <template #default="{ row }">
          <el-image
            v-if="firstImage(row.images)"
            :src="resolveUrl(firstImage(row.images))"
            :preview-src-list="parseList(row.images).map(resolveUrl)"
            fit="cover"
            style="width: 46px; height: 46px; border-radius: 4px"
            preview-teleported
          />
          <span v-else style="color:#bbb">-</span>
        </template>
      </el-table-column>
      <el-table-column label="证书" width="80">
        <template #default="{ row }">
          <el-image
            v-if="firstImage(row.certificates)"
            :src="resolveUrl(firstImage(row.certificates))"
            :preview-src-list="parseList(row.certificates).map(resolveUrl)"
            fit="cover"
            style="width: 46px; height: 46px; border-radius: 4px"
            preview-teleported
          />
          <span v-else style="color:#bbb">-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status).type" size="small">{{ statusTag(row.status).label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="360" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" text size="small" @click.stop="handleEdit(row)">编辑</el-button>
          <el-button
            :type="row.status === 1 ? 'warning' : 'success'"
            text size="small"
            @click.stop="handleToggleShelf(row)"
            :disabled="row.status === 2"
          >{{ row.status === 1 ? '下架' : '上架' }}</el-button>
          <el-button
            :type="row.is_carousel ? 'info' : 'primary'"
            text size="small"
            @click.stop="handleToggleCarousel(row)"
          >{{ row.is_carousel ? '取消轮播' : '轮播' }}</el-button>
          <el-button type="success" text size="small" @click.stop="openFinalize(row)" :disabled="row.status === 2">成交</el-button>
          <el-button type="danger" text size="small" @click.stop="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 成交弹窗 -->
    <el-dialog v-model="finalizeVisible" title="登记成交" width="540px">
      <el-form :model="finalizeForm" label-width="100px" v-if="finalizeShipRow">
        <el-alert type="info" :closable="false" style="margin-bottom: 16px">
          船舶：<b>{{ finalizeShipRow.ship_no }}</b> · 估价 {{ formatPrice(finalizeShipRow.price) }} 万元
        </el-alert>
        <el-form-item label="买家姓名"><el-input v-model="finalizeForm.buyer_name" placeholder="请输入买家姓名" /></el-form-item>
        <el-form-item label="买家电话"><el-input v-model="finalizeForm.buyer_phone" placeholder="请输入买家电话" /></el-form-item>
        <el-form-item label="卖家姓名"><el-input v-model="finalizeForm.seller_name" placeholder="可选" /></el-form-item>
        <el-form-item label="卖家电话"><el-input v-model="finalizeForm.seller_phone" placeholder="可选" /></el-form-item>
        <el-form-item label="成交价(万元)"><el-input-number v-model="finalizeForm.price" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="finalizeForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="finalizeVisible = false">取消</el-button>
        <el-button type="danger" @click="handleFinalize" :loading="finalizing">确认成交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="船舶详情" width="780px">
      <div class="detail-grid" v-if="currentShip">
        <div class="detail-item"><span class="dl">编号：</span>{{ currentShip.ship_no }}</div>
        <div class="detail-item"><span class="dl">船号：</span>{{ currentShip.ship_name || '-' }}</div>
        <div class="detail-item"><span class="dl">船型：</span>{{ currentShip.ship_type }}</div>
        <div class="detail-item"><span class="dl">总长：</span>{{ currentShip.total_length }}米</div>
        <div class="detail-item"><span class="dl">型宽：</span>{{ currentShip.width }}米</div>
        <div class="detail-item"><span class="dl">型深：</span>{{ currentShip.depth }}米</div>
        <div class="detail-item"><span class="dl">载货吨：</span>{{ currentShip.deadweight }}吨</div>
        <div class="detail-item"><span class="dl">总吨：</span>{{ currentShip.gross_tonnage }}吨</div>
        <div class="detail-item"><span class="dl">净吨：</span>{{ currentShip.net_tonnage || 0 }}吨</div>
        <div class="detail-item"><span class="dl">建造时间：</span>{{ currentShip.build_date }}</div>
        <div class="detail-item"><span class="dl">建造地点：</span>{{ currentShip.build_province }}</div>
        <div class="detail-item"><span class="dl">港籍：</span>{{ currentShip.port_registry }}</div>
        <div class="detail-item"><span class="dl">主机品牌：</span>{{ currentShip.engine_brand }}</div>
        <div class="detail-item"><span class="dl">主机功率：</span>{{ currentShip.engine_power }}千瓦</div>
        <div class="detail-item"><span class="dl">主机数量：</span>{{ currentShip.engine_count || 1 }}台</div>
        <div class="detail-item"><span class="dl">水域：</span>{{ currentShip.water_type }}</div>
        <div class="detail-item"><span class="dl">船况：</span>{{ currentShip.ship_condition }}</div>
        <div class="detail-item"><span class="dl">起价：</span>{{ formatPrice(currentShip.base_price) }}万元</div>
        <div class="detail-item"><span class="dl">售价：</span><span style="color:#CC0000;font-weight:bold">{{ formatPrice(currentShip.price) }}万元</span></div>
        <div class="detail-item"><span class="dl">联系人：</span>{{ currentShip.contact_name }}</div>
        <div class="detail-item"><span class="dl">电话：</span>{{ currentShip.contact_phone }}</div>
        <div class="detail-item" style="grid-column: span 2">
          <span class="dl">照片：</span>
          <el-image
            v-for="(url, i) in parseList(currentShip.images)"
            :key="'i'+i"
            :src="resolveUrl(url)"
            :preview-src-list="parseList(currentShip.images).map(resolveUrl)"
            :initial-index="i"
            fit="cover"
            style="width: 72px; height: 72px; margin: 4px; border-radius: 4px"
            preview-teleported
          />
          <span v-if="!parseList(currentShip.images).length" style="color:#bbb">-</span>
        </div>
        <div class="detail-item" style="grid-column: span 2">
          <span class="dl">证书：</span>
          <el-image
            v-for="(url, i) in parseList(currentShip.certificates)"
            :key="'c'+i"
            :src="resolveUrl(url)"
            :preview-src-list="parseList(currentShip.certificates).map(resolveUrl)"
            :initial-index="i"
            fit="cover"
            style="width: 72px; height: 72px; margin: 4px; border-radius: 4px"
            preview-teleported
          />
          <span v-if="!parseList(currentShip.certificates).length" style="color:#bbb">-</span>
        </div>
        <div class="detail-item" style="grid-column: span 2"><span class="dl">其他描述：</span>{{ currentShip.description || '-' }}</div>
      </div>
    </el-dialog>

    <el-dialog v-model="formVisible" :title="isEdit ? '编辑船舶' : '新增船舶'" width="780px">
      <el-form :model="shipForm" label-width="100px" size="default">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="船舶编号">
              <el-input v-model="shipForm.ship_no" placeholder="留空自动生成 YYYYMMDDXXXX" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="船号">
              <el-input v-model="shipForm.ship_name" placeholder="如 江海通达01" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="船型">
              <el-select v-model="shipForm.ship_type" style="width: 100%">
                <el-option label="干散货船" value="干散货船" />
                <el-option label="甲板船" value="甲板船" />
                <el-option label="集装箱船" value="集装箱船" />
                <el-option label="液货船" value="液货船" />
                <el-option label="客船" value="客船" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="船况">
              <el-select v-model="shipForm.ship_condition" style="width: 100%">
                <el-option label="优秀" value="优秀" />
                <el-option label="良好" value="良好" />
                <el-option label="一般" value="一般" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="总长(米)"><el-input-number v-model="shipForm.total_length" :min="0" :precision="2" style="width:100%" @change="onDimChange" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="型宽(米)"><el-input-number v-model="shipForm.width" :min="0" :precision="2" style="width:100%" @change="onDimChange" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="型深(米)"><el-input-number v-model="shipForm.depth" :min="0" :precision="2" style="width:100%" @change="onDimChange" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="载重吨">
              <el-input-number v-model="shipForm.deadweight" :min="0" style="width:100%" @change="onDeadweightChange" />
              <div class="tip">= 长×宽×深×0.7 自动估算，可手动调整</div>
            </el-form-item>
          </el-col>
          <el-col :span="8"><el-form-item label="总吨"><el-input-number v-model="shipForm.gross_tonnage" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="净吨"><el-input-number v-model="shipForm.net_tonnage" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="建造时间"><el-date-picker v-model="shipForm.build_date" type="month" value-format="YYYY-MM" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="建造地点"><el-input v-model="shipForm.build_province" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="港籍"><el-input v-model="shipForm.port_registry" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="水域类型">
              <el-select v-model="shipForm.water_type" style="width: 100%">
                <el-option label="内河" value="内河" />
                <el-option label="沿海" value="沿海" />
                <el-option label="远洋" value="远洋" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="主机品牌"><el-input v-model="shipForm.engine_brand" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="主机力量(千瓦)"><el-input-number v-model="shipForm.engine_power" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="主机数量(台)"><el-input-number v-model="shipForm.engine_count" :min="1" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="单价(元/吨)">
              <el-input-number v-model="shipForm.base_price" :min="0" :precision="2" :step="50" style="width:100%" @change="onPriceChange" />
              <div class="tip">元 / 载重吨</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总价(万元)">
              <el-input-number v-model="shipForm.price" :min="0" :precision="2" style="width:100%" />
              <div class="tip">= 单价 × 载重吨 ÷ 10000，可手动覆盖</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="联系人"><el-input v-model="shipForm.contact_name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="联系电话"><el-input v-model="shipForm.contact_phone" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="shipForm.status" style="width: 100%">
                <el-option label="在售" :value="1" />
                <el-option label="下架" :value="0" />
                <el-option label="已售" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="照片">
              <ImageUploader v-model="shipForm.images" hint="最多 9 张，支持点击预览" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="证书">
              <ImageUploader v-model="shipForm.certificates" hint="最多 9 张，支持点击预览" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="其他描述">
              <el-input v-model="shipForm.description" type="textarea" :rows="3" placeholder="船舶其他说明信息" />
            </el-form-item>
          </el-col>
        </el-row>
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
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getShips, addShip, updateShip, deleteShip, finalizeShip } from '../../api/admin'
import ImageUploader from '../../components/ImageUploader.vue'

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
  if (url.startsWith('/uploads')) return url
  return url
}

const tableData = ref([])
const loading = ref(false)
const saving = ref(false)
const filters = ref({ ship_no: '', deadweight: '', gross_tonnage: '', depth: '', build_date: '', price: '' })
const detailVisible = ref(false)
const formVisible = ref(false)
const isEdit = ref(false)
const currentShip = ref(null)

const emptyForm = { ship_no: '', ship_name: '', ship_type: '干散货船', total_length: 0, width: 0, depth: 0, deadweight: 0, gross_tonnage: 0, net_tonnage: 0, build_date: '', build_province: '', port_registry: '', engine_brand: '', engine_power: 0, engine_count: 1, water_type: '内河', ship_condition: '良好', price: 0, base_price: 0, images: [], certificates: [], contact_name: '', contact_phone: '', description: '', status: 1 }
const shipForm = ref({ ...emptyForm })

const finalizeVisible = ref(false)
const finalizing = ref(false)
const finalizeShipRow = ref(null)
const finalizeForm = ref({ buyer_name: '', buyer_phone: '', seller_name: '', seller_phone: '', price: 0, remark: '' })

function formatPrice(price) {
  const n = parseFloat(price)
  return Number.isInteger(n) ? n : n.toFixed(0)
}

function statusTag(status) {
  if (status === 1) return { label: '在售', type: 'success' }
  if (status === 2) return { label: '已售', type: 'info' }
  return { label: '下架', type: 'warning' }
}

async function handleToggleShelf(row) {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    const res = await updateShip(row.id, { status: newStatus })
    if (res.code === 200) {
      ElMessage.success(newStatus === 1 ? '已上架' : '已下架')
      fetchShips()
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

async function handleToggleCarousel(row) {
  try {
    const res = await updateShip(row.id, { is_carousel: row.is_carousel ? 0 : 1 })
    if (res.code === 200) {
      ElMessage.success(row.is_carousel ? '已取消轮播' : '已加入轮播')
      fetchShips()
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

function openFinalize(row) {
  finalizeShipRow.value = row
  finalizeForm.value = {
    buyer_name: '',
    buyer_phone: '',
    seller_name: row.contact_name || '',
    seller_phone: row.contact_phone || '',
    price: parseFloat(row.price) || 0,
    remark: ''
  }
  finalizeVisible.value = true
}

async function handleFinalize() {
  if (!finalizeForm.value.buyer_name || !finalizeForm.value.price) {
    ElMessage.warning('请填写买家和成交价')
    return
  }
  finalizing.value = true
  try {
    const res = await finalizeShip(finalizeShipRow.value.id, finalizeForm.value)
    if (res.code === 200) {
      ElMessage.success('成交成功，已生成交易记录')
      finalizeVisible.value = false
      fetchShips()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    finalizing.value = false
  }
}

async function fetchShips() {
  loading.value = true
  try {
    const params = {}
    const f = filters.value
    if (f.ship_no) params.ship_no = f.ship_no
    if (f.deadweight) params.deadweight = f.deadweight
    if (f.gross_tonnage) params.gross_tonnage = f.gross_tonnage
    if (f.build_date) params.build_date = f.build_date
    if (f.price) params.price = f.price
    const res = await getShips(params)
    if (res.code === 200) {
      tableData.value = res.data.list || []
    }
  } catch (e) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

function handleRowClick(row) {
  currentShip.value = row
  detailVisible.value = true
}

function onDimChange() {
  const L = parseFloat(shipForm.value.total_length) || 0
  const W = parseFloat(shipForm.value.width) || 0
  const D = parseFloat(shipForm.value.depth) || 0
  if (L > 0 && W > 0 && D > 0) {
    shipForm.value.deadweight = Math.round(L * W * D * 0.7)
    recalcPrice()
  }
}

function onDeadweightChange() {
  recalcPrice()
}

function onPriceChange() {
  recalcPrice()
}

function recalcPrice() {
  const unit = parseFloat(shipForm.value.base_price) || 0
  const dwt = parseFloat(shipForm.value.deadweight) || 0
  if (unit > 0 && dwt > 0) {
    shipForm.value.price = +((unit * dwt) / 10000).toFixed(2)
  }
}

function handleAdd() {
  isEdit.value = false
  shipForm.value = { ...emptyForm, images: [], certificates: [] }
  formVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  shipForm.value = {
    ...row,
    price: parseFloat(row.price) || 0,
    base_price: parseFloat(row.base_price) || 0,
    total_length: parseFloat(row.total_length) || 0,
    width: parseFloat(row.width) || 0,
    depth: parseFloat(row.depth) || 0,
    images: parseList(row.images),
    certificates: parseList(row.certificates)
  }
  formVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (isEdit.value) {
      const res = await updateShip(shipForm.value.id, shipForm.value)
      if (res.code === 200) {
        ElMessage.success('编辑成功')
        formVisible.value = false
        fetchShips()
      } else {
        ElMessage.error(res.message || '编辑失败')
      }
    } else {
      const res = await addShip(shipForm.value)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        formVisible.value = false
        fetchShips()
      } else {
        ElMessage.error(res.message || '新增失败')
      }
    }
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    saving.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm('确定删除该船舶数据？', '提示', { type: 'warning' }).then(async () => {
    try {
      const res = await deleteShip(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchShips()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => fetchShips())
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
.tip {
  font-size: 12px;
  color: #aaa;
  line-height: 1.4;
  margin-top: 4px;
}
</style>
