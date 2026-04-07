<template>
  <div class="members-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ project?.name || '加载中...' }} - 成员管理</span>
          <div>
            <el-button type="primary" @click="handleAddMember">
              <el-icon><Plus /></el-icon> 添加成员
            </el-button>
            <el-button @click="handleBack">返回</el-button>
          </div>
        </div>
      </template>
      
      <el-table v-loading="loading" :data="members" border>
        <el-table-column prop="user.name" label="姓名" width="120">
          <template #default="{ row }">{{ row.user?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="user.username" label="用户名" width="150">
          <template #default="{ row }">{{ row.user?.username || '-' }}</template>
        </el-table-column>
        <el-table-column prop="user.role" label="系统角色" width="120">
          <template #default="{ row }">
            <el-tag>{{ getRoleName(row.user?.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="项目角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'manager' ? 'warning' : 'info'">
              {{ row.role === 'manager' ? '项目经理' : '成员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="加入时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button
              v-if="row.role !== 'manager'"
              type="danger"
              link
              size="small"
              @click="handleRemove(row)"
            >
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 添加成员对话框 -->
    <el-dialog v-model="addDialogVisible" title="添加项目成员" width="500px">
      <el-form :model="addForm" label-width="80px">
        <el-form-item label="选择用户">
          <el-select 
            v-model="addForm.userId" 
            filterable 
            placeholder="搜索用户" 
            style="width: 100%"
            v-loading="usersLoading"
          >
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="`${user.name} (${user.username}) - ${getRoleName(user.role)}`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="项目角色">
          <el-radio-group v-model="addForm.role">
            <el-radio label="member">成员</el-radio>
            <el-radio label="manager">项目经理</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAdd" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { projectApi } from '@/api/project';
import { userApi } from '@/api/user';

const route = useRoute();
const router = useRouter();
const projectId = route.params.id as string;

const project = ref<any>(null);
const members = ref<any[]>([]);
const availableUsers = ref<any[]>([]);
const loading = ref(false);
const usersLoading = ref(false);
const submitting = ref(false);
const addDialogVisible = ref(false);

const addForm = ref({
  userId: '',
  role: 'member',
});

// 角色名称映射
const roleNames: Record<string, string> = {
  admin: '系统管理员',
  ceo: '总裁',
  cto: '技术副总裁',
  cmo: '营销副总裁',
  sales_manager: '销售经理',
  sales: '销售',
  project_manager: '项目经理',
  business: '商务',
  finance: '财务',
  engineer: '工程师',
  customer_service_manager: '客服经理',
};

// 获取角色名称
const getRoleName = (role: string) => {
  return roleNames[role] || role;
};

// 格式化日期时间
const formatDateTime = (datetime: string) => {
  return new Date(datetime).toLocaleString('zh-CN');
};

// 获取项目详情
const fetchProject = async () => {
  try {
    project.value = await projectApi.getDetail(projectId);
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取项目信息失败');
  }
};

// 获取项目成员
const fetchMembers = async () => {
  try {
    loading.value = true;
    members.value = await projectApi.getMembers(projectId);
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取成员列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取所有用户
const fetchUsers = async () => {
  try {
    usersLoading.value = true;
    const res = await userApi.getList({ pageSize: 1000 }); // 获取所有用户
    // 后端返回的数据结构是 { users: [], total: 0 }
    availableUsers.value = res.users || res.data?.users || res.items || [];
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    ElMessage.error(error.response?.data?.message || '获取用户列表失败');
  } finally {
    usersLoading.value = false;
  }
};

// 返回
const handleBack = () => {
  router.back();
};

// 添加成员
const handleAddMember = () => {
  addForm.value = {
    userId: '',
    role: 'member',
  };
  addDialogVisible.value = true;
};

// 确认添加
const handleConfirmAdd = async () => {
  if (!addForm.value.userId) {
    ElMessage.warning('请选择用户');
    return;
  }

  try {
    submitting.value = true;
    await projectApi.addMember(projectId, addForm.value);
    ElMessage.success('添加成功');
    addDialogVisible.value = false;
    fetchMembers();
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '添加失败');
  } finally {
    submitting.value = false;
  }
};

// 移除成员
const handleRemove = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要移除该成员吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await projectApi.removeMember(projectId, row.id);
    ElMessage.success('移除成功');
    fetchMembers();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '移除失败');
    }
  }
};

onMounted(() => {
  fetchProject();
  fetchMembers();
  fetchUsers();
});
</script>

<style scoped>
.members-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
