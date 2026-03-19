<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="login-logo">CRM</div>
        <h1>企业级CRM系统</h1>
        <p>IT企业专属客户关系管理平台</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" class="login-form" @keyup.enter="submit">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名 / 手机号" size="large" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" class="login-btn" @click="submit">登 录</el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">默认账号：admin &nbsp;|&nbsp; 密码：admin123456</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { FormInstance } from 'element-plus'
const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }],
}
const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const ok = await auth.login(form)
    if (ok) await router.replace('/dashboard')
  } finally { loading.value = false }
}
</script>
<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.login-box { width: 420px; padding: 50px 40px; background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.login-header { text-align: center; margin-bottom: 36px; }
.login-logo { width: 60px; height: 60px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 22px; font-weight: 700; margin-bottom: 16px; }
.login-header h1 { font-size: 24px; color: #1d2129; margin-bottom: 8px; }
.login-header p { font-size: 14px; color: #86909c; }
.login-btn { width: 100%; height: 44px; font-size: 16px; }
.login-footer { text-align: center; margin-top: 20px; font-size: 12px; color: #c9cdd4; }
</style>