<template>
  <div class="dashboard-view">
    <!-- 关键指标卡片 -->
    <el-row :gutter="20" class="metrics-row">
      <el-col :span="6">
        <metric-card
          title="线索总数"
          :value="dashboardData.leads?.total || 0"
          :icon="User"
          icon-bg-color="#409eff"
        />
      </el-col>
      <el-col :span="6">
        <metric-card
          title="客户总数"
          :value="dashboardData.customers?.total || 0"
          :icon="OfficeBuilding"
          icon-bg-color="#67c23a"
        />
      </el-col>
      <el-col :span="6">
        <metric-card
          title="商机金额"
          :value="dashboardData.opportunities?.totalAmount || 0"
          unit="元"
          :icon="TrendCharts"
          icon-bg-color="#e6a23c"
        />
      </el-col>
      <el-col :span="6">
        <metric-card
          title="合同金额"
          :value="dashboardData.contracts?.totalAmount || 0"
          unit="元"
          :icon="Document"
          icon-bg-color="#f56c6c"
        />
      </el-col>
    </el-row>

    <el-row :gutter="20" class="metrics-row">
      <el-col :span="6">
        <metric-card
          title="回款金额"
          :value="dashboardData.payments?.paidAmount || 0"
          unit="元"
          :icon="Money"
          icon-bg-color="#909399"
        />
      </el-col>
      <el-col :span="6">
        <metric-card
          title="进行中项目"
          :value="dashboardData.projects?.active || 0"
          :icon="List"
          icon-bg-color="#b37feb"
        />
      </el-col>
      <el-col :span="6">
        <metric-card
          title="线索转化率"
          :value="dashboardData.leads?.conversionRate || 0"
          unit="%"
          :icon="Connection"
          icon-bg-color="#13c2c2"
        />
      </el-col>
      <el-col :span="6">
        <metric-card
          title="商机赢单率"
          :value="dashboardData.opportunities?.winRate || 0"
          unit="%"
          :icon="SuccessFilled"
          icon-bg-color="#52c41a"
        />
      </el-col>
    </el-row>

    <!-- 趋势图表 -->
    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <trend-line-chart
          :data="opportunityTrend"
          title="商机金额趋势"
          height="350px"
        />
      </el-col>
      <el-col :span="12">
        <trend-line-chart
          :data="paymentTrend"
          title="回款金额趋势"
          height="350px"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { User, OfficeBuilding, TrendCharts, Document, Money, List, Connection, SuccessFilled } from '@element-plus/icons-vue';
import { reportApi } from '@/api/report';
import MetricCard from '@/components/charts/MetricCard.vue';
import TrendLineChart from '@/components/charts/TrendLineChart.vue';
import { ElMessage } from 'element-plus';

const dashboardData = ref<any>({});
const opportunityTrend = ref<any[]>([]);
const paymentTrend = ref<any[]>([]);

onMounted(async () => {
  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    const res = await reportApi.getDashboard();
    dashboardData.value = res.data || res;

    // 模拟趋势数据(实际应从API获取)
    const now = new Date();
    opportunityTrend.value = [];
    paymentTrend.value = [];
    
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const period = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      
      opportunityTrend.value.push({
        period,
        amount: Math.random() * 1000000,
        count: Math.floor(Math.random() * 20),
      });

      paymentTrend.value.push({
        period,
        amount: Math.random() * 800000,
        count: Math.floor(Math.random() * 15),
      });
    }
  } catch (error: any) {
    console.error('加载仪表盘数据失败:', error);
    ElMessage.error(error.response?.data?.message || error.message || '加载仪表盘数据失败');
  }
}
</script>

<style scoped>
.dashboard-view {
  padding: 0;
}

.metrics-row {
  margin-bottom: 20px;
}

.mt-20 {
  margin-top: 20px;
}
</style>
