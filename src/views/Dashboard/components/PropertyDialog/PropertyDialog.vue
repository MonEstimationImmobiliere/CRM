<template>
    <el-dialog
      v-model="localModelValue"
      @close="handleClose"
      :title="dialogTitle"
      width="80%"
      class="bg-green-300"
    >
      <el-form :model="localProperty">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <el-form-item label="Propriétaire">
              <el-input v-model="localProperty.owner" size="small" />
            </el-form-item>
          </div>
          <div>
            <el-form-item label="Email">
              <el-input
                v-model="localProperty.email"
                size="small"
                :formatter="(value) => value.toLowerCase()"
                :parser="(value) => value.trim()"
              />
            </el-form-item>
          </div>
        </div>
  
        <el-form-item label="Type de bien">
          <el-radio-group v-model="localProperty.property_type" size="large">
            <el-radio-button label="maison">Maison</el-radio-button>
            <el-radio-button label="appartement">Appartement</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
  
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">Annuler</el-button>
          <el-button type="primary" @click="handleSave">
            {{ localProperty.id ? 'Sauvegarder' : 'Créer' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </template>
  
  
  <script setup lang="ts">
import { computed, ref, watch } from 'vue';

// Define props and events
const props = defineProps<{
  modelValue: boolean; // Modal visibility
  property: any; // Property details
  onSave: (property: any) => void; // Save function
  onClose: () => void; // Close function
}>();

const emit = defineEmits(['update:modelValue', 'update:property']); // Emit events

// Local copies for two-way binding
console.log('props.modelValue:', props.modelValue); // Debugging    
const localModelValue = ref(props.modelValue);
const localProperty = ref({ ...props.property });

// Watch for parent updates to props
watch(
  () => props.modelValue,
  (newValue) => (localModelValue.value = newValue)
);

watch(
  () => localModelValue.value,
  (newValue) => emit('update:modelValue', newValue)
);

watch(
  () => props.property,
  (newValue) => (localProperty.value = { ...newValue })
);

// Computed dialog title
const dialogTitle = computed(() => {
  const { numero, rep, nom_voie, numero_appartement } = localProperty.value;
  return `${numero}${rep ? ` ${rep}` : ''} - ${nom_voie}${
    numero_appartement ? ` - Appartement ${numero_appartement}` : ''
  }`;
});

// Close handler
const handleClose = () => {
    localModelValue.value = false;
};

// Save handler
const handleSave = () => {
  emit('update:property', localProperty.value); // Notify parent about property changes
  props.onSave(localProperty.value); // Save property via parent function
};
</script>

