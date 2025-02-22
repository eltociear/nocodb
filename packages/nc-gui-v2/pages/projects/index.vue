<script lang="ts" setup>
import { Modal, message } from 'ant-design-vue'
import type { ProjectType } from 'nocodb-sdk'
import { navigateTo } from '#app'
import { extractSdkResponseErrorMsg } from '~/utils'
import MaterialSymbolsFormatListBulletedRounded from '~icons/material-symbols/format-list-bulleted-rounded'
import MaterialSymbolsGridView from '~icons/material-symbols/grid-view'
import MdiPlus from '~icons/mdi/plus'
import MdiDatabaseOutline from '~icons/mdi/database-outline'
import MdiFolderOutline from '~icons/mdi/folder-outline'

const navDrawerOptions = [
  {
    title: 'My NocoDB',
    icon: MdiFolderOutline,
  },
  /* todo: implement the api and bring back the options below
   {
    title: "Shared With Me",
    icon: MdiAccountGroup
  },
  {
    title: "Recent",
    icon: MdiClockOutline
  },
  {
    title: "Starred",
    icon: MdiStar
  } */
]

const route = useRoute()

const { $api } = useNuxtApp()

const response = await $api.project.list({})
const projects = $ref(response.list)
const activePage = $ref(navDrawerOptions[0].title)
const deleteProject = (project: ProjectType) => {
  Modal.confirm({
    title: 'Do you want to delete the project?',
    // icon: createVNode(ExclamationCircleOutlined),
    content: 'Some descriptions',
    okText: 'Yes',
    okType: 'danger',
    cancelText: 'No',
    async onOk() {
      try {
        await $api.project.delete(project.id as string)
        projects.splice(projects.indexOf(project), 1)
      } catch (e: any) {
        message.error(await extractSdkResponseErrorMsg(e))
      }
    },
  })
}
</script>

<template>
  <NuxtLayout>
    <template #sidebar>
      <div class="flex flex-col h-full">
        <div class="flex p-4">
          <v-menu class="select-none">
            <template #activator="{ props }">
              <div
                class="color-transition hover:(bg-gray-100) mr-auto select-none flex items-center gap-2 leading-8 cursor-pointer rounded-full border-1 border-gray-300 px-5 py-2 shadow prose-lg font-semibold"
                @click="props.onClick"
              >
                <MdiPlus class="text-primary text-2xl" />
                {{ $t('title.newProj') }}
              </div>
            </template>

            <v-list class="!py-0 flex flex-col bg-white rounded-lg shadow-md border-1 border-gray-300 mt-2 ml-2">
              <div
                class="grid grid-cols-12 cursor-pointer hover:bg-gray-200 flex items-center p-2"
                @click="navigateTo('/project/create')"
              >
                <MdiPlus class="col-span-2 mr-1 mt-[1px] text-primary text-lg" />
                <div class="col-span-10 text-sm xl:text-md">{{ $t('activity.createProject') }}</div>
              </div>
              <div
                class="grid grid-cols-12 cursor-pointer hover:bg-gray-200 flex items-center p-2"
                @click="navigateTo('/project/create-external')"
              >
                <MdiDatabaseOutline class="col-span-2 mr-1 mt-[1px] text-green-500 text-lg" />
                <div class="col-span-10 text-sm xl:text-md" v-html="$t('activity.createProjectExtended.extDB')" />
              </div>
            </v-list>
          </v-menu>
        </div>

        <a-menu class="pr-4 flex-1 border-0">
          <a-menu-item
            v-for="(option, index) in navDrawerOptions"
            :key="index"
            class="!rounded-r-lg"
            @click="activePage = option.title"
          >
            <div class="flex items-center gap-4">
              <component :is="option.icon" />

              <span class="font-semibold">
                {{ option.title }}
              </span>
            </div>
          </a-menu-item>
        </a-menu>

        <general-social />

        <general-sponsors :nav="true" />
      </div>
    </template>

    <div class="flex-1 mb-12">
      <div class="flex">
        <div class="flex-1 text-2xl md:text-4xl font-bold text-gray-500 p-4">
          {{ activePage }}
        </div>

        <div class="self-end flex text-4xl mb-1">
          <MaterialSymbolsGridView
            :class="route.name === 'index-index' ? '!text-primary' : ''"
            class="cursor-pointer p-2 hover:bg-gray-300/50 rounded-full"
            @click="navigateTo('/')"
          />
          <MaterialSymbolsFormatListBulletedRounded
            :class="route.name === 'index-index-list' ? '!text-primary' : ''"
            class="cursor-pointer p-2 hover:bg-gray-300/50 rounded-full"
            @click="navigateTo('/list')"
          />
        </div>
      </div>

      <a-divider class="!mb-4 lg:(!mb-8)" />

      <NuxtPage :projects="projects" @delete-project="deleteProject" />
    </div>

    <a-modal></a-modal>
  </NuxtLayout>
</template>
