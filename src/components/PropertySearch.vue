<script lang="ts" setup>
import { ref, watch } from 'vue'
import { Search, Location, User } from '@element-plus/icons-vue'
import { usePropertyStore } from '@/stores/property'

const store = usePropertyStore()
const searchQuery = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.search(searchQuery.value)
  }, 350)
}

watch(() => store.searchMode, () => {
  if (searchQuery.value.trim()) {
    store.search(searchQuery.value)
  }
})
</script>

<template>
  <div class="property-search">
    <div class="search-mode-toggle">
      <ElButton
        :type="store.searchMode === 'address' ? 'primary' : 'default'"
        @click="store.searchMode = 'address'"
      >
        <ElIcon class="search-mode-icon"><Location /></ElIcon>
        Recherche par Adresse
      </ElButton>
      <ElButton
        :type="store.searchMode === 'owner' ? 'primary' : 'default'"
        @click="store.searchMode = 'owner'"
      >
        <ElIcon class="search-mode-icon"><User /></ElIcon>
        Recherche par Propriétaire
      </ElButton>
    </div>
    <ElInput
      v-model="searchQuery"
      :placeholder="store.searchMode === 'address' ? 'Rechercher une adresse...' : 'Rechercher un propriétaire...'"
      :prefix-icon="Search"
      clearable
      size="large"
      @input="onSearchInput"
      @clear="store.searchResults = []"
    />
  </div>
</template>

<style scoped>
.property-search {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.search-mode-toggle {
  display: flex;
  gap: 0.5rem;
}

.search-mode-icon {
  margin-right: 0.3rem;
}
</style>
