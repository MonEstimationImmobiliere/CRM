// src/stores/dashboard.ts
import { defineStore } from 'pinia'
import { PropertyService } from '@/api/property.service'
import apiService from '@/api/apiRequests'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    selectedCity: null as any,
    selectedStreet: null as any,
    selectedCodeInsee: '',
    selectedCodeIdFantoir: '',
    addresses: [] as any[],
    viewType: 'table',
    lastSearchParams: null as any,
    isDataLoaded: false,
    showCustomPropertyDialog: false,
    noResultsFound: false
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
        this.noResultsFound = this.addresses.length === 0
      } catch (error) {
        console.error('Error fetching addresses:', error)
        this.noResultsFound = true
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
      this.noResultsFound = false
      this.showCustomPropertyDialog = false
    },

    openCustomPropertyDialog() {
      this.showCustomPropertyDialog = true
    },

    closeCustomPropertyDialog() {
      this.showCustomPropertyDialog = false
    },

    async createCustomProperty(propertyData: any) {
      try {
        // Génération de l'id_fantoir_long structuré
        let id_fantoir_long = this.selectedCodeIdFantoir
        
        // Ajouter le numéro de rue s'il existe
        if (propertyData.numero) {
          id_fantoir_long += `_${propertyData.numero}`
        }
        
        // Ajouter la répétition (bis, ter, etc.) s'il existe
        if (propertyData.rep) {
          id_fantoir_long += `_${propertyData.rep}`
        }
        
        // Ajouter le numéro d'appartement s'il existe
        if (propertyData.numero_appartement) {
          id_fantoir_long += `_${propertyData.numero_appartement}`
        }
        
        const propertyWithFantoir = {
          ...propertyData,
          id_fantoir: this.selectedCodeIdFantoir,
          id_fantoir_long: id_fantoir_long
        }
        
        console.log('🏠 Création propriété personnalisée avec id_fantoir:', this.selectedCodeIdFantoir)
        console.log('🏷️ ID fantoir long généré:', id_fantoir_long)
        console.log('📋 Données envoyées:', propertyWithFantoir)
        
        const createdProperty = await PropertyService.createCustomProperty(propertyWithFantoir)
        
        console.log('✅ Propriété créée:', createdProperty)
        console.log('🔄 Actualisation de la liste...')
        
        // Actualiser la liste des adresses après création
        await this.querySearchAddress()
        
        console.log('📊 Nouvelles adresses après création:', this.addresses.length)
        
        return createdProperty
      } catch (error) {
        console.error('Error creating custom property:', error)
        throw error
      }
    }
  }
})