<script setup>
import {onMounted, ref} from "vue";
import { LinkIcon } from 'tdesign-icons-vue-next';
import {listFront, add} from "@/network/links.js";
import {MessagePlugin} from "tdesign-vue-next";

const links = ref({
  data:[],
  loading:false,
  pagination: {
    current: 1,
    pageSize: 16,
    total: 0,
    pageSizeOptions: [16, 32, 64],
  }
})

const getLinksList = async () => {
  links.value.loading = true
  let params = {
    offset: links.value.pagination.current,
    limits: links.value.pagination.pageSize
  }
  await listFront(params).then(res => {
    if (res && res.status === 200) {
      links.value.data = res.data.list.map(item => {
        return {
          ...item,
          faviconError: false
        }
      })
      links.value.pagination.total = res.data.total
    }
  })
  links.value.loading = false
}

const faviconError = (item) => {
  item.faviconError = true
}

const linksPaginationChange = (current, pageSize) => {
  links.value.pagination.current = current.current
  links.value.pagination.pageSize = current.pageSize
  getLinksList()
}


const addLinkData = ref({
  name: "",
  url: "",
})

const addLinkSubmit = () => {
  add(addLinkData.value).then(res => {
    if (res && res.status === 200) {
      MessagePlugin.success('添加成功，请等待管理员审核')
      addLinkReset()
      getLinksList()
    }else{
      MessagePlugin.error(res.msg || '添加失败')
    }
  })
}

 const addLinkReset = () => {
  addLinkData.value.name = ""
  addLinkData.value.url = ""
}

onMounted(() => {
  getLinksList()
})

</script>

<template>
  <div class="links">
    <t-row>
      <t-col
          :xs="{ offset: 0, span: 12 }"
          :sm="{ offset: 0, span: 12 }"
          :md="{ offset: 2, span: 8 }"
          :lg="{ offset: 3, span: 6 }"
          :xl="{ offset: 3, span: 6 }"
      >

        <div class="linksList">
          <t-row :gutter="[16, 16]">
            <t-col
                :xs="{ offset: 0, span: 6 }"
                :sm="{ offset: 0, span: 6 }"
                :md="{ offset: 0, span: 4 }"
                :lg="{ offset: 0, span: 3 }"
                :xl="{ offset: 0, span: 3 }"
                v-for="item in links.data"
                :key="item.id"
            >

              <div class="linksItem">
                <img
                  class="linksIcon"
                  v-if="!item.faviconError"
                  :src="item.url+'favicon.ico'" alt=""
                  @error="() => faviconError(item)"
                >

                <t-avatar v-else size="40px"> {{item.name.substring(0,1)}} </t-avatar>

                <div class="text">
                  <div class="name">{{item.name}}</div>
                  <t-link theme="primary" :href="item.url" target="_self">
                    <template #prefix-icon>
                      <link-icon />
                    </template>
                    传送门
                  </t-link>
                </div>
              </div>
            </t-col>
          </t-row>
        </div>

        <div v-if="links.pagination.total > 0" class="pagination-wrap">
          <t-pagination
              v-model="links.pagination.current"
              v-model:page-size="links.pagination.pageSize"
              :total="links.pagination.total"
              :page-size-options="links.pagination.pageSizeOptions"
              :show-jumper="false"
              @change="linksPaginationChange"
          />
        </div>

        <div class="linkAdd">

          <t-alert theme="warning">
            <template #message>添加友情链接有频率限制，请勿频繁提交</template>
          </t-alert>

          <div class="input">
            <t-input v-model="addLinkData.name" placeholder="站点名称"></t-input>
            <t-input v-model="addLinkData.url" placeholder="站点url"></t-input>
            <t-button theme="primary" @click="addLinkSubmit">提交</t-button>
          </div>


        </div>

      </t-col>
    </t-row>
  </div>
</template>

<style scoped lang="scss">
  .links {
    .linksList {
      padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-s);
      box-sizing: border-box;
      max-height: 445px;
      overflow-y: auto;
      .linksItem {
        padding: var(--td-comp-paddingTB-xl) var(--td-comp-paddingLR-xl);
        box-sizing: border-box;
        overflow: hidden;
        border-radius: var(--td-radius-medium);
        background-color: var(--td-bg-color-container);
        box-shadow: var(--card-shadow);
        transition: box-shadow .2s ease, transform .2s ease;

        display: flex;
        align-items: center;
        &:hover {
          box-shadow: var(--card-shadow-hover);
          transform: translateY(-2px);
        }

        .linksIcon {
          $size: 40px;
          width: $size;
          height: $size;
          border-radius: 50%;
          box-shadow: 0 0 8px var(--td-brand-color-4);
        }

        .text {
          flex: 1;          // 占满剩余宽度
          min-width: 0;     // 允许收缩
          overflow: hidden; // 辅助收缩
          margin-left: var(--td-comp-paddingLR-xl);
          .name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: var(--td-font-size-body-large);
            font-weight: bold;
            color: var(--td-text-color-primary);
            margin-bottom: var(--td-comp-paddingTB-xs);


          }
        }
      }
    }

    .pagination-wrap {
      padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-s);
      box-sizing: border-box;
    }

    .linkAdd {
      padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-s);
      box-sizing: border-box;

      margin-top: var(--td-comp-margin-l);

      .input {
        display: flex;
        gap: var(--td-size-6);

        padding: var(--td-comp-paddingTB-xl) var(--td-comp-paddingLR-xl);
        box-sizing: border-box;
        overflow: hidden;
        border-radius: var(--td-radius-medium);
        background-color: var(--td-bg-color-container);
        box-shadow: var(--card-shadow);
        transition: box-shadow .2s ease, transform .2s ease;

        margin-top: var(--td-comp-margin-l);


        &:hover {
          box-shadow: var(--card-shadow-hover);
          transform: translateY(-2px);
        }

        @include respond-to('desktop') {
          align-items: center;
          flex-direction: row;
        }
        @include respond-to('phone') {
          flex-direction: column;
          align-items: stretch;
        }

      }
    }
  }
</style>