<script setup lang="ts">
import { message } from 'ant-design-vue'
const { api } = useApi()

async function deleteCache() {
  try {
    await api.utils.cacheDelete()
    message.info('Deleted Cache Successfully')
  } catch (e: any) {
    message.error(e.message)
  }
}
</script>

<template>
  <a-tooltip placement="bottom">
    <template #title>
      <span> Delete Cache </span>
    </template>
    <mdi-delete class="cursor-pointer" @click="deleteCache" />
  </a-tooltip>
</template>
