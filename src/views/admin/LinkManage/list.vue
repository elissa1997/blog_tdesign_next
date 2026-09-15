<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { MessagePlugin } from 'tdesign-vue-next'
import LinkEdit from './edit.vue'
import { del, listAdmin } from '@/network/links.js'
import { getDictOptionLabel } from '@/util/dict.js'
import { useDictStore } from '@/store/dict.js'

const MIN_TABLE_HEIGHT = 168
const dictStore = useDictStore()

const searchData = ref(createEmptySearch())
const statusOptions = computed(() => dictStore.optionsByType('状态'))
const qiniuOptions = computed(() => dictStore.optionsByType('七牛审核结果'))
const tableData = ref([])
const selectedRowKeys = ref([])
const loading = ref(false)
const tableHeight = ref(MIN_TABLE_HEIGHT)
const isHeightOverflowing = ref(false)
const editDialogVisible = ref(false)
const editingRow = ref({})
const deleteDialogVisible = ref(false)
const deleting = ref(false)
const pendingDeleteIds = ref([])

const pagination = ref({
  current: 1,
  pageSize: 15,
  total: 0,
  pageSizeOptions: [15, 20, 50, 100],
})

const listRef = ref(null)
const searchRef = ref(null)
const tableCardRef = ref(null)
const tableToolbarRef = ref(null)
const tableWrapRef = ref(null)

let resizeObserver = null
let observedPagination = null
let resizeFrameId = null

const columns = [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  { colKey: 'id', title: 'ID', width: 70 },
  { colKey: 'name', title: '站点名称', width: 160, ellipsis: true },
  { colKey: 'url', title: '站点 URL', minWidth: 240, ellipsis: true },
  { colKey: 'status', title: '状态', width: 100, align: 'center' },
  { colKey: 'qiniuSuggestion', title: '内容审核', width: 110, align: 'center' },
  { colKey: 'sort', title: '排序', width: 80, align: 'center' },
  { colKey: 'ip', title: '提交 IP', width: 140, ellipsis: true },
  { colKey: 'agent', title: 'User Agent', minWidth: 220, ellipsis: true },
  { colKey: 'createdAt', title: '创建时间', width: 160 },
  { colKey: 'updatedAt', title: '更新时间', width: 160 },
  { colKey: 'operation', title: '操作', width: 150, align: 'center', fixed: 'right' },
]

function createEmptySearch() {
  return {
    name: '',
    url: '',
    status: '',
    qiniuSuggestion: '',
  }
}

const getStatusLabel = (status) => {
  return getDictOptionLabel(statusOptions.value, status, '未知')
}

const getStatusTheme = (status) => status === '1' ? 'success' : 'default'

const getQiniuLabel = (suggestion) => {
  return getDictOptionLabel(qiniuOptions.value, suggestion, '未知')
}

const getQiniuTheme = (suggestion) => ({
  pass: 'success',
  review: 'warning',
  block: 'danger',
}[suggestion] || 'default')

const formatDate = (value) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'

const readStylePixel = (styles, property) => Number.parseFloat(styles[property]) || 0

const observePagination = (element) => {
  if (!element || element === observedPagination) return
  if (observedPagination) resizeObserver?.unobserve(observedPagination)
  observedPagination = element
  resizeObserver?.observe(element)
}

const calculateTableHeight = () => {
  const container = listRef.value
  const searchCard = searchRef.value
  const tableCard = tableCardRef.value
  const toolbar = tableToolbarRef.value
  const tableWrap = tableWrapRef.value
  if (!container || !searchCard || !tableCard || !toolbar || !tableWrap) return

  const containerStyles = getComputedStyle(container)
  const cardStyles = getComputedStyle(tableCard)
  const toolbarStyles = getComputedStyle(toolbar)
  const paginationElement = tableWrap.querySelector('.t-table__pagination')
  observePagination(paginationElement)

  const occupiedHeight = [
    readStylePixel(containerStyles, 'paddingTop'),
    readStylePixel(containerStyles, 'paddingBottom'),
    searchCard.getBoundingClientRect().height,
    readStylePixel(cardStyles, 'marginTop'),
    readStylePixel(cardStyles, 'paddingTop'),
    readStylePixel(cardStyles, 'paddingBottom'),
    toolbar.getBoundingClientRect().height,
    readStylePixel(toolbarStyles, 'marginBottom'),
    paginationElement?.getBoundingClientRect().height || 0,
  ].reduce((total, height) => total + height, 0)

  const availableHeight = Math.floor(container.clientHeight - occupiedHeight)
  isHeightOverflowing.value = availableHeight < MIN_TABLE_HEIGHT
  tableHeight.value = Math.max(MIN_TABLE_HEIGHT, availableHeight)
}

const scheduleTableHeightCalculation = () => {
  if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId)
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

  for (const key of ['name', 'url']) {
    const value = searchData.value[key].trim()
    if (value) search[key] = value
  }
  if (searchData.value.status !== '') search.status = searchData.value.status
  if (searchData.value.qiniuSuggestion !== '') {
    search.qiniuSuggestion = searchData.value.qiniuSuggestion
  }
  if (Object.keys(search).length > 0) params.search = JSON.stringify(search)

  return params
}

const getLinkList = async () => {
  loading.value = true
  try {
    const response = await listAdmin(getListParams())
    if (response?.status !== 200) {
      throw new Error(response?.msg || response?.message || '获取友情链接列表失败')
    }

    tableData.value = Array.isArray(response.data?.list) ? response.data.list : []
    pagination.value.total = Number(response.data?.total) || 0
  } catch (error) {
    tableData.value = []
    pagination.value.total = 0
    MessagePlugin.error(error?.message || '获取友情链接列表失败')
  } finally {
    loading.value = false
    void refreshTableHeight()
  }
}

const reloadList = async () => {
  await getLinkList()
  const lastPage = Math.max(1, Math.ceil(pagination.value.total / pagination.value.pageSize))
  if (pagination.value.current > lastPage) {
    pagination.value.current = lastPage
    await getLinkList()
  }
}

const searchReset = () => {
  searchData.value = createEmptySearch()
  pagination.value.current = 1
  void getLinkList()
}

const searchSubmit = () => {
  pagination.value.current = 1
  void getLinkList()
}

const onPaginationChange = ({ current, pageSize }) => {
  pagination.value.current = current
  pagination.value.pageSize = pageSize
  void getLinkList()
}

const openEditDialog = (row) => {
  editingRow.value = { ...row }
  editDialogVisible.value = true
}

const closeEditDialog = () => {
  editDialogVisible.value = false
  editingRow.value = {}
}

const onEditSuccess = async () => {
  closeEditDialog()
  await reloadList()
}

const openDeleteDialog = (ids) => {
  const uniqueIds = [...new Set(ids)]
  if (uniqueIds.length === 0) return
  pendingDeleteIds.value = uniqueIds
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    const response = await del({ id: pendingDeleteIds.value })
    if (response?.status !== 200) {
      throw new Error(response?.msg || response?.message || '删除友情链接失败')
    }

    const deletedIdSet = new Set(pendingDeleteIds.value)
    selectedRowKeys.value = selectedRowKeys.value.filter((id) => !deletedIdSet.has(id))
    deleteDialogVisible.value = false
    pendingDeleteIds.value = []
    MessagePlugin.success('友情链接已删除')
    await reloadList()
  } catch (error) {
    MessagePlugin.error(error?.message || '删除友情链接失败')
  } finally {
    deleting.value = false
  }
}

const startHeightObserver = () => {
  resizeObserver = new ResizeObserver(scheduleTableHeightCalculation)
  ;[listRef.value, searchRef.value, tableCardRef.value, tableToolbarRef.value]
    .filter(Boolean)
    .forEach((element) => resizeObserver.observe(element))
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
  await getLinkList()
  await nextTick()
  startHeightObserver()
})

onBeforeUnmount(stopHeightObserver)
</script>

<template>
  <div
    ref="listRef"
    class="link-list"
    :class="{ 'link-list--overflowing': isHeightOverflowing }"
  >
    <div ref="searchRef" class="search">
      <t-form
        :data="searchData"
        layout="inline"
        scroll-to-first-error="smooth"
        @reset="searchReset"
        @submit="searchSubmit"
      >
        <t-form-item label="站点名称" name="name">
          <t-input v-model="searchData.name" placeholder="请输入站点名称" />
        </t-form-item>

        <t-form-item label="站点 URL" name="url">
          <t-input v-model="searchData.url" placeholder="请输入 URL 关键字" />
        </t-form-item>

        <t-form-item label="状态" name="status">
          <t-select
            v-model="searchData.status"
            :options="statusOptions"
            placeholder="请选择状态"
          />
        </t-form-item>

        <t-form-item label="内容审核" name="qiniuSuggestion">
          <t-select
            v-model="searchData.qiniuSuggestion"
            :options="qiniuOptions"
            placeholder="请选择审核结果"
          />
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
        <t-button
          theme="danger"
          variant="outline"
          :disabled="selectedRowKeys.length === 0"
          @click="openDeleteDialog(selectedRowKeys)"
        >
          批量删除
        </t-button>
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
          <template #url="{ row }">
            <t-link class="url-link" theme="primary" :href="row.url" target="_blank">
              {{ row.url }}
            </t-link>
          </template>

          <template #status="{ row }">
            <t-tag :theme="getStatusTheme(row.status)" variant="light">
              {{ getStatusLabel(row.status) }}
            </t-tag>
          </template>

          <template #qiniuSuggestion="{ row }">
            <t-tag :theme="getQiniuTheme(row.qiniuSuggestion)" variant="light">
              {{ getQiniuLabel(row.qiniuSuggestion) }}
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
              <t-button theme="primary" size="small" @click="openEditDialog(row)">编辑</t-button>
              <t-button theme="danger" size="small" @click="openDeleteDialog([row.id])">删除</t-button>
            </t-space>
          </template>
        </t-table>
      </div>
    </div>

    <t-dialog
      v-model:visible="editDialogVisible"
      header="编辑友情链接"
      width="560px"
      :footer="false"
      destroy-on-close
    >
      <LinkEdit
        :data="editingRow"
        :status-options="statusOptions"
        @success="onEditSuccess"
        @cancel="closeEditDialog"
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
      确定删除选中的 {{ pendingDeleteIds.length }} 条友情链接吗？删除后无法恢复。
    </t-dialog>
  </div>
</template>

<style scoped lang="scss">
.link-list {
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

  .url-link {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
