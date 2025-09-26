<template>
  <div class="floating-label-wrapper">
    <DynamicLabelUI v-model="displayValue" text="Ville" color="#aaa" activeColor="#409EFF">
      <el-autocomplete id="autocomplete" size="large" v-model="displayValue" :fetch-suggestions="queryCities" :debounce="500" :suffix-icon="Search" clearable placeholder="" @clear="handleClear" @select="handleSelect" @focus="handleFocus" @blur="handleBlur">
        <template #default="{ item }">
          <div v-html="highlightMatch(item.value, localValue) + ', ' + item.city" />
        </template>
      </el-autocomplete>
    </DynamicLabelUI>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Search } from "@element-plus/icons-vue";
import axios from "axios";
import API_URL from "@/utils/API_URL";

import { PropType } from "vue";

const props = defineProps({
  modelValue: {
    type: Object as PropType<{ value: string; city?: string; codeInsee?: string } | null>,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "select", "clear"]);
const isFocused = ref(false);

const localValue = computed({
  get: () => props.modelValue?.value || "",
  set: (newValue) => {
    emit("update:modelValue", { value: newValue });
  },
});

// Valeur d'affichage qui montre soit la saisie en cours soit la ville sélectionnée
const displayValue = computed({
  get: () => {
    if (props.modelValue?.city && props.modelValue?.value && !isFocused.value) {
      // Si une ville est sélectionnée et le champ n'est pas en focus, afficher "Ville - Code postal"
      return `${props.modelValue.city} - ${props.modelValue.value}`;
    }
    return props.modelValue?.value || "";
  },
  set: (newValue) => {
    // Lors de la saisie, on stocke juste la valeur
    emit("update:modelValue", { value: newValue });
  },
});

const queryCities = (queryString: string, cb: (results: Array<{ value: string; city: string; codeInsee: string }>) => void) => {
  axios
    .get(`${API_URL}/communes/${queryString}`)
    .then((response) => {
      const data = response.data;
      const results = data.map((item: any) => ({
        value: item.code_postal,
        city: item.nom_commune,
        codeInsee: item.code_insee,
      }));
      cb(results);
    })
    .catch((error) => {
      console.error("Error fetching cities:", error);
      cb([]);
    });
};

const handleSelect = (selectedItem: any) => {
  emit("update:modelValue", selectedItem);
  emit("select", selectedItem);
};

const handleClear = () => {
  emit("update:modelValue", null);
  emit("clear"); // Émettre un événement clear pour notifier les composants dépendants
};

const handleFocus = () => {
  isFocused.value = true;
};

const handleBlur = () => {
  isFocused.value = false;
};

const highlightMatch = (value: any, query: any) => {
  if (!query) return value;

  const index = value.toLowerCase().indexOf(query.toLowerCase());
  if (index !== -1) {
    const beforeMatch = value.substring(0, index);
    const matched = value.substring(index, index + query.length);
    const afterMatch = value.substring(index + query.length);
    return `${beforeMatch}<b>${matched}</b>${afterMatch}`;
  }
  return value;
};
</script>

<style scoped>
.floating-label-wrapper {
  margin-bottom: 1.5rem;
}
</style>
