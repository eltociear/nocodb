<script lang="ts" setup>
import { Empty, Modal } from 'ant-design-vue'
import type { ColumnType } from 'nocodb-sdk'
import {
  ColumnInj,
  IsFormInj,
  ReadonlyInj,
  computed,
  useLTARStoreOrThrow,
  useSmartsheetRowStoreOrThrow,
  useVModel,
  watch,
} from '#imports'
import { IsPublicInj } from '~/context'

const props = defineProps<{ modelValue?: boolean }>()

const emit = defineEmits(['update:modelValue', 'attachRecord'])

const ExpandedForm: any = defineAsyncComponent(() => import('../../smartsheet/expanded-form/index.vue'))

const vModel = useVModel(props, 'modelValue', emit)

const isForm = inject(IsFormInj, ref(false))

const isPublic = inject(IsPublicInj, ref(false))

const column = inject(ColumnInj)

const readonly = inject(ReadonlyInj, false)

const {
  childrenList,
  deleteRelatedRow,
  loadChildrenList,
  childrenListPagination,
  relatedTablePrimaryValueProp,
  unlink,
  getRelatedTableRowId,
  relatedTableMeta,
} = useLTARStoreOrThrow()

const { isNew, state, removeLTARRef } = useSmartsheetRowStoreOrThrow()

watch(
  [vModel, isForm],
  (nextVal) => {
    if ((nextVal[0] || nextVal[1]) && !isNew.value) {
      loadChildrenList()
    }
  },
  { immediate: true },
)

const unlinkRow = async (row: Record<string, any>) => {
  if (isNew.value) {
    removeLTARRef(row, column?.value as ColumnType)
  } else {
    await unlink(row)
    await loadChildrenList()
  }
}

const unlinkIfNewRow = async (row: Record<string, any>) => {
  if (isNew.value) {
    removeLTARRef(row, column?.value as ColumnType)
  }
}

const container = computed(() =>
  isForm?.value
    ? h('div', {
        class: 'w-full p-2',
      })
    : Modal,
)

const expandedFormDlg = ref(false)
const expandedFormRow = ref()
</script>

<template>
  <component :is="container" v-model:visible="vModel" :footer="null" title="Child list" :body-style="{ padding: 0 }">
    <div class="max-h-[max(calc(100vh_-_300px)_,500px)] flex flex-col py-6">
      <div class="flex mb-4 items-center gap-2 px-12">
        <div class="flex-1" />
        <MdiReload v-if="!isForm" class="cursor-pointer text-gray-500" @click="loadChildrenList" />

        <a-button v-if="!readonly" type="primary" ghost class="!text-xs" size="small" @click="emit('attachRecord')">
          <div class="flex items-center gap-1">
            <MdiLinkVariantRemove class="text-xs" type="primary" @click="unlinkRow(row)" />
            Link to '{{ relatedTableMeta.title }}'
          </div>
        </a-button>
      </div>
      <template v-if="(isNew && state?.[column?.title]?.length) || childrenList?.pageInfo?.totalRows">
        <div class="flex-1 overflow-auto min-h-0 scrollbar-thin-dull px-12 cursor-pointer">
          <a-card
            v-for="(row, i) of childrenList?.list ?? state?.[column?.title] ?? []"
            :key="i"
            class="!my-4 hover:(!bg-gray-200/50 shadow-md)"
            @click="
              () => {
                expandedFormRow = row
                expandedFormDlg = true
              }
            "
          >
            <div class="flex items-center">
              <div class="flex-1 overflow-hidden min-w-0">
                {{ row[relatedTablePrimaryValueProp] }}
                <span class="text-gray-400 text-[11px] ml-1">(Primary key : {{ getRelatedTableRowId(row) }})</span>
              </div>
              <div v-if="!readonly" class="flex gap-2">
                <MdiLinkVariantRemove
                  class="text-xs text-grey hover:(!text-red-500) cursor-pointer"
                  @click.stop="unlinkRow(row)"
                />
                <MdiDeleteOutline
                  v-if="!readonly && !isPublic"
                  class="text-xs text-grey hover:(!text-red-500) cursor-pointer"
                  @click.stop="deleteRelatedRow(row, unlinkIfNewRow)"
                />
              </div>
            </div>
          </a-card>
        </div>

        <div class="flex justify-center mt-6">
          <a-pagination
            v-if="!isNew && childrenList?.pageInfo"
            v-model:current="childrenListPagination.page"
            v-model:page-size="childrenListPagination.size"
            class="mt-2 mx-auto"
            size="small"
            :total="childrenList.pageInfo.totalRows"
            show-less-items
          />
        </div>
      </template>
      <a-empty
        v-else
        :class="{ 'my-10': !isForm, 'my-1 !text-xs': isForm }"
        :image="Empty.PRESENTED_IMAGE_SIMPLE"
        :image-style="isForm ? { height: '20px' } : {}"
      />
    </div>

    <Suspense>
      <ExpandedForm
        v-if="expandedFormRow && expandedFormDlg"
        v-model="expandedFormDlg"
        :row="{ row: expandedFormRow }"
        :meta="relatedTableMeta"
        load-row
        use-meta-fields
      />
    </Suspense>
  </component>
</template>

<style scoped lang="scss">
:deep(.ant-pagination-item a) {
  line-height: 21px !important;
}
</style>
