<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { MessagePlugin } from 'tdesign-vue-next'
import { getDictOptionLabel } from '@/util/dict.js'
import { useDictStore } from '@/store/dict.js'

const props = defineProps({
  listRequest: {
    type: Function,
    required: true,
  },
  updateRequest: {
    type: Function,
    required: true,
  },
  deleteRequest: {
    type: Function,
    required: true,
  },
})

const MIN_TABLE_HEIGHT = 168
const dictStore = useDictStore()

const searchData = ref(createEmptySearch())
const statusOptions = computed(() => dictStore.optionsByType('状态'))
const qiniuOptions = computed(() => dictStore.optionsByType('七牛审核结果'))
const tableData = ref([])
const selectedRowKeys = ref([])
const loading = ref(false)
const updatingIds = ref([])
const deleteDialogVisible = ref(false)
const deleting = ref(false)
const pendingDeleteIds = ref([])
const tableHeight = ref(MIN_TABLE_HEIGHT)
const isHeightOverflowing = ref(false)

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

const columns = computed(() => [
  { colKey: 'row-select', type: 'multiple', width: 50 },
  { colKey: 'id', title: 'ID', width: 70 },
  { colKey: 'a_id', title: '文章 ID', width: 90, align: 'center' },
  { colKey: 'user_name', title: '评论人', width: 120, ellipsis: true },
  { colKey: 'email', title: '邮箱', width: 180, ellipsis: true },
  { colKey: 'text', title: '评论内容', minWidth: 240, ellipsis: true },
  { colKey: 'status', title: '状态', width: 130, align: 'center' },
  { colKey: 'qiniuSuggestion', title: '内容审核', width: 110, align: 'center' },
  { colKey: 'createdAt', title: '创建时间', width: 160 },
  { colKey: 'operation', title: '操作', width: 220, align: 'center', fixed: 'right' },
])

function createEmptySearch() {
  return {
    target: '',
    status: '',
    user_name: '',
    email: '',
    text: '',
    qiniuSuggestion: '',
  }
}

const formatDate = (value) => {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

const isSameStatus = (left, right) => left === right

const getStatusLabel = (status) => {
  return getDictOptionLabel(statusOptions.value, status, '未知')
}

const getStatusTheme = (status) => {
  return status === '1' ? 'success' : 'default'
}

const getQiniuLabel = (suggestion) => {
  return getDictOptionLabel(qiniuOptions.value, suggestion, '未知')
}

const getQiniuTheme = (suggestion) => ({
  pass: 'success',
  review: 'warning',
  block: 'danger',
}[suggestion] || 'default')

const getAvailableStatusOptions = (status) => {
  return statusOptions.value.filter((item) => !isSameStatus(item.value, status))
}

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
  if (searchData.value.target !== '') search.a_id = Number(searchData.value.target)
  if (searchData.value.status !== '') search.status = searchData.value.status
  if (searchData.value.qiniuSuggestion !== '') {
    search.qiniuSuggestion = searchData.value.qiniuSuggestion
  }
  for (const key of ['user_name', 'email', 'text']) {
    const value = searchData.value[key].trim()
    if (value) search[key] = value
  }
  if (Object.keys(search).length > 0) params.search = JSON.stringify(search)

  return params
}

const getList = async () => {
  loading.value = true
  try {
    const response = await props.listRequest(getListParams())
    if (response?.status !== 200) {
      throw new Error(response?.msg || response?.message || '获取评论列表失败')
    }
    tableData.value = Array.isArray(response.data?.list) ? response.data.list : []
    pagination.value.total = Number(response.data?.total) || 0
  } catch (error) {
    tableData.value = []
    pagination.value.total = 0
    MessagePlugin.error(error?.message || '获取评论列表失败')
  } finally {
    loading.value = false
    void refreshTableHeight()
  }
}

const searchReset = () => {
  searchData.value = createEmptySearch()
  pagination.value.current = 1
  void getList()
}

const searchSubmit = () => {
  pagination.value.current = 1
  void getList()
}

const onPaginationChange = ({ current, pageSize }) => {
  pagination.value.current = current
  pagination.value.pageSize = pageSize
  void getList()
}

const onStatusChange = async (row, status) => {
  const previousStatus = row.status
  if (isSameStatus(status, previousStatus) || updatingIds.value.includes(row.id)) return

  row.status = status
  updatingIds.value.push(row.id)
  try {
    const response = await props.updateRequest({ id: row.id, status })
    if (response?.status !== 200) {
      throw new Error(response?.msg || response?.message || '更新评论状态失败')
    }
    MessagePlugin.success('评论状态已更新')
  } catch (error) {
    row.status = previousStatus
    MessagePlugin.error(error?.message || '更新评论状态失败')
  } finally {
    updatingIds.value = updatingIds.value.filter((id) => id !== row.id)
  }
}

const openDeleteDialog = (ids) => {
  pendingDeleteIds.value = [...ids]
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    const response = await props.deleteRequest({ id: pendingDeleteIds.value })
    if (response?.status !== 200) {
      throw new Error(response?.msg || response?.message || '删除评论失败')
    }
    selectedRowKeys.value = selectedRowKeys.value.filter(
      (id) => !pendingDeleteIds.value.includes(id),
    )
    deleteDialogVisible.value = false
    MessagePlugin.success('评论已删除')
    if (tableData.value.length === pendingDeleteIds.value.length && pagination.value.current > 1) {
      pagination.value.current -= 1
    }
    await getList()
  } catch (error) {
    MessagePlugin.error(error?.message || '删除评论失败')
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
  if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId)
}

onMounted(async () => {
  await getList()
  await nextTick()
  startHeightObserver()
})

onBeforeUnmount(stopHeightObserver)
</script>

<template>
  <div
    ref="listRef"
    class="comment-list"
    :class="{ 'comment-list--overflowing': isHeightOverflowing }"
  >
    <div ref="searchRef" class="search">
      <t-form
        :data="searchData"
        layout="inline"
        scroll-to-first-error="smooth"
        @reset="searchReset"
        @submit="searchSubmit"
      >
        <t-form-item label="文章 ID" name="target">
          <t-input-number
            v-model="searchData.target"
            :min="0"
            :decimal-places="0"
            placeholder="请输入文章 ID"
          />
        </t-form-item>
        <t-form-item label="评论人" name="user_name">
          <t-input v-model="searchData.user_name" placeholder="请输入评论人" />
        </t-form-item>
        <t-form-item label="邮箱" name="email">
          <t-input v-model="searchData.email" placeholder="请输入邮箱" />
        </t-form-item>
        <t-form-item label="评论内容" name="text">
          <t-input v-model="searchData.text" placeholder="请输入评论内容" />
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
          <template #operation="{ row }">
            <t-space size="small">
              <t-button
                v-for="option in getAvailableStatusOptions(row.status)"
                :key="option.value"
                :theme="option.value === '1' ? 'success' : 'default'"
                size="small"
                :loading="updatingIds.includes(row.id)"
                :disabled="updatingIds.includes(row.id)"
                @click="onStatusChange(row, option.value)"
              >
                {{ option.label }}
              </t-button>
              <t-button
                theme="danger"
                size="small"
                :disabled="updatingIds.includes(row.id)"
                @click="openDeleteDialog([row.id])"
              >
                删除
              </t-button>
            </t-space>
          </template>
        </t-table>
      </div>
    </div>

    <t-dialog
      v-model:visible="deleteDialogVisible"
      header="确认删除"
      :confirm-btn="{ content: '删除', theme: 'danger', loading: deleting }"
      :close-on-overlay-click="!deleting"
      :close-on-esc-keydown="!deleting"
      @confirm="confirmDelete"
    >
      确定删除选中的 {{ pendingDeleteIds.length }} 条评论吗？删除后无法恢复。
    </t-dialog>
  </div>
</template>

<style scoped lang="scss">
.comment-list {
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
