<script setup>
import {
  CodeIcon,
  LaptopIcon,
  LocationIcon,
  UserIcon,
} from 'tdesign-icons-vue-next'
import avatarImg from '@/assets/img/logo.png'
import coverOne from '@/assets/img/defaultCover/coverbg1.jpg'
import coverTwo from '@/assets/img/defaultCover/coverbg2.jpg'
import coverThree from '@/assets/img/defaultCover/coverbg3.jpg'
import { getImgUrl } from '@/util/tools.js'

const profile = {
  avatar: avatarImg,
  nickname: 'Hydro',
  company: '某科技有限公司',
  role: '前端开发工程师',
  location: '中国',
  summary: '关注前端工程化、交互体验和可维护的业务系统建设，喜欢把复杂需求拆成稳定、清晰的产品界面。',
}

const skills = [
  { name: 'Vue / Vite', percent: 90, color: 'var(--td-brand-color)', icon: getImgUrl('logo.png') },
  { name: 'JavaScript / TypeScript', percent: 86, color: 'var(--td-success-color)', icon: getImgUrl('logo.png') },
  { name: 'TDesign / UI 实现', percent: 82, color: 'var(--td-warning-color)', icon: getImgUrl('logo.png') },
  { name: 'Node.js / 接口联调', percent: 72, color: 'var(--td-brand-color)', icon: getImgUrl('logo.png') },
  { name: '工程化 / 性能优化', percent: 78, color: 'var(--td-success-color)', icon: getImgUrl('logo.png') },
]

const projects = [
  {
    name: '个人技术博客',
    image: coverOne,
    tags: ['Vue 3', 'TDesign', 'Markdown'],
    points: [
      '负责文章列表、详情阅读和评论交互的页面搭建',
      '接入 Markdown 渲染、代码高亮和分类字典展示',
      '统一响应式布局，在移动端保持稳定阅读体验',
    ],
  },
  {
    name: '后台内容管理系统',
    image: coverTwo,
    tags: ['Admin', 'CRUD', 'Auth'],
    points: [
      '实现文章、评论和字典等核心管理模块',
      '封装接口请求与权限守卫，减少页面重复逻辑',
      '优化表单编辑、分页列表和数据加载状态',
    ],
  },
  {
    name: '可视化展示页面',
    image: coverThree,
    tags: ['Data', 'Responsive', 'UX'],
    points: [
      '参与页面信息架构与组件拆分',
      '结合业务数据设计卡片、图表和状态提示',
      '兼顾桌面端展示密度与移动端触控体验',
    ],
  },
]
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

          <section class="skills-card panel">
            <div class="section-title">
              <code-icon />
              <h2>个人技能</h2>
            </div>
            <div class="skill-list">
              <div class="skill-item" v-for="skill in skills" :key="skill.name">
                <div class="skill-icon">
                  <img :src="skill.icon" :alt="`${skill.name}图标`">
                </div>
                <div class="skill-content">
                  <div class="skill-top">
                    <span>{{ skill.name }}</span>
                    <strong>{{ skill.percent }}%</strong>
                  </div>
                  <t-progress
                    :percentage="skill.percent"
                    :color="skill.color"
                    :label="false"
                    theme="line"
                    size="small"
                    track-color="var(--td-bg-color-secondarycontainer)"
                  />
                </div>
              </div>
            </div>
          </section>

          <section class="projects-section">
            <div class="section-title">
              <laptop-icon />
              <h2>项目经历</h2>
            </div>
            <div class="project-list">
              <article class="project-card" v-for="project in projects" :key="project.name">
                <img class="project-cover" :src="project.image" :alt="`${project.name}封面`">
                <div class="project-content">
                  <div class="project-head">
                    <h3>{{ project.name }}</h3>
                    <t-space size="small" break-line>
                      <t-tag
                        v-for="tag in project.tags"
                        :key="tag"
                        theme="primary"
                        variant="light"
                        size="small"
                      >
                        {{ tag }}
                      </t-tag>
                    </t-space>
                  </div>
                  <ul>
                    <li v-for="point in project.points" :key="point">{{ point }}</li>
                  </ul>
                </div>
              </article>
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

  .panel,
  .project-card {
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

  .profile-card,
  .skills-card,
  .projects-section {
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

  .section-title {
    display: flex;
    align-items: center;
    gap: var(--td-comp-margin-s);
    color: var(--td-text-color-primary);
    margin-bottom: var(--td-comp-margin-l);

    h2 {
      font: var(--td-font-title-medium);
      margin: 0;
    }
  }

  .skill-list {
    display: grid;
    gap: var(--td-comp-margin-l);
  }

  .skill-item {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    align-items: center;
    gap: var(--td-comp-margin-m);
    padding: var(--td-comp-paddingTB-m) var(--td-comp-paddingLR-m);
    border: 1px solid var(--td-component-border);
    border-radius: var(--td-radius-medium);
    background-color: var(--td-bg-color-secondarycontainer);
  }

  .skill-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;

    img {
      display: block;
      width: 24px;
      height: 24px;
      object-fit: contain;
    }
  }

  .skill-content {
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .skill-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--td-comp-margin-m);
    color: var(--td-text-color-primary);
    font: var(--td-font-body-medium);
    margin-bottom: var(--td-comp-margin-s);

    span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    strong {
      flex-shrink: 0;
      color: var(--td-text-color-secondary);
      font: var(--td-font-body-small);
    }
  }

  .project-list {
    display: grid;
    gap: var(--td-comp-margin-xl);
    align-items: stretch;
    grid-auto-rows: 1fr;
  }

  .project-card {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .project-cover {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }

  .project-content {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-l);
    box-sizing: border-box;
  }

  .project-head {
    display: flex;
    flex-direction: column;
    gap: var(--td-comp-margin-s);
    margin-bottom: var(--td-comp-margin-m);

    h3 {
      color: var(--td-text-color-primary);
      font: var(--td-font-title-medium);
      margin: 0;
      overflow-wrap: anywhere;
    }
  }

  ul {
    margin: 0;
    padding-left: 1.2em;
    color: var(--td-text-color-secondary);
    font: var(--td-font-body-medium);
    line-height: var(--td-line-height-body-medium);
  }

  li:not(:last-child) {
    margin-bottom: var(--td-comp-margin-s);
  }

  @include respond-to('desktop') {
    .skill-list,
    .project-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
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

    .skill-list,
    .project-list {
      grid-template-columns: minmax(0, 1fr);
    }

    .project-list {
      grid-auto-rows: auto;
    }

    .skill-item {
      grid-template-columns: 36px minmax(0, 1fr);
      padding: var(--td-comp-paddingTB-s) var(--td-comp-paddingLR-s);
    }

    .skill-icon {
      width: 36px;
      height: 36px;
    }
  }
}
</style>
