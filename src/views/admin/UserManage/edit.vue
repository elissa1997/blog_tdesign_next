<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { add, update } from '@/network/user.js'

const props = defineProps({
  type: {
    type: String,
    default: 'add',
    validator: (value) => ['add', 'edit'].includes(value),
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  roleOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['success', 'cancel'])

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const formRef = ref(null)
const formData = ref(createEmptyForm())
const submitting = ref(false)

const isAdd = computed(() => props.type === 'add')
const passwordPlaceholder = computed(() => (
  isAdd.value ? '请输入 6–72 位密码' : '留空表示不修改密码'
))

const rules = computed(() => ({
  name: [
    { required: true, message: '请输入用户名', type: 'error' },
    { max: 191, message: '用户名不能超过 191 个字符', type: 'error' },
  ],
  email: [
    { required: true, message: '请输入邮箱', type: 'error' },
    { validator: (value) => EMAIL_PATTERN.test(value), message: '请输入有效的邮箱地址', type: 'error' },
    { max: 191, message: '邮箱不能超过 191 个字符', type: 'error' },
  ],
  password: [
    { required: isAdd.value, message: '请输入密码', type: 'error' },
    {
      validator: (value) => !value || (value.length >= 6 && value.length <= 72),
      message: '密码长度须为 6–72 位',
      type: 'error',
    },
  ],
  role: [{ required: true, message: '请选择用户角色', type: 'error' }],
}))

function createEmptyForm() {
  return {
    id: undefined,
    name: '',
    email: '',
    password: '',
    role: '',
  }
}

const resetForm = () => {
  const row = props.data || {}
  formData.value = {
    id: row.id,
    name: row.name ?? '',
    email: row.email ?? '',
    password: '',
    role: row.role ?? '',
  }

  void nextTick(() => formRef.value?.clearValidate?.())
}

const buildSubmitData = () => {
  const data = {
    name: formData.value.name.trim(),
    email: formData.value.email.trim(),
    role: formData.value.role,
  }
  const password = formData.value.password

  if (isAdd.value) {
    return { ...data, password }
  }

  const updateData = { id: formData.value.id, ...data }
  if (password) updateData.password = password
  return updateData
}

const onSubmit = async ({ validateResult }) => {
  if (validateResult !== true || submitting.value) return

  submitting.value = true
  try {
    const request = isAdd.value ? add : update
    const response = await request(buildSubmitData())

    if (response?.status !== 200) {
      throw new Error(response?.msg || response?.message || '保存用户失败')
    }

    MessagePlugin.success(isAdd.value ? '用户已新增' : '用户已更新')
    emit('success')
  } catch (error) {
    MessagePlugin.error(error?.message || '保存用户失败')
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
    label-width="82px"
    scroll-to-first-error="smooth"
    @submit="onSubmit"
  >
    <t-form-item label="用户名" name="name">
      <t-input v-model="formData.name" :maxlength="191" placeholder="请输入用户名" />
    </t-form-item>

    <t-form-item label="邮箱" name="email">
      <t-input v-model="formData.email" :maxlength="191" placeholder="name@example.com" />
    </t-form-item>

    <t-form-item label="密码" name="password">
      <t-input
        v-model="formData.password"
        type="password"
        :maxlength="72"
        :placeholder="passwordPlaceholder"
        clearable
      />
    </t-form-item>

    <t-form-item label="角色" name="role">
      <t-select
        v-model="formData.role"
        :options="roleOptions"
        placeholder="请选择用户角色"
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
