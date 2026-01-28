<template>
  <div class="floating-label-wrapper">
    <DynamicLabelUI
      v-model="displayValue"
      text="Ville"
      color="#aaa"
      activeColor="#409EFF"
    >
      <el-autocomplete
        id="autocomplete"
        size="large"
        v-model="displayValue"
        :fetch-suggestions="queryCities"
        :debounce="400"
        :suffix-icon="Search"
        clearable
        placeholder=""
        @clear="handleClear"
        @select="handleSelect"
      >
        <!-- Résultat affiché : UNE SEULE LIGNE, AVEC highlight -->
        <template #default="{ item }">
          <div
            v-html="
              `${highlightMatch(item.city, displayValue)} - ${highlightMatch(item.value, displayValue)}`
            "
          />
        </template>
      </el-autocomplete>
    </DynamicLabelUI>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Search } from '@element-plus/icons-vue';
import axios from 'axios';
import API_URL from '@/utils/API_URL';
import type { PropType } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object as PropType<{
      city?: string;
      value?: string;
      codeInsee?: string;
    } | null>,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'select', 'clear']);

/* ----------------------------------------------------------
   AFFICHAGE DIRECT DU CHAMP :
   "Ville - CodePostal"
   dès qu’on sélectionne une ville
----------------------------------------------------------- */
const displayValue = computed({
  get: () => {
    if (props.modelValue?.city && props.modelValue?.value) {
      return `${props.modelValue.city} - ${props.modelValue.value}`;
    }
    return props.modelValue?.value || '';
  },
  set: val => {
    emit('update:modelValue', { value: val });
  },
});

/* ----------------------------------------------------------
   API : AUTOCOMPLETE VILLES
----------------------------------------------------------- */
const queryCities = (query: string, cb: Function) => {
  if (!query || query.length < 2) return cb([]);

  axios
    .get(`${API_URL}/communes/${query}`)
    .then(res => {
      const results = res.data.map((item: any) => ({
        city: item.nom_commune,
        value: item.code_postal,
        codeInsee: item.code_insee,
      }));
      cb(results);
    })
    .catch(() => cb([]));
};

/* ----------------------------------------------------------
   Sélection
----------------------------------------------------------- */
const handleSelect = (item: any) => {
  emit('update:modelValue', item);
  emit('select', item);
};

/* ----------------------------------------------------------
   Clear
----------------------------------------------------------- */
const handleClear = () => {
  emit('update:modelValue', null);
  emit('clear');
};

/* ----------------------------------------------------------
   Highlight intelligent
----------------------------------------------------------- */
const highlightMatch = (value: string, query: string) => {
  if (!query) return value;

  const index = value.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return value;

  const before = value.slice(0, index);
  const match = value.slice(index, index + query.length);
  const after = value.slice(index + query.length);

  return `${before}<b>${match}</b>${after}`;
};
</script>

<style scoped>
.floating-label-wrapper {
  margin-bottom: 1.5rem;
}
</style>
