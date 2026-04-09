import apiService from '@/api/apiRequests';
import type { IProperty, PropertyList } from '@/types/property';
import type {
  IAddressDetail,
  AddressGroupedList,
  AddressDetailList,
} from '@/types/address';

export const PropertyService = {
  async getPropertyById(idFantoir: string): Promise<IProperty> {
    const { data } = await apiService.get<IProperty>(
      `/property/show/${encodeURIComponent(idFantoir)}`
    );
    return data;
  },

  async createProperty(property: Partial<IProperty>): Promise<IProperty> {
    const response = await apiService.post<IProperty>(
      `/property/create`,
      property
    );
    return response.data;
  },

  async updateProperty(
    propertyId: number,
    property: Partial<IProperty>
  ): Promise<IProperty> {
    const response = await apiService.post<{ property: IProperty }>(
      `/property/update/${encodeURIComponent(propertyId)}`,
      property
    );
    return response.data.property;
  },

  async deleteProperty(propertyId: number): Promise<void> {
    await apiService.delete<void>(
      `/property/delete/${encodeURIComponent(propertyId)}`
    );
  },

  async getAddressesByCodeInsee(codeInsee: string): Promise<IAddressDetail[]> {
    const response = await apiService.get<IAddressDetail[]>(
      `/address-city/${encodeURIComponent(codeInsee)}`
    );
    return response.data;
  },

  async getAddressesGroupedByCodeInsee(
    codeInsee: string
  ): Promise<AddressGroupedList> {
    const response = await apiService.get<AddressGroupedList>(
      `/address-city-grouped/${encodeURIComponent(codeInsee)}`
    );
    return response.data;
  },

  async getAddressesByFantoir(
    idFantoir: string,
    type: string
  ): Promise<AddressDetailList> {
    const response = await apiService.get<AddressDetailList>(
      `/addresses/${encodeURIComponent(idFantoir)}?type=${encodeURIComponent(type)}`
    );
    return response.data;
  },

  async getAddressesByNumero(
    idFantoir: string,
    numero: string,
    rep?: string
  ): Promise<IAddressDetail[]> {
    const url = rep
      ? `/address-number/${encodeURIComponent(idFantoir)}/${encodeURIComponent(numero)}/${encodeURIComponent(rep)}`
      : `/address-number/${encodeURIComponent(idFantoir)}/${encodeURIComponent(numero)}`;

    const response = await apiService.get<IAddressDetail[]>(url);
    return response.data;
  },

  async getAddressesByOwner(ownerName: string): Promise<IAddressDetail[]> {
    const response = await apiService.get<IAddressDetail[]>(`/address-owner`, {
      params: {
        owner: ownerName,
      },
    });
    return response.data;
  },

  async removeFromFavorites(propertyId: string): Promise<void> {
    await apiService.delete(
      `/property/${encodeURIComponent(propertyId)}/favorite`
    );
  },

  async getFavorites(): Promise<PropertyList> {
    const response = await apiService.get<PropertyList>('/property/favorite');
    return response.data;
  },

  async createCustomProperty(property: Partial<IProperty>): Promise<IProperty> {
    const response = await apiService.post<IProperty>(`/property/create`, {
      ...property,
      is_custom: true,
      id_fantoir: property.id_fantoir || '',
    });
    return response.data;
  },
};
