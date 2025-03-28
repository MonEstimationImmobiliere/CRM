export interface AddressItem {
    value: string;
    city?: string;
    codeInsee?: string;
    idFantoir?: string;
  }
  
  export interface PropertyFormData {
    id?: string;
    owner?: string;
    email?: string;
    phone?: string;
    property_type?: 'maison' | 'appartement';
    year_built?: number;
    surface?: number;
    fitted_kitchen?: boolean;
    equipped_kitchen?: boolean;
    american_kitchen?: boolean;
    garage?: boolean;
    pool?: boolean;
    garden?: boolean;
    comment?: string;
    id_fantoir_long?: string;
  }