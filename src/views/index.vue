<script setup>
import { onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { CalendarIcon, FolderIcon } from 'tdesign-icons-vue-next'
import { list } from '@/network/article.js'
import { getDictItems, getDictLabel } from '@/util/dict.js'
import { stripMarkdown } from '@/util/tools.js'

const defaultCoverModules = import.meta.glob(
  '../assets/img/defaultCover/*.jpg',
  { eager: true, query: '?url', import: 'default' }
)
const defaultCovers = Object.values(defaultCoverModules)
const getDefaultCover = (id) => defaultCovers[Math.abs(Number(id) || 0) % defaultCovers.length]
const formatDate = (date) => dayjs(date).format('YYYY-MM-DD')
const getPreview = (content) => stripMarkdown(content)
const getCategoryName = (value) => getDictLabel(categoryDict.value, value, '未分类')

const pagination = ref({
  offset: 1,
  limits: 5,
  total: 0,
  limitsOptions: [5, 10, 15, 20],
})

const articleList = ref([])
const categoryDict = ref([])
const loading = ref(true)

const getArticleList = async () => {
  loading.value = true

  const params = {
    offset: pagination.value.offset,
    limits: pagination.value.limits
  }

  try {
    const res = await list(params)
    if (res && res.status === 200) {
      articleList.value = res.data.list
      pagination.value.total = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const onPaginationChange = ({ current, pageSize }) => {
  pagination.value.offset = current
  pagination.value.limits = pageSize
  getArticleList()
}

onMounted(async () => {
  const [, dictResult] = await Promise.allSettled([
    getArticleList(),
    getDictItems('文章类型'),
  ])

  if (dictResult.status === 'fulfilled') {
    categoryDict.value = dictResult.value
  }
})
</script>

<template>
  <div class="index">
    <t-row>
      <t-col
          :xs="{ offset: 0, span: 12 }"
          :sm="{ offset: 0, span: 12 }"
          :md="{ offset: 2, span: 8 }"
          :lg="{ offset: 4, span: 4 }"
          :xl="{ offset: 4, span: 4 }"
      >
        <div class="cardWarp">
          <template v-if="loading">
            <t-card v-for="index in pagination.limits" :key="index" class="card skeleton-card">
              <t-skeleton animation="gradient" :row-col="[[{ width: '34%' }], [{ width: '100%' }], [{ width: '82%' }]]" />
            </t-card>
          </template>

          <template v-else-if="articleList.length > 0">
            <article class="card" v-for="item in articleList" :key="item.id">
              <img
                  class="cover"
                  :src="item.cover || getDefaultCover(item.id)"
                  :alt="`${item.title}封面`"
              >
              <div class="card-content">
                <h2 class="title">{{ item.title }}</h2>
                <t-space class="meta" size="small" break-line>
                  <t-tag variant="light" theme="primary">
                    <template #icon><folder-icon /></template>
                    {{ getCategoryName(item.category) }}
                  </t-tag>
                  <span class="date">
                    <calendar-icon />
                    <time :datetime="item.createdAt">{{ formatDate(item.createdAt) }}</time>
                  </span>
                </t-space>
                <p class="preview">{{ getPreview(item.content) }}</p>
              </div>
            </article>
          </template>

          <t-empty v-else description="暂无文章" />
        </div>

        <div v-if="pagination.total > 0" class="pagination-wrap">
          <t-pagination
              v-model="pagination.offset"
              v-model:page-size="pagination.limits"
              :total="pagination.total"
              :page-size-options="pagination.limitsOptions"
              :show-jumper="false"
              @change="onPaginationChange"
          />
        </div>
      </t-col>
    </t-row>
  </div>
</template>

<style scoped lang="scss">
.index {
  .cardWarp {
    padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-s);
    box-sizing: border-box;
    .card {
      display: flex;
      overflow: hidden;
      border-radius: var(--td-radius-medium);
      background-color: var(--td-bg-color-container);
      box-shadow: var(--card-shadow);
      height: 200px;
      width: 100%;
      transition: box-shadow .2s ease, transform .2s ease;

      &:hover {
        box-shadow: var(--card-shadow-hover);
        transform: translateY(-2px);
      }

      .cover {
        width: 38%;
        flex-shrink: 0;
        height: 100%;
        object-fit: cover;
      }

      .card-content {
        min-width: 0;
        padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-l);
        box-sizing: border-box;
      }

      .title {
        color: var(--td-text-color-primary);
        font: var(--td-font-title-medium);
        margin: 0 0 var(--td-comp-margin-s);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .meta {
        color: var(--td-text-color-secondary);
        font: var(--td-font-body-small);
        margin-bottom: var(--td-comp-margin-m);
      }

      .date {
        display: inline-flex;
        align-items: center;
        gap: var(--td-comp-margin-xs);
      }

      .preview {
        display: -webkit-box;
        overflow: hidden;
        color: var(--td-text-color-secondary);
        font: var(--td-font-body-medium);
        line-height: var(--td-line-height-body-medium);
        margin: 0;
        overflow-wrap: anywhere;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
      }
    }

    .card:not(:last-of-type) {
      margin-bottom: var(--td-comp-margin-xl);
    }

    .skeleton-card {
      display: block;
      height: auto;
      min-height: 160px;
    }

    @include respond-to('phone') {
      .card {
        flex-direction: column;
        height: auto;

        .cover {
          width: 100%;
          height: 170px;
        }

        .card-content {
          padding: var(--td-comp-paddingTB-m) var(--td-comp-paddingLR-m);
        }
      }
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
    padding: 0 var(--td-comp-paddingLR-s) var(--td-comp-paddingTB-xxl);
    box-sizing: border-box;
  }
}
</style>
