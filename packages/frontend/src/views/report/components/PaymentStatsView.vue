<template>
  <div class="payment-stats">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="回款进度" name="progress">
        <el-table :data="paymentProgressData" border>
          <el-table-column prop="contractNo" label="合同编号" width="150" />
          <el-table-column prop="contractName" label="合同名称" width="200" />
          <el-table-column label="合同金额">
            <template #default="{ row }">
              ¥{{ (row.amount || 0).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column label="已回款">
            <template #default="{ row }">
              ¥{{ (row.paidAmount || 0).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column label="回款率" width="150">
            <template #default="{ row }">
              <el-progress :percentage="row.paymentRate || 0" />
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="逾期回款" name="overdue">
        <el-table :data="overduePayments" border>
          <el-table-column prop="contractNo" label="合同编号" width="150" />
          <el-table-column label="逾期金额">
            <template #default="{ row }">
              ¥{{ (row.plannedAmount || 0).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="overdueDays" label="逾期天数" width="100" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { reportApi } from '@/api/report';
import { ElMessage } from 'element-plus';

const activeTab = ref('progress');
const paymentProgressData = ref<any[]>([]);
const overduePayments = ref<any[]>([]);

onMounted(async () => {
  await loadPaymentData();
});

async function loadPaymentData() {
  try {
    const [progressRes, overdueRes] = await Promise.all([
      reportApi.getPaymentProgress(),
      reportApi.getOverduePayments(),
    ]);
    paymentProgressData.value = progressRes.data || progressRes || [];
    overduePayments.value = overdueRes.data || overdueRes || [];
  } catch (error: any) {
    ElMessage.error(error.message || '加载回款统计数据失败');
  }
}
</script>
