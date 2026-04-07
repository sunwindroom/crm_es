<template>
  <el-popover
    placement="bottom"
    :width="400"
    trigger="click"
    @before-enter="loadUnreadCount"
  >
    <template #reference>
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-bell">
        <el-button circle>
          <el-icon :size="20">
            <Bell />
          </el-icon>
        </el-button>
      </el-badge>
    </template>

    <div class="notification-popover">
      <NotificationList />
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Bell } from '@element-plus/icons-vue';
import { notificationApi } from '@/api/notification';
import NotificationList from './NotificationList.vue';

const unreadCount = ref(0);
let timer: NodeJS.Timeout | null = null;

const loadUnreadCount = async () => {
  try {
    const res = await notificationApi.getUnreadCount();
    unreadCount.value = res.count || 0;
  } catch (error) {
    console.error('加载未读数量失败', error);
  }
};

onMounted(() => {
  loadUnreadCount();
  // 每30秒刷新一次未读数量
  timer = setInterval(loadUnreadCount, 30000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped lang="scss">
.notification-bell {
  cursor: pointer;
}

.notification-popover {
  max-height: 600px;
  overflow-y: auto;
}
</style>
