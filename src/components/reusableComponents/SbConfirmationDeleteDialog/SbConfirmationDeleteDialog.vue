<template>
    <el-popconfirm
      width="220"
      :confirm-button-text=props.confirmButtonText
      :cancel-button-text=props.cancelButtonText
      :icon=props.icon
      :icon-color=props.iconColor
      :title=props.title
      @confirm="confirmEvent"
    @cancel="cancelEvent"
    >
      <template #reference>
    <svg style="width: 25px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" data-v-ea893728=""><path fill="currentColor" d="M352 159.872V230.4a352 352 0 1 0 320 0v-70.528A416.128 416.128 0 0 1 512 960a416 416 0 0 1-160-800.128z"></path><path fill="currentColor" d="M512 64q32 0 32 32v320q0 32-32 32t-32-32V96q0-32 32-32"></path></svg>
      </template>
    </el-popconfirm>
  </template>
  
  <script setup lang="ts">
  import { InfoFilled } from '@element-plus/icons-vue'
  import { SbTypography } from "../../index";



  const props = defineProps({
    title: {
      type: String,
      default: 'Confirmer la déconnexion?'
    },
    confirmButtonText: {
      type: String,
      default: 'OK'
    },
    cancelButtonText: {
      type: String,
      default: 'Annuler'
    },
    icon: {
      type: String,
      default: InfoFilled
    },
    iconColor: {
      type: String,
      default: '#626AEF'
    }
  })

const confirmEvent = () => {
  console.log('confirm!')
}
const cancelEvent = () => {
  console.log('cancel!')
}

  </script>
 
  