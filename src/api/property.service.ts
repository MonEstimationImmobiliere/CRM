import apiService from '@/api/apiRequests';
import type { PropertyData } from '@/stores/propertyHome';





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

  async getAddressesByFantoir(idFantoir: string, type: string): Promise<any[]> {
    try {
      const response = await apiService.get<any[]>(`/addresses/${encodeURIComponent(idFantoir)}?type=${encodeURIComponent(type)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw error;
    }
  },

  // Gestion des favoris
  async addToFavorites(propertyId: string): Promise<void> {
    try {
      await apiService.post(`/property/${encodeURIComponent(propertyId)}/favorite`);
    } catch (error) {
      console.error('Error adding property to favorites:', error);
      throw error;
    }
  },

  async removeFromFavorites(propertyId: string): Promise<void> {
    try {
      await apiService.delete(`/property/${encodeURIComponent(propertyId)}/favorite`);
    } catch (error) {
      console.error('Error removing property from favorites:', error);
      throw error;
    }
  },

  async getFavorites(): Promise<PropertyData[]> {
    try {
      const response = await apiService.get<PropertyData[]>('/property/favorites');
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