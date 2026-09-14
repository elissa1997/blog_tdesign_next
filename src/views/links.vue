<script setup>
import {onMounted, ref} from "vue";
import { LinkIcon, JumpIcon } from 'tdesign-icons-vue-next';
import {listFront, add} from "@/network/links.js";
import {MessagePlugin} from "tdesign-vue-next";
import {getUrlHostname} from "@/util/tools.js";

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

        <div class="title">
          <div class="eng">Links</div>
          <div class="zh">友情链接</div>
        </div>

        <div class="linksList">
          <t-row :gutter="[16, 16]">
            <t-col
                :xs="{ offset: 0, span: 12 }"
                :sm="{ offset: 0, span: 12 }"
                :md="{ offset: 0, span: 4 }"
                :lg="{ offset: 0, span: 4 }"
                :xl="{ offset: 0, span: 4 }"
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

                <t-avatar v-else shape="round" size="50px"> {{item.name.substring(0,1)}} </t-avatar>

                <div class="text">
                  <div class="name">{{item.name}}</div>
                  <div class="domain">
                    <link-icon />
                    <span>{{getUrlHostname(item.url)}}</span>
                  </div>
                </div>
                <div class="linkIconWarp">
                  <jump-icon/>
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
          <div class="addTitle">申请友情链接</div>
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

    .title {
      margin: var(--td-comp-margin-xxl) var(--td-comp-margin-s) var(--td-comp-margin-s) var(--td-comp-margin-s);
      .eng {
        display: flex;
        align-items: center;
        color: var(--td-brand-color);
        margin-bottom: var(--td-comp-paddingTB-m);
      }
      .eng::before {
        content: " ";
        width: 4px;
        height: 16px;
        background-color: var(--td-brand-color);
        margin-right: 10px;
        display: inline-block;
      }
      .zh {
        font-size: var(--td-font-size-body-large);
        font-weight: bold;
        color: var(--td-text-color-primary);
      }
    }

    .linksList {
      padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-s);
      box-sizing: border-box;
      //max-height: 445px;
      //overflow-y: auto;
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
          $size: 50px;
          width: $size;
          height: $size;
          border-radius: var(--td-radius-medium);
          padding: var(--td-size-2);
          box-sizing: border-box;
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

          .domain {
            color: var(--td-text-color-placeholder);
            font-size: var(--td-font-size-link-medium);
            display: flex;
            align-items: center;
            // 自动省略
            span {
              width: calc(100% - 20px);
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
              margin-left: var(--td-size-2);
            }
          }
        }

        .linkIconWarp {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: var(--td-size-3);
          padding: var(--td-comp-paddingTB-xs);
          box-sizing: border-box;
          border: 1px solid var(--td-component-border);
          border-radius: var(--td-radius-medium);
        }
      }
    }

    .pagination-wrap {
      padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-s);
      box-sizing: border-box;
    }

    .linkAdd {
      margin: var(--td-comp-margin-l) var(--td-comp-margin-s) var(--td-comp-margin-l) var(--td-comp-margin-s);
      padding: var(--td-comp-paddingTB-xl) var(--td-comp-paddingLR-xl);
      box-sizing: border-box;
      overflow: hidden;
      border-radius: var(--td-radius-medium);
      background-color: var(--td-bg-color-container);
      box-shadow: var(--card-shadow);
      transition: box-shadow .2s ease, transform .2s ease;

      &:hover {
        box-shadow: var(--card-shadow-hover);
        transform: translateY(-2px);
      }

      .addTitle {
        font-size: var(--td-font-size-body-large);
        font-weight: bold;
        color: var(--td-brand-color);
        margin-bottom: var(--td-comp-paddingTB-l);
        display: flex;
        align-items: center;
      }

      .addTitle::before {
        content: " ";
        width: 4px;
        height: 16px;
        background-color: var(--td-brand-color);
        margin-right: 10px;
        display: inline-block;
      }

      .input {
        display: flex;
        gap: var(--td-size-6);
        margin-top: var(--td-comp-margin-l);

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
