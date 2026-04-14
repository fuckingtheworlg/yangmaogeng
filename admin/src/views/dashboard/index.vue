<template>
  <div class="dashboard">
    <div class="welcome">
      <span class="logo-text">YMG</span>
      <span class="welcome-title">羊毛梗船舶服务中心管理平台</span>
    </div>
    <div class="stats-row">
      <div class="stat-card" @click="$router.push('/ship')">
        <div class="stat-label">船舶数据</div>
        <div class="stat-value">
          <span class="stat-num">{{ shipCount }}</span>
          <span class="stat-unit">艘</span>
          <span class="stat-link">（点击查看）</span>
        </div>
      </div>
      <div class="stat-card" @click="$router.push('/commission')">
        <div class="stat-label">今日请求</div>
        <div class="stat-value">
          <span class="stat-num">{{ requestCount }}</span>
          <span class="stat-unit">条</span>
          <span class="stat-link">（点击查看）</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getStats } from '../../api/admin'

const shipCount = ref(0)
const requestCount = ref(0)

onMounted(async () => {
  try {
    const res = await getStats()
    if (res.code === 200) {
      shipCount.value = res.data.shipCount || 0
      requestCount.value = res.data.todayCommissions || 0
    }
  } catch (e) {
    console.error('获取统计数据失败', e)
  }
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}
.welcome {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
}
.logo-text {
  background: #CC0000;
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
}
.welcome-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}
.stats-row {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 500px;
}
.stat-card {
  background: #fff;
  padding: 24px 32px;
  border-radius: 8px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
.stat-label {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}
.stat-num {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
.stat-unit {
  font-size: 14px;
  color: #333;
  margin-left: 4px;
}
.stat-link {
  font-size: 14px;
  color: #999;
  margin-left: 8px;
  text-decoration: underline;
}
</style>
