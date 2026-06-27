import { instance_api } from '@/network/axios.js'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 100

/**
 * 按字典类型获取字典项。
 *
 * 对应后端 GET /dict/findbytype。
 *
 * @param {string} dictType 字典类型
 * @param {{ offset?: number, limits?: number }} [pagination] 分页参数
 * @returns {Promise<Array<{ id: number, dict_type: string, name: string, value: number }>>}
 */
export async function getDictItems(
  dictType,
  { offset = DEFAULT_PAGE, limits = DEFAULT_PAGE_SIZE } = {},
) {
  if (typeof dictType !== 'string' || !dictType.trim()) {
    throw new TypeError('dictType 必须是非空字符串')
  }

  const response = await instance_api({
    url: `${import.meta.env.VITE_APP_API}/dict/findbytype`,
    method: 'get',
    params: {
      dict_type: dictType.trim(),
      offset,
      limits,
    },
  })

  if (response?.status !== 200 || !Array.isArray(response?.data?.list)) {
    throw new Error(response?.msg || response?.message || '获取字典失败')
  }

  return response.data.list
}

/**
 * 将后端字典项转换为 TDesign Select 等组件可直接使用的选项。
 *
 * @param {Array<{ name: string, value: unknown }>} items 字典项
 * @returns {Array<{ label: string, value: unknown }>}
 */
export function toDictOptions(items = []) {
  if (!Array.isArray(items)) {
    throw new TypeError('items 必须是数组')
  }

  return items.map(({ name, value }) => ({
    label: name,
    value,
  }))
}

/**
 * 按字典类型获取组件选项。
 *
 * @param {string} dictType 字典类型
 * @param {{ offset?: number, limits?: number }} [pagination] 分页参数
 * @returns {Promise<Array<{ label: string, value: unknown }>>}
 */
export async function getDictOptions(dictType, pagination) {
  return toDictOptions(await getDictItems(dictType, pagination))
}

/**
 * 根据 value 获取字典名称。
 *
 * @param {Array<{ name: string, value: unknown }>} items 字典项
 * @param {unknown} value 字典值
 * @param {string} [fallback=''] 未匹配时返回值
 * @returns {string}
 */
export function getDictLabel(items, value, fallback = '') {
  if (!Array.isArray(items)) return fallback
  return items.find((item) => item.value === value)?.name ?? fallback
}

/**
 * 根据名称获取字典值。
 *
 * @param {Array<{ name: string, value: unknown }>} items 字典项
 * @param {string} label 字典名称
 * @param {unknown} [fallback] 未匹配时返回值
 * @returns {unknown}
 */
export function getDictValue(items, label, fallback) {
  if (!Array.isArray(items)) return fallback
  return items.find((item) => item.name === label)?.value ?? fallback
}
