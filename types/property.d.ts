export namespace Property {
  /** Type d'unité dans un immeuble */
  type UnitType = 'Appartement' | 'Local commercial' | 'Terrain' | 'Parking' | 'Dépendance'

  /** Mode de recherche */
  type SearchMode = 'address' | 'owner'

  /** Adresse d'un bien immobilier */
  interface Address {
    id?: number
    street_number: string
    street_name: string
    city: string
    postal_code: string
    country?: string
    is_building: boolean
    units_count: number
  }

  /** Propriétaire d'un bien */
  interface Owner {
    id?: number
    first_name: string
    last_name: string
    email?: string
    phone?: string
  }

  /** Unité dans un immeuble (appartement, local, etc.) */
  interface Unit {
    id?: number
    address_id: number
    unit_number: string
    floor: number
    unit_type: UnitType
    created_by_agent_id?: number
    agency_id?: number
    created_at?: string
  }

  /** Bien immobilier */
  interface PropertyItem {
    id?: number
    address: Address
    owner?: Owner
    description?: string
    surface?: number
    rooms?: number
    price?: number
    agency_id?: number
    created_at?: string
  }

  /** Formulaire de création/édition d'un bien */
  interface PropertyForm {
    street_number: string
    street_name: string
    city: string
    postal_code: string
    is_building: boolean
    units_count: number
    owner_first_name: string
    owner_last_name: string
    owner_email: string
    owner_phone: string
    description: string
    surface: number | null
    rooms: number | null
    price: number | null
  }

  /** Formulaire de création d'une unité */
  interface UnitForm {
    unit_number: string
    floor: number | null
    unit_type: UnitType
  }
}
