<template>
  <div class="lead-handover-info">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>线索交接信息</span>
          <el-button
            v-if="canTriggerHandover"
            type="primary"
            size="small"
            @click="handleTriggerHandover"
          >
            触发交接
          </el-button>
        </div>
      </template>

      <div v-loading="loading">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="线索状态">
            <el-tag :type="getLeadStatusType(lead?.status)">
              {{ getLeadStatusText(lead?.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前负责人">
            {{ lead?.assignedUser?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="交接状态">
            <el-tag v-if="handoverStatus" :type="getHandoverStatusType(handoverStatus)">
              {{ handoverStatus }}
            </el-tag>
            <span v-else>未交接</span>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="handoverHistory.length > 0" class="handover-history">
          <h4>交接历史</h4>
          <el-timeline>
            <el-timeline-item
              v-for="item in handoverHistory"
              :key="item.id"
              :timestamp="formatTime(item.createdAt)"
              placement="top"
            >
              <el-card>
                <p><strong>从：</strong>{{ item.fromUser?.name || '-' }}</p>
                <p><strong>到：</strong>{{ item.toUser?.name || '-' }}</p>
                <p><strong>状态：</strong>{{ item.status }}</p>
                <p v-if="item.remark"><strong>备注：</strong>{{ item.remark }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-card>

    <!-- 触发交接对话框 -->
    <el-dialog
      v-model="handoverDialogVisible"
      title="触发线索交接"
      width="500px"
    >
      <el-form :model="handoverForm" label-width="120px">
        <el-form-item label="客服经理">
          <el-select
            v-model="handoverForm.csManagerId"
            placeholder="请选择客服经理（可选）"
            clearable
            filterable
          >
            <el-option
              v-for="user in csManagers"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
          <div class="form-tip">不选择将自动分配可用的客服经理</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handoverDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmHandover" :loading="handoverLoading">
          确认交接
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { leadHandoverApi } from '@/api/notification';
import { userApi } from '@/api/user';

const props = defineProps<{
  leadId: string;
  lead?: any;
  canTriggerHandover?: boolean;
}>();

const loading = ref(false);
const handoverHistory = ref<any[]>([]);
const handoverStatus = ref('');
const csManagers = ref<any[]>([]);
const handoverDialogVisible = ref(false);
const handoverLoading = ref(false);
const handoverForm = ref({
  csManagerId: '',
});

const loadHandoverHistory = async () => {
  loading.value = true;
  try {
    const res = await leadHandoverApi.getHistory(props.leadId);
    handoverHistory.value = res || [];
    if (handoverHistory.value.length > 0) {
      handoverStatus.value = handoverHistory.value[0].status;
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载交接历史失败');
  } finally {
    loading.value = false;
  }
};

const loadCsManagers = async () => {
  try {
    const res = await userApi.getList({ role: 'customer_service_manager' });
    csManagers.value = res.items || [];
  } catch (error) {
    console.error('加载客服经理列表失败', error);
  }
};

const handleTriggerHandover = () => {
  loadCsManagers();
  handoverDialogVisible.value = true;
};

const confirmHandover = async () => {
  handoverLoading.value = true;
  try {
    const data: any = {};
    if (handoverForm.value.csManagerId) {
      data.csManagerId = handoverForm.value.csManagerId;
    }

    const res = await leadHandoverApi.trigger(props.leadId, data);
    ElMessage.success(res.message || '交接成功');
    handoverDialogVisible.value = false;
    loadHandoverHistory();
  } catch (error: any) {
    ElMessage.error(error.message || '交接失败');
  } finally {
    handoverLoading.value = false;
  }
};

const getLeadStatusType = (status: string) => {
  const map: Record<string, any> = {
    new: 'info',
    contacted: 'warning',
    qualified: 'primary',
    converted: 'success',
    lost: 'danger',
  };
  return map[status] || 'info';
};

const getLeadStatusText = (status: string) => {
  const map: Record<string, string> = {
    new: '新建',
    contacted: '已联系',
    qualified: '已验证',
    converted: '已转化',
    lost: '已丢失',
  };
  return map[status] || status;
};

const getHandoverStatusType = (status: string) => {
  const map: Record<string, any> = {
    pending: 'warning',
    approved: 'primary',
    rejected: 'danger',
    completed: 'success',
  };
  return map[status] || 'info';
};

const formatTime = (time: string) => {
  return new Date(time).toLocaleString();
};

onMounted(() => {
  loadHandoverHistory();
});

watch(() => props.leadId, () => {
  loadHandoverHistory();
});
</script>

<style scoped lang="scss">
.lead-handover-info {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .handover-history {
    margin-top: 24px;

    h4 {
      margin-bottom: 16px;
    }
  }

  .form-tip {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }
}
</style>
