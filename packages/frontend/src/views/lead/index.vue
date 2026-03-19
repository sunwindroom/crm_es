<template>
  <div class="lead-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>线索管理</span>
          <div class="header-actions">
            <el-button
              v-if="selectedLeads.length > 0 && hasPermission('lead_assign')"
              type="success"
              @click="handleBatchAssign"
            >
              批量分配 ({{ selectedLeads.length }})
            </el-button>
            <el-button v-if="hasPermission('lead_create')" type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon> 新增线索
            </el-button>
          </div>
        </div>
      </template>

      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="姓名/公司/电话" clearable style="width:200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" clearable placeholder="全部" style="width:120px">
            <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="searchForm.source" clearable placeholder="全部" style="width:120px">
            <el-option v-for="o in sourceOptions" :key="o.value" :label="o.label" :value="o.value" />
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
        <el-table-column v-if="hasPermission('lead_assign')" type="selection" width="50" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="company" label="公司" min-width="160" show-overflow-tooltip />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="source" label="来源" width="90">
          <template #default="{ row }">{{ getSourceText(row.source) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignedUser.name" label="负责人" width="90">
          <template #default="{ row }">{{ row.assignedUser?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="150">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
            <el-button v-if="canEditLead(row)" type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="hasPermission('lead_assign') && canEditLead(row)" type="success" link size="small" @click="handleAssign(row)">分配</el-button>
            <el-button v-if="hasPermission('lead_convert') && row.status !== 'converted'" type="warning" link size="small" @click="handleConvert(row)">转化</el-button>
            <el-button v-if="canDeleteLead(row)" type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="680px" @close="resetForm">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="formData.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公司" prop="company">
              <el-input v-model="formData.company" placeholder="请输入公司名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电话" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="来源" prop="source">
              <el-select v-model="formData.source" placeholder="选择来源" style="width:100%">
                <el-option v-for="o in sourceOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" placeholder="选择状态" style="width:100%">
                <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="行业" prop="industry">
              <el-input v-model="formData.industry" placeholder="所在行业" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地区" prop="region">
              <el-input v-model="formData.region" placeholder="所在地区" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="需求说明" prop="requirement">
          <el-input v-model="formData.requirement" type="textarea" :rows="3" placeholder="请描述客户需求" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配对话框 -->
    <el-dialog v-model="assignVisible" title="分配线索" width="480px" @close="resetAssignForm">
      <el-form ref="assignFormRef" :model="assignForm" :rules="assignRules" label-width="90px">
        <el-form-item label="分配给" prop="userId">
          <el-select v-model="assignForm.userId" filterable placeholder="选择销售人员" style="width:100%">
            <el-option
              v-for="u in salesUsers"
              :key="u.id"
              :label="`${u.name}（${u.department || ''}）`"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="assignForm.remark" type="textarea" :rows="2" placeholder="分配备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" :loading="assigning" @click="handleAssignSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="线索详情" size="500px">
      <template v-if="currentLead">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ currentLead.name }}</el-descriptions-item>
          <el-descriptions-item label="公司">{{ currentLead.company }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ currentLead.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ currentLead.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="来源">{{ getSourceText(currentLead.source) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentLead.status)" size="small">{{ getStatusText(currentLead.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="行业">{{ currentLead.industry || '-' }}</el-descriptions-item>
          <el-descriptions-item label="地区">{{ currentLead.region || '-' }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentLead.assignedUser?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentLead.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="需求说明" :span="2">{{ currentLead.requirement || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="currentLead.lostReason" label="流失原因" :span="2">{{ currentLead.lostReason }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import dayjs from 'dayjs'
import { leadApi } from '@/api/lead'
import { userApi } from '@/api/user'
import type { Lead, User } from '@/types'
import { hasPermission, canEditLead, canDeleteLead } from '@/utils/permission'

// ─── 常量 ─────────────────────────────────────────────────
const statusOptions = [
  { label: '新线索', value: 'new' },
  { label: '已联系', value: 'contacted' },
  { label: '已验证', value: 'qualified' },
  { label: '已转化', value: 'converted' },
  { label: '已丢失', value: 'lost' },
]
const sourceOptions = [
  { label: '官网', value: 'website' },
  { label: '推荐', value: 'referral' },
  { label: '广告', value: 'advertisement' },
  { label: '展会', value: 'exhibition' },
  { label: '电话营销', value: 'cold_call' },
  { label: '其他', value: 'other' },
]

const formatDate = (d: string) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'

const getStatusText = (s: string) => statusOptions.find(o => o.value === s)?.label ?? s
const getSourceText = (s: string) => sourceOptions.find(o => o.value === s)?.label ?? s
const getStatusType = (s: string): any => ({
  new: 'primary', contacted: 'warning', qualified: 'success',
  converted: '', lost: 'danger'
}[s] ?? 'info')

// ─── 状态 ─────────────────────────────────────────────────
const loading = ref(false)
const submitting = ref(false)
const assigning = ref(false)
const dialogVisible = ref(false)
const assignVisible = ref(false)
const detailVisible = ref(false)
const dialogTitle = ref('新增线索')
const tableData = ref<Lead[]>([])
const selectedLeads = ref<Lead[]>([])
const salesUsers = ref<User[]>([])
const currentLead = ref<Lead | null>(null)
const formRef = ref<FormInstance>()
const assignFormRef = ref<FormInstance>()

const searchForm = reactive({ keyword: '', status: '', source: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const formData = reactive({
  id: '', name: '', company: '', phone: '', email: '',
  source: 'other', status: 'new', industry: '', region: '', requirement: ''
})
const assignForm = reactive({ leadIds: [] as string[], userId: '', remark: '' })

const formRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  company: [{ required: true, message: '请输入公司', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
}
const assignRules = {
  userId: [{ required: true, message: '请选择销售人员', trigger: 'change' }],
}

// ─── 方法 ─────────────────────────────────────────────────
const fetchData = async () => {
  loading.value = true
  try {
    const res = await leadApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      source: searchForm.source || undefined,
    })
    // 兼容 { items, total } 和 { data, total }
    tableData.value = (res as any).items ?? (res as any).data ?? []
    pagination.total = (res as any).total ?? 0
  } finally {
    loading.value = false
  }
}

const fetchSalesUsers = async () => {
  try {
    const res = await userApi.getSalesUsers()
    salesUsers.value = Array.isArray(res) ? res : (res as any).data ?? []
  } catch { /* ignore */ }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => { Object.assign(searchForm, { keyword: '', status: '', source: '' }); handleSearch() }
const handleSelectionChange = (rows: Lead[]) => { selectedLeads.value = rows }

const handleAdd = () => { dialogTitle.value = '新增线索'; dialogVisible.value = true }
const handleView = (row: Lead) => { currentLead.value = row; detailVisible.value = true }
const handleEdit = (row: Lead) => {
  dialogTitle.value = '编辑线索'
  Object.assign(formData, { ...row })
  dialogVisible.value = true
}

const handleAssign = async (row: Lead) => {
  assignForm.leadIds = [row.id]
  assignForm.userId = ''
  assignForm.remark = ''
  await fetchSalesUsers()
  assignVisible.value = true
}

const handleBatchAssign = async () => {
  assignForm.leadIds = selectedLeads.value.map(l => l.id)
  assignForm.userId = ''
  assignForm.remark = ''
  await fetchSalesUsers()
  assignVisible.value = true
}

const handleConvert = (row: Lead) => {
  ElMessageBox.confirm(`确认将线索"${row.name}"转化为客户吗？`, '转化确认', {
    type: 'warning',
  }).then(async () => {
    await leadApi.convert(row.id, { customerId: '' })
    ElMessage.success('转化成功')
    fetchData()
  })
}

const handleDelete = (row: Lead) => {
  ElMessageBox.confirm(`确认删除线索"${row.name}"吗？`, '删除确认', { type: 'warning' })
    .then(async () => {
      await leadApi.delete(row.id)
      ElMessage.success('删除成功')
      fetchData()
    })
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (formData.id) {
      await leadApi.update(formData.id, formData)
      ElMessage.success('编辑成功')
    } else {
      await leadApi.create(formData)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchData()
  } finally { submitting.value = false }
}

const handleAssignSubmit = async () => {
  const valid = await assignFormRef.value?.validate().catch(() => false)
  if (!valid) return
  assigning.value = true
  try {
    await leadApi.batchAssign(assignForm.leadIds, { userId: assignForm.userId, remark: assignForm.remark })
    ElMessage.success(`成功分配 ${assignForm.leadIds.length} 条线索`)
    assignVisible.value = false
    fetchData()
  } finally { assigning.value = false }
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(formData, { id: '', name: '', company: '', phone: '', email: '', source: 'other', status: 'new', industry: '', region: '', requirement: '' })
}
const resetAssignForm = () => { assignFormRef.value?.resetFields() }

onMounted(fetchData)
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 10px; }
.search-form { margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
.pagination { margin-top: 20px; justify-content: flex-end; }
</style>
