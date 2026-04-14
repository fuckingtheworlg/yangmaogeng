<template>
  <div class="login-page">
    <div class="login-header">
      <span class="logo-text">YMG</span>
      <span class="header-title">羊毛梗船舶服务中心管理平台</span>
    </div>
    <div class="login-box">
      <h2 class="login-title">管理员登录</h2>
      <el-form :model="form" label-width="0" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" size="large" prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" placeholder="密码" type="password" size="large" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="danger" size="large" style="width: 100%" @click="handleLogin" :loading="loading">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '../../api/admin'

const router = useRouter()
const loading = ref(false)
const form = ref({
  username: '',
  password: ''
})

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const res = await login(form.value)
    if (res.code === 200) {
      localStorage.setItem('admin_token', res.data.token)
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch {
    // 后端未启动时使用 Mock 模式
    if (form.value.username === 'admin' && form.value.password === 'admin123') {
      localStorage.setItem('admin_token', 'mock_token_123')
      ElMessage.success('登录成功（Mock模式）')
      router.push('/dashboard')
    } else {
      ElMessage.error('用户名或密码错误')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  width: 100%;
  height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-header {
  width: 100%;
  height: 60px;
  background-color: #CC0000;
  display: flex;
  align-items: center;
  padding: 0 24px;
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

.login-box {
  margin-top: 120px;
  width: 400px;
  background: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 32px;
  color: #333;
}
</style>
