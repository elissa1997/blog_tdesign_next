<script setup>
import CommentManageList from '@/components/admin/CommentManageList.vue'
import {
  adminList,
  del,
  updateStatus,
} from '@/network/comment.js'
</script>

<template>
  <CommentManageList
    :list-request="adminList"
    :update-request="updateStatus"
    :delete-request="del"
  />
</template>
