<script setup lang="ts">
import type { ColumnType } from 'nocodb-sdk'
import { isVirtualCol } from 'nocodb-sdk'
import Draggable from 'vuedraggable'
import {
  ActiveViewInj,
  FieldsInj,
  IsLockedInj,
  IsPublicInj,
  MetaInj,
  ReloadViewDataHookInj,
  computed,
  inject,
  ref,
  useNuxtApp,
  useViewColumns,
  watch,
} from '#imports'
import CellIcon from '~/components/smartsheet-header/CellIcon.vue'
import VirtualCellIcon from '~/components/smartsheet-header/VirtualCellIcon.vue'

const meta = inject(MetaInj)!

const activeView = inject(ActiveViewInj)!

const reloadDataHook = inject(ReloadViewDataHookInj)!

const rootFields = inject(FieldsInj)

const isLocked = inject(IsLockedInj, ref(false))

const isPublic = inject(IsPublicInj, ref(false))

const { $e } = useNuxtApp()

const {
  showSystemFields,
  sortedAndFilteredFields,
  fields,
  loadViewColumns,
  filteredFieldList,
  filterQuery,
  showAll,
  hideAll,
  saveOrUpdate,
  metaColumnById,
} = useViewColumns(activeView, meta, () => reloadDataHook.trigger())

watch(
  () => (activeView.value as any)?.id,
  async (newVal, oldVal) => {
    if (newVal !== oldVal && meta.value) {
      await loadViewColumns()
    }
  },
  { immediate: true },
)

watch(
  sortedAndFilteredFields,
  (v) => {
    if (rootFields) rootFields.value = v || []
  },
  { immediate: true },
)

const isAnyFieldHidden = computed(() => filteredFieldList.value?.some((field) => !field.show))

const onMove = (event: { moved: { newIndex: number } }) => {
  // todo : sync with server
  if (!fields.value) return

  if (fields.value.length < 2) return

  fields.value.map((field, index) => {
    field.order = index + 1
    return field
  })

  saveOrUpdate(fields.value[event.moved.newIndex], event.moved.newIndex)

  $e('a:fields:reorder')
}

const getIcon = (c: ColumnType) =>
  h(isVirtualCol(c) ? VirtualCellIcon : CellIcon, {
    columnMeta: c,
  })
</script>

<template>
  <a-dropdown :trigger="['click']">
    <div :class="{ 'nc-badge nc-active-btn': isAnyFieldHidden }">
      <a-button v-t="['c:fields']" class="nc-fields-menu-btn nc-toolbar-btn" :disabled="isLocked">
        <div class="flex items-center gap-1">
          <MdiEyeOffOutline />

          <!-- Fields -->
          <span class="text-capitalize !text-sm font-weight-normal">{{ $t('objects.fields') }}</span>

          <MdiMenuDown class="text-grey" />
        </div>
      </a-button>
    </div>
    <template #overlay>
      <div
        class="p-3 min-w-[280px] bg-gray-50 shadow-lg nc-table-toolbar-menu max-h-[max(80vh,500px)] overflow-auto !border"
        @click.stop
      >
        <div class="p-1" @click.stop>
          <a-input v-model:value="filterQuery" size="small" :placeholder="$t('placeholder.searchFields')" />
        </div>
        <div class="nc-fields-list py-1">
          <Draggable v-model="fields" item-key="id" @change="onMove($event)">
            <template #item="{ element: field, index: index }">
              <div v-show="filteredFieldList.includes(field)" :key="field.id" class="px-2 py-1 flex items-center" @click.stop>
                <a-checkbox v-model:checked="field.show" class="shrink" @change="saveOrUpdate(field, index)">
                  <div class="flex items-center">
                    <component :is="getIcon(metaColumnById[field.fk_column_id])" />
                    <span>{{ field.title }}</span>
                  </div>
                </a-checkbox>
                <div class="flex-1" />
                <MdiDrag class="cursor-move" />
              </div>
            </template>
          </Draggable>
        </div>

        <a-divider class="!my-2" />

        <div v-if="!isPublic" class="p-2 py-1 flex" @click.stop>
          <a-checkbox v-model:checked="showSystemFields" class="!items-center">
            <span class="text-xs"> {{ $t('activity.showSystemFields') }}</span>
          </a-checkbox>
        </div>
        <div class="p-2 flex gap-2" @click.stop>
          <a-button size="small" class="!text-xs text-gray-500 text-capitalize" @click.stop="showAll()">
            <!-- Show All -->
            {{ $t('general.showAll') }}
          </a-button>
          <a-button size="small" class="!text-xs text-gray-500 text-capitalize" @click.stop="hideAll()">
            <!-- Hide All -->
            {{ $t('general.hideAll') }}
          </a-button>
        </div>
      </div>
    </template>
  </a-dropdown>
</template>

<style scoped lang="scss">
:deep(.ant-checkbox-inner) {
  @apply transform scale-60;
}
:deep(.ant-checkbox) {
  @apply top-auto;
}
</style>
