<template>
  <div class="sales-funnel-view">
    <!-- 筛选条件 -->
    <el-form :model="queryParams" inline class="query-form">
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="queryParams.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item label="行业">
        <el-input v-model="queryParams.industry" placeholder="请输入行业" clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 漏斗图和数据表格 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>销售漏斗</span>
          </template>
          <funnel-chart :data="funnelData" height="400px" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>阶段明细</span>
          </template>
          <el-table :data="funnelData" border>
            <el-table-column prop="name" label="阶段" width="120" />
            <el-table-column prop="count" label="商机数" width="100" />
            <el-table-column label="金额">
              <template #default="{ row }">
                ¥{{ row.amount.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="加权金额">
              <template #default="{ row }">
                ¥{{ row.weightedAmount.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="probability" label="赢单概率" width="100">
              <template #default="{ row }">
                {{ row.probability }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { reportApi } from '@/api/report';
import FunnelChart from '@/components/charts/FunnelChart.vue';
import { ElMessage } from 'element-plus';

const queryParams = ref({
  dateRange: [] as string[],
  industry: '',
});

const funnelData = ref<any[]>([]);

onMounted(async () => {
  await loadFunnelData();
});

async function loadFunnelData() {
  try {
    const params: any = {};
    if (queryParams.value.dateRange && queryParams.value.dateRange.length === 2) {
      params.startDate = queryParams.value.dateRange[0];
      params.endDate = queryParams.value.dateRange[1];
    }
    if (queryParams.value.industry) {
      params.industry = queryParams.value.industry;
    }

    const res = await reportApi.getSalesFunnel(params);
    funnelData.value = res.data || res || [];
  } catch (error: any) {
    ElMessage.error(error.message || '加载销售漏斗数据失败');
  }
}

function handleQuery() {
  loadFunnelData();
}

function handleReset() {
  queryParams.value = {
    dateRange: [],
    industry: '',
  };
  loadFunnelData();
}
</script>

<style scoped>
.sales-funnel-view {
  padding: 0;
}

.query-form {
  margin-bottom: 20px;
}
</style>
