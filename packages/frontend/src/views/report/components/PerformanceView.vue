<template>
  <div class="performance-view">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="个人业绩" name="personal">
        <personal-performance />
      </el-tab-pane>
      <el-tab-pane label="团队业绩" name="team">
        <team-performance />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PersonalPerformance from './PersonalPerformance.vue';
import TeamPerformance from './TeamPerformance.vue';

const activeTab = ref('personal');
</script>

<style scoped>
.performance-view {
  padding: 0;
}
</style>
