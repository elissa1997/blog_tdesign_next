<script setup>
import CommentManageList from '@/components/admin/CommentManageList.vue'
import {
  adminList,
  del,
  updateStatus,
} from '@/network/otherComment.js'
</script>

<template>
  <CommentManageList
    kind="other"
    :list-request="adminList"
    :update-request="updateStatus"
    :delete-request="del"
  />
</template>
