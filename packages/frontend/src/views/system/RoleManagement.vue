<template>
  <div class="role-management">
    <el-card>
      <template #header><div class="card-header"><span>角色管理</span></div></template>
      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="name" label="角色名称" width="140" />
        <el-table-column prop="code" label="代码" width="130" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="isSystem" label="系统角色" width="90">
          <template #default="{ row }"><el-tag :type="row.isSystem ? 'danger' : 'info'" size="small">{{ row.isSystem ? '是' : '否' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="权限数量" width="100">
          <template #default="{ row }"><el-tag type="primary" size="small">{{ getPermCount(row) }} 个</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }"><el-button type="primary" link size="small" @click="viewPerms(row)">查看权限</el-button></template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="`${currentRole?.name} - 权限详情`" width="720px">
      <el-collapse v-model="activeGroups">
        <el-collapse-item v-for="g in permGroups" :key="g.name" :title="g.name" :name="g.name">
          <div class="perm-grid">
            <el-checkbox v-for="p in g.perms" :key="p.value" :model-value="hasRolePerm(p.value)" disabled>{{ p.label }}</el-checkbox>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { roleApi } from '@/api/role'
const loading = ref(false); const dialogVisible = ref(false)
const tableData = ref<any[]>([]); const currentRole = ref<any>(null)
const activeGroups = ref<string[]>([])
const permGroups = [
  { name: '线索管理', perms: [{value:'lead_create',label:'创建'},{value:'lead_view',label:'查看'},{value:'lead_edit',label:'编辑'},{value:'lead_delete',label:'删除'},{value:'lead_assign',label:'分配'},{value:'lead_convert',label:'转化'}] },
  { name: '客户管理', perms: [{value:'customer_create',label:'创建'},{value:'customer_view',label:'查看'},{value:'customer_edit',label:'编辑'},{value:'customer_delete',label:'删除'}] },
  { name: '项目管理', perms: [{value:'project_create',label:'创建'},{value:'project_view',label:'查看'},{value:'project_edit',label:'编辑'},{value:'project_delete',label:'删除'}] },
  { name: '合同管理', perms: [{value:'contract_create',label:'创建'},{value:'contract_view',label:'查看'},{value:'contract_edit',label:'编辑'},{value:'contract_delete',label:'删除'}] },
  { name: '回款管理', perms: [{value:'payment_create',label:'创建'},{value:'payment_view',label:'查看'},{value:'payment_edit',label:'编辑'},{value:'payment_delete',label:'删除'}] },
  { name: '用户管理', perms: [{value:'user_create',label:'创建'},{value:'user_view',label:'查看'},{value:'user_edit',label:'编辑'},{value:'user_delete',label:'删除'}] },
  { name: '其他', perms: [{value:'role_view',label:'查看角色'},{value:'role_edit',label:'管理角色'},{value:'report_view',label:'查看报表'},{value:'dashboard_view',label:'仪表盘'}] },
]
const getPermCount = (role: any) => {
  const perms: string = role.permissions || ''
  return perms.split(',').filter(Boolean).length
}
const hasRolePerm = (perm: string) => {
  if (!currentRole.value) return false
  return (currentRole.value.permissions || '').split(',').includes(perm)
}
const viewPerms = (role: any) => {
  currentRole.value = role
  activeGroups.value = permGroups.map(g => g.name)
  dialogVisible.value = true
}
onMounted(async () => {
  loading.value = true
  try { tableData.value = await roleApi.getList() as any[] } catch { tableData.value = [] }
  finally { loading.value = false }
})
</script>
<style scoped>
.card-header { display:flex; justify-content:space-between; align-items:center; }
.perm-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:10px; padding:10px 0; }
</style>
