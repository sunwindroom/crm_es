<template>
  <div class="report-dashboard">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 仪表盘 -->
      <el-tab-pane label="仪表盘" name="dashboard">
        <dashboard-view />
      </el-tab-pane>
      
      <!-- 销售漏斗 -->
      <el-tab-pane label="销售漏斗" name="funnel">
        <sales-funnel-view />
      </el-tab-pane>
      
      <!-- 业绩统计 -->
      <el-tab-pane label="业绩统计" name="performance">
        <performance-view />
      </el-tab-pane>
      
      <!-- 客户分析 -->
      <el-tab-pane label="客户分析" name="customer">
        <customer-analysis-view />
      </el-tab-pane>
      
      <!-- 回款统计 -->
      <el-tab-pane label="回款统计" name="payment">
        <payment-stats-view />
      </el-tab-pane>
      
      <!-- 项目统计 -->
      <el-tab-pane label="项目统计" name="project">
        <project-stats-view />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DashboardView from './components/DashboardView.vue';
import SalesFunnelView from './components/SalesFunnelView.vue';
import PerformanceView from './components/PerformanceView.vue';
import CustomerAnalysisView from './components/CustomerAnalysisView.vue';
import PaymentStatsView from './components/PaymentStatsView.vue';
import ProjectStatsView from './components/ProjectStatsView.vue';

const activeTab = ref('dashboard');
</script>

<style scoped>
.report-dashboard {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

:deep(.el-tabs__content) {
  padding: 20px;
  background: #fff;
}
</style>
