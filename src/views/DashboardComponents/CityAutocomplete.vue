<template>
  <div class="floating-label-wrapper">
    <DynamicLabelUI v-model="localValue" text="Ville" color="#aaa" activeColor="#409EFF">
      <el-autocomplete id="autocomplete" v-model="localValue" :fetch-suggestions="queryCities" :debounce="500" :suffix-icon="Search" clearable placeholder="" @clear="handleClear" @select="handleSelect" @focus="isFocused = true" @blur="isFocused = false">
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
    type: Object as PropType<{ value: string } | null>,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "select"]);
const isFocused = ref(false);

const localValue = computed({
  get: () => props.modelValue?.value || "",
  set: (newValue) => {
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
