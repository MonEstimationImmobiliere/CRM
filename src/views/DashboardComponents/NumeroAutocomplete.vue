<script setup lang="ts">
import { computed } from "vue";
import apiService from "@/api/apiRequests";
import API_URL from "@/utils/API_URL";

const props = defineProps({
  modelValue: {
    type: Object,
    default: null,   // toujours un OBJET { numero, rep, value }
  },
  idFantoir: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "select", "clear"]);

/* ----------------------------------
      VALEUR AFFICHÉE (STRING)
----------------------------------- */
const displayValue = computed({
  get: () => {
    if (!props.modelValue) return "";
    return props.modelValue.value;     // ex: "40 bis"
  },
  set: (v) => {
    // si l’utilisateur tape lui-même (pas via select)
    emit("update:modelValue", { value: v });
  },
});

/* ----------------------------------
      AUTOCOMPLETE API
----------------------------------- */
const queryNumero = async (query, cb) => {
  if (!query || !props.idFantoir) return cb([]);

  try {
    const url = `${API_URL}/address-number-search/${props.idFantoir}/${query}`;
    const res = await apiService.get(url);

    const results = res.data.map((item) => ({
      numero: item.numero,
      rep: item.rep || "",
      value: item.rep ? `${item.numero} ${item.rep}` : String(item.numero),
    }));

    cb(results);
  } catch (e) {
    console.error("Erreur queryNumero:", e);
    cb([]);
  }
};

/* ----------------------------------
      SÉLECTION D’UN NUMÉRO
----------------------------------- */
const handleSelect = (item) => {
  emit("update:modelValue", item);  // objet propre
  emit("select", item);
};

/* ----------------------------------
      CLEAR
----------------------------------- */
const handleClear = () => {
  emit("update:modelValue", null);
  emit("clear");
};
</script>

<template>
  <div class="floating-label-wrapper">
    <DynamicLabelUI
      :model-value="displayValue"
      @update:model-value="displayValue = $event"
      text="Numéro"
      color="#aaa"
      activeColor="#409EFF"
      :disabled="!idFantoir"
    >
      <el-autocomplete
        v-model="displayValue"
        size="large"
        :fetch-suggestions="queryNumero"
        :debounce="300"
        clearable
        placeholder="Numéro"
        @select="handleSelect"
        @clear="handleClear"
        :disabled="!idFantoir"
      >
        <template #default="{ item }">
          <div>{{ item.value }}</div>
        </template>
      </el-autocomplete>
    </DynamicLabelUI>
  </div>
</template>
