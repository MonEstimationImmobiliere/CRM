<template>
  <PropertyReminderList :property-id="store.selectedProperty?.id ?? 0" />
</template>

<script setup lang="ts">
import PropertyReminderList from '../PropertyReminderList.vue';
import { usePropertyStore } from '@/stores/propertyHome';

const store = usePropertyStore();
</script>
