<template>
  <el-dialog
    v-model="visible"
    title="赢单处理"
    width="800px"
    @close="handleClose"
  >
    <el-alert
      title="赢单后将自动创建项目和合同"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    />
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-divider content-position="left">项目信息</el-divider>
      <el-form-item label="项目名称">
        <el-input v-model="form.projectName" placeholder="默认使用商机名称" />
      </el-form-item>
      <el-form-item label="项目类型" prop="projectType">
        <el-select v-model="form.projectType" placeholder="请选择项目类型">
          <el-option label="售前咨询" value="presales" />
          <el-option label="开发项目" value="development" />
          <el-option label="实施项目" value="implementation" />
          <el-option label="维护项目" value="maintenance" />
          <el-option label="咨询项目" value="consulting" />
        </el-select>
      </el-form-item>
      <el-form-item label="项目开始日期" prop="startDate">
        <el-date-picker
          v-model="form.startDate"
          type="date"
          placeholder="选择开始日期"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="项目结束日期" prop="endDate">
        <el-date-picker
          v-model="form.endDate"
          type="date"
          placeholder="选择结束日期"
          style="width: 100%"
        />
      </el-form-item>

      <el-divider content-position="left">合同信息</el-divider>
      <el-form-item label="合同名称">
        <el-input v-model="form.contractName" placeholder="默认使用商机名称" />
      </el-form-item>
      <el-form-item label="合同金额">
        <el-input-number
          v-model="form.contractAmount"
          :min="0"
          :precision="2"
          placeholder="默认使用商机金额"
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
  opportunityName?: string;
  opportunityAmount?: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: any];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const formRef = ref<FormInstance>();
const form = ref({
  projectName: '',
  projectType: 'implementation',
  startDate: null as Date | null,
  endDate: null as Date | null,
  contractName: '',
  contractAmount: 0,
});

const rules: FormRules = {
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
};

const resetForm = () => {
  form.value = {
    projectName: props.opportunityName || '',
    projectType: 'implementation',
    startDate: null,
    endDate: null,
    contractName: props.opportunityName || '',
    contractAmount: props.opportunityAmount || 0,
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
      emit('submit', form.value);
      handleClose();
    }
  });
};

watch(visible, (val) => {
  if (val) {
    resetForm();
  }
});
</script>
