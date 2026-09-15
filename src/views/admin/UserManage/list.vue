<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { MessagePlugin } from 'tdesign-vue-next'
import UserEdit from './edit.vue'
import { del, detail, info, list as listUsers } from '@/network/user.js'
import { getDictOptionLabel } from '@/util/dict.js'
import { useDictStore } from '@/store/dict.js'
import { getCravatarUrl } from '@/util/tools.js'

const MIN_TABLE_HEIGHT = 168
const dictStore = useDictStore()

const searchData = ref(createEmptySearch())
const roleOptions = computed(() => dictStore.optionsByType('用户角色'))
const tableData = ref([])
const selectedRowKeys = ref([])
const loading = ref(false)
const tableHeight = ref(MIN_TABLE_HEIGHT)
const isHeightOverflowing = ref(false)
const currentUserId = ref(null)
const editDialogVisible = ref(false)
const editDialogType = ref('add')
const editingUser = ref({})
const editLoading = ref(false)
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
  { colKey: 'user', title: '用户', minWidth: 190, ellipsis: true },
  { colKey: 'email', title: '邮箱', minWidth: 220, ellipsis: true },
  { colKey: 'role', title: '角色', width: 100, align: 'center' },
  { colKey: 'createdAt', title: '创建时间', width: 160 },
  { colKey: 'updatedAt', title: '更新时间', width: 160 },
  { colKey: 'operation', title: '操作', width: 150, align: 'center', fixed: 'right' },
]

function createEmptySearch() {
  return {
    name: '',
    email: '',
    role: '',
  }
}

const isCurrentUser = (id) => String(id) === String(currentUserId.value)
const formatDate = (value) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
const getRoleLabel = (role) => getDictOptionLabel(roleOptions.value, role, '未知')
const getRoleTheme = (role) => role === '1' ? 'primary' : 'default'

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

  for (const key of ['name', 'email']) {
    const value = searchData.value[key].trim()
    if (value) search[key] = value
  }
  if (searchData.value.role !== '') search.role = searchData.value.role
  if (Object.keys(search).length > 0) params.search = JSON.stringify(search)

  return params
}

const getUserList = async () => {
  loading.value = true
  try {
    const response = await listUsers(getListParams())
    if (response?.status !== 200) {
      throw new Error(response?.msg || response?.message || '获取用户列表失败')
    }

    tableData.value = Array.isArray(response.data?.list) ? response.data.list : []
    pagination.value.total = Number(response.data?.total) || 0
  } catch (error) {
    tableData.value = []
    pagination.value.total = 0
    MessagePlugin.error(error?.message || '获取用户列表失败')
  } finally {
    loading.value = false
    void refreshTableHeight()
  }
}

const reloadList = async () => {
  await getUserList()
  const lastPage = Math.max(1, Math.ceil(pagination.value.total / pagination.value.pageSize))
  if (pagination.value.current > lastPage) {
    pagination.value.current = lastPage
    await getUserList()
  }
}

const loadCurrentUser = async () => {
  const response = await info()
  if (response?.status === 200) currentUserId.value = response.data?.id ?? null
}

const searchReset = () => {
  searchData.value = createEmptySearch()
  pagination.value.current = 1
  void getUserList()
}

const searchSubmit = () => {
  pagination.value.current = 1
  void getUserList()
}

const onPaginationChange = ({ current, pageSize }) => {
  pagination.value.current = current
  pagination.value.pageSize = pageSize
  void getUserList()
}

const openAddDialog = () => {
  editDialogType.value = 'add'
  editingUser.value = {}
  editDialogVisible.value = true
}

const openEditDialog = async (row) => {
  editLoading.value = true
  try {
    const response = await detail({ id: row.id })
    if (response?.status !== 200) {
      throw new Error(response?.msg || response?.message || '获取用户详情失败')
    }

    editDialogType.value = 'edit'
    editingUser.value = response.data || { ...row }
    editDialogVisible.value = true
  } catch (error) {
    MessagePlugin.error(error?.message || '获取用户详情失败')
  } finally {
    editLoading.value = false
  }
}

const closeEditDialog = () => {
  editDialogVisible.value = false
  editingUser.value = {}
}

const onEditSuccess = async () => {
  closeEditDialog()
  await reloadList()
  await loadCurrentUser()
}

const openDeleteDialog = (ids) => {
  const uniqueIds = [...new Set(ids)].filter((id) => !isCurrentUser(id))
  if (uniqueIds.length === 0) {
    MessagePlugin.warning('当前登录用户不能删除')
    return
  }

  pendingDeleteIds.value = uniqueIds
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    const response = await del({ id: pendingDeleteIds.value })
    if (response?.status !== 200) {
      throw new Error(response?.msg || response?.message || '删除用户失败')
    }

    const deletedIdSet = new Set(pendingDeleteIds.value.map(String))
    selectedRowKeys.value = selectedRowKeys.value.filter((id) => !deletedIdSet.has(String(id)))
    deleteDialogVisible.value = false
    pendingDeleteIds.value = []
    MessagePlugin.success('用户已删除')
    await reloadList()
  } catch (error) {
    MessagePlugin.error(error?.message || '删除用户失败')
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
  resizeFrameId = null
}

onMounted(async () => {
  await Promise.allSettled([loadCurrentUser(), getUserList()])
  await nextTick()
  startHeightObserver()
})

onBeforeUnmount(stopHeightObserver)
</script>

<template>
  <div ref="listRef" class="userList" :class="{ 'userList--overflowing': isHeightOverflowing }">
    <div ref="searchRef" class="search">
      <t-form
        :data="searchData"
        layout="inline"
        scroll-to-first-error="smooth"
        @reset="searchReset"
        @submit="searchSubmit"
      >
        <t-form-item label="用户名" name="name">
          <t-input v-model="searchData.name" placeholder="请输入用户名" />
        </t-form-item>

        <t-form-item label="邮箱" name="email">
          <t-input v-model="searchData.email" placeholder="请输入邮箱" />
        </t-form-item>

        <t-form-item label="角色" name="role">
          <t-select
            v-model="searchData.role"
            :options="roleOptions"
            placeholder="请选择角色"
            clearable
            @clear="searchData.role = ''"
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
          <t-button theme="primary" @click="openAddDialog">新增</t-button>
          <t-button
            theme="danger"
            variant="outline"
            :disabled="selectedRowKeys.length === 0"
            @click="openDeleteDialog(selectedRowKeys)"
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
          <template #user="{ row }">
            <div class="user-cell">
              <t-avatar :image="getCravatarUrl(row.email)" size="32px">
                {{ row.name?.slice(0, 1) }}
              </t-avatar>
              <span class="user-name" :title="row.name">{{ row.name }}</span>
              <t-tag v-if="isCurrentUser(row.id)" size="small" variant="outline">当前用户</t-tag>
            </div>
          </template>

          <template #role="{ row }">
            <t-tag :theme="getRoleTheme(row.role)" variant="light">
              {{ getRoleLabel(row.role) }}
            </t-tag>
          </template>

          <template #createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
          <template #updatedAt="{ row }">{{ formatDate(row.updatedAt) }}</template>

          <template #operation="{ row }">
            <t-space size="small">
              <t-button theme="primary" size="small" :loading="editLoading" @click="openEditDialog(row)">
                编辑
              </t-button>
              <t-button
                theme="danger"
                size="small"
                :disabled="isCurrentUser(row.id)"
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
      v-model:visible="editDialogVisible"
      :header="editDialogType === 'add' ? '新增用户' : '编辑用户'"
      width="540px"
      :footer="false"
      destroy-on-close
    >
      <UserEdit
        :type="editDialogType"
        :data="editingUser"
        :role-options="roleOptions"
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
      确定删除选中的 {{ pendingDeleteIds.length }} 个用户吗？删除后无法恢复。
    </t-dialog>
  </div>
</template>

<style scoped lang="scss">
.userList {
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

  .user-cell {
    display: flex;
    align-items: center;
    gap: var(--td-comp-margin-s);
    min-width: 0;
  }

  .user-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
