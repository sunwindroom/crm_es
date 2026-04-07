<template>
  <div class="follow-up-list">
    <el-timeline>
      <el-timeline-item
        v-for="item in followUps"
        :key="item.id"
        :timestamp="formatDate(item.created_at)"
        placement="top"
      >
        <el-card>
          <div class="follow-up-header">
            <span class="creator">{{ item.creator?.name || '未知用户' }}</span>
            <el-tag :type="getTagType(item.type)" size="small">
              {{ getTagText(item.type) }}
            </el-tag>
          </div>
          <div class="follow-up-content">{{ item.content }}</div>
          <div v-if="item.next_action" class="next-action">
            <strong>下一步计划：</strong>{{ item.next_action }}
            <span v-if="item.next_action_date" class="next-action-date">
              （{{ formatDate(item.next_action_date) }}）
            </span>
          </div>
          <div class="follow-up-actions">
            <el-button
              v-if="canReply"
              type="primary"
              size="small"
              text
              @click="handleReply(item)"
            >
              回复
            </el-button>
            <el-button
              v-if="canComment"
              type="warning"
              size="small"
              text
              @click="handleComment(item)"
            >
              点评
            </el-button>
            <el-button
              v-if="canDelete(item)"
              type="danger"
              size="small"
              text
              @click="handleDelete(item)"
            >
              删除
            </el-button>
          </div>
          <!-- 回复和点评列表 -->
          <div v-if="item.replies && item.replies.length > 0" class="replies">
            <div v-for="reply in item.replies" :key="reply.id" class="reply-item">
              <div class="reply-header">
                <span class="creator">{{ reply.creator?.name || '未知用户' }}</span>
                <el-tag :type="getTagType(reply.type)" size="small">
                  {{ getTagText(reply.type) }}
                </el-tag>
                <span class="reply-time">{{ formatDate(reply.created_at) }}</span>
              </div>
              <div class="reply-content">{{ reply.content }}</div>
            </div>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FollowUp } from '../types/followUp';

const props = defineProps<{
  followUps: FollowUp[];
  currentUserId: string;
  canReply?: boolean;
  canComment?: boolean;
}>();

const emit = defineEmits<{
  reply: [item: FollowUp];
  comment: [item: FollowUp];
  delete: [item: FollowUp];
}>();

const formatDate = (date: Date | string) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('zh-CN');
};

const getTagType = (type: string) => {
  switch (type) {
    case 'follow_up':
      return 'primary';
    case 'reply':
      return 'success';
    case 'comment':
      return 'warning';
    default:
      return 'info';
  }
};

const getTagText = (type: string) => {
  switch (type) {
    case 'follow_up':
      return '跟进';
    case 'reply':
      return '回复';
    case 'comment':
      return '点评';
    default:
      return '未知';
  }
};

const canDelete = (item: FollowUp) => {
  return item.created_by === props.currentUserId;
};

const handleReply = (item: FollowUp) => {
  emit('reply', item);
};

const handleComment = (item: FollowUp) => {
  emit('comment', item);
};

const handleDelete = (item: FollowUp) => {
  emit('delete', item);
};
</script>

<style scoped>
.follow-up-list {
  padding: 20px;
}

.follow-up-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.creator {
  font-weight: bold;
  color: #409eff;
}

.follow-up-content {
  margin-bottom: 10px;
  line-height: 1.6;
}

.next-action {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 10px;
}

.next-action-date {
  color: #909399;
  font-size: 12px;
}

.follow-up-actions {
  display: flex;
  gap: 10px;
}

.replies {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.reply-item {
  padding: 10px;
  background-color: #fafafa;
  border-radius: 4px;
  margin-bottom: 10px;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.reply-time {
  color: #909399;
  font-size: 12px;
}

.reply-content {
  line-height: 1.6;
}
</style>
