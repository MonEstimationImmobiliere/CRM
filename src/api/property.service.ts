import apiService from '@/api/apiRequests';
import type { IProperty } from '@/types/property';
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

  async getProperty(id: number): Promise<Record<string, any>> {
    const response = await apiService.get<Record<string, any>>(
      `/property/${id}`
    );
    return response.data;
  },

  async createProperty(property: Partial<IProperty>): Promise<IProperty> {
    console.log('API createProperty payload', property);
    const response = await apiService.post<{ property: IProperty }>(
      `/property/create`,
      property
    );
    return response.data.property;
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
    codeInsee: string,
    prospection = false
  ): Promise<AddressGroupedList> {
    const response = await apiService.get<AddressGroupedList>(
      `/address-city-grouped/${encodeURIComponent(codeInsee)}`,
      { params: { prospection } }
    );
    return response.data;
  },

  async getAddressesByFantoir(
    idFantoir: string,
    type: string,
    numero?: string,
    rep?: string,
    prospection = false,
    codeInsee?: string
  ): Promise<AddressDetailList> {
    const params = new URLSearchParams({
      type,
    });

    if (numero) params.append('numero', numero);
    if (rep || (prospection && rep !== undefined)) params.append('rep', rep ?? '');
    if (prospection) {
      params.set('prospection', '1');
      if (codeInsee) params.set('code_insee', codeInsee);
    }

    const response = await apiService.get<AddressDetailList>(
      `/addresses/${encodeURIComponent(idFantoir)}?${params.toString()}`
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

  async getAddressesByOwner(ownerName: string, prospection = false): Promise<IAddressDetail[]> {
    const response = await apiService.get<IAddressDetail[]>(`/address-owner`, {
      params: {
        owner: ownerName,
        prospection,
      },
    });
    return response.data;
  },

async getEstimationAddresses(includeDvf = false): Promise<IAddressDetail[]> {
  const response = await apiService.get<IAddressDetail[]>(
    '/address-estimations', { params: { include_dvf: includeDvf ? 1 : undefined } }
  );

  return response.data;
},
async getReminderAddresses(
  scope: 'agency' | 'personal' = 'personal', includeDvf = false
): Promise<IAddressDetail[]> {
  const response = await apiService.get<IAddressDetail[]>(
    '/address-owner',
    {
      params: {
        type: 'rappel',
        scope,
        include_dvf: includeDvf ? 1 : undefined,
      },
    }
  );

  return response.data;
},

async getMajAddresses(
  scope: 'agency' | 'personal' = 'personal', includeDvf = false
): Promise<IAddressDetail[]> {
  const response = await apiService.get<IAddressDetail[]>(
    '/address-owner',
    {
      params: {
        type: 'maj',
        scope,
        include_dvf: includeDvf ? 1 : undefined,
      },
    }
  );

  return response.data;
},

  async getDvfAddresses(
    range: '1y' | '2y' | '3y' | '5y'
  ): Promise<IAddressDetail[]> {
    const response = await apiService.get<IAddressDetail[]>(`/address-dvf`, {
      params: {
        range,
      },
    });
    return response.data;
  },

  async createCustomProperty(property: Partial<IProperty>): Promise<IProperty> {
    return this.createProperty({ ...property, is_custom: true, id_fantoir: property.id_fantoir || '' });
  },
};
