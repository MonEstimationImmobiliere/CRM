<template>
  <ElResult title="404" sub-title="Sorry, request error">
    <template #icon>
      <ElImage src="https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png" />
    </template>
    <template #extra>
      <ElButton  type="none">
        <RouterLink to="/" >Back Home</RouterLink>
      </ElButton>
    </template>
  </ElResult>
</template>

<script setup>
import { ElResult, ElImage, ElButton } from 'element-plus'
</script>
