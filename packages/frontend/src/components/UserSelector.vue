<template>
  <el-select
    v-model="selectedValue"
    :multiple="multiple"
    :placeholder="placeholder"
    :filterable="filterable"
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading"
    :multiple-limit="maxSelect"
    @change="handleChange"
  >
    <el-option
      v-for="user in filteredUsers"
      :key="user.id"
      :label="user.name"
      :value="user.id"
    >
      <div class="user-option">
        <span class="user-name">{{ user.name }}</span>
        <span class="user-info">
          <el-tag size="small" type="info">{{ getRoleLabel(user.role) }}</el-tag>
          <span v-if="user.department" class="user-department">{{ user.department }}</span>
        </span>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { userApi } from '@/api/user'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: string | string[]
  multiple?: boolean
  roleFilter?: string[]
  statusFilter?: string[]
  maxSelect?: number
  placeholder?: string
  filterable?: boolean
  clearable?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  roleFilter: () => [],
  statusFilter: () => ['active'],
  maxSelect: 20,
  placeholder: '请选择用户',
  filterable: true,
  clearable: true,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  'change': [value: string | string[]]
}>()

const users = ref<any[]>([])
const loading = ref(false)
const selectedValue = ref<string | string[]>(props.modelValue)

// 角色标签映射
const roleLabels: Record<string, string> = {
  admin: '系统管理员',
  ceo: '总裁',
  cto: '技术副总裁',
  cmo: '营销副总裁',
  sales_manager: '销售经理',
  sales: '销售人员',
  project_manager: '项目经理',
  business: '商务人员',
  finance: '财务人员',
  engineer: '工程师',
}

// 获取角色标签
const getRoleLabel = (role: string) => {
  return roleLabels[role] || role
}

// 过滤后的用户列表
const filteredUsers = computed(() => {
  let result = users.value

  // 角色过滤
  if (props.roleFilter.length > 0) {
    result = result.filter(user => props.roleFilter.includes(user.role))
  }

  // 状态过滤
  if (props.statusFilter.length > 0) {
    result = result.filter(user => props.statusFilter.includes(user.status))
  }

  return result
})

// 加载用户列表
const loadUsers = async () => {
  try {
    loading.value = true
    const response = await userApi.getList({ pageSize: 1000 })
    users.value = response.items || []
  } catch (error: any) {
    ElMessage.error(error.message || '加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 处理选择变化
const handleChange = (value: string | string[]) => {
  emit('update:modelValue', value)
  emit('change', value)
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  selectedValue.value = newValue
})

// 组件挂载时加载用户列表
onMounted(() => {
  loadUsers()
})
</script>

<style scoped lang="scss">
.user-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .user-name {
    font-weight: 500;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #909399;

    .user-department {
      margin-left: 4px;
    }
  }
}
</style>
