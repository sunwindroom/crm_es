<template>
  <slot v-if="hasPermission" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { hasPermission as checkPermission } from '../utils/permission';

const props = defineProps<{
  permission: string;
}>();

const hasPermission = computed(() => {
  return checkPermission(props.permission);
});
</script>
