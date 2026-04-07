<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="600px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="内容" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="4"
          placeholder="请输入跟进内容"
        />
      </el-form-item>
      <el-form-item v-if="type === 'follow_up'" label="下一步计划">
        <el-input
          v-model="form.nextAction"
          type="textarea"
          :rows="2"
          placeholder="请输入下一步计划（可选）"
        />
      </el-form-item>
      <el-form-item v-if="type === 'follow_up'" label="计划日期">
        <el-date-picker
          v-model="form.nextActionDate"
          type="date"
          placeholder="选择计划日期"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

const props = defineProps<{
  modelValue: boolean;
  type: 'follow_up' | 'reply' | 'comment';
  parentId?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: any];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const dialogTitle = computed(() => {
  switch (props.type) {
    case 'follow_up':
      return '添加跟进记录';
    case 'reply':
      return '回复跟进记录';
    case 'comment':
      return '点评跟进记录';
    default:
      return '';
  }
});

const formRef = ref<FormInstance>();
const form = ref({
  content: '',
  nextAction: '',
  nextActionDate: null as Date | null,
});

const rules: FormRules = {
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
};

const resetForm = () => {
  form.value = {
    content: '',
    nextAction: '',
    nextActionDate: null,
  };
};

const handleClose = () => {
  resetForm();
  visible.value = false;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate((valid) => {
    if (valid) {
      const data: any = {
        content: form.value.content,
      };

      if (props.type === 'follow_up') {
        data.nextAction = form.value.nextAction;
        data.nextActionDate = form.value.nextActionDate;
      } else {
        data.parentId = props.parentId;
      }

      emit('submit', data);
      handleClose();
    }
  });
};

watch(visible, (val) => {
  if (!val) {
    resetForm();
  }
});
</script>
