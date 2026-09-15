<script setup>
import {useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref} from "vue";
import { MessagePlugin } from 'tdesign-vue-next'
import { useDictStore } from '@/store/dict.js'

const router = useRouter()
const route = useRoute()
const dictStore = useDictStore()

const navList = ref([])
const getNavList = () => {
  navList.value = router.getRoutes().filter(item => item.path.includes('/admin/')).filter(item2 => item2.meta && item2.meta.label)
}

const activeNavName = computed(() => {
  const active = route.meta.active
  return Array.isArray(active) ? active[1] : undefined
})

const menuClick = (item) => {
  router.push(item.path)
}

onMounted(async () => {
  getNavList()
  try {
    await dictStore.load()
  } catch (error) {
    MessagePlugin.error(error?.message || '获取字典列表失败')
  }
})
</script>

<template>
  <div class="adminIndex">
    <div class="sideNav">
      <div
        class="navItem" :class="{ active: activeNavName && item.meta.active?.[1] === activeNavName }"
        v-for="item in navList" :key="item.path"
        @click="menuClick(item)"
      >
        {{ item.meta.label }}
      </div>
    </div>
    <router-view class="adminContent"/>
  </div>

  <div class="mobileTip">
    <img src="@/assets/img/mobileTip.webp" alt="后台管理使用电脑端访问">
    <div class="text">
      后台管理使用电脑端访问
    </div>
  </div>
</template>

<style scoped lang="scss">







  .adminIndex {
    @include respond-to('phone') {
      display: none;
    }
    @include respond-to('desktop') {
      width: 100%;
      height: calc(100vh - $nav-height);
      display: flex;
      align-items: center;
      justify-content: space-between;

      .sideNav {
        width: 200px;
        height: 100%;
        background-color: var(--nav-bg);
        padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-l);
        box-sizing: border-box;

        .navItem {
          transition: all .3s ease-in-out;
          color: var(--td-text-color-primary);
          padding: var(--td-comp-paddingTB-s) var(--td-comp-paddingLR-l);
          box-sizing: border-box;
          width: 100%;
          border-radius: var(--td-radius-default);
          cursor: pointer;
        }

        .navItem:not(:last-of-type) {
          margin-bottom: 10px;
        }

        .navItem:hover {
          color: var(--nav-item-font-color);
          background-color: var(--nav-item-bg);
        }

        .navItem.active {
          color: var(--nav-item-font-color);
          background-color: var(--nav-item-bg);
        }
      }

      .adminContent {
        width: calc(100% - 200px);
        height: 100%;
        //background-color: #ffffff;
      }
    }
  }

  .mobileTip {
    @include respond-to('phone') {
      margin-top: var(--td-comp-margin-xxl);
      width: calc(100% - var(--td-comp-paddingLR-xl));
      margin-left: auto;
      margin-right: auto;
      padding: var(--td-comp-paddingTB-s) var(--td-comp-paddingLR-s);
      box-sizing: border-box;
      border-radius: var(--td-radius-medium);
      background-color: var(--td-bg-color-container);
      box-shadow: var(--card-shadow);

      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;

      img {
        width: 70%;
        height: auto;
        object-fit: contain;
      }

      .text {
        font-size: var(--td-font-size-medium);
        color: var(--td-text-color-primary);
        text-align: center;
        margin-top: var(--td-comp-margin-xl);
      }
    }

    @include respond-to('desktop') {
      display: none;
    }
  }

</style>
