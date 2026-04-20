<template>
  <div class="commission-page">
    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="编号/电话" style="width: 140px" clearable />
      <el-input v-model="filters.contact_name" placeholder="姓名" style="width: 120px" clearable />
      <el-input v-model="filters.total_length" placeholder="长度" style="width: 100px" clearable />
      <el-date-picker v-model="filters.build_date" type="month" placeholder="建造时间" style="width: 140px" value-format="YYYY-MM" />
      <el-select v-model="filters.status" placeholder="状态" style="width: 110px" clearable>
        <el-option label="待处理" :value="0" />
        <el-option label="已达成" :value="1" />
        <el-option label="已成交" :value="2" />
        <el-option label="已拒绝" :value="3" />
        <el-option label="已失效" :value="4" />
      </el-select>
      <el-button type="primary" @click="fetchData" :icon="Search">搜索</el-button>
      <el-button type="danger" :icon="Plus" @click="openAdd">新增委托</el-button>
    </div>

    <el-tabs v-model="activeTab" type="card" @tab-change="fetchData">
      <el-tab-pane label="购买请求" name="buy">
        <el-table :data="tableData" border stripe size="small" v-loading="loading">
          <el-table-column prop="code" label="编号" width="120" />
          <el-table-column prop="contact_name" label="姓名" width="80" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column prop="total_length" label="总长" width="70" />
          <el-table-column prop="deadweight" label="载货吨" width="80" />
          <el-table-column prop="gross_tonnage" label="总吨位" width="80" />
          <el-table-column prop="build_date" label="建造时间" width="100" />
          <el-table-column prop="build_province" label="建造地点" width="90" />
          <el-table-column prop="engine_brand" label="主机品牌" width="90" />
          <el-table-column prop="engine_power" label="主机功率" width="90">
            <template #default="{ row }">{{ row.engine_power }}千瓦</template>
          </el-table-column>
          <el-table-column prop="engine_count" label="主机数量" width="90">
            <template #default="{ row }">{{ row.engine_count || 1 }}台</template>
          </el-table-column>
          <el-table-column prop="water_type" label="内河/沿海" width="90" />
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
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" text size="small" @click="openEdit(row)">编辑</el-button>
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
          <el-table-column prop="code" label="编号" width="120" />
          <el-table-column prop="contact_name" label="姓名" width="80" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column prop="total_length" label="总长" width="70" />
          <el-table-column prop="width" label="型宽" width="70" />
          <el-table-column prop="depth" label="型深" width="70" />
          <el-table-column prop="deadweight" label="载重吨" width="80" />
          <el-table-column prop="gross_tonnage" label="总吨" width="70" />
          <el-table-column prop="port_registry" label="港籍" width="80" />
          <el-table-column prop="build_date" label="建造时间" width="100" />
          <el-table-column prop="build_province" label="建造地点" width="90" />
          <el-table-column prop="engine_brand" label="主机品牌" width="90" />
          <el-table-column prop="engine_power" label="主机功率" width="80">
            <template #default="{ row }">{{ row.engine_power }}千瓦</template>
          </el-table-column>
          <el-table-column prop="engine_count" label="主机数量" width="90">
            <template #default="{ row }">{{ row.engine_count || 1 }}台</template>
          </el-table-column>
          <el-table-column prop="water_type" label="内河/沿海" width="90" />
          <el-table-column prop="ship_type" label="船型" width="80" />
          <el-table-column prop="price" label="售价" width="100">
            <template #default="{ row }">
              <span style="color:#CC0000;font-weight:bold" v-if="row.price">{{ row.price }}万元</span>
            </template>
          </el-table-column>
          <el-table-column label="照片" width="80">
            <template #default="{ row }">
              <el-image
                v-if="firstImage(row.ship_images)"
                :src="resolveUrl(firstImage(row.ship_images))"
                :preview-src-list="parseImgs(row.ship_images).map(resolveUrl)"
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
                v-if="firstImage(row.cert_images)"
                :src="resolveUrl(firstImage(row.cert_images))"
                :preview-src-list="parseImgs(row.cert_images).map(resolveUrl)"
                fit="cover"
                style="width:44px;height:44px;border-radius:4px"
                preview-teleported
              />
              <span v-else style="color:#bbb">-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusMap[row.status]?.type" size="small">{{ statusMap[row.status]?.label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="320" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" text size="small" @click="openEdit(row)">编辑</el-button>
              <el-button type="success" text size="small" @click="openImport(row)" :disabled="row.status !== 0">导入船舶库</el-button>
              <el-button type="warning" text size="small" @click="setStatus(row, 3)" :disabled="row.status !== 0">拒绝</el-button>
              <el-button type="info" text size="small" @click="setStatus(row, 4)" :disabled="row.status === 2">失效</el-button>
              <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 新增/编辑委托弹窗 -->
    <el-dialog v-model="editVisible" :title="editMode === 'add' ? '新增委托' : '编辑委托'" width="780px">
      <el-form :model="editForm" label-width="100px" v-if="editForm">
        <el-row :gutter="16" v-if="editMode === 'add'">
          <el-col :span="12">
            <el-form-item label="类型">
              <el-radio-group v-model="editForm.type">
                <el-radio label="buy">购买</el-radio>
                <el-radio label="sell">出售</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="姓名"><el-input v-model="editForm.contact_name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="电话"><el-input v-model="editForm.phone" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="总长(米)"><el-input-number v-model="editForm.total_length" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="型宽(米)"><el-input-number v-model="editForm.width" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="型深(米)"><el-input-number v-model="editForm.depth" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="载重吨"><el-input-number v-model="editForm.deadweight" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="总吨"><el-input-number v-model="editForm.gross_tonnage" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="建造时间"><el-date-picker v-model="editForm.build_date" type="month" value-format="YYYY-MM" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="建造地点"><el-input v-model="editForm.build_province" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16" v-if="editForm.type === 'sell'">
          <el-col :span="12"><el-form-item label="港籍"><el-input v-model="editForm.port_registry" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="水域">
              <el-select v-model="editForm.water_type" style="width:100%">
                <el-option label="内河" value="内河" /><el-option label="沿海" value="沿海" /><el-option label="远洋" value="远洋" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" v-else>
          <el-col :span="12">
            <el-form-item label="水域">
              <el-select v-model="editForm.water_type" style="width:100%">
                <el-option label="内河" value="内河" /><el-option label="沿海" value="沿海" /><el-option label="远洋" value="远洋" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="船型"><el-input v-model="editForm.ship_type" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="主机品牌"><el-input v-model="editForm.engine_brand" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="主机功率"><el-input-number v-model="editForm.engine_power" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="主机数量"><el-input-number v-model="editForm.engine_count" :min="1" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16" v-if="editForm.type === 'sell'">
          <el-col :span="24"><el-form-item label="船型"><el-input v-model="editForm.ship_type" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12" v-if="editForm.type === 'buy'">
            <el-form-item label="求购预算">
              <el-input-number v-model="editForm.budget" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-else>
            <el-form-item label="售价(万元)">
              <el-input-number v-model="editForm.price" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="editForm.type === 'buy'">
            <el-form-item label="年限(起/止)">
              <el-input v-model="editForm.year_start" placeholder="起始年" style="width:48%" />
              <el-input v-model="editForm.year_end" placeholder="截止年" style="width:48%; margin-left:4%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" v-if="editForm.type === 'sell'">
          <el-col :span="12">
            <el-form-item label="船舶照片">
              <ImageUploader v-model="editForm.ship_images" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="证书照片">
              <ImageUploader v-model="editForm.cert_images" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="editForm.remark" type="textarea" :rows="2" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="danger" @click="handleSaveCommission" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

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
    <el-dialog v-model="importVisible" title="导入至船舶信息库" width="820px">
      <el-form :model="importForm" label-width="100px" v-if="importForm">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="船舶编号">
              <el-input v-model="importForm.ship_no" placeholder="留空自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="船号"><el-input v-model="importForm.ship_name" placeholder="如 江海通达01" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="总长(米)"><el-input-number v-model="importForm.total_length" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="型宽(米)"><el-input-number v-model="importForm.width" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="型深(米)"><el-input-number v-model="importForm.depth" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="载重吨"><el-input-number v-model="importForm.deadweight" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="总吨"><el-input-number v-model="importForm.gross_tonnage" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="净吨位"><el-input-number v-model="importForm.net_tonnage" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="建造时间"><el-input v-model="importForm.build_date" placeholder="YYYY-MM" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="建造地点"><el-input v-model="importForm.build_province" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="港籍"><el-input v-model="importForm.port_registry" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="船型"><el-input v-model="importForm.ship_type" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="6"><el-form-item label="主机品牌"><el-input v-model="importForm.engine_brand" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="主机功率"><el-input-number v-model="importForm.engine_power" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="主机数量"><el-input-number v-model="importForm.engine_count" :min="1" style="width:100%" /></el-form-item></el-col>
          <el-col :span="6">
            <el-form-item label="水域">
              <el-select v-model="importForm.water_type" style="width:100%">
                <el-option label="内河" value="内河" />
                <el-option label="沿海" value="沿海" />
                <el-option label="远洋" value="远洋" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="起价(万元)"><el-input-number v-model="importForm.base_price" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="售价(万元)"><el-input-number v-model="importForm.price" :min="0" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="联系人"><el-input v-model="importForm.contact_name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="电话"><el-input v-model="importForm.contact_phone" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="照片">
              <el-image
                v-for="(u,i) in parseImgs(importingRow?.ship_images)"
                :key="i"
                :src="resolveUrl(u)"
                :preview-src-list="parseImgs(importingRow?.ship_images).map(resolveUrl)"
                :initial-index="i"
                fit="cover"
                style="width:64px;height:64px;border-radius:4px;margin:2px"
                preview-teleported
              />
              <span v-if="!parseImgs(importingRow?.ship_images).length" style="color:#bbb">无</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="证书">
              <el-image
                v-for="(u,i) in parseImgs(importingRow?.cert_images)"
                :key="i"
                :src="resolveUrl(u)"
                :preview-src-list="parseImgs(importingRow?.cert_images).map(resolveUrl)"
                :initial-index="i"
                fit="cover"
                style="width:64px;height:64px;border-radius:4px;margin:2px"
                preview-teleported
              />
              <span v-if="!parseImgs(importingRow?.cert_images).length" style="color:#bbb">无</span>
            </el-form-item>
          </el-col>
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
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCommissions, addCommission, updateCommission, importCommissionToShip, getShips } from '../../api/admin'
import ImageUploader from '../../components/ImageUploader.vue'

const API_BASE = 'http://47.114.89.50'
const router = useRouter()
const tableData = ref([])
const loading = ref(false)
const saving = ref(false)
const activeTab = ref('buy')
const filters = ref({ keyword: '', status: null, total_length: '', build_date: '', contact_name: '' })

const statusMap = {
  0: { label: '待处理', type: 'warning' },
  1: { label: '已达成', type: 'success' },
  2: { label: '已成交', type: 'primary' },
  3: { label: '已拒绝', type: 'danger' },
  4: { label: '已失效', type: 'info' }
}

function parseIds(str) {
  if (!str) return []
  return String(str).split(',').filter(Boolean).map(s => s.trim())
}

function parseImgs(raw) {
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
  const list = parseImgs(raw)
  return list.length ? list[0] : ''
}

function resolveUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/uploads')) return API_BASE + url
  return url
}

function goShip(id) {
  router.push({ path: '/ship', query: { id } })
}

async function fetchData() {
  loading.value = true
  try {
    const params = { type: activeTab.value }
    if (filters.value.keyword) params.keyword = filters.value.keyword
    if (filters.value.contact_name) params.contact_name = filters.value.contact_name
    if (filters.value.total_length) params.total_length = filters.value.total_length
    if (filters.value.build_date) params.build_date = filters.value.build_date
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
  ElMessageBox.confirm('确定标记为已失效？', '提示', { type: 'warning' }).then(async () => {
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

// 新增/编辑委托
const editVisible = ref(false)
const editMode = ref('add')
const editForm = ref(null)
const emptyForm = {
  type: 'buy',
  contact_name: '',
  phone: '',
  total_length: 0, width: 0, depth: 0,
  deadweight: 0, gross_tonnage: 0,
  build_date: '', build_province: '',
  port_registry: '',
  water_type: '内河',
  ship_type: '',
  engine_brand: '', engine_power: 0, engine_count: 1,
  year_start: '', year_end: '',
  budget: 0, price: 0,
  ship_images: [], cert_images: [],
  remark: ''
}

function openAdd() {
  editMode.value = 'add'
  editForm.value = { ...emptyForm, type: activeTab.value, ship_images: [], cert_images: [] }
  editVisible.value = true
}

function openEdit(row) {
  editMode.value = 'edit'
  editForm.value = {
    ...emptyForm,
    ...row,
    total_length: parseFloat(row.total_length) || 0,
    width: parseFloat(row.width) || 0,
    depth: parseFloat(row.depth) || 0,
    budget: parseFloat(row.budget) || 0,
    price: parseFloat(row.price) || 0,
    ship_images: parseImgs(row.ship_images),
    cert_images: parseImgs(row.cert_images)
  }
  editVisible.value = true
}

async function handleSaveCommission() {
  if (!editForm.value.contact_name || !editForm.value.phone) {
    ElMessage.warning('请填写姓名和电话')
    return
  }
  saving.value = true
  try {
    const res = editMode.value === 'add'
      ? await addCommission(editForm.value)
      : await updateCommission(editForm.value.id, editForm.value)
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
    ship_name: '',
    ship_type: row.ship_type || '',
    total_length: parseFloat(row.total_length) || 0,
    width: parseFloat(row.width) || 0,
    depth: parseFloat(row.depth) || 0,
    deadweight: row.deadweight || 0,
    gross_tonnage: row.gross_tonnage || 0,
    net_tonnage: 0,
    build_date: row.build_date || '',
    build_province: row.build_province || '',
    port_registry: row.port_registry || '',
    engine_brand: row.engine_brand || '',
    engine_power: row.engine_power || 0,
    engine_count: row.engine_count || 1,
    water_type: row.water_type || '内河',
    price: parseFloat(row.price) || 0,
    base_price: 0,
    contact_name: row.contact_name || '',
    contact_phone: row.phone || ''
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
  flex-wrap: wrap;
}
</style>
