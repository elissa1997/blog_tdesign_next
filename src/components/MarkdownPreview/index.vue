<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import 'katex/dist/katex.min.css'
import { renderMarkdown } from './markdownRenderer.js'

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['error'])

const renderedContent = ref('')
const loading = ref(true)
const renderError = ref(null)

let renderTimer
let renderVersion = 0

async function updatePreview(version) {
  try {
    const html = await renderMarkdown(props.content)

    if (version !== renderVersion) return

    renderedContent.value = html
    renderError.value = null
  } catch (error) {
    if (version !== renderVersion) return

    const normalizedError = error instanceof Error
      ? error
      : new Error('Markdown 渲染失败')

    renderError.value = normalizedError
    emit('error', normalizedError)
  } finally {
    if (version === renderVersion) {
      loading.value = false
    }
  }
}

function scheduleRender() {
  window.clearTimeout(renderTimer)
  const version = ++renderVersion

  renderTimer = window.setTimeout(() => {
    updatePreview(version)
  }, 100)
}

watch(() => props.content, scheduleRender, { immediate: true })

onBeforeUnmount(() => {
  window.clearTimeout(renderTimer)
  renderVersion += 1
})
</script>

<template>
  <div class="markdown-preview">
    <div v-if="loading" class="markdown-preview__status" role="status">
      正在渲染 Markdown…
    </div>

    <div v-else-if="renderError" class="markdown-preview__error" role="alert">
      <p>Markdown 预览渲染失败，已保留原始内容。</p>
      <pre>{{ content }}</pre>
    </div>

    <div
      v-else
      class="markdown-preview__content"
      v-html="renderedContent"
    />
  </div>
</template>

<style scoped lang="scss">
.markdown-preview {
  min-width: 0;
  color: var(--td-text-color-primary);
  font: var(--td-font-body-medium);
  line-height: 1.75;
  overflow-wrap: anywhere;

  &__status,
  &__error {
    padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-l);
    border-radius: var(--td-radius-medium);
    background: var(--td-bg-color-secondarycontainer);
    color: var(--td-text-color-secondary);
  }

  &__error {
    color: var(--td-error-color);

    p {
      margin: 0 0 var(--td-comp-margin-m);
    }

    pre {
      max-height: 24rem;
      margin: 0;
      padding: var(--td-comp-paddingTB-m) var(--td-comp-paddingLR-m);
      overflow: auto;
      border-radius: var(--td-radius-default);
      background: var(--td-bg-color-container);
      color: var(--td-text-color-primary);
      white-space: pre-wrap;
    }
  }

  :deep(.markdown-preview__content > :first-child) {
    margin-top: 0;
  }

  :deep(.markdown-preview__content > :last-child) {
    margin-bottom: 0;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 1.6em 0 .65em;
    color: var(--td-text-color-primary);
    font-weight: 600;
    line-height: 1.35;
  }

  :deep(h1) {
    padding-bottom: .3em;
    border-bottom: 1px solid var(--td-component-border);
    font-size: 2em;
  }

  :deep(h2) {
    padding-bottom: .25em;
    border-bottom: 1px solid var(--td-component-border);
    font-size: 1.55em;
  }

  :deep(h3) {
    font-size: 1.3em;
  }

  :deep(h4) {
    font-size: 1.15em;
  }

  :deep(p),
  :deep(ul),
  :deep(ol),
  :deep(blockquote),
  :deep(table),
  :deep(.shiki),
  :deep(.katex-block) {
    margin: 0 0 1em;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 2em;
  }

  :deep(li + li) {
    margin-top: .25em;
  }

  :deep(blockquote) {
    padding: .25em 1em;
    border-left: 4px solid var(--td-brand-color);
    background: var(--td-bg-color-secondarycontainer);
    color: var(--td-text-color-secondary);
  }

  :deep(blockquote > :last-child) {
    margin-bottom: 0;
  }

  :deep(a) {
    color: var(--td-brand-color);
    text-decoration: none;
  }

  :deep(a:hover) {
    text-decoration: underline;
  }

  :deep(img) {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 1em auto;
    border-radius: var(--td-radius-medium);
  }

  :deep(hr) {
    height: 1px;
    margin: 1.5em 0;
    border: 0;
    background: var(--td-component-border);
  }

  :deep(table) {
    display: block;
    max-width: 100%;
    overflow-x: auto;
    border-spacing: 0;
    border-collapse: collapse;
  }

  :deep(th),
  :deep(td) {
    padding: .55em .8em;
    border: 1px solid var(--td-component-border);
    text-align: left;
    white-space: nowrap;
  }

  :deep(th) {
    background: var(--td-bg-color-secondarycontainer);
    font-weight: 600;
  }

  :deep(code) {
    border-radius: var(--td-radius-small);
    font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
    font-size: .9em;
  }

  :deep(:not(pre) > code) {
    padding: .15em .4em;
    background: var(--td-bg-color-secondarycontainer);
    color: var(--td-error-color);
  }

  :deep(.shiki) {
    padding: 1em;
    overflow-x: auto;
    border: 1px solid var(--td-component-border);
    border-radius: var(--td-radius-medium);
    background-color: var(--shiki-light-bg);
  }

  :deep(.shiki span) {
    color: var(--shiki-light);
  }

  :deep(.katex-display),
  :deep(.katex-block) {
    overflow-x: auto;
    overflow-y: hidden;
  }

  :deep(.katex-error) {
    color: var(--td-error-color);
  }
}

@media (prefers-color-scheme: dark) {
  .markdown-preview {
    :deep(.shiki) {
      background-color: var(--shiki-dark-bg);
    }

    :deep(.shiki span) {
      color: var(--shiki-dark);
    }
  }
}
</style>
