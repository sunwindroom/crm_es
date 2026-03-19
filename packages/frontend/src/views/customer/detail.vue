<template>
  <div class="customer-detail">
    <el-page-header @back="$router.back()" :content="customer?.name || '客户详情'" />
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="8">
        <el-card>
          <template #header>基本信息</template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="客户名称">{{ customer?.name }}</el-descriptions-item>
            <el-descriptions-item label="行业">{{ customer?.industry || '-' }}</el-descriptions-item>
            <el-descriptions-item label="规模">{{ customer?.scale || '-' }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ customer?.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ customer?.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="地址">{{ customer?.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="级别"><el-tag size="small">{{ customer?.level }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="状态"><el-tag :type="customer?.status === 'active' ? 'success' : 'danger'" size="small">{{ customer?.status }}</el-tag></el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-tabs>
          <el-tab-pane label="联系人">
            <el-table :data="contacts" border size="small">
              <el-table-column prop="name" label="姓名" width="100" />
              <el-table-column prop="position" label="职位" width="120" />
              <el-table-column prop="phone" label="电话" width="130" />
              <el-table-column prop="email" label="邮箱" />
              <el-table-column prop="isPrimary" label="主要联系人" width="100">
                <template #default="{ row }"><el-tag v-if="row.isPrimary" type="success" size="small">是</el-tag></template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="跟进记录"><div style="padding:20px;color:#86909c;text-align:center">暂无跟进记录</div></el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { request } from '@/utils/request'
const route = useRoute()
const customer = ref<any>(null)
const contacts = ref<any[]>([])
onMounted(async () => {
  const id = route.params.id as string
  try {
    customer.value = await request.get(`/customers/${id}`)
    contacts.value = await request.get(`/customers/${id}/contacts`) as any[]
  } catch {}
})
</script>