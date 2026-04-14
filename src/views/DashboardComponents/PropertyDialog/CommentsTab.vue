<template>
  <EMCard
    title="Commentaires sur la propriété"
    titleSize="S"
    :border="true"
    :noShadow="true"
  >
    <div class="comments-content">
      <el-input
        v-model="store.selectedProperty!.comment"
        type="textarea"
        :autosize="{ minRows: 6, maxRows: 12 }"
        placeholder="Ajoutez vos commentaires, observations, ou notes importantes sur cette propriété..."
        style="font-size: 16px; line-height: 1.6"
        show-word-limit
        maxlength="2000"
      />
      <div class="comment-help">
        💡 <strong>Conseil :</strong> Utilisez cette section pour noter des
        informations importantes comme l'état du bien, les travaux à prévoir,
        les négociations en cours, ou tout autre détail utile.
      </div>
    </div>
  </EMCard>
</template>

<script setup lang="ts">
import { ElInput } from 'element-plus';
import EMCard from '@/components/OwnReusableComponents/card/EMCard.vue';
import { usePropertyStore } from '@/stores/propertyHome';

const store = usePropertyStore();
</script>

<style scoped>
.comments-content {
  display: flex;
  flex-direction: column;
  gap: var(--ion-space-4);
}

.comment-help {
  padding: var(--ion-space-3);
  background-color: var(--ion-background-color-secondary);
  border-radius: var(--ion-radius-md);
  font-size: var(--ion-text-sm);
  color: var(--ion-text-color-secondary);
}
</style>
