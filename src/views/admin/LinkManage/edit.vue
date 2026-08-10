<script setup>
import { nextTick, ref, watch } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { update } from '@/network/links.js'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  statusOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['success', 'cancel'])

const formRef = ref(null)
const submitting = ref(false)
const formData = ref(createEmptyForm())

const isHttpUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

const rules = {
  name: [{ required: true, message: '请输入站点名称', type: 'error' }],
  url: [
    { required: true, message: '请输入站点 URL', type: 'error' },
    { validator: isHttpUrl, message: '请输入以 http:// 或 https:// 开头的有效 URL', type: 'error' },
  ],
  status: [{ required: true, message: '请选择状态', type: 'error' }],
  sort: [{ required: true, message: '请输入排序值', type: 'error' }],
}

function createEmptyForm() {
  return {
    id: undefined,
    name: '',
    url: '',
    status: '',
    sort: 0,
  }
}

const resetForm = () => {
  const row = props.data || {}

  formData.value = {
    id: row.id,
    name: row.name ?? '',
    url: row.url ?? '',
    status: row.status ?? '',
    sort: Number(row.sort) || 0,
  }

  void nextTick(() => formRef.value?.clearValidate?.())
}

const onSubmit = async ({ validateResult }) => {
  if (validateResult !== true || submitting.value) return

  submitting.value = true
  try {
    const response = await update({
      id: formData.value.id,
      name: formData.value.name.trim(),
      url: formData.value.url.trim(),
      status: formData.value.status,
      sort: Number(formData.value.sort),
    })

    if (response?.status !== 200) {
      throw new Error(response?.msg || response?.message || '保存友情链接失败')
    }

    MessagePlugin.success('友情链接已更新')
    emit('success')
  } catch (error) {
    MessagePlugin.error(error?.message || '保存友情链接失败')
  } finally {
    submitting.value = false
  }
}

watch(() => props.data, resetForm, { immediate: true, deep: true })
</script>

<template>
  <t-form
    ref="formRef"
    :data="formData"
    :rules="rules"
    label-width="88px"
    scroll-to-first-error="smooth"
    @submit="onSubmit"
  >
    <t-form-item label="站点名称" name="name">
      <t-input v-model="formData.name" placeholder="请输入站点名称" />
    </t-form-item>

    <t-form-item label="站点 URL" name="url">
      <t-input v-model="formData.url" placeholder="https://example.com/" />
    </t-form-item>

    <t-form-item label="状态" name="status">
      <t-select
        v-model="formData.status"
        :options="statusOptions"
        placeholder="请选择状态"
      />
    </t-form-item>

    <t-form-item label="排序" name="sort">
      <t-input-number
        v-model="formData.sort"
        :decimal-places="0"
        placeholder="数值越大排序越靠前"
        style="width: 100%"
      />
    </t-form-item>

    <t-form-item>
      <t-space>
        <t-button theme="primary" type="submit" :loading="submitting">保存</t-button>
        <t-button theme="default" variant="base" :disabled="submitting" @click="emit('cancel')">
          取消
        </t-button>
      </t-space>
    </t-form-item>
  </t-form>
</template>
