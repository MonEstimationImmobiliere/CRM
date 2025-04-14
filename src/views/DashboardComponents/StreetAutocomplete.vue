<template>
  <div class="floating-label-wrapper">
    <DynamicLabelUI v-model="localValue" text="Rue" color="#aaa" activeColor="#409EFF" :disabled="!codeInsee">
      <el-autocomplete v-model="localValue" :fetch-suggestions="queryStreets" :debounce="500" :suffix-icon="Search" :icon-size="60" clearable @clear="handleClear" @select="handleSelect" :disabled="!codeInsee">
        <template #default="{ item }">
          <div v-html="highlightMatch(item.value, localValue)" />
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
  codeInsee: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "select"]);

const localValue = computed({
  get: () => props.modelValue?.value || "",
  set: (newValue) => {
    emit("update:modelValue", { value: newValue });
  },
});

const queryStreets = (queryString: string, cb: (results: { value: string; idFantoir: string }[]) => void): void => {
  if (!props.codeInsee || queryString.length < 3) {
    cb([]);
    return;
  }

  axios
    .get(`${API_URL}/addresses/${props.codeInsee}/nom_voie/${queryString}`)
    .then((response) => {
      const data = response.data;
      const results = data.map((item: any) => ({
        value: item.nom_voie,
        idFantoir: item.id_fantoir,
      }));
      cb(results);
    })
    .catch((error) => {
      console.error("Error fetching streets:", error);
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

<style scoped lang="scss">
.floating-label-wrapper {
  margin-bottom: 1.5rem;
}
</style>
