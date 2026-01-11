import apiService from '@/api/apiRequests';
import type { PropertyData, IProperty, PropertyList } from '@/types/property';
import type { IAddressGrouped, IAddressDetail, AddressGroupedList, AddressDetailList } from '@/types/address';





export const PropertyService = {

  async getPropertyById(idFantoir: string): Promise<PropertyData> {
    try {
      const { data } = await apiService.get<PropertyData>(`/property/show/${encodeURIComponent(idFantoir)}`);
      return data;
    } catch (error) {
      console.error('Error fetching property details:', error);
      throw error;
    }
  },

  async createProperty(property: PropertyData): Promise<PropertyData> {
    try {
      const response = await apiService.post<PropertyData>(`/property/create`, property);
      return response.data;
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  },

  async updateProperty(propertyId: number, property: PropertyData): Promise<PropertyData> {
    try {
      const response = await apiService.post<{ property: PropertyData }>(`/property/update/${encodeURIComponent(propertyId)}`, property);
      return response.data.property;
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  },

  async deleteProperty(propertyId: number): Promise<void> {
    try {
      await apiService.delete<void>(`/property/delete/${encodeURIComponent(propertyId)}`);
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  },



  async getAddressesByCodeInsee(codeInsee: string): Promise<IAddressDetail[]> {
    try {
      const response = await apiService.get<IAddressDetail[]>(`/address-city/${encodeURIComponent(codeInsee)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching code insee:', error);
      throw error;
    }
  },

  async getAddressesGroupedByCodeInsee(codeInsee: string): Promise<AddressGroupedList> {
    try {
      const response = await apiService.get<AddressGroupedList>(`/address-city-grouped/${encodeURIComponent(codeInsee)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching code insee:', error);
      throw error;
    }
  },

  async getAddressesByFantoir(idFantoir: string, type: string): Promise<AddressDetailList> {
    try {
      const response = await apiService.get<AddressDetailList>(`/addresses/${encodeURIComponent(idFantoir)}?type=${encodeURIComponent(type)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw error;
    }
  },

  async getAddressesByNumero(idFantoir: string, numero: string, rep?: string): Promise<IAddressDetail[]> {
    try {
      const url = rep
        ? `/address-number/${encodeURIComponent(idFantoir)}/${encodeURIComponent(numero)}/${encodeURIComponent(rep)}`
        : `/address-number/${encodeURIComponent(idFantoir)}/${encodeURIComponent(numero)}`;

      const response = await apiService.get<IAddressDetail[]>(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching addresses by numero:", error);
      throw error;
    }
  },

  // Gestion des favoris
  async removeFromFavorites(propertyId: string): Promise<void> {
    try {
      await apiService.delete(`/property/${encodeURIComponent(propertyId)}/favorite`);
    } catch (error) {
      console.error('Error removing property from favorites:', error);
      throw error;
    }
  },

  async getFavorites(): Promise<PropertyList> {
    try {
      const response = await apiService.get<PropertyList>('/property/favorite');
      return response.data;
    } catch (error) {
      console.error('Error fetching favorite properties:', error);
      throw error;
    }
  },

  // Gestion des propriétés personnalisées
  async createCustomProperty(property: PropertyData): Promise<PropertyData> {
    try {
      const response = await apiService.post<PropertyData>(`/property/create`, {
        ...property,
        is_custom: true,
        id_fantoir: property.id_fantoir || ''
      });
      return response.data;
    } catch (error) {
      console.error('Error creating custom property:', error);
      throw error;
    }
  },

};