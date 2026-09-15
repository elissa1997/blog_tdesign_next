<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { add, update } from '@/network/dict.js'

const props = defineProps({
  type: {
    type: String,
    default: 'add',
    validator: (value) => ['add', 'editItem', 'editType'].includes(value),
  },
  data: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['success', 'cancel'])

const formRef = ref(null)
const submitting = ref(false)
const formData = ref(createEmptyForm())

const isAdd = computed(() => props.type === 'add')
const isEditItem = computed(() => props.type === 'editItem')
const isEditType = computed(() => props.type === 'editType')
const submitText = computed(() => {
  if (isAdd.value) return '字典已新增'
  if (isEditType.value) return '字典类型已更新'
  return '字典已更新'
})

const rules = computed(() => {
  const baseRules = {
    update_dict_type: [{ required: true, message: '请输入字典类型', type: 'error' }],
  }

  if (isEditType.value) return baseRules

  return {
    ...baseRules,
    name: [{ required: true, message: '请输入字典名称', type: 'error' }],
    value: [{ required: true, message: '请输入字典值', type: 'error' }],
  }
})

function createEmptyForm() {
  return {
    id: undefined,
    dict_type: '',
    update_dict_type: '',
    name: '',
    value: '',
  }
}

const resetForm = () => {
  const row = props.data || {}
  const dictType = row.dict_type ?? ''

  formData.value = {
    id: row.id,
    dict_type: dictType,
    update_dict_type: dictType,
    name: row.name ?? '',
    value: row.value ?? '',
  }

  void nextTick(() => {
    formRef.value?.clearValidate?.()
  })
}

const buildSubmitData = () => {
  const value = formData.value.value.trim()

  if (isEditType.value) {
    return {
      dict_type: formData.value.dict_type.trim(),
      update_dict_type: formData.value.update_dict_type.trim(),
    }
  }

  if (isEditItem.value) {
    return {
      id: formData.value.id,
      dict_type: formData.value.dict_type.trim(),
      update_dict_type: formData.value.update_dict_type.trim(),
      name: formData.value.name.trim(),
      value,
    }
  }

  return {
    dict_type: formData.value.update_dict_type.trim(),
    name: formData.value.name.trim(),
    value,
  }
}

const onSubmit = async ({ validateResult }) => {
  if (validateResult !== true || submitting.value) return

  submitting.value = true
  try {
    const request = isAdd.value ? add : update
    const response = await request(buildSubmitData())

    if (response?.status !== 200) {
      throw new Error(response?.msg || response?.message || '保存字典失败')
    }

    MessagePlugin.success(submitText.value)
    emit('success')
  } catch (error) {
    MessagePlugin.error(error?.message || '保存字典失败')
  } finally {
    submitting.value = false
  }
}

watch(
  () => [props.type, props.data],
  resetForm,
  { immediate: true, deep: true },
)
</script>

<template>
  <t-form
    ref="formRef"
    :data="formData"
    :rules="rules"
    label-width="90px"
    scroll-to-first-error="smooth"
    @submit="onSubmit"
  >
    <t-form-item v-if="!isAdd" label="原字典类型" name="dict_type">
      <t-input v-model="formData.dict_type" disabled />
    </t-form-item>

    <t-form-item :label="isAdd ? '字典类型' : '新字典类型'" name="update_dict_type">
      <t-input v-model="formData.update_dict_type" placeholder="请输入字典类型" />
    </t-form-item>

    <t-form-item v-if="!isEditType" label="字典名称" name="name">
      <t-input v-model="formData.name" placeholder="请输入字典名称" />
    </t-form-item>

    <t-form-item v-if="!isEditType" label="字典值" name="value">
      <t-input
        v-model="formData.value"
        :maxlength="191"
        placeholder="请输入字典值"
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
