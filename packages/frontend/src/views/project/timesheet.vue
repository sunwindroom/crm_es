<template>
  <div class="timesheet-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ project?.name || '加载中...' }} - 工时管理</span>
          <el-button @click="handleBack">返回</el-button>
        </div>
      </template>
      
      <!-- 工时填报表单 -->
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工作日期" prop="date">
              <el-date-picker
                v-model="form.date"
                type="date"
                placeholder="选择日期"
                :disabled-date="disabledDate"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工时数" prop="hours">
              <el-input-number
                v-model="form.hours"
                :min="0.5"
                :max="24"
                :step="0.5"
                :precision="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="工作内容" prop="workContent">
          <el-input
            v-model="form.workContent"
            type="textarea"
            :rows="3"
            placeholder="请输入工作内容"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" placeholder="备注信息" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 工时统计 -->
    <el-card class="mt-4">
      <template #header>
        <div class="card-header">
          <span>工时统计</span>
          <div>
            <el-select
              v-if="canViewAllTimesheets"
              v-model="filterUserId"
              placeholder="筛选成员"
              clearable
              filterable
              style="width: 200px; margin-right: 10px"
              @change="fetchTimesheets"
            >
              <el-option
                v-for="member in members"
                :key="member.user?.id"
                :label="member.user?.name"
                :value="member.user?.id"
              />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 260px"
              @change="fetchTimesheets"
            />
          </div>
        </div>
      </template>
      
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-statistic title="总工时" :value="stats.totalHours" suffix="小时" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="总记录" :value="stats.totalRecords" suffix="条" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="参与人数" :value="stats.memberCount" suffix="人" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="人均工时" :value="stats.avgHours" suffix="小时" />
        </el-col>
      </el-row>
      
      <!-- 成员工时统计 -->
      <el-table v-if="canViewAllTimesheets" :data="memberStats" border class="mt-4">
        <el-table-column prop="userName" label="成员" width="120" />
        <el-table-column prop="totalHours" label="总工时" width="100">
          <template #default="{ row }">{{ row.totalHours.toFixed(1) }}小时</template>
        </el-table-column>
        <el-table-column prop="recordCount" label="记录数" width="100" />
        <el-table-column prop="avgHours" label="日均工时" width="120">
          <template #default="{ row }">{{ row.avgHours.toFixed(1) }}小时</template>
        </el-table-column>
        <el-table-column prop="lastDate" label="最后填报" width="120" />
      </el-table>
    </el-card>
    
    <!-- 工时记录列表 -->
    <el-card class="mt-4">
      <template #header>
        <span>工时记录</span>
      </template>
      <el-table v-loading="loading" :data="timesheets" border>
        <el-table-column prop="user.name" label="成员" width="100">
          <template #default="{ row }">{{ row.user?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="date" label="日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="hours" label="工时" width="80">
          <template #default="{ row }">{{ row.hours }}小时</template>
        </el-table-column>
        <el-table-column prop="workContent" label="工作内容" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="填报时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button v-if="canEditTimesheet(row)" type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="canEditTimesheet(row)" type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑工时记录" width="500px">
      <el-form ref="editFormRef" :model="editForm" :rules="rules" label-width="100px">
        <el-form-item label="工作日期" prop="date">
          <el-date-picker
            v-model="editForm.date"
            type="date"
            placeholder="选择日期"
            :disabled-date="disabledDate"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="工时数" prop="hours">
          <el-input-number
            v-model="editForm.hours"
            :min="0.5"
            :max="24"
            :step="0.5"
            :precision="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="工作内容" prop="workContent">
          <el-input
            v-model="editForm.workContent"
            type="textarea"
            :rows="3"
            placeholder="请输入工作内容"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { projectApi } from '@/api/project';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const projectId = route.params.id as string;

const project = ref<any>(null);
const timesheets = ref<any[]>([]);
const members = ref<any[]>([]);
const loading = ref(false);
const formRef = ref();
const editFormRef = ref();
const editDialogVisible = ref(false);
const filterUserId = ref('');
const dateRange = ref<string[]>([]);

const form = ref({
  date: new Date().toISOString().split('T')[0],
  hours: 8,
  workContent: '',
  remark: '',
});

const editForm = ref({
  id: '',
  date: '',
  hours: 8,
  workContent: '',
  remark: '',
});

const rules = {
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  hours: [{ required: true, message: '请输入工时', trigger: 'blur' }],
  workContent: [{ required: true, message: '请输入工作内容', trigger: 'blur' }],
};

// 当前用户角色
const currentUserRole = computed(() => authStore.user?.role);

// 是否可以查看所有工时（项目经理、副总裁、总裁、管理员）
const canViewAllTimesheets = computed(() => {
  const role = currentUserRole.value;
  return ['project_manager', 'cto', 'cmo', 'ceo', 'admin'].includes(role);
});

// 统计信息
const stats = computed(() => {
  const totalHours = timesheets.value.reduce((sum, t) => sum + Number(t.hours), 0);
  const totalRecords = timesheets.value.length;
  const userIds = new Set(timesheets.value.map(t => t.userId));
  const memberCount = userIds.size;
  const avgHours = memberCount > 0 ? totalHours / memberCount : 0;
  
  return {
    totalHours: totalHours.toFixed(1),
    totalRecords,
    memberCount,
    avgHours: avgHours.toFixed(1),
  };
});

// 成员工时统计
const memberStats = computed(() => {
  const memberMap = new Map<string, any>();
  
  timesheets.value.forEach(t => {
    const userId = t.userId;
    if (!memberMap.has(userId)) {
      memberMap.set(userId, {
        userId,
        userName: t.user?.name || '-',
        totalHours: 0,
        recordCount: 0,
        dates: [],
      });
    }
    
    const member = memberMap.get(userId);
    member.totalHours += Number(t.hours);
    member.recordCount += 1;
    member.dates.push(new Date(t.date));
  });
  
  return Array.from(memberMap.values()).map(m => ({
    ...m,
    avgHours: m.recordCount > 0 ? m.totalHours / m.recordCount : 0,
    lastDate: m.dates.length > 0 
      ? new Date(Math.max(...m.dates.map((d: Date) => d.getTime()))).toLocaleDateString('zh-CN')
      : '-',
  }));
});

// 禁用未来日期
const disabledDate = (date: Date) => {
  return date > new Date();
};

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN');
};

// 格式化日期时间
const formatDateTime = (datetime: string) => {
  return new Date(datetime).toLocaleString('zh-CN');
};

// 是否可以编辑工时（只能编辑自己的）
const canEditTimesheet = (row: any) => {
  return row.userId === authStore.user?.id;
};

// 提交工时
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    await projectApi.addTimesheet(projectId, form.value);
    ElMessage.success('填报成功');
    resetForm();
    fetchTimesheets();
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '填报失败');
  }
};

// 获取工时列表
const fetchTimesheets = async () => {
  try {
    loading.value = true;
    const params: any = {};
    
    if (filterUserId.value) {
      params.userId = filterUserId.value;
    }
    
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    
    const res = await projectApi.getTimesheets(projectId, params);
    timesheets.value = res;
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取工时列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取项目成员
const fetchMembers = async () => {
  try {
    members.value = await projectApi.getMembers(projectId);
  } catch (error: any) {
    console.error('获取成员列表失败:', error);
  }
};

// 获取项目详情
const fetchProject = async () => {
  try {
    project.value = await projectApi.getDetail(projectId);
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取项目信息失败');
  }
};

// 返回
const handleBack = () => {
  router.back();
};

// 重置表单
const resetForm = () => {
  form.value = {
    date: new Date().toISOString().split('T')[0],
    hours: 8,
    workContent: '',
    remark: '',
  };
};

// 编辑工时
const handleEdit = (row: any) => {
  editForm.value = {
    id: row.id,
    date: new Date(row.date).toISOString().split('T')[0],
    hours: row.hours,
    workContent: row.workContent || '',
    remark: row.remark || '',
  };
  editDialogVisible.value = true;
};

// 更新工时
const handleUpdate = async () => {
  try {
    await editFormRef.value?.validate();
    await projectApi.updateTimesheet(projectId, editForm.value.id, editForm.value);
    ElMessage.success('更新成功');
    editDialogVisible.value = false;
    fetchTimesheets();
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '更新失败');
  }
};

// 删除工时
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条工时记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await projectApi.deleteTimesheet(projectId, row.id);
    ElMessage.success('删除成功');
    fetchTimesheets();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败');
    }
  }
};

onMounted(() => {
  fetchProject();
  fetchTimesheets();
  if (canViewAllTimesheets.value) {
    fetchMembers();
  }
});
</script>

<style scoped>
.timesheet-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mt-4 {
  margin-top: 16px;
}

.stats-row {
  margin-bottom: 20px;
}
</style>
