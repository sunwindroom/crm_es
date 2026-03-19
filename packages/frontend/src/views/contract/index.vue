<template>
  <div class="contract-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>合同管理</span>
          <el-button v-if="hasPermission('contract_create')" type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 新增合同
          </el-button>
        </div>
      </template>

      <el-form :model="search" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="search.keyword" placeholder="合同编号/名称" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="search.status" clearable placeholder="全部" style="width:120px">
            <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="contractNo" label="合同编号" width="150" />
        <el-table-column prop="name" label="合同名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="customer.name" label="客户" width="140">
          <template #default="{ row }">{{ row.customer?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="合同金额" width="120">
          <template #default="{ row }">¥{{ fmt(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="paidAmount" label="已回款" width="110">
          <template #default="{ row }">
            <span :class="{ 'text-success': row.paidAmount >= row.amount }">¥{{ fmt(row.paidAmount || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="回款进度" width="140">
          <template #default="{ row }">
            <el-progress
              :percentage="row.amount ? Math.min(100, Math.round((row.paidAmount || 0) / row.amount * 100)) : 0"
              :status="(row.paidAmount || 0) >= row.amount ? 'success' : undefined"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startDate" label="开始日期" width="110" />
        <el-table-column prop="endDate" label="结束日期" width="110" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
            <el-button v-if="canEdit(row)" type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 'draft'" type="warning" link size="small" @click="handleSubmitApproval(row)">提交审批</el-button>
            <el-button v-if="row.status === 'approved'" type="success" link size="small" @click="handleSign(row)">签署</el-button>
            <el-button v-if="hasPermission('payment_create') && ['signed','executing'].includes(row.status)" type="success" link size="small" @click="handlePayment(row)">回款</el-button>
            <el-button v-if="hasPermission('contract_delete') && row.status === 'draft'" type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
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

    <!-- 合同表单对话框 -->
    <el-dialog v-model="formVisible" :title="editId ? '编辑合同' : '新增合同'" width="760px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入合同名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合同类型" prop="type">
              <el-select v-model="form.type" style="width:100%">
                <el-option label="销售合同" value="sales" />
                <el-option label="服务合同" value="service" />
                <el-option label="采购合同" value="purchase" />
                <el-option label="维保合同" value="maintenance" />
                <el-option label="咨询合同" value="consulting" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联客户" prop="customerId">
              <el-select v-model="form.customerId" filterable remote :remote-method="searchCustomers" placeholder="搜索客户" style="width:100%">
                <el-option v-for="c in custOptions" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合同金额" prop="amount">
              <el-input-number v-model="form.amount" :min="0.01" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="签订日期" prop="signDate">
              <el-date-picker v-model="form.signDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同开始" prop="startDate">
              <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合同结束" prop="endDate">
              <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="合同描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="合同条款" prop="terms">
          <el-input v-model="form.terms" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">确定</el-button>
      </template>
    </el-dialog>

    <!-- 回款管理对话框 -->
    <el-dialog v-model="paymentVisible" :title="`回款管理 - ${currentContract?.name}`" width="1000px">
      <div class="payment-toolbar">
        <el-button type="primary" @click="handleAddPayment">
          <el-icon><Plus /></el-icon> 添加回款
        </el-button>
        <div class="payment-stats">
          <el-tag>合同金额: ¥{{ fmt(currentContract?.amount) }}</el-tag>
          <el-tag type="success">已确认: ¥{{ fmt(paymentStats.confirmed) }}</el-tag>
          <el-tag type="warning">待确认: ¥{{ fmt(paymentStats.pending) }}</el-tag>
          <el-tag type="info">未回款: ¥{{ fmt((currentContract?.amount || 0) - paymentStats.confirmed) }}</el-tag>
        </div>
      </div>

      <el-table :data="payments" border v-loading="payLoading">
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">¥{{ fmt(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="方式" width="100">
          <template #default="{ row }">{{ methodText(row.paymentMethod) }}</template>
        </el-table-column>
        <el-table-column prop="paymentDate" label="支付日期" width="110" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="{ pending: 'warning', confirmed: 'success', rejected: 'danger' }[row.status] || 'info'" size="small">
              {{ { pending: '待确认', confirmed: '已确认', rejected: '已拒绝' }[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="success" link size="small" @click="confirmPayment(row)">确认</el-button>
              <el-button type="danger" link size="small" @click="rejectPayment(row)">拒绝</el-button>
            </template>
            <el-button v-if="row.status === 'pending'" type="primary" link size="small" @click="editPayment(row)">编辑</el-button>
            <el-button v-if="row.status !== 'confirmed'" type="danger" link size="small" @click="deletePayment(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 回款表单对话框 -->
    <el-dialog v-model="payFormVisible" :title="payEditId ? '编辑回款' : '新增回款'" width="520px" @close="resetPayForm">
      <el-form ref="payFormRef" :model="payForm" :rules="payRules" label-width="100px">
        <el-form-item label="回款金额" prop="amount">
          <el-input-number v-model="payForm.amount" :min="0.01" :precision="2" style="width:100%" />
          <div class="form-hint">合同未回款: ¥{{ fmt(remainingAmount) }}</div>
        </el-form-item>
        <el-form-item label="支付方式" prop="paymentMethod">
          <el-select v-model="payForm.paymentMethod" style="width:100%">
            <el-option label="银行转账" value="bank_transfer" />
            <el-option label="现金" value="cash" />
            <el-option label="支票" value="check" />
            <el-option label="在线支付" value="online" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付日期" prop="paymentDate">
          <el-date-picker v-model="payForm.paymentDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="payForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payFormVisible = false">取消</el-button>
        <el-button type="primary" :loading="paySaving" @click="savePayment">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" :title="`合同详情 - ${currentContract?.contractNo}`" size="600px">
      <template v-if="currentContract">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="合同编号" :span="2">{{ currentContract.contractNo }}</el-descriptions-item>
          <el-descriptions-item label="合同名称" :span="2">{{ currentContract.name }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ currentContract.customer?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ typeText(currentContract.type) }}</el-descriptions-item>
          <el-descriptions-item label="合同金额">¥{{ fmt(currentContract.amount) }}</el-descriptions-item>
          <el-descriptions-item label="已回款">¥{{ fmt(currentContract.paidAmount || 0) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentContract.status)" size="small">{{ getStatusText(currentContract.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="签订日期">{{ currentContract.signDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ currentContract.startDate }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ currentContract.endDate }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ currentContract.description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="条款" :span="2">{{ currentContract.terms || '-' }}</el-descriptions-item>
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

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '待审批', value: 'pending' },
  { label: '已审批', value: 'approved' },
  { label: '已签署', value: 'signed' },
  { label: '执行中', value: 'executing' },
  { label: '已完成', value: 'completed' },
  { label: '已终止', value: 'terminated' },
]

const fmt = (v: any) => v != null ? (v / 10000).toFixed(2) + '万' : '0.00万'
const getStatusText = (s: string) => statusOptions.find(o => o.value === s)?.label ?? s
const getStatusType = (s: string): any => ({ draft: 'info', pending: 'warning', approved: '', signed: 'success', executing: 'primary', completed: 'success', terminated: 'danger' }[s] ?? 'info')
const methodText = (m: string) => ({ bank_transfer: '银行转账', cash: '现金', check: '支票', online: '在线支付', other: '其他' }[m] ?? m)
const typeText = (t: string) => ({ sales: '销售', service: '服务', purchase: '采购', maintenance: '维保', consulting: '咨询', other: '其他' }[t] ?? t)
const canEdit = (row: any) => hasPermission('contract_edit') && ['draft', 'rejected'].includes(row.status)

const loading = ref(false)
const saving = ref(false)
const payLoading = ref(false)
const paySaving = ref(false)
const formVisible = ref(false)
const paymentVisible = ref(false)
const payFormVisible = ref(false)
const detailVisible = ref(false)
const editId = ref('')
const payEditId = ref('')
const tableData = ref<any[]>([])
const payments = ref<any[]>([])
const custOptions = ref<any[]>([])
const currentContract = ref<any>(null)
const formRef = ref<FormInstance>()
const payFormRef = ref<FormInstance>()
const pg = reactive({ current: 1, size: 10, total: 0 })
const search = reactive({ keyword: '', status: '' })

const form = reactive({
  name: '', customerId: '', type: 'sales', amount: 0,
  signDate: '', startDate: '', endDate: '', description: '', terms: ''
})
const payForm = reactive({ amount: 0, paymentMethod: 'bank_transfer', paymentDate: '', remark: '' })

const paymentStats = computed(() => ({
  confirmed: payments.value.filter(p => p.status === 'confirmed').reduce((s, p) => s + Number(p.amount), 0),
  pending: payments.value.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0),
}))

const remainingAmount = computed(() => {
  if (!currentContract.value) return 0
  return Math.max(0, Number(currentContract.value.amount) - paymentStats.value.confirmed - paymentStats.value.pending)
})

const rules = {
  name: [{ required: true, message: '请输入合同名称', trigger: 'blur' }],
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  amount: [{ required: true, message: '请输入合同金额', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
}
const payRules = {
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  paymentMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
  paymentDate: [{ required: true, message: '请选择支付日期', trigger: 'change' }],
}

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/contracts', { params: { page: pg.current, pageSize: pg.size, ...search } })
    tableData.value = res?.items ?? res?.data ?? []
    pg.total = res?.total ?? 0
  } finally { loading.value = false }
}

const fetchPayments = async (contractId: string) => {
  payLoading.value = true
  try {
    const res: any = await request.get('/payments', { params: { contractId, pageSize: 50 } })
    payments.value = res?.items ?? res?.data ?? []
  } finally { payLoading.value = false }
}

const searchCustomers = async (q: string) => {
  try {
    const res: any = await request.get('/customers', { params: { keyword: q, pageSize: 20 } })
    custOptions.value = res?.items ?? res?.data ?? []
  } catch { /* */ }
}

const handleSearch = () => { pg.current = 1; fetchData() }
const handleReset = () => { Object.assign(search, { keyword: '', status: '' }); handleSearch() }
const handleAdd = () => { editId.value = ''; formVisible.value = true }
const handleView = (row: any) => { currentContract.value = row; detailVisible.value = true }
const handleEdit = (row: any) => { editId.value = row.id; Object.assign(form, row); formVisible.value = true }

const handleSubmitApproval = async (row: any) => {
  await request.post(`/contracts/${row.id}/submit`)
  ElMessage.success('已提交审批')
  fetchData()
}
const handleSign = async (row: any) => {
  ElMessageBox.prompt('请输入签署日期', '合同签署', { inputType: 'date' })
    .then(async ({ value }) => {
      await request.post(`/contracts/${row.id}/sign`, { signDate: value || new Date().toISOString().slice(0, 10) })
      ElMessage.success('合同已签署')
      fetchData()
    })
}
const handleDelete = async (row: any) => {
  await ElMessageBox.confirm(`确认删除合同"${row.name}"？`, '删除', { type: 'warning' })
  await request.delete(`/contracts/${row.id}`)
  ElMessage.success('删除成功')
  fetchData()
}

const handlePayment = async (row: any) => {
  currentContract.value = row
  await fetchPayments(row.id)
  paymentVisible.value = true
}

const handleAddPayment = () => { payEditId.value = ''; payForm.amount = 0; payFormVisible.value = true }
const editPayment = (row: any) => { payEditId.value = row.id; Object.assign(payForm, row); payFormVisible.value = true }

const confirmPayment = async (row: any) => {
  await request.post(`/payments/${row.id}/confirm`)
  ElMessage.success('回款已确认')
  await fetchPayments(currentContract.value.id)
  fetchData()
}
const rejectPayment = async (row: any) => {
  const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝回款', { inputType: 'textarea' })
  await request.post(`/payments/${row.id}/reject`, { reason })
  ElMessage.success('已拒绝')
  fetchPayments(currentContract.value.id)
}
const deletePayment = async (row: any) => {
  await ElMessageBox.confirm('确认删除此回款？', '删除', { type: 'warning' })
  await request.delete(`/payments/${row.id}`)
  ElMessage.success('删除成功')
  fetchPayments(currentContract.value.id)
}

const save = async () => {
  const v = await formRef.value?.validate().catch(() => false)
  if (!v) return
  saving.value = true
  try {
    if (editId.value) {
      await request.put(`/contracts/${editId.value}`, form)
    } else {
      await request.post('/contracts', form)
    }
    ElMessage.success('保存成功')
    formVisible.value = false
    fetchData()
  } finally { saving.value = false }
}

const savePayment = async () => {
  const v = await payFormRef.value?.validate().catch(() => false)
  if (!v) return
  paySaving.value = true
  try {
    const payload = { ...payForm, contractId: currentContract.value.id }
    if (payEditId.value) {
      await request.put(`/payments/${payEditId.value}`, payload)
    } else {
      await request.post('/payments', payload)
    }
    ElMessage.success('保存成功')
    payFormVisible.value = false
    await fetchPayments(currentContract.value.id)
    fetchData()
  } finally { paySaving.value = false }
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(form, { name: '', customerId: '', type: 'sales', amount: 0, signDate: '', startDate: '', endDate: '', description: '', terms: '' })
}
const resetPayForm = () => { payFormRef.value?.resetFields(); Object.assign(payForm, { amount: 0, paymentMethod: 'bank_transfer', paymentDate: '', remark: '' }) }

onMounted(fetchData)
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-form { margin-bottom: 16px; }
.pagination { margin-top: 20px; justify-content: flex-end; }
.payment-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.payment-stats { display: flex; gap: 8px; flex-wrap: wrap; }
.form-hint { font-size: 12px; color: #909399; margin-top: 4px; }
.text-success { color: #67c23a; font-weight: 600; }
</style>
