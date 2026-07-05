<script setup>
import { nextTick, reactive, ref, watch } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { add, list } from '@/network/comment.js'
import { buildTree } from '@/util/tools.js'
import CommentItem from './CommentItem.vue'

const props = defineProps({
  articleId: {
    type: [Number, String],
    required: true,
  },
})

const formRef = ref()
const formElementRef = ref()
const contentRef = ref()
const comments = ref([])
const loading = ref(false)
const submitting = ref(false)
const loadError = ref('')
const replyTarget = ref(null)
let requestSequence = 0

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const formData = reactive({
  user_name: '',
  email: '',
  url: '',
  text: '',
})

const formRules = {
  user_name: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    {
      validator: value => Boolean(value?.trim()),
      message: '昵称不能只包含空格',
      trigger: 'blur',
    },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { email: true, message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  url: [
    {
      validator: value => !value || /^https?:\/\/[^\s]+$/i.test(value),
      message: '请输入以 http:// 或 https:// 开头的 URL',
      trigger: 'blur',
    },
  ],
  text: [
    { required: true, message: '请输入评论内容', trigger: 'blur' },
    {
      validator: value => Boolean(value?.trim()),
      message: '评论内容不能只包含空格',
      trigger: 'blur',
    },
  ],
}

const validArticleId = () => {
  const id = Number(props.articleId)
  return Number.isInteger(id) && id > 0 ? id : null
}

const loadComments = async () => {
  const articleId = validArticleId()
  const sequence = ++requestSequence

  if (!articleId) {
    comments.value = []
    pagination.total = 0
    loadError.value = '无效的文章 ID'
    return
  }

  loading.value = true
  loadError.value = ''

  try {
    const res = await list({
      a_id: articleId,
      offset: pagination.current,
      limits: pagination.pageSize,
    })

    if (sequence !== requestSequence) return

    if (res?.status !== 200 || !res.data) {
      throw new Error(res?.msg || res?.message || '评论加载失败')
    }

    comments.value = buildTree(res.data.list)
    pagination.total = Number(res.data.total) || 0
  } catch (error) {
    if (sequence !== requestSequence) return
    comments.value = []
    pagination.total = 0
    loadError.value = error?.message || '评论加载失败'
    MessagePlugin.error(loadError.value)
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

const focusContent = async () => {
  await nextTick()
  formElementRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  contentRef.value?.focus?.()
}

const selectReply = comment => {
  replyTarget.value = comment
  focusContent()
}

const cancelReply = () => {
  replyTarget.value = null
}

const submitComment = async ({ validateResult }) => {
  if (validateResult !== true || submitting.value) return

  const articleId = validArticleId()
  if (!articleId) {
    MessagePlugin.error('无效的文章 ID')
    return
  }

  submitting.value = true
  const isReply = Boolean(replyTarget.value)
  const payload = {
    a_id: articleId,
    parent_id: replyTarget.value?.id || 0,
    is_regist: 0,
    user_name: formData.user_name.trim(),
    email: formData.email.trim(),
    text: formData.text.trim(),
  }

  if (formData.url.trim()) payload.url = formData.url.trim()

  try {
    const res = await add(payload)
    if (res?.status !== 200 || res?.data !== true) {
      throw new Error(res?.msg || res?.message || '评论发布失败')
    }

    formData.text = ''
    replyTarget.value = null
    formRef.value?.clearValidate?.(['text'])
    if (!isReply) pagination.current = 1
    await loadComments()
    MessagePlugin.success('评论发布成功')
  } catch (error) {
    MessagePlugin.error(error?.message || '评论发布失败')
  } finally {
    submitting.value = false
  }
}

const onPaginationChange = ({ current, pageSize }) => {
  pagination.current = current
  pagination.pageSize = pageSize
  loadComments()
}

watch(
  () => props.articleId,
  () => {
    pagination.current = 1
    replyTarget.value = null
    loadComments()
  },
  { immediate: true },
)
</script>

<template>
  <section class="article-comment">
    <div ref="formElementRef" class="comment-form-wrap">
      <h2 class="section-title">发表评论</h2>

      <t-form
        ref="formRef"
        :data="formData"
        :rules="formRules"
        label-align="top"
        @submit="submitComment"
      >
        <div class="visitor-fields">
          <t-form-item label="昵称" name="user_name">
            <t-input v-model="formData.user_name" placeholder="请输入昵称" clearable />
          </t-form-item>
          <t-form-item label="邮箱" name="email">
            <t-input v-model="formData.email" placeholder="请输入邮箱" clearable />
          </t-form-item>
          <t-form-item label="URL（可选）" name="url">
            <t-input v-model="formData.url" placeholder="https://example.com" clearable />
          </t-form-item>
        </div>

        <t-form-item label="评论内容" name="text">
          <div class="content-field">
            <t-textarea
              ref="contentRef"
              v-model="formData.text"
              placeholder="请输入评论内容"
              :autosize="{ minRows: 4, maxRows: 10 }"
            />
            <div v-if="replyTarget" class="reply-target">
              <span>回复 @{{ replyTarget.user_name }}</span>
              <t-button type="button" variant="text" size="small" @click="cancelReply">
                取消回复
              </t-button>
            </div>
          </div>
        </t-form-item>

        <t-form-item>
          <t-button theme="primary" type="submit" :loading="submitting">
            发布评论
          </t-button>
        </t-form-item>
      </t-form>
    </div>

    <div class="comment-list-wrap">
      <h2 class="section-title">
        评论
        <span v-if="pagination.total" class="comment-total">（{{ pagination.total }}）</span>
      </h2>

      <div v-if="loading" class="loading-state">
        <t-loading text="评论加载中..." />
      </div>

      <t-alert v-else-if="loadError" theme="error" :message="loadError">
        <template #operation>
          <t-button variant="text" size="small" @click="loadComments">重新加载</t-button>
        </template>
      </t-alert>

      <template v-else-if="comments.length">
        <div class="comment-list">
          <comment-item
            v-for="comment in comments"
            :key="comment.id"
            :comment="comment"
            @reply="selectReply"
          />
        </div>

        <div v-if="pagination.total > pagination.pageSize" class="pagination-wrap">
          <t-pagination
            v-model="pagination.current"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-size-options="[10, 20, 30]"
            :show-jumper="false"
            @change="onPaginationChange"
          />
        </div>
      </template>

      <t-empty v-else description="暂无评论，来发表第一条评论吧" />
    </div>
  </section>
</template>

<style scoped lang="scss">
.article-comment {
  width: 100%;
  box-sizing: border-box;
  color: var(--td-text-color-primary);
}

.comment-form-wrap,
.comment-list-wrap {
  width: 100%;
  padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-l);
  box-sizing: border-box;
  background: var(--td-bg-color-container);
}

.comment-list-wrap {
  margin-top: var(--td-comp-margin-xl);
}

.section-title {
  margin: 0 0 var(--td-comp-margin-l);
  font: var(--td-font-title-medium);
}

.comment-total {
  color: var(--td-text-color-secondary);
  font: var(--td-font-body-medium);
}

.visitor-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--td-comp-margin-l);
}

.content-field {
  width: 100%;
}

.reply-target {
  display: flex;
  align-items: center;
  gap: var(--td-comp-margin-xs);
  min-height: 32px;
  color: var(--td-text-color-secondary);
  font: var(--td-font-body-small);
}

.loading-state {
  display: flex;
  justify-content: center;
  min-height: 120px;
  padding-top: var(--td-comp-paddingTB-xxl);
  box-sizing: border-box;
}

.comment-list {
  min-width: 0;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: var(--td-comp-margin-xl);
}

@include respond-to('phone') {
  .comment-form-wrap,
  .comment-list-wrap {
    padding: var(--td-comp-paddingTB-m) var(--td-comp-paddingLR-m);
  }

  .visitor-fields {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .pagination-wrap {
    overflow-x: auto;
    justify-content: flex-start;
  }
}
</style>
