<template>
  <el-card class="metric-card" shadow="hover">
    <div class="metric-icon" :style="{ backgroundColor: iconBgColor }">
      <el-icon :size="24">
        <component :is="icon" />
      </el-icon>
    </div>
    <div class="metric-content">
      <div class="metric-title">{{ title }}</div>
      <div class="metric-value">{{ formatValue }}</div>
      <div v-if="trend !== undefined" class="metric-trend" :class="trendClass">
        <el-icon>
          <component :is="trendIcon" />
        </el-icon>
        <span>{{ trendText }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Top, Bottom, Minus } from '@element-plus/icons-vue';

interface Props {
  title: string;
  value: number;
  trend?: number;
  unit?: string;
  icon?: any;
  iconBgColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  iconBgColor: '#409eff'
});

const formatValue = computed(() => {
  if (props.value >= 10000) {
    return `${(props.value / 10000).toFixed(2)}万`;
  }
  return props.value.toLocaleString();
});

const trendClass = computed(() => {
  if (props.trend === undefined) return '';
  return props.trend > 0 ? 'up' : props.trend < 0 ? 'down' : 'flat';
});

const trendIcon = computed(() => {
  if (props.trend === undefined) return Minus;
  return props.trend > 0 ? Top : props.trend < 0 ? Bottom : Minus;
});

const trendText = computed(() => {
  if (props.trend === undefined) return '';
  return props.trend > 0 ? `+${props.trend.toFixed(2)}%` : `${props.trend.toFixed(2)}%`;
});
</script>

<style scoped>
.metric-card {
  position: relative;
  overflow: hidden;
}

.metric-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0.8;
}

.metric-content {
  padding-right: 60px;
}

.metric-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.metric-trend {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.metric-trend.up {
  color: #67c23a;
}

.metric-trend.down {
  color: #f56c6c;
}

.metric-trend.flat {
  color: #909399;
}

.metric-trend .el-icon {
  margin-right: 4px;
}
</style>
