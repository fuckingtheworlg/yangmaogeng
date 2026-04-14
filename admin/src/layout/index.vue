<template>
  <div class="layout">
    <div class="layout-header">
      <div class="header-logo">
        <span class="logo-text">YMG</span>
        <span class="header-title">羊毛梗船舶服务中心管理平台</span>
      </div>
      <div class="header-right">
        <span class="admin-name">管理员</span>
        <el-button type="danger" text size="small" @click="logout">退出</el-button>
      </div>
    </div>
    <div class="layout-body">
      <div class="layout-sidebar">
        <el-menu
          :default-active="currentRoute"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="/dashboard">
            <span>首 页</span>
          </el-menu-item>
          <el-menu-item index="/ship">
            <span>船舶数据</span>
          </el-menu-item>
          <el-menu-item index="/user">
            <span>用户数据</span>
          </el-menu-item>
          <el-menu-item index="/commission">
            <span>委托请求</span>
          </el-menu-item>
          <el-menu-item index="/transaction">
            <span>交易记录</span>
          </el-menu-item>
        </el-menu>
      </div>
      <div class="layout-main">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => route.path)

function logout() {
  localStorage.removeItem('admin_token')
  router.push('/login')
}
</script>

<style scoped>
.layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  height: 60px;
  background-color: #CC0000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-text {
  background: #fff;
  color: #CC0000;
  font-weight: bold;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
}

.header-title {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-name {
  color: #fff;
  font-size: 14px;
}

.layout-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.layout-sidebar {
  width: 160px;
  background-color: #fff;
  border-right: 1px solid #e5e5e5;
  flex-shrink: 0;
}

.sidebar-menu {
  border-right: none;
}

.layout-main {
  flex: 1;
  padding: 20px;
  background-color: #f5f5f5;
  overflow: auto;
}
</style>
