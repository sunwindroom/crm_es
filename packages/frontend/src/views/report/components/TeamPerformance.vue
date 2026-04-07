<template>
  <div class="team-performance">
    <el-card>
      <template #header>
        <span>团队业绩排名</span>
      </template>
      <el-table :data="teamData.members" border>
        <el-table-column prop="userName" label="姓名" width="120" />
        <el-table-column label="商机金额">
          <template #default="{ row }">
            ¥{{ (row.opportunityAmount || 0).toLocaleString() }}
          </template>
        </el-table-column>
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
        <el-table-column prop="rank" label="排名" width="80" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { reportApi } from '@/api/report';
import { ElMessage } from 'element-plus';

const teamData = ref<any>({ members: [] });

onMounted(async () => {
  await loadTeamPerformance();
});

async function loadTeamPerformance() {
  try {
    const res = await reportApi.getTeamPerformance();
    teamData.value = res.data || res || { members: [] };
  } catch (error: any) {
    ElMessage.error(error.message || '加载团队业绩失败');
  }
}
</script>
