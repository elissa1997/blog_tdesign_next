<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { MessagePlugin } from 'tdesign-vue-next'
import DictEdit from './edit.vue'
import { del, list as listDicts } from '@/network/dict.js'

const MIN_TABLE_HEIGHT = 168

const searchData = ref({
  dict_type: '',
})
const tableData = ref([])
const selectedRowKeys = ref([])
const loading = ref(false)
const deleting = ref(false)
const deleteDialogVisible = ref(false)
const pendingDelete = ref(createEmptyDelete())
const dialog = ref({
  visible: false,
  title: '',
  data: null,
  id: '',
})
const tableHeight = ref(168)
const isHeightOverflowing = ref(false)

const pagination = ref({
  current: 1,
  pageSize: 15,
  total: 0,
  pageSizeOptions: [15, 20, 50, 100],
})

const dictListRef = ref(null)
const searchRef = ref(null)
const tableCardRef = ref(null)
const tableToolbarRef = ref(null)
const tableWrapRef = ref(null)

let resizeObserver = null
let observedPagination = null
let resizeFrameId = null

const columns = [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  { colKey: 'id', title: 'ID', width: 60 },
  { colKey: 'dict_type', title: '字典类型', ellipsis: true },
  { colKey: 'name', title: '字典名称', ellipsis: true },
  { colKey: 'value', title: '字典值', width: 100, align: 'center' },
  { colKey: 'createdAt', title: '创建时间', width: 160 },
  { colKey: 'updatedAt', title: '更新时间', width: 160 },
  { colKey: 'operation', title: '操作', width: 260, align: 'center' },
]

function createEmptyDelete() {
  return {
    id: [],
    dict_type: [],
    text: '',
  }
}

const formatDate = (value) => {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

const readStylePixel = (styles, property) => {
  return Number.parseFloat(styles[property]) || 0
}

const observePagination = (paginationElement) => {
  if (!paginationElement || paginationElement === observedPagination) return

  if (observedPagination) {
    resizeObserver?.unobserve(observedPagination)
  }

  observedPagination = paginationElement
  resizeObserver?.observe(paginationElement)
}

const calculateTableHeight = () => {
  const dictList = dictListRef.value
  const searchCard = searchRef.value
  const tableCard = tableCardRef.value
  const toolbar = tableToolbarRef.value
  const tableWrap = tableWrapRef.value

  if (!dictList || !searchCard || !tableCard || !toolbar || !tableWrap) return

  const dictStyles = getComputedStyle(dictList)
  const cardStyles = getComputedStyle(tableCard)
  const toolbarStyles = getComputedStyle(toolbar)
  const paginationElement = tableWrap.querySelector('.t-table__pagination')
  const paginationHeight = paginationElement?.getBoundingClientRect().height || 0

  observePagination(paginationElement)

  const occupiedHeight = [
    readStylePixel(dictStyles, 'paddingTop'),
    readStylePixel(dictStyles, 'paddingBottom'),
    searchCard.getBoundingClientRect().height,
    readStylePixel(cardStyles, 'marginTop'),
    readStylePixel(cardStyles, 'paddingTop'),
    readStylePixel(cardStyles, 'paddingBottom'),
    toolbar.getBoundingClientRect().height,
    readStylePixel(toolbarStyles, 'marginBottom'),
    paginationHeight,
  ].reduce((total, height) => total + height, 0)

  const availableHeight = Math.floor(dictList.clientHeight - occupiedHeight)

  isHeightOverflowing.value = availableHeight < MIN_TABLE_HEIGHT
  tableHeight.value = Math.max(MIN_TABLE_HEIGHT, availableHeight)
}

const scheduleTableHeightCalculation = () => {
  if (resizeFrameId !== null) {
    cancelAnimationFrame(resizeFrameId)
  }

  resizeFrameId = requestAnimationFrame(() => {
    resizeFrameId = null
    calculateTableHeight()
  })
}

const refreshTableHeight = async () => {
  await nextTick()
  scheduleTableHeightCalculation()
}

const getListParams = () => {
  const params = {
    offset: pagination.value.current,
    limits: pagination.value.pageSize,
  }
  const search = {}

  if (searchData.value.dict_type.trim()) {
    search.dict_type = searchData.value.dict_type.trim()
  }

  if (Object.keys(search).length > 0) {
    params.search = JSON.stringify(search)
  }

  return params
}

const getDictList = async () => {
  loading.value = true

  try {
    const res = await listDicts(getListParams())

    if (res?.status !== 200) {
      throw new Error(res?.msg || res?.message || '获取字典列表失败')
    }

    tableData.value = Array.isArray(res.data?.list) ? res.data.list : []
    pagination.value.total = Number(res.data?.total) || 0
  } catch (error) {
    tableData.value = []
    pagination.value.total = 0
    MessagePlugin.error(error?.message || '获取字典列表失败')
  } finally {
    loading.value = false
    void refreshTableHeight()
  }
}

const reloadList = async () => {
  await getDictList()

  if (tableData.value.length === 0 && pagination.value.current > 1 && pagination.value.total > 0) {
    pagination.value.current -= 1
    await getDictList()
  }
}

const searchReset = () => {
  searchData.value = {
    dict_type: '',
  }
  pagination.value.current = 1
  void getDictList()
}

const searchSubmit = () => {
  pagination.value.current = 1
  void getDictList()
}

const onPaginationChange = ({ current, pageSize }) => {
  pagination.value.current = current
  pagination.value.pageSize = pageSize
  void getDictList()
}

const onAdd = () => {
  dialog.value = {
    visible: true,
    title: '新增字典',
    data: {
      type: 'add',
      row: {},
    },
    id: 'dictEdit',
  }
}

const onBatchDelete = () => {
  openDeleteDialog({
    id: selectedRowKeys.value,
    dict_type: [],
    text: `确定删除选中的 ${selectedRowKeys.value.length} 条字典吗？删除后无法恢复。`,
  })
}

const onEdit = (row) => {
  dialog.value = {
    visible: true,
    title: '编辑字典',
    data: {
      type: 'editItem',
      row: { ...row },
    },
    id: 'dictEdit',
  }
}

const onEditType = (row) => {
  dialog.value = {
    visible: true,
    title: '编辑字典类型',
    data: {
      type: 'editType',
      row: { dict_type: row.dict_type },
    },
    id: 'dictEdit',
  }
}

const onDelete = (row) => {
  openDeleteDialog({
    id: [row.id],
    dict_type: [],
    text: `确定删除字典「${row.name}」吗？删除后无法恢复。`,
  })
}

const openDeleteDialog = ({ id = [], dict_type = [], text }) => {
  if (id.length === 0 && dict_type.length === 0) return

  pendingDelete.value = {
    id: [...id],
    dict_type: [...dict_type],
    text,
  }
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    const response = await del({
      id: pendingDelete.value.id,
      dict_type: pendingDelete.value.dict_type,
    })

    if (response?.status !== 200) {
      throw new Error(response?.msg || response?.message || '删除字典失败')
    }

    const deletedIds = pendingDelete.value.id
    const deletedTypes = pendingDelete.value.dict_type
    selectedRowKeys.value = selectedRowKeys.value.filter((id) => !deletedIds.includes(id))
    if (deletedTypes.length > 0) {
      const deletedTypeSet = new Set(deletedTypes)
      selectedRowKeys.value = selectedRowKeys.value.filter((id) => {
        const row = tableData.value.find((item) => item.id === id)
        return row ? !deletedTypeSet.has(row.dict_type) : true
      })
    }

    MessagePlugin.success('字典已删除')
    deleteDialogVisible.value = false
    pendingDelete.value = createEmptyDelete()
    await reloadList()
  } catch (error) {
    MessagePlugin.error(error?.message || '删除字典失败')
  } finally {
    deleting.value = false
  }
}

const closeDialog = () => {
  dialog.value.visible = false
}

const onEditSuccess = async () => {
  closeDialog()
  await reloadList()
}

const startHeightObserver = () => {
  resizeObserver = new ResizeObserver(scheduleTableHeightCalculation)

  const observedElements = [
    dictListRef.value,
    searchRef.value,
    tableCardRef.value,
    tableToolbarRef.value,
  ]

  observedElements.filter(Boolean).forEach((element) => {
    resizeObserver.observe(element)
  })

  scheduleTableHeightCalculation()
}

const stopHeightObserver = () => {
  resizeObserver?.disconnect()
  resizeObserver = null
  observedPagination = null

  if (resizeFrameId !== null) {
    cancelAnimationFrame(resizeFrameId)
    resizeFrameId = null
  }
}

onMounted(async () => {
  await getDictList()
  await nextTick()

  startHeightObserver()
})

onBeforeUnmount(stopHeightObserver)

</script>

<template>
  <div
    ref="dictListRef"
    class="dictList"
    :class="{ 'dictList--overflowing': isHeightOverflowing }"
  >
    <div ref="searchRef" class="search">
      <t-form
        :data="searchData"
        layout="inline"
        scroll-to-first-error="smooth"
        @reset="searchReset"
        @submit="searchSubmit"
      >
        <t-form-item label="字典类型" name="dict_type">
          <t-input v-model="searchData.dict_type" placeholder="请输入字典类型" />
        </t-form-item>

        <t-form-item>
          <t-space size="10px">
            <t-button theme="primary" type="submit">查询</t-button>
            <t-button theme="default" variant="base" type="reset">重置</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </div>

    <div ref="tableCardRef" class="table-card">
      <div ref="tableToolbarRef" class="table-toolbar">
        <t-space>
          <t-button theme="primary" @click="onAdd">新增</t-button>
          <t-button
            theme="danger"
            variant="outline"
            :disabled="selectedRowKeys.length === 0"
            @click="onBatchDelete"
          >
            批量删除
          </t-button>
        </t-space>
        <span class="selected-count">已选择 {{ selectedRowKeys.length }} 项</span>
      </div>

      <div ref="tableWrapRef">
        <t-table
          v-model:selected-row-keys="selectedRowKeys"
          row-key="id"
          :columns="columns"
          :data="tableData"
          :height="tableHeight"
          :loading="loading"
          :pagination="pagination"
          :reserve-selected-row-on-paginate="true"
          size="small"
          table-layout="fixed"
          bordered
          resizable
          @page-change="onPaginationChange"
        >
          <template #value="{ row }">
            <t-tag theme="primary" variant="light">
              {{ row.value }}
            </t-tag>
          </template>

          <template #createdAt="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>

          <template #updatedAt="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>

          <template #operation="{ row }">
            <t-space size="small">
              <t-button theme="primary" size="small" @click="onEdit(row)">编辑</t-button>
              <t-button theme="default" variant="outline" size="small" @click="onEditType(row)">
                编辑类型
              </t-button>
              <t-button theme="danger" size="small" @click="onDelete(row)">删除</t-button>
            </t-space>
          </template>
        </t-table>
      </div>
    </div>

    <t-dialog
      v-model:visible="dialog.visible"
      :header="dialog.title"
      width="520px"
      :footer="false"
      destroy-on-close
    >
      <DictEdit
        v-if="dialog.id === 'dictEdit'"
        :type="dialog.data?.type"
        :data="dialog.data?.row"
        @success="onEditSuccess"
        @cancel="closeDialog"
      />
    </t-dialog>

    <t-dialog
      v-model:visible="deleteDialogVisible"
      header="确认删除"
      :confirm-btn="{ content: '删除', theme: 'danger', loading: deleting }"
      :close-on-overlay-click="!deleting"
      :close-on-esc-keydown="!deleting"
      @confirm="confirmDelete"
    >
      {{ pendingDelete.text }}
    </t-dialog>
  </div>
</template>

<style scoped lang="scss">
.dictList {
  height: 100%;
  padding: var(--td-comp-paddingTB-s) var(--td-comp-paddingLR-s);
  box-sizing: border-box;
  overflow: hidden;

  &--overflowing {
    overflow-y: auto;
  }

  .search,
  .table-card {
    padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-l);
    box-sizing: border-box;
    border-radius: var(--td-radius-medium);
    background-color: var(--td-bg-color-container);
  }

  .table-card {
    margin-top: var(--td-comp-margin-m);
  }

  .table-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--td-comp-margin-m);
  }

  .selected-count {
    color: var(--td-text-color-secondary);
    font: var(--td-font-body-medium);
  }
}

</style>
