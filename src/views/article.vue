<script setup>
import { detail } from '@/network/article.js'
import {onMounted, ref} from "vue";
import {useRoute} from "vue-router";
import {getImgUrl} from "@/util/tools.js";

const route = useRoute()

const articleDetail = ref({})

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

onMounted(() => {
  getDetail()
})
</script>

<template>
  <div class="article">
    <t-row>
      <t-col
          :xs="{ offset: 0, span: 12 }"
          :sm="{ offset: 0, span: 12 }"
          :md="{ offset: 2, span: 8 }"
          :lg="{ offset: 4, span: 4 }"
          :xl="{ offset: 4, span: 4 }"
      >

        <div class="articleWarp">
          <img
            class="cover"
            :src="articleDetail.cover || getImgUrl(`defaultCover/coverbg${Math.floor(Math.random() * 3) + 1}.jpg`)"
            :alt="`${articleDetail.title}封面`"
          >
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

    .cover {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
  }
}
</style>