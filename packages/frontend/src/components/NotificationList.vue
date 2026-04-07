<template>
  <div class="notification-list">
    <div class="notification-header">
      <h3>通知列表</h3>
      <el-button
        v-if="unreadCount > 0"
        type="text"
        @click="handleMarkAllAsRead"
      >
        全部标记已读
      </el-button>
    </div>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane :label="`未读 (${unreadCount})`" name="unread" />
    </el-tabs>

    <div class="notification-content" v-loading="loading">
      <div v-if="notifications.length === 0" class="empty-state">
        <el-empty description="暂无通知" />
      </div>

      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
        :class="{ unread: !notification.isRead }"
        @click="handleNotificationClick(notification)"
      >
        <div class="notification-icon">
          <el-icon :size="24">
            <Bell />
          </el-icon>
        </div>
        <div class="notification-body">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-content-text">{{ notification.content }}</div>
          <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
        </div>
        <div class="notification-action" v-if="!notification.isRead">
          <el-button
            type="primary"
            size="small"
            @click.stop="handleMarkAsRead(notification.id)"
          >
            标记已读
          </el-button>
        </div>
      </div>
    </div>

    <div class="pagination" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadNotifications"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Bell } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { notificationApi } from '@/api/notification';

const activeTab = ref('all');
const loading = ref(false);
const notifications = ref<any[]>([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const unreadCount = ref(0);

const loadNotifications = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
    };

    if (activeTab.value === 'unread') {
      params.isRead = false;
    }

    const res = await notificationApi.getList(params);
    notifications.value = res.data || [];
    total.value = res.total || 0;
  } catch (error: any) {
    ElMessage.error(error.message || '加载通知失败');
  } finally {
    loading.value = false;
  }
};

const loadUnreadCount = async () => {
  try {
    const res = await notificationApi.getUnreadCount();
    unreadCount.value = res.count || 0;
  } catch (error) {
    console.error('加载未读数量失败', error);
  }
};

const handleTabChange = () => {
  currentPage.value = 1;
  loadNotifications();
};

const handleMarkAsRead = async (id: string) => {
  try {
    await notificationApi.markAsRead(id);
    ElMessage.success('已标记为已读');
    loadNotifications();
    loadUnreadCount();
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  }
};

const handleMarkAllAsRead = async () => {
  try {
    await notificationApi.markAllAsRead();
    ElMessage.success('已全部标记为已读');
    loadNotifications();
    loadUnreadCount();
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  }
};

const handleNotificationClick = (notification: any) => {
  if (!notification.isRead) {
    handleMarkAsRead(notification.id);
  }
  // TODO: 根据通知类型跳转到相关页面
};

const formatTime = (time: string) => {
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  } else {
    return date.toLocaleDateString();
  }
};

onMounted(() => {
  loadNotifications();
  loadUnreadCount();
});
</script>

<style scoped lang="scss">
.notification-list {
  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      margin: 0;
      font-size: 18px;
    }
  }

  .notification-content {
    min-height: 300px;
    max-height: 600px;
    overflow-y: auto;

    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background-color 0.3s;

      &:hover {
        background-color: #f5f7fa;
      }

      &.unread {
        background-color: #ecf5ff;
      }

      .notification-icon {
        margin-right: 12px;
        color: #409eff;
      }

      .notification-body {
        flex: 1;

        .notification-title {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .notification-content-text {
          color: #666;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .notification-time {
          color: #999;
          font-size: 12px;
        }
      }

      .notification-action {
        margin-left: 12px;
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }
}
</style>
