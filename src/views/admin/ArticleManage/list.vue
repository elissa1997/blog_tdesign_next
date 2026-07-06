<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { list as listArticles } from '@/network/article.js'
import { getDictOptions } from '@/util/dict.js'

const MIN_TABLE_HEIGHT = 168

// 页面状态
const searchData = ref({
  title: '',
  category: '',
  status: '',
})
const dictOptions = ref({
  category: [],
  status: [],
})
const tableData = ref([])
const selectedRowKeys = ref([])
const loading = ref(false)
const tableHeight = ref(168)
const isHeightOverflowing = ref(false)

const pagination = ref({
  current: 1,
  pageSize: 15,
  total: 0,
  pageSizeOptions: [15, 20, 50, 100],
})

// 动态高度计算所需的 DOM 引用
const articleListRef = ref(null)
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
  { colKey: 'title', title: '文章标题', ellipsis: true },
  { colKey: 'category', title: '分类', width: 100 },
  { colKey: 'status', title: '状态', width: 80, align: 'center' },
  { colKey: 'createdAt', title: '创建时间', width: 160 },
  { colKey: 'updatedAt', title: '更新时间', width: 160 },
  { colKey: 'operation', title: '操作', width: 160, align: 'center' },
]

const loadDictOptions = async () => {
  const [category, status] = await Promise.all([
    getDictOptions('文章类型'),
    getDictOptions('状态'),
  ])

  dictOptions.value = { category, status }
}

const getOptionLabel = (optionList, value, fallback = '-') => {
  return optionList.find((item) => item.value === value)?.label ?? fallback
}

const formatDate = (value) => {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

// 将 getComputedStyle 返回的字符串尺寸转换为数值
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
  const articleList = articleListRef.value
  const searchCard = searchRef.value
  const tableCard = tableCardRef.value
  const toolbar = tableToolbarRef.value
  const tableWrap = tableWrapRef.value

  if (!articleList || !searchCard || !tableCard || !toolbar || !tableWrap) return

  const articleStyles = getComputedStyle(articleList)
  const cardStyles = getComputedStyle(tableCard)
  const toolbarStyles = getComputedStyle(toolbar)
  const paginationElement = tableWrap.querySelector('.t-table__pagination')
  const paginationHeight = paginationElement?.getBoundingClientRect().height || 0

  observePagination(paginationElement)

  // TDesign 的 height 只控制表格内容区，分页高度需要从可用空间中单独扣除。
  const occupiedHeight = [
    readStylePixel(articleStyles, 'paddingTop'),
    readStylePixel(articleStyles, 'paddingBottom'),
    searchCard.getBoundingClientRect().height,
    readStylePixel(cardStyles, 'marginTop'),
    readStylePixel(cardStyles, 'paddingTop'),
    readStylePixel(cardStyles, 'paddingBottom'),
    toolbar.getBoundingClientRect().height,
    readStylePixel(toolbarStyles, 'marginBottom'),
    paginationHeight,
  ].reduce((total, height) => total + height, 0)

  const availableHeight = Math.floor(articleList.clientHeight - occupiedHeight)

  // 空间不足时保留 TDesign 加载态/空状态所需的最小高度，由页面容器负责滚动。
  isHeightOverflowing.value = availableHeight < MIN_TABLE_HEIGHT
  tableHeight.value = Math.max(MIN_TABLE_HEIGHT, availableHeight)
}

const scheduleTableHeightCalculation = () => {
  if (resizeFrameId !== null) {
    cancelAnimationFrame(resizeFrameId)
  }

  // ResizeObserver 可能在同一帧触发多次，统一到下一帧只计算一次。
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

  if (searchData.value.title.trim()) search.title = searchData.value.title.trim()
  if (searchData.value.category !== '') search.category = searchData.value.category
  if (searchData.value.status !== '') search.status = searchData.value.status

  // Apifox 定义要求筛选条件以 JSON 字符串形式放入 search 查询参数。
  if (Object.keys(search).length > 0) {
    params.search = JSON.stringify(search)
  }

  return params
}

const getArticleList = async () => {
  loading.value = true

  try {
    const res = await listArticles(getListParams())

    if (res?.status === 200) {
      tableData.value = Array.isArray(res.data?.list) ? res.data.list : []
      pagination.value.total = Number(res.data?.total) || 0
    }
  } finally {
    loading.value = false
    void refreshTableHeight()
  }
}

const searchReset = () => {
  searchData.value = {
    title: '',
    category: '',
    status: '',
  }
  pagination.value.current = 1
  void getArticleList()
}

const searchSubmit = () => {
  pagination.value.current = 1
  void getArticleList()
}

const onPaginationChange = ({ current, pageSize }) => {
  pagination.value.current = current
  pagination.value.pageSize = pageSize
  void getArticleList()
}

const onAdd = () => {
  // TODO: 预留新增文章事件
}

const onBatchDelete = () => {
  // TODO: 预留批量删除文章事件
}

const onEdit = (row) => {
  // TODO: 预留编辑文章事件
}

const onDelete = (row) => {
  // TODO: 预留删除文章事件
}

const startHeightObserver = () => {
  resizeObserver = new ResizeObserver(scheduleTableHeightCalculation)

  const observedElements = [
    articleListRef.value,
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
  await Promise.allSettled([
    loadDictOptions(),
    getArticleList(),
  ])

  await nextTick()

  startHeightObserver()
})

onBeforeUnmount(stopHeightObserver)
</script>

<template>
  <div
    ref="articleListRef"
    class="articleList"
    :class="{ 'articleList--overflowing': isHeightOverflowing }"
  >
    <div ref="searchRef" class="search">
      <t-form
        :data="searchData"
        layout="inline"
        scroll-to-first-error="smooth"
        @reset="searchReset"
        @submit="searchSubmit"
      >
        <t-form-item label="文章标题" name="title">
          <t-input v-model="searchData.title" placeholder="请输入文章标题" />
        </t-form-item>

        <t-form-item label="文章分类" name="category">
          <t-select
            v-model="searchData.category"
            :options="dictOptions.category"
            placeholder="请选择文章分类"
          />
        </t-form-item>

        <t-form-item label="文章状态" name="status">
          <t-select
            v-model="searchData.status"
            :options="dictOptions.status"
            placeholder="请选择文章状态"
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
          table-layout="fixed"
          bordered
          resizable
          @page-change="onPaginationChange"
        >
          <template #category="{ row }">
            {{ getOptionLabel(dictOptions.category, row.category, '未分类') }}
          </template>

          <template #status="{ row }">
            <t-tag :theme="row.status === 1 ? 'success' : 'default'" variant="light">
              {{ getOptionLabel(dictOptions.status, row.status) }}
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
              <t-button theme="primary" @click="onEdit(row)">编辑</t-button>
              <t-button theme="danger" @click="onDelete(row)">删除</t-button>
            </t-space>
          </template>
        </t-table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.articleList {
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
