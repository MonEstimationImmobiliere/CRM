<template>
  <EMCard :border="true" :noShadow="true">
    <EMInput
      v-model="owner"
      label="Propriétaire"
      placeholder="Nom du propriétaire"
      :clearInput="true"
    />

    <EMInput
      v-model="email"
      label="Mail"
      placeholder="email@exemple.com"
      type="email"
      :clearInput="true"
      :errorText="emailError"
      :showError="!!emailError"
    />

    <EMInput
      v-model="phone"
      label="Téléphone"
      placeholder="06 12 34 56 78"
      type="tel"
      :clearInput="true"
      placeholderColor="var(--ion-input-placeholder-color)"
      :errorText="phoneError"
      :showError="!!phoneError"
      @input="onPhoneInput"
    />
  </EMCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import EMInput from '@/components/OwnReusableComponents/input/EMInput.vue';
import EMCard from '@/components/OwnReusableComponents/card/EMCard.vue';
import { usePropertyStore } from '@/stores/propertyHome';

const store = usePropertyStore();

const owner = computed({
  get: () => store.selectedProperty?.owner ?? '',
  set: (v: string | number) => {
    if (store.selectedProperty) store.selectedProperty.owner = String(v);
  },
});

const email = computed({
  get: () => store.selectedProperty?.email ?? '',
  set: (v: string | number) => {
    if (store.selectedProperty)
      store.selectedProperty.email = String(v).toLowerCase().trim();
  },
});

const phone = computed({
  get: () => {
    const raw = store.selectedProperty?.phone ?? '';
    return String(raw)
      .replace(/\D/g, '')
      .replace(/(\d{2})(?=\d)/g, '$1 ');
  },
  set: (v: string | number) => {
    if (store.selectedProperty) {
      store.selectedProperty.phone = String(v)
        .replace(/\D/g, '')
        .substring(0, 10);
    }
  },
});

const emailError = computed(() => {
  const val = store.selectedProperty?.email;
  if (!val) return '';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(val) ? '' : 'Format email invalide';
});

const phoneError = computed(() => {
  const raw = String(store.selectedProperty?.phone ?? '').replace(/\D/g, '');
  if (!raw) return '';
  return raw.length === 10 ? '' : 'Le numéro doit contenir 10 chiffres';
});

const onPhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const digits = target.value.replace(/\D/g, '').substring(0, 10);
  if (store.selectedProperty) {
    store.selectedProperty.phone = digits;
  }
};
</script>

<style scoped>
.contact-fields {
  display: flex;
  flex-direction: column;
  gap: var(--ion-space-4, 1rem);
}

.form-field {
  width: 100%;
}
</style>
