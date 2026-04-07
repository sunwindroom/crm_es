<template>
  <div class="personal-performance">
    <el-card>
      <template #header>
        <span>个人业绩概览</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-item">
            <div class="label">商机金额</div>
            <div class="value">¥{{ (performance.opportunityAmount || 0).toLocaleString() }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="label">赢单金额</div>
            <div class="value">¥{{ (performance.wonAmount || 0).toLocaleString() }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="label">合同金额</div>
            <div class="value">¥{{ (performance.contractAmount || 0).toLocaleString() }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="label">回款金额</div>
            <div class="value">¥{{ (performance.paidAmount || 0).toLocaleString() }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { reportApi } from '@/api/report';
import { ElMessage } from 'element-plus';

const performance = ref<any>({});

onMounted(async () => {
  await loadPerformance();
});

async function loadPerformance() {
  try {
    const res = await reportApi.getPersonalPerformance();
    performance.value = res.data || res || {};
  } catch (error: any) {
    ElMessage.error(error.message || '加载个人业绩失败');
  }
}
</script>

<style scoped>
.stat-item {
  text-align: center;
  padding: 20px;
}

.stat-item .label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-item .value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
</style>
