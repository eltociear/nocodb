<script lang="ts" setup>
import { useGlobal, useProject } from '#imports'

const showDrawer = ref(false)

const { appInfo } = useGlobal()

const { project } = useProject()

const route = useRoute()

const openSwaggerLink = () => {
  openLink(`/api/v1/db/meta/projects/${route.params.projectId}/swagger`, appInfo.value.ncSiteUrl)
}
</script>

<template>
  <div
    class="flex items-center space-x-1 w-full cursor-pointer pl-3 py-1.5 hover:(text-primary bg-primary bg-opacity-5)"
    @click="showDrawer = true"
  >
    <MdiCommentTextOutline class="mr-1" />
    <!-- todo: i18n -->
    <div>APIs & Support</div>
  </div>

  <a-drawer
    v-bind="$attrs"
    v-model:visible="showDrawer"
    class="h-full relative"
    placement="right"
    size="small"
    :closable="false"
    :body-style="{ padding: '12px 24px 0 24px', background: '#fafafa' }"
  >
    <div class="flex flex-col w-full h-full p-4 pb-0">
      <!-- todo: i18n -->
      <a-typography-title :level="4" class="!mb-6 !text-gray-500">Help center</a-typography-title>

      <GeneralSocialCard class="!w-full nc-social-card">
        <template #before>
          <a-list-item v-if="project">
            <nuxt-link
              v-t="['e:docs']"
              class="!no-underline !text-current py-4 font-semibold"
              target="_blank"
              @click="openSwaggerLink"
            >
              <div class="ml-3 flex items-center text-sm">
                <LogosSwagger />
                <!--            todo:  i18n -->
                <span class="ml-3">{{ project.title }} : Swagger Documentation</span>
              </div>
            </nuxt-link>
          </a-list-item>
        </template>
      </GeneralSocialCard>

      <div class="flex-1 my-2"></div>

      <GeneralSponsors class="!w-full" />

      <div class="min-h-10 w-full" />
    </div>
  </a-drawer>
</template>

<style scoped lang="scss">
/* Social card style */
.nc-social-card {
  @apply !shadow-none !border-0 bg-transparent;

  :deep(.ant-spin-container) {
    @apply !gap-3;

    .ant-list-item {
      @apply mb-2 border-1 bg-white border-gray-200;
      &:last-child {
        @apply !border-solid;
      }
    }
  }
}
</style>
