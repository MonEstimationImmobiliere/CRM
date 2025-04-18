
import axios from 'axios';
import API_URL from '@/utils/API_URL';
import type { PropertyData } from '@/stores/propertyHome';

export const PropertyService = {

  async getPropertyById(idFantoir: string): Promise<PropertyData> {
    try {
      const { data } = await axios.get(`${API_URL}/property/show/${encodeURIComponent(idFantoir)}`);
      return data;
    } catch (error) {
      console.error('Error fetching property details:', error);
      throw error;
    }
  },

  async createProperty(property: PropertyData): Promise<PropertyData> {
    try {
      const response = await axios.post(`${API_URL}/property/create`, property);
      return response.data;
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  },

  async updateProperty(propertyId: number, property: PropertyData): Promise<PropertyData> {
    try {
      const response = await axios.post(
        `${API_URL}/property/update/${encodeURIComponent(propertyId)}`, 
        property
      );
      return response.data.property;
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  },

  async deleteProperty(propertyId: number): Promise<void> {
    try {
      await axios.delete(`${API_URL}/property/delete/${encodeURIComponent(propertyId)}`);
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  },

  async getAddressesByFantoir(idFantoir: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/addresses/${encodeURIComponent(idFantoir)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw error;
    }
  }
};