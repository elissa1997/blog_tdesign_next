<script setup>
import {
  LaptopIcon,
  LocationIcon,
  UserIcon,
} from 'tdesign-icons-vue-next'
import avatarImg from '@/assets/img/logo.png'

const profile = {
  avatar: avatarImg,
  nickname: 'Hydro',
  company: '某科技有限公司',
  role: '前端开发工程师',
  location: '中国',
  summary: '关注前端工程化、交互体验和可维护的业务系统建设，喜欢把复杂需求拆成稳定、清晰的产品界面。',
}
</script>

<template>
  <main class="about">
    <t-row>
      <t-col
        :xs="{ offset: 0, span: 12 }"
        :sm="{ offset: 0, span: 12 }"
        :md="{ offset: 2, span: 8 }"
        :lg="{ offset: 3, span: 6 }"
        :xl="{ offset: 3, span: 6 }"
      >
        <div class="about-wrap">
          <section class="profile-card panel">
            <div class="profile-main">
              <t-avatar :image="profile.avatar" size="96px" class="avatar" />
              <div class="profile-info">
                <div class="name-row">
                  <h1>{{ profile.nickname }}</h1>
                  <t-tag theme="primary" variant="light">ABOUT</t-tag>
                </div>
                <p class="summary">{{ profile.summary }}</p>
                <div class="profile-meta">
                  <span>
                    <laptop-icon />
                    {{ profile.company }}
                  </span>
                  <span>
                    <user-icon />
                    {{ profile.role }}
                  </span>
                  <span>
                    <location-icon />
                    {{ profile.location }}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </t-col>
    </t-row>
  </main>
</template>

<style scoped lang="scss">
.about {
  .about-wrap {
    padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-s);
    box-sizing: border-box;
  }

  .panel {
    overflow: hidden;
    border-radius: var(--td-radius-medium);
    background-color: var(--td-bg-color-container);
    box-shadow: var(--card-shadow);
    transition: box-shadow .2s ease, transform .2s ease;

    &:hover {
      box-shadow: var(--card-shadow-hover);
      transform: translateY(-2px);
    }
  }

  .panel {
    padding: var(--td-comp-paddingTB-xl) var(--td-comp-paddingLR-xl);
    box-sizing: border-box;
  }

  .profile-card {
    margin-bottom: var(--td-comp-margin-xl);
  }

  .profile-main {
    display: flex;
    align-items: center;
    gap: var(--td-comp-margin-xl);
  }

  .avatar {
    flex-shrink: 0;
    background-color: var(--td-bg-color-secondarycontainer);
    box-shadow: var(--card-shadow);
  }

  .profile-info {
    min-width: 0;
    flex: 1;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: var(--td-comp-margin-s);
    margin-bottom: var(--td-comp-margin-s);

    h1 {
      color: var(--td-text-color-primary);
      font: var(--td-font-headline-medium);
      margin: 0;
    }
  }

  .summary {
    color: var(--td-text-color-secondary);
    font: var(--td-font-body-medium);
    line-height: var(--td-line-height-body-medium);
    margin: 0 0 var(--td-comp-margin-l);
    overflow-wrap: anywhere;
  }

  .profile-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--td-comp-margin-s) var(--td-comp-margin-l);
    color: var(--td-text-color-secondary);
    font: var(--td-font-body-small);

    span {
      display: inline-flex;
      align-items: center;
      gap: var(--td-comp-margin-xs);
      min-width: 0;
    }
  }

  @include respond-to('phone') {
    .panel {
      padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-l);
    }

    .profile-main {
      flex-direction: column;
      align-items: stretch;
      text-align: left;
    }

    .avatar {
      align-self: flex-start;
    }
  }
}
</style>
