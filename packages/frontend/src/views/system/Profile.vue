<template>
  <div class="profile">
    <el-card>
      <template #header>个人中心</template>
      <el-tabs v-model="tab">
        <el-tab-pane label="基本信息" name="info">
          <el-form ref="infoRef" :model="info" label-width="100px" style="max-width:500px">
            <el-form-item label="用户名"><el-input v-model="info.username" disabled /></el-form-item>
            <el-form-item label="姓名"><el-input v-model="info.name" /></el-form-item>
            <el-form-item label="电话"><el-input v-model="info.phone" /></el-form-item>
            <el-form-item label="邮箱"><el-input v-model="info.email" /></el-form-item>
            <el-form-item label="部门"><el-input v-model="info.department" /></el-form-item>
            <el-form-item label="职位"><el-input v-model="info.position" /></el-form-item>
            <el-form-item label="角色"><el-tag>{{ getRoleDisplayName(info.role as any) }}</el-tag></el-form-item>
            <el-form-item><el-button type="primary" :loading="saving" @click="saveInfo">保存</el-button></el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="修改密码" name="pwd">
          <el-form ref="pwdRef" :model="pwd" :rules="pwdRules" label-width="100px" style="max-width:500px">
            <el-form-item label="原密码" prop="oldPwd"><el-input v-model="pwd.oldPwd" type="password" show-password /></el-form-item>
            <el-form-item label="新密码" prop="newPwd"><el-input v-model="pwd.newPwd" type="password" show-password /></el-form-item>
            <el-form-item label="确认密码" prop="confirmPwd"><el-input v-model="pwd.confirmPwd" type="password" show-password /></el-form-item>
            <el-form-item><el-button type="primary" :loading="savingPwd" @click="changePwd">修改密码</el-button></el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { request } from '@/utils/request'
import { getRoleDisplayName } from '@/utils/permission'
const auth = useAuthStore()
const tab = ref('info'); const saving = ref(false); const savingPwd = ref(false)
const infoRef = ref<FormInstance>(); const pwdRef = ref<FormInstance>()
const info = reactive({ username: '', name: '', phone: '', email: '', department: '', position: '', role: 'sales' })
const pwd = reactive({ oldPwd: '', newPwd: '', confirmPwd: '' })
const pwdRules = {
  oldPwd: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPwd: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '至少6位', trigger: 'blur' }],
  confirmPwd: [{ required: true, trigger: 'blur', validator: (_: any, v: string, cb: Function) => v !== pwd.newPwd ? cb(new Error('两次密码不一致')) : cb() }],
}
onMounted(() => { if (auth.user) Object.assign(info, auth.user) })
const saveInfo = async () => {
  saving.value = true
  try { await request.put('/users/me', info); auth.updateUser(info); ElMessage.success('保存成功') }
  catch { ElMessage.error('保存失败，请稍后重试') }
  finally { saving.value = false }
}
const changePwd = async () => {
  const v = await pwdRef.value?.validate().catch(() => false); if (!v) return
  savingPwd.value = true
  try {
    await request.post('/users/change-password', {
      oldPassword: pwd.oldPwd,
      newPassword: pwd.newPwd
    });
    ElMessage.success('密码修改成功，请重新登录');
    auth.logout();
  } catch { ElMessage.error('密码修改失败') }
  finally { savingPwd.value = false }
}
</script>