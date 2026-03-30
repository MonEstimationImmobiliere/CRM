import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Property } from 'types/property'
import {
  searchByAddress,
  searchByOwner,
  getProperties,
  createProperty,
  getUnitsByAddress,
  createUnit,
  deleteUnit
} from '@/api/property'

export const usePropertyStore = defineStore('property', () => {
  const properties = ref<Property.PropertyItem[]>([])
  const searchResults = ref<Property.PropertyItem[]>([])
  const units = ref<Property.Unit[]>([])
  const loading = ref(false)
  const searchMode = ref<Property.SearchMode>('address')

  async function fetchProperties() {
    loading.value = true
    try {
      const res = await getProperties()
      if (res.data) {
        properties.value = res.data
      }
    } finally {
      loading.value = false
    }
  }

  async function search(query: string) {
    if (!query.trim()) {
      searchResults.value = []
      return
    }
    loading.value = true
    try {
      const res = searchMode.value === 'address'
        ? await searchByAddress(query)
        : await searchByOwner(query)
      if (res.data) {
        searchResults.value = res.data
      }
    } finally {
      loading.value = false
    }
  }

  async function addProperty(form: Property.PropertyForm) {
    loading.value = true
    try {
      const res = await createProperty(form)
      if (res.data) {
        properties.value.push(res.data)
      }
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchUnits(addressId: number) {
    loading.value = true
    try {
      const res = await getUnitsByAddress(addressId)
      if (res.data) {
        units.value = res.data
      }
    } finally {
      loading.value = false
    }
  }

  async function addUnit(addressId: number, form: Property.UnitForm) {
    loading.value = true
    try {
      const res = await createUnit(addressId, form)
      if (res.data) {
        units.value.push(res.data)
      }
      return res
    } finally {
      loading.value = false
    }
  }

  async function removeUnit(unitId: number) {
    loading.value = true
    try {
      await deleteUnit(unitId)
      units.value = units.value.filter(u => u.id !== unitId)
    } finally {
      loading.value = false
    }
  }

  function toggleSearchMode() {
    searchMode.value = searchMode.value === 'address' ? 'owner' : 'address'
    searchResults.value = []
  }

  return {
    properties,
    searchResults,
    units,
    loading,
    searchMode,
    fetchProperties,
    search,
    addProperty,
    fetchUnits,
    addUnit,
    removeUnit,
    toggleSearchMode
  }
})
