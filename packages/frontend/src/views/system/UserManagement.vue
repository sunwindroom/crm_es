<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button v-if="hasPermission('user_create')" type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 新增用户
          </el-button>
        </div>
      </template>

      <el-form :model="search" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="search.keyword" placeholder="姓名/用户名/电话" clearable style="width:200px" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="search.role" clearable placeholder="全部" style="width:130px">
            <el-option v-for="r in getAllRoles()" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="search.status" clearable placeholder="全部" style="width:100px">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="inactive" />
            <el-option label="锁定" value="locked" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="username" label="用户名" width="110" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="职位" width="120" />
        <el-table-column prop="role" label="角色" width="110">
          <template #default="{ row }">
            <el-tag :type="getRoleColor(row.role)" size="small">{{ getRoleDisplayName(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="superiorName" label="上级" width="100">
          <template #default="{ row }">{{ row.superiorName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="{ active: 'success', inactive: 'info', locked: 'danger' }[row.status] || 'info'" size="small">
              {{ { active: '正常', inactive: '禁用', locked: '锁定' }[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-if="canEdit(row)" type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="canEdit(row) && row.status === 'active'" type="warning" link size="small" @click="toggleStatus(row, 'inactive')">禁用</el-button>
            <el-button v-if="canEdit(row) && row.status !== 'active'" type="success" link size="small" @click="toggleStatus(row, 'active')">启用</el-button>
            <el-button v-if="canEdit(row)" type="info" link size="small" @click="resetPwd(row)">重置密码</el-button>
            <el-button v-if="canDelete(row)" type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pg.current"
        v-model:page-size="pg.size"
        :total="pg.total"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        @change="fetchData"
      />
    </el-card>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog v-model="formVisible" :title="editId ? '编辑用户' : '新增用户'" width="720px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="登录用户名" :disabled="!!editId" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="真实姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="!editId" :gutter="20">
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input v-model="form.password" type="password" show-password placeholder="至少6位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="form.confirmPassword" type="password" show-password placeholder="再次输入密码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="11位手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="电子邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门" prop="department">
              <el-input v-model="form.department" placeholder="所在部门" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位" prop="position">
              <el-input v-model="form.position" placeholder="职位名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="form.role" style="width:100%">
                <el-option v-for="r in getAssignableRoles()" :key="r" :label="getRoleDisplayName(r)" :value="r" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上级" prop="superiorId">
              <el-select v-model="form.superiorId" clearable filterable placeholder="选择上级（可选）" style="width:100%">
                <el-option
                  v-for="u in superiorOptions"
                  :key="u.id"
                  :label="`${u.name}（${getRoleDisplayName(u.role)}）`"
                  :value="u.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="账户状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio value="active">正常</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { userApi } from '@/api/user'
import type { User } from '@/types'
import {
  hasPermission, getAllRoles, getAssignableRoles,
  getRoleDisplayName, getRoleColor, canEditUser, canDeleteUser, getCurrentUser
} from '@/utils/permission'

const loading = ref(false)
const saving = ref(false)
const formVisible = ref(false)
const editId = ref('')
const tableData = ref<User[]>([])
const formRef = ref<FormInstance>()
const pg = reactive({ current: 1, size: 10, total: 0 })
const search = reactive({ keyword: '', role: '', status: '' })

const form = reactive({
  username: '', password: '', confirmPassword: '', name: '',
  phone: '', email: '', department: '', position: '',
  role: 'sales', superiorId: '', status: 'active'
})

const superiorOptions = computed(() =>
  tableData.value.filter(u =>
    u.id !== editId.value &&
    ['admin','ceo','cto','cmo','sales_manager','project_manager'].includes(u.role as string)
  )
)

const canEdit = (row: User) => canEditUser(row)
const canDelete = (row: User) => canDeleteUser(row)

const rules = computed(() => ({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }, { min: 3, max: 20, message: '3-20个字符', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, trigger: 'blur' }, { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  ...(!editId.value ? {
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '至少6位', trigger: 'blur' }],
    confirmPassword: [{
      required: true, trigger: 'blur',
      validator: (_: any, v: string, cb: Function) => {
        v !== form.password ? cb(new Error('两次密码不一致')) : cb()
      }
    }],
  } : {}),
}))

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await userApi.getList({
      page: pg.current, pageSize: pg.size,
      keyword: search.keyword || undefined,
      role: search.role || undefined,
      status: search.status || undefined,
    })
    tableData.value = res?.users ?? res?.data ?? []
    pg.total = res?.total ?? 0
  } finally { loading.value = false }
}

const handleSearch = () => { pg.current = 1; fetchData() }
const handleReset = () => { Object.assign(search, { keyword: '', role: '', status: '' }); handleSearch() }
const handleAdd = () => { editId.value = ''; formVisible.value = true }
const handleEdit = (row: User) => {
  editId.value = row.id
  Object.assign(form, { ...row, password: '', confirmPassword: '', superiorId: row.superiorId || '' })
  formVisible.value = true
}

const toggleStatus = async (row: User, status: string) => {
  await userApi.updateStatus(row.id, status as User['status'])
  ElMessage.success('状态已更新')
  fetchData()
}

const resetPwd = async (row: User) => {
  const { value: pwd } = await ElMessageBox.prompt('请输入新密码（至少6位）', '重置密码', {
    inputType: 'password',
    inputValidator: v => !v || v.length < 6 ? '密码至少6位' : true
  })
  await userApi.resetPassword(row.id, pwd)
  ElMessage.success('密码已重置')
}

const handleDelete = async (row: User) => {
  await ElMessageBox.confirm(`确认删除用户"${row.name}"？此操作不可恢复！`, '删除确认', { type: 'error' })
  await userApi.delete(row.id)
  ElMessage.success('删除成功')
  fetchData()
}

const save = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload: any = { ...form }
    delete payload.confirmPassword
    if (editId.value) {
      delete payload.password // 编辑时不提交密码
      await userApi.update(editId.value, payload)
      ElMessage.success('保存成功')
    } else {
      await userApi.create(payload)
      ElMessage.success('创建成功')
    }
    formVisible.value = false
    fetchData()
  } finally { saving.value = false }
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(form, { username: '', password: '', confirmPassword: '', name: '', phone: '', email: '', department: '', position: '', role: 'sales', superiorId: '', status: 'active' })
}

onMounted(fetchData)
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-form { margin-bottom: 16px; }
.pagination { margin-top: 20px; justify-content: flex-end; }
</style>
