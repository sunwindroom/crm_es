<template>
  <el-container class="main-layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="sidebar">
      <div class="logo" :class="{ collapsed }">
        <span class="logo-icon">CRM</span>
        <span v-if="!collapsed" class="logo-text">管理系统</span>
      </div>
      <el-menu :default-active="activeMenu" :collapse="collapsed" router class="sidebar-menu"
        background-color="#001529" text-color="#a6adb4" active-text-color="#fff">
        <template v-for="route in menuRoutes" :key="route.path">
          <el-sub-menu v-if="route.children?.length" :index="route.path">
            <template #title>
              <el-icon><component :is="route.meta?.icon" /></el-icon>
              <span>{{ route.meta?.title }}</span>
            </template>
            <el-menu-item v-for="child in route.children" :key="child.path" :index="child.path">
              <el-icon><component :is="child.meta?.icon" /></el-icon>
              <template #title>{{ child.meta?.title }}</template>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="route.path">
            <el-icon><component :is="route.meta?.icon" /></el-icon>
            <template #title>{{ route.meta?.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="collapsed = !collapsed">
            <Fold v-if="!collapsed" /><Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="b in breadcrumbs" :key="b.path" :to="{ path: b.path }">{{ b.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="username">{{ auth.user?.name || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const route = useRoute(); const router = useRouter(); const auth = useAuthStore()
const collapsed = ref(false)
const menuRoutes = computed(() => {
  const main = router.options.routes.find(r => r.path === '/')
  const children = main?.children || []

  return children.filter(r => !r.meta?.hidden).map(r => {
    const route = {
      ...r,
      path: r.path ? `/${r.path}` : '/',
    }

    // 处理子路由
    if (r.children && r.children.length > 0) {
      route.children = r.children
        .filter(c => !c.meta?.hidden)
        .map(c => ({
          ...c,
          path: `/${r.path}/${c.path}`
        }))
    }

    return route
  })
})
const activeMenu = computed(() => route.path)
const breadcrumbs = computed(() => route.matched.filter(m => m.meta?.title).map(m => ({ path: m.path, title: m.meta?.title as string })))
const handleCommand = async (cmd: string) => {
  if (cmd === 'logout') { await auth.logout(); router.push('/login') }
  else if (cmd === 'profile') router.push('/system/profile')
}
</script>
<style scoped>
.main-layout { height: 100vh; }
.sidebar { background: #001529; transition: width .25s; overflow: hidden; }
.logo { height: 60px; display: flex; align-items: center; padding: 0 16px; color: white; font-weight: 700; border-bottom: 1px solid #002140; gap: 10px; transition: all .25s; }
.logo.collapsed { justify-content: center; padding: 0; }
.logo-icon { background: #1890ff; border-radius: 6px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
.logo-text { font-size: 16px; white-space: nowrap; overflow: hidden; }
.sidebar-menu { border-right: none; }
.header { display: flex; justify-content: space-between; align-items: center; background: white; border-bottom: 1px solid #f0f0f0; padding: 0 24px; box-shadow: 0 1px 4px rgba(0,21,41,.08); }
.header-left { display: flex; align-items: center; gap: 16px; }
.collapse-btn { font-size: 18px; cursor: pointer; color: #595959; }
.header-right { display: flex; align-items: center; }
.user-dropdown { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #595959; }
.username { font-size: 14px; }
.main-content { background: #f0f2f5; padding: 20px; overflow-y: auto; }
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>