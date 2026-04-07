<template>
  <div class="customer-detail">
    <el-page-header @back="$router.back()" :content="customer?.name || '客户详情'" />
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="8">
        <el-card>
          <template #header>基本信息</template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="客户名称">{{ customer?.name }}</el-descriptions-item>
            <el-descriptions-item label="行业">{{ customer?.industry || '-' }}</el-descriptions-item>
            <el-descriptions-item label="规模">{{ customer?.scale || '-' }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ customer?.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ customer?.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="地址">{{ customer?.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="级别"><el-tag size="small">{{ customer?.level }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="状态"><el-tag :type="customer?.status === 'active' ? 'success' : 'danger'" size="small">{{ customer?.status }}</el-tag></el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-tabs>
          <el-tab-pane label="联系人">
            <div style="margin-bottom: 12px;">
              <el-button
                v-if="canAddContact"
                type="primary"
                size="small"
                @click="showContactDialog = true"
              >
                <el-icon><Plus /></el-icon> 添加联系人
              </el-button>
            </div>
            <el-table :data="contacts" border size="small">
              <el-table-column prop="name" label="姓名" width="100" />
              <el-table-column prop="position" label="职位" width="120" />
              <el-table-column prop="phone" label="电话" width="130" />
              <el-table-column prop="email" label="邮箱" />
              <el-table-column prop="isPrimary" label="主要联系人" width="100">
                <template #default="{ row }"><el-tag v-if="row.isPrimary" type="success" size="small">是</el-tag></template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button
                    v-if="canDeleteContact"
                    type="danger"
                    link
                    size="small"
                    @click="handleDeleteContact(row)"
                  >删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="跟进记录">
            <div style="margin-bottom: 12px;">
              <el-button
                v-if="canAddFollowUp"
                type="primary"
                size="small"
                @click="showFollowUpDialog = true"
              >
                <el-icon><Plus /></el-icon> 添加跟进记录
              </el-button>
            </div>
            <el-timeline v-if="followUps.length > 0">
              <el-timeline-item
                v-for="item in followUps"
                :key="item.id"
                :timestamp="formatDate(item.created_at)"
                placement="top"
              >
                <el-card>
                  <div>{{ item.content }}</div>
                  <div v-if="item.next_action" style="color: #86909c; margin-top: 8px;">
                    下一步: {{ item.next_action }}
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无跟进记录" />
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>

    <!-- 添加联系人对话框 -->
    <el-dialog v-model="showContactDialog" title="添加联系人" width="500px">
      <el-form :model="contactForm" label-width="80px">
        <el-form-item label="姓名" required>
          <el-input v-model="contactForm.name" placeholder="请输入联系人姓名" />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="contactForm.position" placeholder="请输入职位" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="contactForm.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="contactForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="主要联系人">
          <el-switch v-model="contactForm.isPrimary" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showContactDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddContact" :loading="contactLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加跟进记录对话框 -->
    <el-dialog v-model="showFollowUpDialog" title="添加跟进记录" width="500px">
      <el-form :model="followUpForm" label-width="80px">
        <el-form-item label="跟进内容" required>
          <el-input
            v-model="followUpForm.content"
            type="textarea"
            :rows="3"
            placeholder="请输入跟进内容"
          />
        </el-form-item>
        <el-form-item label="下一步计划">
          <el-input v-model="followUpForm.next_action" placeholder="请输入下一步计划" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFollowUpDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddFollowUp" :loading="followUpLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { request } from '@/utils/request'
import { hasPermission, canManageCustomer } from '@/utils/permission'

const route = useRoute()
const customer = ref<any>(null)
const contacts = ref<any[]>([])
const followUps = ref<any[]>([])

// 对话框状态
const showContactDialog = ref(false)
const showFollowUpDialog = ref(false)
const contactLoading = ref(false)
const followUpLoading = ref(false)

// 表单数据
const contactForm = ref({
  name: '',
  position: '',
  phone: '',
  email: '',
  isPrimary: false
})

const followUpForm = ref({
  content: '',
  next_action: ''
})

// 权限检查
const currentUserId = localStorage.getItem('userId') || ''

const canAddContact = computed(() => {
  // 检查是否有编辑客户权限 或 是客户负责人 或 是管理员/总裁/营销副总/销售经理
  if (hasPermission('customer:edit') || hasPermission('customer_edit')) {
    return true
  }
  if (customer.value && canManageCustomer(customer.value.owner_id || customer.value.createdBy, currentUserId)) {
    return true
  }
  return false
})

const canDeleteContact = computed(() => {
  return canAddContact.value
})

const canAddFollowUp = computed(() => {
  // 检查是否有创建跟进记录权限 或 可以管理客户
  if (hasPermission('follow_up:create') || hasPermission('follow_up_create')) {
    return true
  }
  if (customer.value && canManageCustomer(customer.value.owner_id || customer.value.createdBy, currentUserId)) {
    return true
  }
  return false
})

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

// 添加联系人
const handleAddContact = async () => {
  if (!contactForm.value.name) {
    ElMessage.warning('请输入联系人姓名')
    return
  }

  contactLoading.value = true
  try {
    const id = route.params.id as string
    await request.post(`/customers/${id}/contacts`, contactForm.value)
    ElMessage.success('添加成功')
    showContactDialog.value = false
    // 重新获取联系人列表
    contacts.value = await request.get(`/customers/${id}/contacts`) as any[]
    // 重置表单
    contactForm.value = {
      name: '',
      position: '',
      phone: '',
      email: '',
      isPrimary: false
    }
  } catch (error: any) {
    ElMessage.error(error.message || '添加失败')
  } finally {
    contactLoading.value = false
  }
}

// 删除联系人
const handleDeleteContact = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该联系人吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const id = route.params.id as string
    await request.delete(`/customers/${id}/contacts/${row.id}`)
    ElMessage.success('删除成功')
    contacts.value = await request.get(`/customers/${id}/contacts`) as any[]
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 添加跟进记录
const handleAddFollowUp = async () => {
  if (!followUpForm.value.content) {
    ElMessage.warning('请输入跟进内容')
    return
  }

  followUpLoading.value = true
  try {
    const id = route.params.id as string
    await request.post(`/customers/${id}/follow-ups`, followUpForm.value)
    ElMessage.success('添加成功')
    showFollowUpDialog.value = false
    // 重新获取跟进记录列表
    followUps.value = await request.get(`/customers/${id}/follow-ups`) as any[]
    // 重置表单
    followUpForm.value = {
      content: '',
      next_action: ''
    }
  } catch (error: any) {
    ElMessage.error(error.message || '添加失败')
  } finally {
    followUpLoading.value = false
  }
}

onMounted(async () => {
  const id = route.params.id as string
  try {
    customer.value = await request.get(`/customers/${id}`)
    contacts.value = await request.get(`/customers/${id}/contacts`) as any[]
    // 获取跟进记录
    try {
      followUps.value = await request.get(`/customers/${id}/follow-ups`) as any[]
    } catch {
      // 如果接口不存在，使用空数组
      followUps.value = []
    }
  } catch {}
})
</script>