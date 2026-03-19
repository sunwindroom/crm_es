<template>
  <div class="opportunity-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商机管理</span>
          <el-button v-if="hasPermission('lead_create')" type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 新增商机
          </el-button>
        </div>
      </template>

      <el-form :model="search" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="search.keyword" placeholder="商机名称" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="阶段">
          <el-select v-model="search.stage" clearable placeholder="全部" style="width:120px">
            <el-option v-for="o in stageOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="search.status" clearable placeholder="全部" style="width:100px">
            <el-option label="进行中" value="active" />
            <el-option label="已成交" value="won" />
            <el-option label="已失败" value="lost" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 漏斗统计 -->
      <el-row :gutter="12" class="funnel-row">
        <el-col v-for="s in funnelData" :key="s.stage" :span="4">
          <el-card shadow="never" class="funnel-card">
            <div class="funnel-label">{{ getStageName(s.stage) }}</div>
            <div class="funnel-count">{{ s.count }} 个</div>
            <div class="funnel-amount">¥{{ (s.totalAmount / 10000).toFixed(1) }}万</div>
          </el-card>
        </el-col>
      </el-row>

      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="name" label="商机名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="customer.name" label="客户" width="150">
          <template #default="{ row }">{{ row.customer?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">¥{{ (row.amount / 10000).toFixed(2) }}万</template>
        </el-table-column>
        <el-table-column prop="stage" label="阶段" width="110">
          <template #default="{ row }">
            <el-tag :type="getStageType(row.stage)" size="small">{{ getStageName(row.stage) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="probability" label="成功率" width="80">
          <template #default="{ row }">{{ row.probability }}%</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'won' ? 'success' : row.status === 'lost' ? 'danger' : 'primary'" size="small">
              {{ { active: '进行中', won: '已成交', lost: '已失败' }[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expectedCloseDate" label="预计成交" width="110" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 'active'" type="success" link size="small" @click="handleWon(row)">赢单</el-button>
            <el-button v-if="row.status === 'active'" type="warning" link size="small" @click="handleLost(row)">输单</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page.current"
        v-model:page-size="page.size"
        :total="page.total"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        @change="fetchData"
      />
    </el-card>

    <el-dialog v-model="visible" :title="editId ? '编辑商机' : '新增商机'" width="700px" @close="reset">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="商机名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入商机名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联客户" prop="customerId">
              <el-select v-model="form.customerId" filterable remote :remote-method="searchCustomers" placeholder="搜索客户" style="width:100%">
                <el-option v-for="c in customerOptions" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商机金额" prop="amount">
              <el-input-number v-model="form.amount" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="销售阶段" prop="stage">
              <el-select v-model="form.stage" style="width:100%">
                <el-option v-for="o in stageOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成功概率" prop="probability">
              <el-slider v-model="form.probability" :marks="{ 0: '0%', 50: '50%', 100: '100%' }" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预计成交日" prop="expectedCloseDate">
              <el-date-picker v-model="form.expectedCloseDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { request } from '@/utils/request'
import { hasPermission } from '@/utils/permission'

const stageOptions = [
  { label: '初步接触', value: 'initial' },
  { label: '需求确认', value: 'requirement' },
  { label: '方案报价', value: 'proposal' },
  { label: '商务谈判', value: 'negotiation' },
  { label: '签订合同', value: 'contract' },
]

const getStageType = (s: string): any => ({ initial: 'info', requirement: 'primary', proposal: 'warning', negotiation: 'warning', contract: 'success' }[s] ?? 'info')
const getStageName = (s: string) => stageOptions.find(o => o.value === s)?.label ?? s

const loading = ref(false)
const saving = ref(false)
const visible = ref(false)
const editId = ref('')
const tableData = ref<any[]>([])
const funnelData = ref<any[]>([])
const customerOptions = ref<any[]>([])
const formRef = ref<FormInstance>()
const page = reactive({ current: 1, size: 10, total: 0 })
const search = reactive({ keyword: '', stage: '', status: '' })

const form = reactive({
  name: '', customerId: '', amount: 0, stage: 'initial',
  probability: 30, expectedCloseDate: '', description: ''
})
const rules = {
  name: [{ required: true, message: '请输入商机名称', trigger: 'blur' }],
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  stage: [{ required: true, message: '请选择阶段', trigger: 'change' }],
}

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/opportunities', {
      params: { page: page.current, pageSize: page.size, ...search }
    })
    tableData.value = res?.items ?? res?.data ?? []
    page.total = res?.total ?? 0
  } finally { loading.value = false }
}

const fetchFunnel = async () => {
  try {
    const res: any = await request.get('/opportunities/funnel')
    funnelData.value = Array.isArray(res) ? res : []
  } catch { /* ignore */ }
}

const searchCustomers = async (q: string) => {
  try {
    const res: any = await request.get('/customers', { params: { keyword: q, pageSize: 20 } })
    customerOptions.value = res?.items ?? res?.data ?? []
  } catch { /* ignore */ }
}

const handleSearch = () => { page.current = 1; fetchData() }
const handleReset = () => { Object.assign(search, { keyword: '', stage: '', status: '' }); handleSearch() }
const handleAdd = () => { editId.value = ''; visible.value = true }
const handleEdit = (row: any) => {
  editId.value = row.id
  Object.assign(form, row)
  visible.value = true
}
const handleWon = (row: any) => {
  ElMessageBox.confirm(`确认"${row.name}"赢单？`, '赢单确认', { type: 'success' })
    .then(async () => {
      await request.post(`/opportunities/${row.id}/win`)
      ElMessage.success('已标记为赢单')
      fetchData()
    })
}
const handleLost = (row: any) => {
  ElMessageBox.prompt('请输入输单原因', '输单', { inputType: 'textarea' })
    .then(async ({ value }) => {
      await request.post(`/opportunities/${row.id}/lose`, { reason: value })
      ElMessage.success('已标记为输单')
      fetchData()
    })
}
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认删除商机"${row.name}"？`, '删除', { type: 'warning' })
    .then(async () => {
      await request.delete(`/opportunities/${row.id}`)
      ElMessage.success('删除成功')
      fetchData()
    })
}
const save = async () => {
  const v = await formRef.value?.validate().catch(() => false)
  if (!v) return
  saving.value = true
  try {
    if (editId.value) {
      await request.put(`/opportunities/${editId.value}`, form)
      ElMessage.success('保存成功')
    } else {
      await request.post('/opportunities', form)
      ElMessage.success('创建成功')
    }
    visible.value = false
    fetchData()
    fetchFunnel()
  } finally { saving.value = false }
}
const reset = () => {
  formRef.value?.resetFields()
  Object.assign(form, { name: '', customerId: '', amount: 0, stage: 'initial', probability: 30, expectedCloseDate: '', description: '' })
}

onMounted(() => { fetchData(); fetchFunnel() })
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-form { margin-bottom: 16px; }
.funnel-row { margin-bottom: 20px; }
.funnel-card { text-align: center; padding: 8px; }
.funnel-label { font-size: 13px; color: #606266; margin-bottom: 6px; }
.funnel-count { font-size: 20px; font-weight: 600; color: #303133; }
.funnel-amount { font-size: 12px; color: #909399; margin-top: 4px; }
.pagination { margin-top: 20px; justify-content: flex-end; }
</style>
