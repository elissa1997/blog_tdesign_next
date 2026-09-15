<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { add, detail, update } from '@/network/article.js'
import { useDictStore } from '@/store/dict.js'
import MarkdownPreview from '@/components/MarkdownPreview/index.vue'

const props = defineProps({
  type: {
    type: String,
    default: 'add',
    validator: (value) => ['add', 'edit'].includes(value),
  },
  id: {
    type: Number,
    default: undefined,
  },
})

const router = useRouter()
const dictStore = useDictStore()

const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const dictOptions = computed(() => ({
  category: dictStore.optionsByType('文章类型'),
  status: dictStore.optionsByType('状态'),
}))
const formData = ref(createEmptyForm())

const isEdit = computed(() => props.type === 'edit')
const pageTitle = computed(() => (isEdit.value ? '编辑文章' : '新增文章'))

const rules = {
  title: [{ required: true, message: '请输入文章标题', type: 'error' }],
  content: [{ required: true, message: '请输入文章内容', type: 'error' }],
}

function createEmptyForm() {
  return {
    id: undefined,
    title: '',
    cover: '',
    category: '',
    status: '1',
    content: '',
  }
}

const resetValidate = () => {
  void nextTick(() => {
    formRef.value?.clearValidate?.()
  })
}

const loadArticleDetail = async () => {
  if (!isEdit.value) {
    formData.value = createEmptyForm()
    resetValidate()
    return
  }

  if (!props.id) {
    MessagePlugin.error('缺少文章 ID')
    await router.replace({ name: 'Admin-Article-list' })
    return
  }

  loading.value = true
  try {
    const response = await detail({ a_id: props.id })

    if (response?.status !== 200 || !response.data) {
      throw new Error(response?.msg || response?.message || '获取文章详情失败')
    }

    const article = response.data
    formData.value = {
      id: article.id,
      title: article.title ?? '',
      cover: article.cover ?? '',
      category: article.category ?? '',
      status: article.status ?? '1',
      content: article.content ?? '',
    }
    resetValidate()
  } catch (error) {
    MessagePlugin.error(error?.message || '获取文章详情失败')
  } finally {
    loading.value = false
  }
}

const buildSubmitData = () => {
  const data = {
    title: formData.value.title.trim(),
    content: formData.value.content,
    cover: formData.value.cover.trim(),
    category: formData.value.category,
    status: formData.value.status,
  }

  if (isEdit.value) {
    data.a_id = formData.value.id || props.id
  }

  return data
}

const onSubmit = async ({ validateResult }) => {
  if (validateResult !== true || submitting.value) return

  submitting.value = true
  try {
    const request = isEdit.value ? update : add
    const response = await request(buildSubmitData())

    if (response?.status !== 200) {
      throw new Error(response?.msg || response?.message || '保存文章失败')
    }

    MessagePlugin.success(isEdit.value ? '文章已更新' : '文章已新增')
    await router.push({ name: 'Admin-Article-list' })
  } catch (error) {
    MessagePlugin.error(error?.message || '保存文章失败')
  } finally {
    submitting.value = false
  }
}

const onCancel = () => {
  router.push({ name: 'Admin-Article-list' })
}

watch(
  () => [props.type, props.id],
  loadArticleDetail,
)

onMounted(async () => {
  await loadArticleDetail()
})
</script>

<template>
  <div class="articleEdit">
    <div class="edit-card">
      <div class="edit-header">
        <h1>{{ pageTitle }}</h1>
        <t-button theme="default" variant="base" @click="onCancel">返回</t-button>
      </div>

      <t-loading :loading="loading" text="加载中">
        <t-form
          ref="formRef"
          :data="formData"
          :rules="rules"
          label-width="90px"
          scroll-to-first-error="smooth"
          @submit="onSubmit"
        >
          <div class="base-grid">
            <t-form-item label="标题" name="title">
              <t-input v-model="formData.title" placeholder="请输入文章标题" clearable />
            </t-form-item>

            <t-form-item label="分类" name="category">
              <t-select
                v-model="formData.category"
                :options="dictOptions.category"
                placeholder="请选择文章分类"
                clearable
                @clear="formData.category = ''"
              />
            </t-form-item>

            <t-form-item label="封面" name="cover">
              <t-input v-model="formData.cover" placeholder="请输入封面图片地址" clearable />
            </t-form-item>

            <t-form-item label="状态" name="status">
              <t-select
                v-model="formData.status"
                :options="dictOptions.status"
                placeholder="请选择文章状态"
              />
            </t-form-item>
          </div>

          <t-form-item label="内容" name="content">
            <div class="editor-layout">
              <t-textarea
                v-model="formData.content"
                class="markdown-input"
                placeholder="请输入 Markdown 内容"
              />

              <div class="preview-pane">
                <markdown-preview :content="formData.content" />
              </div>
            </div>
          </t-form-item>

          <t-form-item>
            <t-space>
              <t-button theme="primary" type="submit" :loading="submitting">保存</t-button>
              <t-button theme="default" variant="base" :disabled="submitting" @click="onCancel">
                取消
              </t-button>
            </t-space>
          </t-form-item>
        </t-form>
      </t-loading>
    </div>
  </div>
</template>

<style scoped lang="scss">
.articleEdit {
  height: 100%;
  padding: var(--td-comp-paddingTB-s) var(--td-comp-paddingLR-s);
  box-sizing: border-box;
  overflow: auto;

  .edit-card {
    min-height: 100%;
    padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-l);
    box-sizing: border-box;
    border-radius: var(--td-radius-medium);
    background-color: var(--td-bg-color-container);
  }

  .edit-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--td-comp-margin-l);

    h1 {
      margin: 0;
      color: var(--td-text-color-primary);
      font: var(--td-font-title-large);
    }
  }

  .base-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--td-comp-margin-xl);
  }

  .editor-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--td-comp-margin-l);
    width: 100%;
    min-height: 560px;
  }

  .markdown-input {
    height: 560px;

    :deep(textarea) {
      height: 100% !important;
      resize: none;
      font-family: Consolas, Monaco, 'Courier New', monospace;
      line-height: 1.7;
    }
  }

  .preview-pane {
    height: 560px;
    overflow: auto;
    border: 1px solid var(--td-component-border);
    border-radius: var(--td-radius-default);
    background-color: var(--td-bg-color-container);
  }
}
</style>
