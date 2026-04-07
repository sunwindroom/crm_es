<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>客户管理</span>
          <div>
            <el-button v-if="canAssign" type="success" @click="handleBatchAssign" :disabled="selectedRows.length === 0">
              <el-icon><UserFilled /></el-icon> 批量分配 ({{ selectedRows.length }})
            </el-button>
            <el-button v-if="hasPermission('customer_create')" type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon> 新增客户
            </el-button>
          </div>
        </div>
      </template>
      <el-form :model="search" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="search.keyword" placeholder="客户名称/电话" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="级别">
          <el-select v-model="search.level" clearable placeholder="全部" style="width:100px">
            <el-option label="VIP" value="vip" /><el-option label="重要" value="important" />
            <el-option label="普通" value="normal" /><el-option label="潜在" value="potential" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="search.status" clearable placeholder="全部" style="width:100px">
            <el-option label="活跃" value="active" /><el-option label="停用" value="inactive" /><el-option label="黑名单" value="blacklist" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" v-if="canAssign" />
        <el-table-column prop="name" label="客户名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="industry" label="行业" width="100" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="level" label="级别" width="80">
          <template #default="{ row }">
            <el-tag :type="{ vip:'danger', important:'warning', normal:'', potential:'info' }[row.level] || ''" size="small">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="owner.name" label="负责人" width="90"><template #default="{ row }">{{ row.owner?.name || '-' }}</template></el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="$router.push(`/customers/${row.id}`)">详情</el-button>
            <el-button v-if="hasPermission('customer_edit')" type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="canAssignCustomer(row)" type="success" link size="small" @click="handleAssign(row)">分配</el-button>
            <el-button v-if="hasPermission('customer_delete')" type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="pg.current" v-model:page-size="pg.size" :total="pg.total" layout="total, sizes, prev, pager, next" class="pagination" @change="fetchData" />
    </el-card>

    <!-- 新增/编辑客户对话框 -->
    <el-dialog v-model="visible" :title="editId ? '编辑客户' : '新增客户'" width="680px" @close="reset">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="客户名称" prop="name"><el-input v-model="form.name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="行业"><el-input v-model="form.industry" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="电话" prop="phone"><el-input v-model="form.phone" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="级别"><el-select v-model="form.level" style="width:100%"><el-option label="VIP" value="vip"/><el-option label="重要" value="important"/><el-option label="普通" value="normal"/><el-option label="潜在" value="potential"/></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态"><el-select v-model="form.status" style="width:100%"><el-option label="活跃" value="active"/><el-option label="停用" value="inactive"/></el-select></el-form-item></el-col>
        </el-row>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配客户对话框 -->
    <el-dialog v-model="assignVisible" title="分配客户" width="500px">
      <el-form :model="assignForm" label-width="80px">
        <el-form-item label="当前客户" v-if="assignForm.customerNames">
          <div>{{ assignForm.customerNames }}</div>
        </el-form-item>
        <el-form-item label="当前负责人" v-if="assignForm.currentOwner">
          <el-tag>{{ assignForm.currentOwner }}</el-tag>
        </el-form-item>
        <el-form-item label="分配给" required>
          <el-select
            v-model="assignForm.targetUserId"
            placeholder="请选择要分配的用户"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="user in assignableUsers"
              :key="user.id"
              :label="`${user.name} (${getRoleName(user.role)})`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="assignForm.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" :loading="assignLoading" @click="confirmAssign">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Plus, UserFilled } from '@element-plus/icons-vue'
import { request } from '@/utils/request'
import { hasPermission, getRoleName, canAssignLead } from '@/utils/permission'

const loading = ref(false)
const saving = ref(false)
const visible = ref(false)
const editId = ref('')
const tableData = ref<any[]>([])
const formRef = ref<FormInstance>()
const pg = reactive({ current: 1, size: 10, total: 0 })
const search = reactive({ keyword: '', level: '', status: '' })
const form = reactive({ name: '', industry: '', phone: '', email: '', level: 'normal', status: 'active', address: '', description: '' })
const rules = { name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }] }

// 分配相关
const assignVisible = ref(false)
const assignLoading = ref(false)
const selectedRows = ref<any[]>([])
const assignableUsers = ref<any[]>([])
const assignForm = reactive({
  customerIds: [] as string[],
  customerNames: '',
  currentOwner: '',
  targetUserId: '',
  remark: ''
})

// 权限检查
const currentUserId = localStorage.getItem('userId') || ''
const userRole = localStorage.getItem('userRole') || ''

// 是否可以分配客户
const canAssign = computed(() => {
  // 管理员、总裁、营销副总裁、销售经理可以分配
  if (['admin', 'ceo', 'cmo', 'sales_manager'].includes(userRole)) {
    return true
  }
  // 检查权限码
  return hasPermission('customer:assign') || hasPermission('customer_assign')
})

// 检查是否可以分配特定客户
const canAssignCustomer = (row: any) => {
  if (!canAssign.value) return false
  // 管理员、总裁、营销副总裁可以分配任何客户
  if (['admin', 'ceo', 'cmo'].includes(userRole)) return true
  // 销售经理可以分配自己和下属的客户
  if (userRole === 'sales_manager') return true
  return false
}

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/customers', { params: { page: pg.current, pageSize: pg.size, ...search } })
    tableData.value = res?.items ?? []
    pg.total = res?.total ?? 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pg.current = 1; fetchData() }
const handleReset = () => { Object.assign(search, { keyword: '', level: '', status: '' }); handleSearch() }
const handleAdd = () => { editId.value = ''; visible.value = true }
const handleEdit = (row: any) => { editId.value = row.id; Object.assign(form, row); visible.value = true }

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确认删除客户"${row.name}"？`, '删除', { type: 'warning' })
  await request.delete(`/customers/${row.id}`)
  ElMessage.success('删除成功')
  fetchData()
}

const save = async () => {
  const v = await formRef.value?.validate().catch(() => false)
  if (!v) return
  saving.value = true
  try {
    editId.value ? await request.put(`/customers/${editId.value}`, form) : await request.post('/customers', form)
    ElMessage.success('保存成功')
    visible.value = false
    fetchData()
  } finally {
    saving.value = false
  }
}

const reset = () => {
  formRef.value?.resetFields()
  Object.assign(form, { name: '', industry: '', phone: '', email: '', level: 'normal', status: 'active', address: '', description: '' })
}

// 选择变化
const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

// 获取可分配用户列表
const fetchAssignableUsers = async () => {
  try {
    const res: any = await request.get('/users/assignable')
    assignableUsers.value = res ?? []
  } catch {
    // 如果接口不存在，获取所有用户
    try {
      const res: any = await request.get('/users')
      assignableUsers.value = res?.items ?? []
    } catch {
      assignableUsers.value = []
    }
  }
}

// 单个分配
const handleAssign = async (row: any) => {
  assignForm.customerIds = [row.id]
  assignForm.customerNames = row.name
  assignForm.currentOwner = row.owner?.name || '无'
  assignForm.targetUserId = ''
  assignForm.remark = ''
  await fetchAssignableUsers()
  assignVisible.value = true
}

// 批量分配
const handleBatchAssign = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要分配的客户')
    return
  }
  assignForm.customerIds = selectedRows.value.map(r => r.id)
  assignForm.customerNames = selectedRows.value.map(r => r.name).join('、')
  assignForm.currentOwner = ''
  assignForm.targetUserId = ''
  assignForm.remark = ''
  await fetchAssignableUsers()
  assignVisible.value = true
}

// 确认分配
const confirmAssign = async () => {
  if (!assignForm.targetUserId) {
    ElMessage.warning('请选择要分配的用户')
    return
  }

  assignLoading.value = true
  try {
    if (assignForm.customerIds.length === 1) {
      // 单个分配
      await request.post(`/customers/${assignForm.customerIds[0]}/assign`, {
        userId: assignForm.targetUserId,
        remark: assignForm.remark
      })
    } else {
      // 批量分配
      await request.post('/customers/batch-assign', {
        customerIds: assignForm.customerIds,
        userId: assignForm.targetUserId,
        remark: assignForm.remark
      })
    }
    ElMessage.success('分配成功')
    assignVisible.value = false
    selectedRows.value = []
    fetchData()
  } catch (error: any) {
    ElMessage.error(error.message || '分配失败')
  } finally {
    assignLoading.value = false
  }
}

onMounted(fetchData)
</script>
<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-form { margin-bottom: 16px; }
.pagination { margin-top: 20px; justify-content: flex-end; }
</style>
