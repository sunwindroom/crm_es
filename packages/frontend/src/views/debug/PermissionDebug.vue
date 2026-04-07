<template>
  <div class="debug-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>权限调试工具</span>
          <el-button @click="refreshData">刷新数据</el-button>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="12">
          <h3>当前用户信息</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="用户ID">{{ currentUser?.id }}</el-descriptions-item>
            <el-descriptions-item label="用户名">{{ currentUser?.username }}</el-descriptions-item>
            <el-descriptions-item label="姓名">{{ currentUser?.name }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{ currentUser?.role }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ currentUser?.status }}</el-descriptions-item>
          </el-descriptions>
        </el-col>

        <el-col :span="12">
          <h3>权限判断结果</h3>
          <el-table :data="permissionResults" border>
            <el-table-column prop="project" label="项目" width="180" />
            <el-table-column prop="manager" label="项目经理ID" width="280" />
            <el-table-column prop="canEdit" label="可编辑" width="80">
              <template #default="{ row }">
                <el-tag :type="row.canEdit ? 'success' : 'danger'">
                  {{ row.canEdit ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="canManage" label="可管理成员" width="100">
              <template #default="{ row }">
                <el-tag :type="row.canManage ? 'success' : 'danger'">
                  {{ row.canManage ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>

      <el-divider />

      <h3>项目列表数据</h3>
      <el-table :data="projects" border>
        <el-table-column prop="name" label="项目名称" width="180" />
        <el-table-column prop="id" label="项目ID" width="280" />
        <el-table-column prop="manager" label="项目经理ID" width="280" />
        <el-table-column prop="managerUser.name" label="项目经理姓名" width="120">
          <template #default="{ row }">{{ row.managerUser?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="匹配结果" width="120">
          <template #default="{ row }">
            <el-tag :type="row.manager === currentUser?.id ? 'success' : 'danger'">
              {{ row.manager === currentUser?.id ? '匹配' : '不匹配' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { request } from '@/utils/request'

const currentUser = ref<any>(null)
const projects = ref<any[]>([])

const permissionResults = computed(() => {
  if (!currentUser.value) return []

  return projects.value.map(p => {
    const managerId = String(p.manager || '')
    const userId = String(currentUser.value.id || '')
    const isCTO = ['cto', 'admin', 'ceo'].includes(currentUser.value.role)

    return {
      project: p.name,
      manager: p.manager,
      canEdit: isCTO || (managerId === userId && managerId !== ''),
      canManage: isCTO || (managerId === userId && managerId !== '')
    }
  })
})

const loadCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    currentUser.value = JSON.parse(userStr)
  }
}

const loadProjects = async () => {
  try {
    const res: any = await request.get('/projects', {
      params: { page: 1, pageSize: 100 }
    })
    projects.value = res?.items ?? res?.data ?? []
  } catch (error: any) {
    ElMessage.error(error.message || '加载项目列表失败')
  }
}

const refreshData = () => {
  loadCurrentUser()
  loadProjects()
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.debug-page {
  padding: 20px;
}

.debug-page .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.debug-page h3 {
  margin-bottom: 16px;
  color: #303133;
}

.debug-page .el-divider {
  margin: 20px 0;
}
</style>
