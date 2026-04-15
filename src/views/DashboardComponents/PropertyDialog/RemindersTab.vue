<template>
  <div class="reminders-tab-container">
    <div class="reminders-header">
      <Button @click="$emit('open-reminder-dialog')"> Créer un rappel </Button>
    </div>
    <PropertyReminderList :property-id="store.selectedProperty?.id ?? 0" />
  </div>
</template>

<script setup lang="ts">
import PropertyReminderList from '../PropertyReminderList.vue';
import Button from '@/components/OwnReusableComponents/button/Button.vue';
import { usePropertyStore } from '@/stores/propertyHome';

defineEmits(['open-reminder-dialog']);

const store = usePropertyStore();
</script>

<style scoped>
.reminders-tab-container {
  display: flex;
  flex-direction: column;
  gap: var(--ion-space-4);
}
.reminders-header {
  display: flex;
  justify-content: flex-end;
}
</style>
