<script setup lang="ts">
import type { Socket } from 'socket.io-client'
import io from 'socket.io-client'
import type { Card as AntCard } from 'ant-design-vue'
import { Form, message } from 'ant-design-vue'
import {
  computed,
  extractSdkResponseErrorMsg,
  fieldRequiredValidator,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useGlobal,
  useNuxtApp,
  useProject,
  watch,
} from '#imports'

interface Props {
  modelValue: boolean
}

const { modelValue } = defineProps<Props>()

const emit = defineEmits(['update:modelValue'])

const { appInfo } = $(useGlobal())

const baseURL = appInfo.ncSiteUrl

const { $state } = useNuxtApp()

const { project, loadTables } = useProject()

const showGoToDashboardButton = ref(false)

const step = ref(1)

const progress = ref<Record<string, any>[]>([])

const logRef = ref<typeof AntCard>()

let socket: Socket | null

const syncSource = ref({
  id: '',
  type: 'Airtable',
  details: {
    syncInterval: '15mins',
    syncDirection: 'Airtable to NocoDB',
    syncRetryCount: 1,
    apiKey: '',
    shareId: '',
    syncSourceUrlOrId: '',
    options: {
      syncViews: true,
      syncData: true,
      syncRollup: false,
      syncLookup: true,
      syncFormula: false,
      syncAttachment: true,
    },
  },
})

const validators = computed(() => ({
  'details.apiKey': [fieldRequiredValidator],
  'details.syncSourceUrlOrId': [fieldRequiredValidator],
}))

const dialogShow = computed({
  get: () => modelValue,
  set: (v) => emit('update:modelValue', v),
})

const useForm = Form.useForm

const { validateInfos } = useForm(syncSource, validators)

const disableImportButton = computed(() => !syncSource.value.details.apiKey || !syncSource.value.details.syncSourceUrlOrId)

async function saveAndSync() {
  await createOrUpdate()
  await sync()
}

async function createOrUpdate() {
  try {
    const { id, ...payload } = syncSource.value

    if (id !== '') {
      await $fetch(`/api/v1/db/meta/syncs/${id}`, {
        baseURL,
        method: 'PATCH',
        headers: { 'xc-auth': $state.token.value as string },
        body: payload,
      })
    } else {
      syncSource.value = await $fetch(`/api/v1/db/meta/projects/${project.value.id}/syncs`, {
        baseURL,
        method: 'POST',
        headers: { 'xc-auth': $state.token.value as string },
        body: payload,
      })
    }
  } catch (e: any) {
    message.error(await extractSdkResponseErrorMsg(e))
  }
}

async function loadSyncSrc() {
  const data: any = await $fetch(`/api/v1/db/meta/projects/${project.value.id}/syncs`, {
    baseURL,
    method: 'GET',
    headers: { 'xc-auth': $state.token.value as string },
  })

  const { list: srcs } = data

  if (srcs && srcs[0]) {
    srcs[0].details = srcs[0].details || {}
    syncSource.value = migrateSync(srcs[0])
    syncSource.value.details.syncSourceUrlOrId = srcs[0].details.shareId
  } else {
    syncSource.value = {
      id: '',
      type: 'Airtable',
      details: {
        syncInterval: '15mins',
        syncDirection: 'Airtable to NocoDB',
        syncRetryCount: 1,
        apiKey: '',
        shareId: '',
        syncSourceUrlOrId: '',
        options: {
          syncViews: true,
          syncData: true,
          syncRollup: false,
          syncLookup: true,
          syncFormula: false,
          syncAttachment: true,
        },
      },
    }
  }
}

async function sync() {
  step.value = 2
  try {
    await $fetch(`/api/v1/db/meta/syncs/${syncSource.value.id}/trigger`, {
      baseURL,
      method: 'POST',
      headers: { 'xc-auth': $state.token.value as string },
      params: {
        id: socket?.id,
      },
    })
  } catch (e: any) {
    message.error(await extractSdkResponseErrorMsg(e))
  }
}

function migrateSync(src: any) {
  if (!src.details?.options) {
    src.details.options = {
      syncViews: false,
      syncData: true,
      syncRollup: false,
      syncLookup: true,
      syncFormula: false,
      syncAttachment: true,
    }
    src.details.options.syncViews = src.syncViews
    delete src.syncViews
  }

  return src
}

watch(
  () => syncSource.value.details.syncSourceUrlOrId,
  (v) => {
    if (syncSource.value.details) {
      const m = v && v.match(/(exp|shr).{14}/g)
      syncSource.value.details.shareId = m ? m[0] : ''
    }
  },
)

onMounted(async () => {
  socket = io(new URL(baseURL, window.location.href.split(/[?#]/)[0]).href, {
    extraHeaders: { 'xc-auth': $state.token.value as string },
  })

  socket.on('connect_error', () => {
    socket?.disconnect()
    socket = null
  })

  // connect event does not provide data
  socket.on('connect', () => {
    console.log(socket?.id)
    console.log('socket connected')
  })

  socket.on('progress', async (d: Record<string, any>) => {
    progress.value.push(d)

    // FIXME: this doesn't work
    await nextTick(() => {
      ;(logRef.value?.$el as HTMLDivElement).scrollTo()
    })

    if (d.status === 'COMPLETED') {
      showGoToDashboardButton.value = true
      await loadTables()
      // TODO: add tab of the first table
    }
  })

  await loadSyncSrc()
})

onBeforeUnmount(() => {
  if (socket) {
    socket.disconnect()
  }
})
</script>

<template>
  <a-modal v-model:visible="dialogShow" width="max(30vw, 600px)" class="p-2" @keydown.esc="dialogShow = false">
    <div class="px-5">
      <div class="mt-5 prose-xl font-weight-bold">QUICK IMPORT - AIRTABLE</div>

      <div v-if="step === 1">
        <div class="mb-4">
          <span class="mr-3 pt-2 text-gray-500 text-xs">Credentials</span>

          <a
            href="https://docs.nocodb.com/setup-and-usages/import-airtable-to-sql-database-within-a-minute-for-free/#get-airtable-credentials"
            class="prose-sm underline text-grey text-xs"
            target="_blank"
            >Where to find this?
          </a>
        </div>

        <a-form ref="form" :model="syncSource" name="quick-import-airtable-form" layout="horizontal" class="m-0">
          <a-form-item v-bind="validateInfos['details.apiKey']">
            <a-input-password
              v-model:value="syncSource.details.apiKey"
              class="nc-input-api-key"
              placeholder="Api Key"
              size="large"
            />
          </a-form-item>

          <a-form-item v-bind="validateInfos['details.syncSourceUrlOrId']">
            <a-input
              v-model:value="syncSource.details.syncSourceUrlOrId"
              class="nc-input-shared-base"
              placeholder="Shared Base ID / URL"
              size="large"
            />
          </a-form-item>

          <div class="prose-lg self-center my-4 text-gray-500">Advanced Settings</div>

          <a-divider class="mt-2 mb-5" />

          <div class="mt-0 my-2">
            <a-checkbox v-model:checked="syncSource.details.options.syncData">Import Data</a-checkbox>
          </div>

          <div class="my-2">
            <a-checkbox v-model:checked="syncSource.details.options.syncViews">Import Secondary Views</a-checkbox>
          </div>

          <div class="my-2">
            <a-checkbox v-model:checked="syncSource.details.options.syncRollup">Import Rollup Columns</a-checkbox>
          </div>

          <div class="my-2">
            <a-checkbox v-model:checked="syncSource.details.options.syncLookup">Import Lookup Columns</a-checkbox>
          </div>

          <div class="my-2">
            <a-checkbox v-model:checked="syncSource.details.options.syncAttachment">Import Attachment Columns</a-checkbox>
          </div>

          <a-tooltip placement="top">
            <template #title>
              <span>Coming Soon!</span>
            </template>
            <a-checkbox v-model:checked="syncSource.details.options.syncFormula" disabled>Import Formula Columns</a-checkbox>
          </a-tooltip>
        </a-form>

        <a-divider />

        <div>
          <a href="https://github.com/nocodb/nocodb/issues/2052" target="_blank">Questions / Help - Reach out here</a>

          <br />

          <div>
            This feature is currently in beta and more information can be found
            <a class="prose-sm" href="https://github.com/nocodb/nocodb/discussions/2122" target="_blank">here</a>.
          </div>
        </div>
      </div>

      <div v-if="step === 2">
        <div class="mb-4 prose-xl font-bold">Logs</div>

        <a-card ref="logRef" :body-style="{ backgroundColor: '#000000', height: '400px', overflow: 'auto' }">
          <div v-for="({ msg, status }, i) in progress" :key="i">
            <div v-if="status === 'FAILED'" class="flex items-center">
              <MdiCloseCircleOutline class="text-red-500" />

              <span class="text-red-500 ml-2">{{ msg }}</span>
            </div>

            <div v-else class="flex items-center">
              <MdiCurrencyUsd class="text-green-500" />

              <span class="text-green-500 ml-2">{{ msg }}</span>
            </div>
          </div>

          <div
            v-if="
              !progress ||
              !progress.length ||
              (progress[progress.length - 1].status !== 'COMPLETED' && progress[progress.length - 1].status !== 'FAILED')
            "
            class="flex items-center"
          >
            <MdiLoading class="text-green-500 animate-spin" />
            <span class="text-green-500 ml-2"> Importing</span>
          </div>
        </a-card>

        <div class="flex justify-center items-center">
          <a-button v-if="showGoToDashboardButton" class="mt-4" size="large" @click="dialogShow = false">
            Go to Dashboard
          </a-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div v-if="step === 1">
        <a-button key="back" @click="dialogShow = false">{{ $t('general.cancel') }}</a-button>

        <a-button
          key="submit"
          v-t="['c:sync-airtable:save-and-sync']"
          type="primary"
          class="nc-btn-airtable-import"
          :disabled="disableImportButton"
          @click="saveAndSync"
        >
          Import
        </a-button>
      </div>
    </template>
  </a-modal>
</template>
