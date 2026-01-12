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
set: (newValue) => {
  // 1️⃣ Si utilisateur efface le champ
  if (!newValue) {
    emit("update:modelValue", null);
    emit("clear");
    return;
  }

  // 2️⃣ Si modelValue vient du parent, on le garde intact
  if (props.modelValue && props.modelValue.value === newValue) {
    return; // 🔥 NE PAS ÉCRASER CE QUI VIENT DU DASHBOARD
  }

  // 3️⃣ Si utilisateur écrit à la main → reconstruire proprement
  const numero = props.modelValue?.numero || "";
  const rep = props.modelValue?.rep || "";

  emit("update:modelValue", {
    numero,
    rep,
    value: newValue,
  });
},
});

/* ----------------------------------
      AUTOCOMPLETE API
----------------------------------- */
const queryNumero = async (query: string, cb: (results: any[]) => void) => {
  if (!query || !props.idFantoir) return cb([]);

  try {
    const url = `${API_URL}/address-number-search/${props.idFantoir}/${query}`;
    const res = await apiService.get(url);

    const results = (res.data as any[]).map((item: any) => ({
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
const handleSelect = (item: any) => {
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
