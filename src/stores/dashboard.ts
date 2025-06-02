// src/stores/dashboard.ts
import { defineStore } from 'pinia'
import { PropertyService } from '@/api/property.service'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    selectedCity: null as any,
    selectedStreet: null as any,
    selectedCodeInsee: '',
    selectedCodeIdFantoir: '',
    addresses: [] as any[],
    viewType: 'table',
    lastSearchParams: null as any,
    isDataLoaded: false
  }),

  actions: {
    async querySearchAddress() {
      if (!this.selectedCodeIdFantoir) return
      
      try {
        this.addresses = await PropertyService.getAddressesByFantoir(
          this.selectedCodeIdFantoir, 
          'address'
        )
        this.lastSearchParams = {
          city: this.selectedCity,
          street: this.selectedStreet,
          codeInsee: this.selectedCodeInsee,
          codeIdFantoir: this.selectedCodeIdFantoir
        }
        this.isDataLoaded = true
      } catch (error) {
        console.error('Error fetching addresses:', error)
      }
    },

    async querySearchEstimation() {
      if (!this.selectedCodeIdFantoir) return
      
      try {
        this.addresses = await PropertyService.getAddressesByFantoir(
          this.selectedCodeIdFantoir, 
          'estimation'
        )
        this.isDataLoaded = true
      } catch (error) {
        console.error('Error fetching estimations:', error)
      }
    },

    async querySearchRappel() {
      if (!this.selectedCodeIdFantoir) return
      
      try {
        this.addresses = await PropertyService.getAddressesByFantoir(
          this.selectedCodeIdFantoir, 
          'rappel'
        )
        this.isDataLoaded = true
      } catch (error) {
        console.error('Error fetching rappel:', error)
      }
    },

    async querySearchMaj() {
      if (!this.selectedCodeIdFantoir) return
      
      try {
        this.addresses = await PropertyService.getAddressesByFantoir(
          this.selectedCodeIdFantoir, 
          'maj'
        )
        this.isDataLoaded = true
      } catch (error) {
        console.error('Error fetching maj:', error)
      }
    },

    setSearchParams(city: any, street: any, codeInsee: string, codeIdFantoir: string) {
      this.selectedCity = city
      this.selectedStreet = street
      this.selectedCodeInsee = codeInsee
      this.selectedCodeIdFantoir = codeIdFantoir
    },

    clearSearchData() {
      this.selectedCity = null
      this.selectedStreet = null
      this.selectedCodeInsee = ''
      this.selectedCodeIdFantoir = ''
      this.addresses = []
      this.isDataLoaded = false
      this.lastSearchParams = null
    }
  }
})