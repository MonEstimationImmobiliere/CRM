import request from '@/utils/request'
import type { Property } from 'types/property'

// --- Recherche ---

export function searchByAddress(query: string) {
  return request.get<Property.PropertyItem[]>('/property/search/address', {
    params: { q: query }
  })
}

export function searchByOwner(query: string) {
  return request.get<Property.PropertyItem[]>('/property/search/owner', {
    params: { q: query }
  })
}

// --- Biens ---

export function getProperties() {
  return request.get<Property.PropertyItem[]>('/property/list')
}

export function createProperty(data: Property.PropertyForm) {
  return request.post<Property.PropertyItem>('/property/create', data)
}

// --- Unités ---

export function getUnitsByAddress(addressId: number) {
  return request.get<Property.Unit[]>('/property/units', {
    params: { address_id: addressId }
  })
}

export function createUnit(addressId: number, data: Property.UnitForm) {
  return request.post<Property.Unit>('/property/units/create', {
    address_id: addressId,
    ...data
  })
}

export function deleteUnit(unitId: number) {
  return request.delete<null>(`/property/units/${unitId}`)
}
