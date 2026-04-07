<template>
  <div class="customer-analysis">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="客户价值" name="value">
        <el-table :data="customerValueData" border>
          <el-table-column prop="customerName" label="客户名称" width="200" />
          <el-table-column prop="level" label="级别" width="100" />
          <el-table-column label="合同金额">
            <template #default="{ row }">
              ¥{{ (row.contractAmount || 0).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column label="回款金额">
            <template #default="{ row }">
              ¥{{ (row.paidAmount || 0).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="valueScore" label="价值评分" width="120" />
          <el-table-column prop="rank" label="排名" width="80" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="客户分布" name="distribution">
        <el-row :gutter="20">
          <el-col :span="12">
            <pie-chart :data="distributionData" title="行业分布" height="400px" />
          </el-col>
          <el-col :span="12">
            <pie-chart :data="levelDistribution" title="级别分布" height="400px" />
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { reportApi } from '@/api/report';
import PieChart from '@/components/charts/PieChart.vue';
import { ElMessage } from 'element-plus';

const activeTab = ref('value');
const customerValueData = ref<any[]>([]);
const distributionData = ref<any[]>([]);
const levelDistribution = ref<any[]>([]);

onMounted(async () => {
  await loadCustomerData();
});

async function loadCustomerData() {
  try {
    const [valueRes, distRes] = await Promise.all([
      reportApi.getCustomerValue(),
      reportApi.getCustomerDistribution({ dimension: 'industry' }),
    ]);
    customerValueData.value = valueRes.data || valueRes || [];
    distributionData.value = distRes.data || distRes || [];
  } catch (error: any) {
    ElMessage.error(error.message || '加载客户分析数据失败');
  }
}
</script>
