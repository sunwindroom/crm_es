<template>
  <div class="project-stats">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="项目进度" name="progress">
        <el-table :data="projectProgressData" border>
          <el-table-column prop="projectName" label="项目名称" width="200" />
          <el-table-column prop="totalMilestones" label="里程碑总数" width="120" />
          <el-table-column prop="completedMilestones" label="已完成" width="100" />
          <el-table-column label="进度" width="150">
            <template #default="{ row }">
              <el-progress :percentage="row.progress || 0" />
            </template>
          </el-table-column>
          <el-table-column prop="overdueMilestones" label="逾期里程碑" width="120" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="工时统计" name="timesheet">
        <el-table :data="timesheetData" border>
          <el-table-column prop="projectName" label="项目名称" width="200" />
          <el-table-column prop="totalHours" label="总工时" width="120" />
          <el-table-column label="使用率" width="150">
            <template #default="{ row }">
              <el-progress :percentage="row.usageRate || 0" />
            </template>
          </el-table-column>
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
const projectProgressData = ref<any[]>([]);
const timesheetData = ref<any[]>([]);

onMounted(async () => {
  await loadProjectData();
});

async function loadProjectData() {
  try {
    const [progressRes, timesheetRes] = await Promise.all([
      reportApi.getProjectProgress(),
      reportApi.getTimesheetStats(),
    ]);
    projectProgressData.value = progressRes.data || progressRes || [];
    timesheetData.value = timesheetRes.data || timesheetRes || [];
  } catch (error: any) {
    ElMessage.error(error.message || '加载项目统计数据失败');
  }
}
</script>
