<template>
  <div class="project-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>项目管理</span>
          <el-button v-if="hasPermission('project_create')" type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 新增项目
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="search" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="search.keyword" placeholder="项目名称" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="search.status" clearable placeholder="全部" style="width:120px">
            <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="search.type" clearable placeholder="全部" style="width:120px">
            <el-option v-for="o in typeOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="name" label="项目名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="customer.name" label="客户" width="150">
          <template #default="{ row }">{{ row.customer?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="110">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ getTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="140">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progress || 0"
              :status="row.progress >= 100 ? 'success' : undefined"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="managerUser.name" label="项目经理" width="100">
          <template #default="{ row }">{{ row.managerUser?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="startDate" label="开始日期" width="110" />
        <el-table-column prop="endDate" label="结束日期" width="110" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
            <el-button v-if="hasPermission('project_edit')" type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="handleMilestone(row)">里程碑</el-button>
            <el-button v-if="hasPermission('project_delete')" type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="formVisible" :title="editId ? '编辑项目' : '新增项目'" width="760px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入项目名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目类型" prop="type">
              <el-select v-model="form.type" style="width:100%">
                <el-option v-for="o in typeOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联客户" prop="customerId">
              <el-select v-model="form.customerId" filterable remote :remote-method="searchCustomers"
                placeholder="搜索客户" style="width:100%">
                <el-option v-for="c in custOptions" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目经理" prop="manager">
              <el-select v-model="form.manager" filterable placeholder="选择项目经理" style="width:100%">
                <el-option v-for="u in pmOptions" :key="u.id" :label="u.name" :value="u.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目状态" prop="status">
              <el-select v-model="form.status" style="width:100%">
                <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预算(万元)">
              <el-input-number v-model="form.budget" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="项目描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">确定</el-button>
      </template>
    </el-dialog>

    <!-- 里程碑管理对话框 -->
    <el-dialog v-model="msVisible" :title="`里程碑管理 - ${currentProject?.name}`" width="1100px">
      <div class="ms-toolbar">
        <el-button type="primary" @click="handleAddMs">
          <el-icon><Plus /></el-icon> 添加里程碑
        </el-button>
        <div class="ms-stats">
          <el-tag type="success">已完成: {{ msStats.completed }}</el-tag>
          <el-tag type="warning">进行中: {{ msStats.inProgress }}</el-tag>
          <el-tag type="info">待开始: {{ msStats.notStarted }}</el-tag>
          <el-tag type="danger">已延期: {{ msStats.delayed }}</el-tag>
        </div>
      </div>

      <el-table :data="milestones" border v-loading="msLoading">
        <el-table-column prop="name" label="里程碑名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="plannedDate" label="计划日期" width="110" />
        <el-table-column prop="actualDate" label="实际日期" width="110">
          <template #default="{ row }">{{ row.actualDate || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getMsStatusType(row.status)" size="small">{{ getMsStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assigneeUser.name" label="负责人" width="100">
          <template #default="{ row }">{{ row.assigneeUser?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'not_started'"
              type="primary" link size="small"
              @click="updateMsStatus(row, 'in_progress')"
            >开始</el-button>
            <el-button
              v-if="row.status === 'in_progress'"
              type="success" link size="small"
              @click="completeMs(row)"
            >完成</el-button>
            <el-button
              v-if="row.status === 'in_progress'"
              type="warning" link size="small"
              @click="delayMs(row)"
            >延期</el-button>
            <el-button type="primary" link size="small" @click="editMs(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteMs(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 里程碑表单对话框 -->
    <el-dialog v-model="msFormVisible" :title="msEditId ? '编辑里程碑' : '新增里程碑'" width="560px" @close="resetMsForm">
      <el-form ref="msFormRef" :model="msForm" :rules="msRules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="msForm.name" placeholder="里程碑名称" />
        </el-form-item>
        <el-form-item label="计划日期" prop="plannedDate">
          <el-date-picker v-model="msForm.plannedDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="msForm.assignee" filterable clearable placeholder="选择负责人" style="width:100%">
            <el-option v-for="u in pmOptions" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="msForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="msFormVisible = false">取消</el-button>
        <el-button type="primary" :loading="msSaving" @click="saveMs">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" :title="`项目详情 - ${currentProject?.name}`" size="520px">
      <template v-if="currentProject">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目名称" :span="2">{{ currentProject.name }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ currentProject.customer?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ getTypeName(currentProject.type) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentProject.status)" size="small">{{ getStatusName(currentProject.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="进度">
            <el-progress :percentage="currentProject.progress || 0" :stroke-width="8" />
          </el-descriptions-item>
          <el-descriptions-item label="项目经理">{{ currentProject.managerUser?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预算">{{ currentProject.budget ? `¥${(currentProject.budget/10000).toFixed(2)}万` : '-' }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ currentProject.startDate }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ currentProject.endDate }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ currentProject.description || '-' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { request } from '@/utils/request'
import { hasPermission } from '@/utils/permission'

// ─── 常量 ────────────────────────────────────────────────────
const statusOptions = [
  { label: '规划中', value: 'planning' },
  { label: '进行中', value: 'in_progress' },
  { label: '已暂停', value: 'on_hold' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]
const typeOptions = [
  { label: '售前项目', value: 'presales' },
  { label: '开发项目', value: 'development' },
  { label: '实施项目', value: 'implementation' },
  { label: '运维项目', value: 'maintenance' },
  { label: '咨询项目', value: 'consulting' },
]

const getStatusName = (s: string) => statusOptions.find(o => o.value === s)?.label ?? s
const getTypeName  = (s: string) => typeOptions.find(o => o.value === s)?.label ?? s
const getStatusType = (s: string): any => ({
  planning: 'info', in_progress: 'warning', on_hold: '',
  completed: 'success', cancelled: 'danger'
}[s] ?? 'info')

const getMsStatusName = (s: string) => ({
  not_started: '待开始', in_progress: '进行中',
  completed: '已完成', delayed: '已延期', cancelled: '已取消'
}[s] ?? s)
const getMsStatusType = (s: string): any => ({
  not_started: 'info', in_progress: 'warning',
  completed: 'success', delayed: 'danger', cancelled: ''
}[s] ?? 'info')

// ─── 状态 ────────────────────────────────────────────────────
const loading     = ref(false)
const saving      = ref(false)
const msLoading   = ref(false)
const msSaving    = ref(false)
const formVisible = ref(false)
const msVisible   = ref(false)
const msFormVisible = ref(false)
const detailVisible = ref(false)
const editId      = ref('')
const msEditId    = ref('')
const tableData   = ref<any[]>([])
const milestones  = ref<any[]>([])
const custOptions = ref<any[]>([])
const pmOptions   = ref<any[]>([])
const currentProject = ref<any>(null)
const formRef  = ref<FormInstance>()
const msFormRef = ref<FormInstance>()
const pg = reactive({ current: 1, size: 10, total: 0 })
const search = reactive({ keyword: '', status: '', type: '' })

const form = reactive({
  name: '', customerId: '', type: 'development', status: 'planning',
  manager: '', startDate: '', endDate: '', budget: 0, description: ''
})
const msForm = reactive({
  name: '', plannedDate: '', assignee: '', description: ''
})

const rules = {
  name:       [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  customerId: [{ required: true, message: '请选择客户',    trigger: 'change' }],
  type:       [{ required: true, message: '请选择类型',    trigger: 'change' }],
  manager:    [{ required: true, message: '请选择项目经理', trigger: 'change' }],
  startDate:  [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate:    [{ required: true, message: '请选择结束日期', trigger: 'change' }],
}
const msRules = {
  name:        [{ required: true, message: '请输入里程碑名称', trigger: 'blur' }],
  plannedDate: [{ required: true, message: '请选择计划日期',   trigger: 'change' }],
}

const msStats = computed(() => ({
  completed:  milestones.value.filter(m => m.status === 'completed').length,
  inProgress: milestones.value.filter(m => m.status === 'in_progress').length,
  notStarted: milestones.value.filter(m => m.status === 'not_started').length,
  delayed:    milestones.value.filter(m => m.status === 'delayed').length,
}))

// ─── 数据获取 ─────────────────────────────────────────────────
const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/projects', {
      params: { page: pg.current, pageSize: pg.size, ...search }
    })
    tableData.value = res?.items ?? res?.data ?? []
    pg.total = res?.total ?? 0
  } finally { loading.value = false }
}

const fetchMilestones = async (projectId: string) => {
  msLoading.value = true
  try {
    const res: any = await request.get(`/projects/${projectId}/milestones`)
    milestones.value = Array.isArray(res) ? res : (res?.items ?? res?.data ?? [])
  } finally { msLoading.value = false }
}

const searchCustomers = async (q: string) => {
  try {
    const res: any = await request.get('/customers', { params: { keyword: q, pageSize: 20 } })
    custOptions.value = res?.items ?? res?.data ?? []
  } catch { /* ignore */ }
}

const fetchPmOptions = async () => {
  try {
    const res: any = await request.get('/users', {
      params: { role: 'project_manager', pageSize: 100, status: 'active' }
    })
    // Also include sales_manager and admin as PM options
    const res2: any = await request.get('/users', {
      params: { pageSize: 50, status: 'active' }
    })
    pmOptions.value = res2?.users ?? res2?.data ?? []
  } catch { /* ignore */ }
}

// ─── 项目 CRUD ────────────────────────────────────────────────
const handleSearch = () => { pg.current = 1; fetchData() }
const handleReset  = () => { Object.assign(search, { keyword: '', status: '', type: '' }); handleSearch() }

const handleAdd = async () => {
  await fetchPmOptions()
  editId.value = ''
  formVisible.value = true
}

const handleView = (row: any) => {
  currentProject.value = row
  detailVisible.value = true
}

const handleEdit = async (row: any) => {
  await fetchPmOptions()
  editId.value = row.id
  Object.assign(form, {
    name: row.name, customerId: row.customerId, type: row.type,
    status: row.status, manager: row.manager,
    startDate: row.startDate, endDate: row.endDate,
    budget: row.budget || 0, description: row.description || ''
  })
  if (row.customer) custOptions.value = [row.customer]
  formVisible.value = true
}

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确认删除项目"${row.name}"？`, '删除确认', { type: 'warning' })
  await request.delete(`/projects/${row.id}`)
  ElMessage.success('删除成功')
  fetchData()
}

const save = async () => {
  const v = await formRef.value?.validate().catch(() => false)
  if (!v) return
  saving.value = true
  try {
    if (editId.value) {
      await request.put(`/projects/${editId.value}`, form)
    } else {
      await request.post('/projects', form)
    }
    ElMessage.success('保存成功')
    formVisible.value = false
    fetchData()
  } finally { saving.value = false }
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(form, {
    name: '', customerId: '', type: 'development', status: 'planning',
    manager: '', startDate: '', endDate: '', budget: 0, description: ''
  })
}

// ─── 里程碑管理 ───────────────────────────────────────────────
const handleMilestone = async (row: any) => {
  currentProject.value = row
  await fetchPmOptions()
  await fetchMilestones(row.id)
  msVisible.value = true
}

const handleAddMs = () => {
  msEditId.value = ''
  msFormVisible.value = true
}

const editMs = (row: any) => {
  msEditId.value = row.id
  Object.assign(msForm, {
    name: row.name,
    plannedDate: row.plannedDate,
    assignee: row.assignee || '',
    description: row.description || ''
  })
  msFormVisible.value = true
}

const deleteMs = async (row: any) => {
  await ElMessageBox.confirm(`确认删除里程碑"${row.name}"？`, '删除', { type: 'warning' })
  await request.delete(`/projects/milestones/${row.id}`)
  ElMessage.success('删除成功')
  fetchMilestones(currentProject.value.id)
}

const updateMsStatus = async (row: any, status: string) => {
  await request.patch(`/projects/milestones/${row.id}/status`, { status })
  ElMessage.success('状态已更新')
  fetchMilestones(currentProject.value.id)
}

const completeMs = async (row: any) => {
  const { value: remark } = await ElMessageBox.prompt('请输入完成备注（可选）', '完成里程碑', {
    confirmButtonText: '确定', cancelButtonText: '取消', inputPlaceholder: '可选'
  }).catch(() => ({ value: '' }))
  await request.post(`/projects/milestones/${row.id}/complete`, { remark })
  ElMessage.success('里程碑已完成')
  fetchMilestones(currentProject.value.id)
  fetchData() // 刷新项目进度
}

const delayMs = async (row: any) => {
  const { value: reason } = await ElMessageBox.prompt('请输入延期原因', '标记延期', {
    confirmButtonText: '确定', cancelButtonText: '取消',
    inputValidator: (v) => !v ? '请输入延期原因' : true
  })
  await request.patch(`/projects/milestones/${row.id}/status`, { status: 'delayed', reason })
  ElMessage.success('已标记为延期')
  fetchMilestones(currentProject.value.id)
}

const saveMs = async () => {
  const v = await msFormRef.value?.validate().catch(() => false)
  if (!v) return
  msSaving.value = true
  try {
    if (msEditId.value) {
      await request.put(`/projects/milestones/${msEditId.value}`, msForm)
    } else {
      await request.post(`/projects/${currentProject.value.id}/milestones`, msForm)
    }
    ElMessage.success('保存成功')
    msFormVisible.value = false
    fetchMilestones(currentProject.value.id)
  } finally { msSaving.value = false }
}

const resetMsForm = () => {
  msFormRef.value?.resetFields()
  Object.assign(msForm, { name: '', plannedDate: '', assignee: '', description: '' })
}

onMounted(fetchData)
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-form { margin-bottom: 16px; }
.pagination  { margin-top: 20px; justify-content: flex-end; }
.ms-toolbar  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
.ms-stats    { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
