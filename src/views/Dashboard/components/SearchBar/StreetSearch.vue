<template>
  <div class="grid grid-cols-[1fr_2fr] gap-4 items-center">
    <h6 class="text-gray-700 font-medium">Rue</h6>
    <div class="relative">
      <el-autocomplete
        v-model="localValue"
        :fetch-suggestions="handleSearch"
        :debounce="500"
        :trigger-on-focus="false"
        clearable
        placeholder="Saisir une rue"
        @select="handleSelect"
        @clear="handleClear"
      >
        <template #default="{ item }">
          <div v-html="highlightMatch(item.value, localValue)" />
        </template>
        <template #suffix>
          <el-icon><Search /></el-icon>
        </template>
      </el-autocomplete>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';

const props = defineProps<{
  modelValue: string;
  onSearch: (query: string, cb: (results: any[]) => void) => Promise<void>;
  onSelect: (item: any) => void;
  onClear: () => void;
}>();

const emit = defineEmits(['update:modelValue']);

const localValue = ref(props.modelValue);

watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue;
});

watch(localValue, (newValue) => {
  emit('update:modelValue', newValue);
});

const handleSearch = (query: string, cb: any) => {
  if (query.length >= 2) {
    props.onSearch(query, cb);
  } else {
    cb([]);
  }
};

const handleSelect = (item: any) => {
  props.onSelect(item);
};

const handleClear = () => {
  localValue.value = '';
  props.onClear();
};

const highlightMatch = (value: string, query: string) => {
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