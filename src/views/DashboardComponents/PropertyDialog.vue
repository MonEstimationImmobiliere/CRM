<template>
    <el-dialog 
      v-model="visible" 
      :title="dialogTitle" 
      width="80%"
    >
      <el-form :model="localPropertyData" label-width="150px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Propriétaire">
              <el-input v-model="localPropertyData.owner" size="small" />
            </el-form-item>
            
            <el-form-item label="Mail">
              <el-input 
                v-model="localPropertyData.email" 
                size="small" 
                :formatter="emailFormatter" 
                :parser="emailParser"
              />
            </el-form-item>
            
            <el-form-item label="Téléphone">
              <el-input 
                v-model="localPropertyData.phone" 
                size="small" 
                :formatter="phoneFormatter" 
                :parser="phoneParser"
              />
            </el-form-item>
            
            <el-form-item label="Type de bien">
              <el-radio-group v-model="localPropertyData.property_type" size="large">
                <el-radio-button label="Maison" value="maison"/>
                <el-radio-button label="Appartement" value="appartement" />
              </el-radio-group>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="Année de construction">
              <el-input-number 
                v-model="localPropertyData.year_built" 
                :min="1800" 
                :max="new Date().getFullYear()"
              />
            </el-form-item>
            
            <el-form-item label="Année d'acquisition">
              <el-input-number 
                v-model="localPropertyData.year_buy" 
                :min="1800" 
                :max="new Date().getFullYear()"
              />
            </el-form-item>
            
            <el-form-item label="Surface">
              <el-input-number 
                v-model="localPropertyData.surface" 
                :min="0" 
                :precision="2" 
                :step="1"
              /> m²
            </el-form-item>
            
            <el-form-item label="Terrain">
              <el-input-number 
                v-model="localPropertyData.area" 
                :min="0" 
                :precision="2" 
                :step="1"
              /> m²
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- Additional form sections would follow similar pattern -->
        
        <el-form-item label="Commentaire">
          <el-input 
            v-model="localPropertyData.comment" 
            type="textarea" 
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDialog">Annuler</el-button>
          <el-button 
            type="primary" 
            @click="saveProperty"
          >
            {{ isEditing ? 'Sauvegarder' : 'Créer' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch, PropType } from 'vue';
  
  const props = defineProps({
    modelValue: Boolean,
    propertyData: Object as PropType<Record<string, any> | null> // Updated type
  });
  
  const emit = defineEmits(['update:modelValue', 'save', 'create']);
  
  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  });
  
  interface PropertyData {
    owner: string;
    email: string;
    phone: string;
    property_type: string;
    year_built: number;
    year_buy: number;
    surface: number;
    area: number;
    comment: string;
    id?: number;
    [key: string]: any; // Optional for additional dynamic properties
  }
  
  const localPropertyData = ref<PropertyData>({
    owner: '',
    email: '',
    phone: '',
    property_type: '',
    year_built: new Date().getFullYear(),
    year_buy: new Date().getFullYear(),
    surface: 0,
    area: 0,
    comment: ''
  });
  const isEditing = computed(() => !!localPropertyData.value.id);
  
  const dialogTitle = computed(() => {
    if (!props.propertyData) return 'Nouvelle propriété';
    return `${props.propertyData.numero || ''} ${props.propertyData.rep || ''} - ${props.propertyData.nom_voie || ''}`;
  });
  
  watch(() => props.propertyData, (newData) => {
    localPropertyData.value = { 
      owner: '',
      email: '',
      phone: '',
      property_type: '',
      year_built: new Date().getFullYear(),
      year_buy: new Date().getFullYear(),
      surface: 0,
      area: 0,
      comment: '',
      id: undefined,
      ...newData // Ensure newData is merged into localPropertyData
    };
  }, { immediate: true });
  
  const emailFormatter = (value:any) => value.toLowerCase();
  const emailParser = (value:any) => value.trim();
  
  const phoneFormatter = (value:any) => 
    value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1 ');
  const phoneParser = (value:any) => value.replace(/\D/g, '').substring(0, 10);
  
  const closeDialog = () => {
    visible.value = false;
  };
  
  const saveProperty = () => {
    if (isEditing.value) {
      emit('save', localPropertyData.value);
    } else {
      emit('create', localPropertyData.value);
    }
    closeDialog();
  };
  </script>