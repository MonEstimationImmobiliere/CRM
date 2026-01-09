<template>
  <div class="sidebar-wrapper">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-closed': !sidebarOpen }">
      <div class="sidebar-content">
        <!-- Mode Controls -->
        <div class="mode-controls">
          <h3>Mode d'affichage</h3>
          <div class="mode-buttons">
            <button 
              v-for="mode in displayModes"
              :key="mode.value"
              :class="['mode-btn', { active: currentMode === mode.value }]"
              @click="setMode(mode.value)"
            >
              {{ mode.label }}
            </button>
          </div>
        </div>

        <!-- City Controls -->
        <div class="city-controls" v-if="dashboard.selectedCity">
          <h3>Données ville</h3>
          <div class="city-info">
            <p><strong>{{ getCityName }}</strong></p>
            <small>Code INSEE: {{ dashboard.selectedCodeInsee || 'N/A' }}</small>
          </div>
          <button 
            class="load-city-btn"
            @click="loadCityData"
            :disabled="loadingCityData"
          >
            {{ loadingCityData ? '⏳ Chargement...' : '🏙️ Charger ville entière' }}
          </button>
        </div>

        <!-- Street Search -->
        <div class="street-search" v-if="dashboard.selectedCity">
          <h3>Recherche de rue</h3>
          <div class="search-input-container">
            <input 
              ref="streetSearchInput"
              v-model="streetSearchQuery"
              @input="searchStreets"
              @focus="showStreetResults = true"
              @blur="hideStreetResults"
              @keydown.escape="showStreetResults = false"
              @keydown.arrow-down.prevent="navigateResults(1)"
              @keydown.arrow-up.prevent="navigateResults(-1)"
              @keydown.enter.prevent="selectHighlightedStreet"
              type="text"
              placeholder="Tapez le nom d'une rue... (ou appuyez sur '/')"
              class="street-search-input"
            />
            <div v-if="searchingStreets" class="search-loading">
              🔍 Recherche...
            </div>
          </div>
          
          <!-- Street Results -->
          <div v-if="showStreetResults && streetResults.length > 0" class="street-results">
            <div 
              v-for="(street, index) in streetResults.slice(0, 5)"
              :key="street.id_fantoir || index"
              @click="selectStreet(street)"
              :class="['street-result-item', { 'highlighted': index === highlightedIndex }]"
            >
              <strong>{{ street.nom_voie }}</strong>
              <small>{{ street.total_adresses || 0 }} adresses</small>
            </div>
          </div>
          
          <!-- No Results -->
          <div v-if="showStreetResults && streetSearchQuery && streetResults.length === 0 && !searchingStreets" class="no-street-results">
            Aucune rue trouvée
          </div>

          <!-- Selected Street Info -->
          <div v-if="selectedStreetInfo" class="selected-street-info">
            <p><strong>📍 {{ selectedStreetInfo.nom_voie }}</strong></p>
            <small>{{ selectedStreetInfo.total_adresses || 0 }} adresses trouvées</small>
            <button 
              class="load-street-btn"
              @click="loadStreetData"
              :disabled="loadingStreetData"
            >
              {{ loadingStreetData ? '⏳ Chargement...' : '🏢 Charger cette rue' }}
            </button>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="stats-section">
          <h3>Statistiques</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ stats.addressCount }}</div>
              <div class="stat-label">Adresses</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ stats.streetCount }}</div>
              <div class="stat-label">Rues</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ stats.dpeCount }}</div>
              <div class="stat-label">DPE</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ stats.estimationsCount }}</div>
              <div class="stat-label">Estimations</div>
            </div>
          </div>
        </div>

        <!-- Légende -->
        <div class="legend-section">
          <h3>Légende</h3>
          <div class="legend-items">
            <div v-for="item in currentLegend" :key="item.key" class="legend-item">
              <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>

        <!-- Section de debug -->
        <div class="debug-section">
          <h3>Debug</h3>
          <div class="debug-controls">
            <button class="debug-btn" @click="forceRefreshData">
              🔄 Rafraîchir données
            </button>
            <button class="debug-btn" @click="logCurrentState">
              📊 Log état
            </button>
          </div>
          <div class="debug-info">
            <small>Adresses: {{ dashboard.addresses.length }}</small><br>
            <small>Mode: {{ currentMode }}</small><br>
            <small>Ville: {{ getCityName || 'Non définie' }}</small><br>
            <small>Rue: {{ getStreetName || 'Non définie' }}</small>
          </div>
        </div>
      </div>
    </aside>

    <!-- Toggle Button -->
    <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
      {{ sidebarOpen ? '←' : '→' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'

// Emits
const emit = defineEmits<{
  'mode-change': [mode: string]
  'sidebar-toggle': [open: boolean]
}>()

// Store
const dashboard = useDashboardStore()

// État réactif
const sidebarOpen = ref(true)
const loadingCityData = ref(false)
const currentMode = ref<'address' | 'estimation' | 'rappel' | 'maj' | 'dpe'>('address')

// Variables pour la recherche de rue
const streetSearchQuery = ref('')
const streetResults = ref<any[]>([])
const showStreetResults = ref(false)
const searchingStreets = ref(false)
const selectedStreetInfo = ref<any>(null)
const loadingStreetData = ref(false)
const highlightedIndex = ref(-1)
const streetSearchInput = ref<HTMLInputElement | null>(null)

// Constantes de couleurs
const COLORS = {
  address: '#4287f5',
  estimation: '#9333ea',
  rappel: '#06b6d4',
  maj: '#f97316',
  dpe: '#10b981',
  none: '#d1d5db'
}

// Modes d'affichage
const displayModes = [
  { value: 'address', label: 'Adresses' },
  { value: 'estimation', label: 'Estimations' },
  { value: 'rappel', label: 'Rappels' },
  { value: 'maj', label: 'Mises à jour' },
  { value: 'dpe', label: 'DPE' }
]

// Computed
const getCityName = computed(() => {
  const city = dashboard.selectedCity
  if (!city) return null
  if (typeof city === 'string') return city
  return city.city || city.value || city.nom_commune || null
})

const getStreetName = computed(() => {
  const street = dashboard.selectedStreet
  if (!street) return null
  if (typeof street === 'string') return street
  return street.value || street.nom_voie || null
})

const stats = computed(() => {
  const addresses = dashboard.addresses || []
  
  // Compter les rues uniques
  const uniqueStreets = new Set(addresses.map(a => a.id_fantoir || a.nom_voie))
  
  // Compter les estimations (adresses avec dernier_prix_estime)
  const estimationsCount = addresses.filter(a => 
    a.dernier_prix_estime && a.dernier_prix_estime > 0
  ).length

  return {
    addressCount: addresses.length,
    streetCount: uniqueStreets.size,
    dpeCount: dashboard.dpePoints?.length || 0,
    estimationsCount
  }
})

const currentLegend = computed(() => {
  switch (currentMode.value) {
    case 'address':
      return [
        { key: 'address', label: 'Adresse', color: COLORS.address },
        { key: 'none', label: 'Sans données', color: COLORS.none }
      ]
    case 'estimation':
      return [
        { key: 'estimation', label: 'Avec estimation', color: COLORS.estimation },
        { key: 'none', label: 'Sans estimation', color: COLORS.none }
      ]
    case 'rappel':
      return [
        { key: 'rappel', label: 'Rappel programmé', color: COLORS.rappel },
        { key: 'none', label: 'Sans rappel', color: COLORS.none }
      ]
    case 'maj':
      return [
        { key: 'maj', label: 'Mise à jour requise', color: COLORS.maj },
        { key: 'none', label: 'À jour', color: COLORS.none }
      ]
    case 'dpe':
      return [
        { key: 'dpe', label: 'DPE récent', color: COLORS.dpe },
        { key: 'none', label: 'Sans DPE', color: COLORS.none }
      ]
    default:
      return []
  }
})

// Méthodes
const setMode = (mode: string) => {
  currentMode.value = mode as any
  emit('mode-change', mode)
  
  // Appeler la méthode correspondante du store
  switch (mode) {
    case 'estimation':
      dashboard.querySearchEstimation()
      break
    case 'rappel':
      dashboard.querySearchRappel()
      break
    case 'maj':
      dashboard.querySearchMaj()
      break
    case 'dpe':
      dashboard.fetchDPE()
      break
    default:
      dashboard.querySearchAddress()
  }
}

const loadCityData = async () => {
  if (!dashboard.selectedCity) return
  
  loadingCityData.value = true
  
  try {
    console.log('🏙️ Chargement de la ville entière...')
    
    // Reset street selection
    dashboard.selectedStreet = null
    dashboard.selectedCodeIdFantoir = ''
    dashboard.selectedNumero = ''
    dashboard.selectedRep = ''
    dashboard.selectedNumeroFull = null
    
    await dashboard.querySearchAddress()
    
    console.log('✅ Ville chargée avec succès')
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la ville:', error)
  } finally {
    loadingCityData.value = false
  }
}

const searchStreets = async () => {
  const query = streetSearchQuery.value.trim()
  
  if (!query || query.length < 2) {
    streetResults.value = []
    showStreetResults.value = false
    highlightedIndex.value = -1
    return
  }

  if (!dashboard.selectedCity) {
    console.error('❌ Ville non sélectionnée pour la recherche de rue')
    return
  }

  searchingStreets.value = true
  
  try {
    // Filtrer les adresses du store par nom de voie
    const allAddresses = dashboard.addresses || []
    const queryLower = query.toLowerCase()
    
    // Grouper par nom de voie et filtrer
    const streetMap = new Map<string, any>()
    
    allAddresses.forEach(addr => {
      const nomVoie = addr.nom_voie
      if (nomVoie && nomVoie.toLowerCase().includes(queryLower)) {
        if (!streetMap.has(nomVoie)) {
          streetMap.set(nomVoie, {
            nom_voie: nomVoie,
            id_fantoir: addr.id_fantoir,
            code_postal: addr.code_postal,
            nom_commune: addr.nom_commune,
            total_adresses: 1
          })
        } else {
          streetMap.get(nomVoie).total_adresses++
        }
      }
    })
    
    streetResults.value = Array.from(streetMap.values())
    showStreetResults.value = true
    highlightedIndex.value = -1
    
    console.log('✅ Rues trouvées:', streetResults.value.length)
  } catch (error) {
    console.error('❌ Erreur recherche rues:', error)
    streetResults.value = []
    showStreetResults.value = false
  } finally {
    searchingStreets.value = false
  }
}

const selectStreet = (street: any) => {
  selectedStreetInfo.value = street
  streetSearchQuery.value = street.nom_voie
  showStreetResults.value = false
  
  console.log('📍 Rue sélectionnée:', street)
}

const loadStreetData = async () => {
  if (!selectedStreetInfo.value) return
  
  loadingStreetData.value = true
  
  try {
    console.log('🏢 Chargement des données de la rue:', selectedStreetInfo.value.nom_voie)
    
    // Mettre à jour le store avec les données de rue
    dashboard.selectedStreet = {
      value: selectedStreetInfo.value.nom_voie,
      idFantoir: selectedStreetInfo.value.id_fantoir
    }
    dashboard.selectedCodeIdFantoir = selectedStreetInfo.value.id_fantoir
    dashboard.selectedNumero = ''
    dashboard.selectedRep = ''
    dashboard.selectedNumeroFull = null
    
    // Charger les adresses de cette rue
    await dashboard.querySearchAddress()
    
    console.log('✅ Données de rue chargées avec succès')
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données de rue:', error)
  } finally {
    loadingStreetData.value = false
  }
}

// Navigation au clavier pour les résultats de rue
const navigateResults = (direction: number) => {
  if (!showStreetResults.value || streetResults.value.length === 0) return
  
  const maxIndex = Math.min(streetResults.value.length - 1, 4)
  highlightedIndex.value += direction
  
  if (highlightedIndex.value > maxIndex) {
    highlightedIndex.value = 0
  } else if (highlightedIndex.value < 0) {
    highlightedIndex.value = maxIndex
  }
}

const selectHighlightedStreet = () => {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < streetResults.value.length) {
    selectStreet(streetResults.value[highlightedIndex.value])
  }
}

const hideStreetResults = () => {
  setTimeout(() => {
    showStreetResults.value = false
  }, 150)
}

// Gestion des raccourcis clavier globaux
const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (event.key === '/' && event.target !== streetSearchInput.value && !isInputFocused()) {
    event.preventDefault()
    streetSearchInput.value?.focus()
  }
}

const isInputFocused = () => {
  const activeElement = document.activeElement
  return activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA'
}

// Debug functions
const forceRefreshData = () => {
  console.log('🔄 Rafraîchissement des données...')
  dashboard.querySearchAddress()
}

const logCurrentState = () => {
  console.log('📊 État actuel du dashboard:', {
    city: dashboard.selectedCity,
    street: dashboard.selectedStreet,
    codeInsee: dashboard.selectedCodeInsee,
    codeIdFantoir: dashboard.selectedCodeIdFantoir,
    addressCount: dashboard.addresses.length,
    dpeCount: dashboard.dpePoints?.length || 0,
    mode: currentMode.value
  })
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped>
.sidebar-wrapper {
  position: relative;
  z-index: 20;
}

.sidebar {
  width: 320px;
  background: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 20;
  transition: margin-left 0.3s ease;
  border-right: 1px solid #e5e7eb;
  height: 100%;
  overflow: hidden;
}

.sidebar-closed {
  margin-left: -320px;
}

.sidebar-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
  overflow-y: auto;
}

.sidebar-toggle {
  position: absolute;
  top: 1rem;
  left: 320px;
  z-index: 30;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  width: 2.5rem;
  height: 2.5rem;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
}

.sidebar-closed + .sidebar-toggle {
  left: 0;
}

.mode-controls h3,
.city-controls h3,
.street-search h3,
.stats-section h3,
.legend-section h3,
.debug-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

/* City Controls */
.city-controls {
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.city-info {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.city-info p {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
}

.city-info small {
  color: #6b7280;
  font-size: 0.75rem;
}

.load-city-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #3b82f6;
  background: #3b82f6;
  color: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
}

.load-city-btn:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
}

.load-city-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Street Search */
.street-search {
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.search-input-container {
  position: relative;
  margin-bottom: 1rem;
}

.street-search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.street-search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.search-loading {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: #6b7280;
}

.street-results {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.street-result-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: background-color 0.2s ease;
}

.street-result-item:hover {
  background-color: #f9fafb;
}

.street-result-item.highlighted {
  background-color: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.street-result-item:last-child {
  border-bottom: none;
}

.street-result-item strong {
  font-size: 0.875rem;
  color: #1f2937;
}

.street-result-item small {
  font-size: 0.75rem;
  color: #6b7280;
}

.no-street-results {
  padding: 1rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.selected-street-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-top: 0.5rem;
}

.selected-street-info p {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
}

.selected-street-info small {
  color: #2563eb;
  font-size: 0.75rem;
  display: block;
  margin-bottom: 0.75rem;
}

.load-street-btn {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: white;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  font-weight: 500;
}

.load-street-btn:hover:not(:disabled) {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.load-street-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mode Buttons */
.mode-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mode-btn {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.mode-btn:hover {
  background: #f9fafb;
}

.mode-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.stat-item {
  text-align: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 0.7rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Legend */
.legend-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
}

.legend-color {
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
}

/* Debug */
.debug-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
  margin-top: auto;
}

.debug-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.debug-btn {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.debug-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.debug-info {
  font-size: 0.7rem;
  color: #6b7280;
  line-height: 1.5;
}
</style>
