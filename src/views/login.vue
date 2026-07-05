<script setup>
import { bingPic } from '@/network/thirdParty.js'
import {onMounted, ref} from "vue";
import { login } from '@/network/user.js'
import { setToken } from '@/util/auth.js'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'

const bingPicObj = ref({})
const route = useRoute()
const router = useRouter()
const submitting = ref(false)
const getBingPic = () => {
  let params = {
    format: "js",
    idx: "0",
    n: "1",
    nc: "1614319565639",
    pid: "hp",
    FORM: "BEHPTB",
    uhd: "0"
  };
  bingPic(params).then(res => {
    if (res) {
      bingPicObj.value = res.images[0];
      bingPicObj.value['fullUrl'] = import.meta.env.VITE_PROXY_BING + bingPicObj.value.url
    }
  })
}

const loginObj = ref({
  username: '',
  password: ''
})

const getRedirectPath = () => {
  const redirect = route.query.redirect

  return typeof redirect === 'string'
    && redirect.startsWith('/')
    && !redirect.startsWith('//')
    ? redirect
    : '/admin'
}

const handleLogin = async () => {
  const name = loginObj.value.username.trim()
  const password = loginObj.value.password

  if (!name || !password) {
    MessagePlugin.warning('请输入用户名和密码')
    return
  }

  submitting.value = true

  try {
    const response = await login({ name, password })
    const token = response?.data?.token

    if (response?.status !== 200 || !token) {
      MessagePlugin.error(response?.msg || '登录失败，请检查用户名和密码')
      return
    }

    setToken(token)
    MessagePlugin.success('登录成功')
    await router.replace(getRedirectPath())
  } catch (error) {
    MessagePlugin.error(error?.message || '登录失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const clearLogin = () => {
  loginObj.value.username = ''
  loginObj.value.password = ''
}


onMounted(() => {
  getBingPic()
})
</script>

<template>
  <div class="login">
    <t-row>
      <t-col
          :xs="{ offset: 0, span: 12 }"
          :sm="{ offset: 0, span: 12 }"
          :md="{ offset: 2, span: 8 }"
          :lg="{ offset: 3, span: 6 }"
          :xl="{ offset: 3, span: 6 }"
      >
        <div class="loginWarp">
          <div class="bingpic">
            <img :src="bingPicObj.fullUrl" alt=""></img>
            <div class="text">{{bingPicObj.copyright}}</div>
          </div>
          <div class="login">
            <t-space direction="vertical" :size="20" class="formWarp">

              <div class="title">后台登录</div>

              <t-input v-model="loginObj.username"  placeholder="请输入用户名" style="width: 100%"/>

              <t-input v-model="loginObj.password" type="password" placeholder="请输入密码" style="width: 100%"/>

              <t-space :size="20">
                <t-button :loading="submitting" :disabled="submitting" @click="handleLogin">确定</t-button>
                <t-button theme="default" :disabled="submitting" @click="clearLogin">清空</t-button>
              </t-space>

            </t-space>
          </div>
        </div>
      </t-col>
    </t-row>
  </div>
</template>

<style scoped lang="scss">
  .login {

    :deep(.t-space-item) {
      width: 100%;
    }

    padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-s);
    box-sizing: border-box;

    .loginWarp {
      box-shadow: var(--card-shadow);
      border-radius: var(--td-radius-medium);
      margin-top: 100px;

      @include respond-to('desktop') {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .bingpic {
          width: 50%;
          height: 400px;
          img {
            border-bottom-left-radius: var(--td-radius-medium);
            border-top-left-radius: var(--td-radius-medium);
          }

        }
        .login {
          width: 50%;
          height: 400px;
          border-bottom-right-radius: var(--td-radius-medium);
          border-top-right-radius: var(--td-radius-medium);
        }
      }
      @include respond-to('phone') {

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        .bingpic {
          width: 100%;
          height: 100px;
          img {
            border-top-left-radius: var(--td-radius-medium);
            border-top-right-radius: var(--td-radius-medium);
          }

        }

        .login {
          width: 100%;
          height: 300px;
          border-bottom-left-radius: var(--td-radius-medium);
          border-bottom-right-radius: var(--td-radius-medium);
        }

      }

      .bingpic {
        display: flow-root;
        position: relative;
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .text {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          padding: var(--td-comp-paddingTB-s) var(--td-comp-paddingLR-s);
          box-sizing: border-box;
          font-size: 10px;
          color: #fff;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.5), rgb(0 0 0 / 0));
        }
      }

      .login {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--td-bg-color-container);

        .formWarp {
          width: 80%;
          .title {
            font: var(--td-font-title-medium);
            color: var(--td-brand-color);
          }
        }
      }

    }

  }
</style>
