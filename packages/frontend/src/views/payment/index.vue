<template>
  <div class="payment-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>回款管理</span>
          <el-button v-if="hasPermission('payment_create')" type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 记录回款
          </el-button>
        </div>
      </template>

      <!-- 统计卡片 -->
      <el-row :gutter="16" class="stats-row">
        <el-col :span="6">
          <el-card shadow="never" class="stat-card">
            <div class="stat-value">¥{{ (stats.totalConfirmed / 10000).toFixed(1) }}万</div>
            <div class="stat-label">已确认回款</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="never" class="stat-card warning">
            <div class="stat-value">¥{{ (stats.totalPending / 10000).toFixed(1) }}万</div>
            <div class="stat-label">待确认回款</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="never" class="stat-card danger">
            <div class="stat-value">{{ stats.overdueCount }}</div>
            <div class="stat-label">逾期计划</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="never" class="stat-card info">
            <div class="stat-value">{{ stats.thisMonthCount }}</div>
            <div class="stat-label">本月回款笔数</div>
          </el-card>
        </el-col>
      </el-row>

      <el-form :model="search" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="search.keyword" placeholder="回款编号/客户名称" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="search.status" clearable placeholder="全部" style="width:110px">
            <el-option label="待确认" value="pending" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker v-model="search.dateRange" type="daterange" value-format="YYYY-MM-DD"
            range-separator="至" start-placeholder="开始" end-placeholder="结束" style="width:240px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="paymentNo" label="回款编号" width="160" />
        <el-table-column label="关联合同" width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.contract?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">¥{{ (row.amount / 10000).toFixed(2) }}万</template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="方式" width="100">
          <template #default="{ row }">{{ methodText(row.paymentMethod) }}</template>
        </el-table-column>
        <el-table-column prop="paymentDate" label="支付日期" width="110" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="{ pending: 'warning', confirmed: 'success', rejected: 'danger' }[row.status] || 'info'" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column prop="creator.name" label="创建人" width="90">
          <template #default="{ row }">{{ row.creator?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending' && hasPermission('payment_edit')">
              <el-button type="success" link size="small" @click="confirm(row)">确认</el-button>
              <el-button type="danger" link size="small" @click="reject(row)">拒绝</el-button>
            </template>
            <el-button v-if="row.status === 'pending' && hasPermission('payment_edit')" type="primary" link size="small" @click="edit(row)">编辑</el-button>
            <el-button v-if="row.status !== 'confirmed' && hasPermission('payment_delete')" type="danger" link size="small" @click="remove(row)">删除</el-button>
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

    <!-- 回款表单 -->
    <el-dialog v-model="formVisible" :title="editId ? '编辑回款' : '记录回款'" width="560px" @close="reset">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="关联合同" prop="contractId">
          <el-select v-model="form.contractId" filterable remote :remote-method="searchContracts" placeholder="搜索合同" style="width:100%">
            <el-option v-for="c in contractOptions" :key="c.id" :label="`${c.contractNo} - ${c.name}`" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="回款金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0.01" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="支付方式" prop="paymentMethod">
          <el-select v-model="form.paymentMethod" style="width:100%">
            <el-option label="银行转账" value="bank_transfer" />
            <el-option label="现金" value="cash" />
            <el-option label="支票" value="check" />
            <el-option label="在线支付" value="online" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付日期" prop="paymentDate">
          <el-date-picker v-model="form.paymentDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { request } from '@/utils/request'
import { hasPermission } from '@/utils/permission'

const methodText = (m: string) => ({ bank_transfer: '银行转账', cash: '现金', check: '支票', online: '在线支付', other: '其他' }[m] ?? m)
const statusText = (s: string) => ({ pending: '待确认', confirmed: '已确认', rejected: '已拒绝' }[s] ?? s)

const loading = ref(false)
const saving = ref(false)
const formVisible = ref(false)
const editId = ref('')
const tableData = ref<any[]>([])
const contractOptions = ref<any[]>([])
const formRef = ref<FormInstance>()
const pg = reactive({ current: 1, size: 10, total: 0 })
const search = reactive({ keyword: '', status: '', dateRange: [] as string[] })
const stats = reactive({ totalConfirmed: 0, totalPending: 0, overdueCount: 0, thisMonthCount: 0 })

const form = reactive({ contractId: '', amount: 0, paymentMethod: 'bank_transfer', paymentDate: '', remark: '' })
const rules = {
  contractId: [{ required: true, message: '请选择合同', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  paymentMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
  paymentDate: [{ required: true, message: '请选择支付日期', trigger: 'change' }],
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = { page: pg.current, pageSize: pg.size }
    if (search.keyword) params.keyword = search.keyword
    if (search.status) params.status = search.status
    if (search.dateRange?.length === 2) { params.startDate = search.dateRange[0]; params.endDate = search.dateRange[1] }
    const res: any = await request.get('/payments', { params })
    tableData.value = res?.items ?? res?.data ?? []
    pg.total = res?.total ?? 0
  } finally { loading.value = false }
}

const fetchStats = async () => {
  try {
    const res: any = await request.get('/payment-plans/statistics')
    if (res) {
      stats.totalConfirmed = res.completedAmount ?? 0
      stats.totalPending = res.pendingAmount ?? 0
    }
  } catch { /* */ }
}

const searchContracts = async (q: string) => {
  try {
    const res: any = await request.get('/contracts', { params: { keyword: q, pageSize: 20, status: 'signed' } })
    contractOptions.value = res?.items ?? res?.data ?? []
  } catch { /* */ }
}

const handleSearch = () => { pg.current = 1; fetchData() }
const handleReset = () => { Object.assign(search, { keyword: '', status: '', dateRange: [] }); handleSearch() }
const handleAdd = () => { editId.value = ''; formVisible.value = true }
const edit = (row: any) => { editId.value = row.id; Object.assign(form, row); formVisible.value = true }

const confirm = async (row: any) => {
  await request.post(`/payments/${row.id}/confirm`)
  ElMessage.success('回款已确认')
  fetchData(); fetchStats()
}
const reject = async (row: any) => {
  const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝回款', { inputType: 'textarea' })
  await request.post(`/payments/${row.id}/reject`, { reason })
  ElMessage.success('已拒绝')
  fetchData()
}
const remove = async (row: any) => {
  await ElMessageBox.confirm('确认删除此回款记录？', '删除', { type: 'warning' })
  await request.delete(`/payments/${row.id}`)
  ElMessage.success('删除成功')
  fetchData()
}

const save = async () => {
  const v = await formRef.value?.validate().catch(() => false)
  if (!v) return
  saving.value = true
  try {
    if (editId.value) {
      await request.put(`/payments/${editId.value}`, form)
    } else {
      await request.post('/payments', form)
    }
    ElMessage.success('保存成功')
    formVisible.value = false
    fetchData(); fetchStats()
  } finally { saving.value = false }
}

const reset = () => {
  formRef.value?.resetFields()
  Object.assign(form, { contractId: '', amount: 0, paymentMethod: 'bank_transfer', paymentDate: '', remark: '' })
}

onMounted(() => { fetchData(); fetchStats() })
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.stats-row { margin-bottom: 20px; }
.stat-card { text-align: center; padding: 12px; }
.stat-card.warning .stat-value { color: #e6a23c; }
.stat-card.danger .stat-value { color: #f56c6c; }
.stat-card.info .stat-value { color: #909399; }
.stat-value { font-size: 24px; font-weight: 700; color: #67c23a; margin-bottom: 6px; }
.stat-label { font-size: 13px; color: #606266; }
.search-form { margin-bottom: 16px; }
.pagination { margin-top: 20px; justify-content: flex-end; }
</style>
