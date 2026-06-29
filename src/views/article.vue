<script setup>
import { detail } from '@/network/article.js'
import {onMounted, ref} from "vue";
import {useRoute} from "vue-router";
import {getImgUrl} from "@/util/tools.js";
import dayjs from "dayjs";
import { CalendarIcon, FolderIcon } from 'tdesign-icons-vue-next'
import {getDictItems, getDictLabel} from "../util/dict.js";
import markdownPreview from "@/components/MarkdownPreview/index.vue";

const route = useRoute()
const formatDate = (date) => dayjs(date).format('YYYY-MM-DD')
const getCategoryName = (value) => getDictLabel(categoryDict.value, value, '未分类')

const articleDetail = ref({})
const categoryDict = ref([])

const getDetail = () => {

  let params = {
    a_id: route.query.id
  }
  detail(params).then(res => {
    if (res && res.status === 200) {
      articleDetail.value = res.data
    }
  })
}

onMounted(async () => {
  const [, dictResult] = await Promise.allSettled([
    getDetail(),
    getDictItems('文章类型'),
  ])
  if (dictResult.status === 'fulfilled') {
    categoryDict.value = dictResult.value
  }
})
</script>

<template>
  <div class="article">
    <t-row>
      <t-col
          :xs="{ offset: 0, span: 12 }"
          :sm="{ offset: 0, span: 12 }"
          :md="{ offset: 2, span: 8 }"
          :lg="{ offset: 3, span: 6 }"
          :xl="{ offset: 3, span: 6 }"
      >

        <div class="articleWarp">
          <div class="coverWarp">
            <img
              class="cover"
              :src="articleDetail.cover || getImgUrl(`defaultCover/coverbg${Math.floor(Math.random() * 3) + 1}.jpg`)"
              :alt="`${articleDetail.title}封面`"
            >

            <div class="header">
              <h1 class="title">{{ articleDetail.title }}</h1>
              <t-space class="meta" align="center" size="small" break-line>
                <t-tag variant="light" theme="primary">
                  <template #icon><folder-icon /></template>
                  {{ getCategoryName(articleDetail.category) }}
                </t-tag>

                <span class="date">
                  <calendar-icon />
                  <time :datetime="articleDetail.createdAt">{{ formatDate(articleDetail.createdAt) }}</time>
                </span>
              </t-space>
            </div>
          </div>
          <div class="content">
            <markdown-preview :content="articleDetail.content" />
          </div>
        </div>

      </t-col>
    </t-row>
  </div>
</template>

<style scoped lang="scss">
.article {
  .articleWarp {
    padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-s);
    box-sizing: border-box;

    .coverWarp {
      width: 100%;
      height: 200px;
      position: relative;
      .cover {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .header {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-l);
        box-sizing: border-box;

        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: flex-start;

        background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 90%);
        .title {
          font: var(--td-font-title-medium);
          margin: 0 0 var(--td-comp-margin-s);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #ffffff;
        }

        .meta {
          color: var(--td-text-color-secondary);
          font: var(--td-font-body-small);
          margin-bottom: var(--td-comp-margin-m);
          .date {
            display: inline-flex;
            align-items: center;
            gap: var(--td-comp-margin-xs);
            color: #eaeaea;
          }
        }


      }
    }

    .content {
      padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-l);
      box-sizing: border-box;
      background-color: var(--td-bg-color-container);
    }
  }
}
</style>
