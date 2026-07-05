<script setup>
import dayjs from 'dayjs'
import { getCravatarUrl } from '@/util/tools.js'

defineOptions({
  name: 'CommentItem',
})

defineProps({
  comment: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['reply'])

const formatDate = date => dayjs(date).format('YYYY-MM-DD HH:mm')
const getSafeUrl = value => /^https?:\/\/[^\s]+$/i.test(value || '') ? value : ''
const reply = comment => emit('reply', comment)
</script>

<template>
  <t-comment :datetime="formatDate(comment.createdAt)">
    <template #author>
      <a
        v-if="getSafeUrl(comment.url)"
        class="comment-author-link"
        :href="getSafeUrl(comment.url)"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ comment.user_name }}
      </a>
      <span v-else>{{ comment.user_name }}</span>
    </template>

    <template #avatar>
      <t-avatar
        :image="getCravatarUrl(comment.email)"
        :alt="comment.user_name || '评论者头像'"
      />
    </template>

    <template #content>
      <p class="comment-text">{{ comment.text }}</p>
    </template>

    <template #actions>
      <span class="reply-action" @click="reply(comment)">回复</span>
    </template>

    <template v-if="comment.children?.length" #reply>
      <comment-item
        v-for="child in comment.children"
        :key="child.id"
        :comment="child"
        @reply="reply"
      />
    </template>
  </t-comment>
</template>

<style scoped lang="scss">
.comment-author-link {
  color: inherit;
  text-decoration: none;

  &:hover {
    color: var(--td-brand-color);
  }
}

.comment-text {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.reply-action {
  cursor: pointer;
}

:deep(.t-comment__content) {
  min-width: 0;
}

:deep(.t-comment__reply) {
  margin-left: var(--td-comp-margin-l);
}

@include respond-to('phone') {
  :deep(.t-comment__reply) {
    margin-left: var(--td-comp-margin-s);
  }
}
</style>
