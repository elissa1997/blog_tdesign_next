import { defineStore } from 'pinia'
import { list as listDicts } from '@/network/dict.js'

const PAGE_SIZE = 100

let loadingPromise = null

const readPage = async (offset) => {
  const response = await listDicts({ offset, limits: PAGE_SIZE })
  if (response?.status !== 200 || !Array.isArray(response.data?.list)) {
    throw new Error(response?.msg || response?.message || '获取字典列表失败')
  }
  return response.data
}

export const useDictStore = defineStore('dict', {
  state: () => ({
    items: [],
    loaded: false,
  }),

  getters: {
    optionsByType: (state) => (dictType) => state.items
      .filter((item) => item.dict_type === dictType)
      .map((item) => ({ label: item.name, value: item.value })),
  },

  actions: {
    async load(force = false) {
      if (this.loaded && !force) return this.items
      if (loadingPromise) {
        if (!force) return loadingPromise
        await loadingPromise
      }

      const currentPromise = (async () => {
        const firstPage = await readPage(1)
        const total = Number(firstPage.total) || firstPage.list.length
        const pageCount = Math.ceil(total / PAGE_SIZE)
        const remainingPages = await Promise.all(
          Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => readPage(index + 2)),
        )

        this.items = [firstPage, ...remainingPages].flatMap((page) => page.list)
        this.loaded = true
        return this.items
      })()
      loadingPromise = currentPromise

      try {
        return await currentPromise
      } finally {
        if (loadingPromise === currentPromise) loadingPromise = null
      }
    },
  },
})
