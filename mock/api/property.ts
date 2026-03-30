import { MockApi } from '../mockapi'
import type { Property } from '../../types/property'

const properties: Property.PropertyItem[] = [
  {
    id: 1,
    address: {
      id: 1,
      street_number: '12',
      street_name: 'Rue de la Paix',
      city: 'Paris',
      postal_code: '75002',
      is_building: true,
      units_count: 6
    },
    owner: { id: 1, first_name: 'Jean', last_name: 'Dupont', email: 'jean.dupont@email.com', phone: '0612345678' },
    description: 'Immeuble haussmannien',
    surface: 450,
    rooms: 18,
    price: 2500000,
    agency_id: 1,
    created_at: '2024-01-15'
  },
  {
    id: 2,
    address: {
      id: 2,
      street_number: '5',
      street_name: 'Avenue des Champs-Élysées',
      city: 'Paris',
      postal_code: '75008',
      is_building: false,
      units_count: 0
    },
    owner: { id: 2, first_name: 'Marie', last_name: 'Martin', email: 'marie.martin@email.com', phone: '0698765432' },
    description: 'Appartement de standing',
    surface: 85,
    rooms: 4,
    price: 750000,
    agency_id: 1,
    created_at: '2024-02-20'
  },
  {
    id: 3,
    address: {
      id: 3,
      street_number: '28',
      street_name: 'Boulevard Saint-Germain',
      city: 'Paris',
      postal_code: '75005',
      is_building: true,
      units_count: 10
    },
    owner: { id: 3, first_name: 'Pierre', last_name: 'Bernard', email: 'pierre.b@email.com', phone: '0654321098' },
    description: 'Immeuble mixte résidentiel/commercial',
    surface: 800,
    rooms: 30,
    price: 4200000,
    agency_id: 1,
    created_at: '2024-03-10'
  }
]

const units: Property.Unit[] = [
  { id: 1, address_id: 1, unit_number: 'A1', floor: 0, unit_type: 'Local commercial', created_by_agent_id: 1, agency_id: 1, created_at: '2024-01-16' },
  { id: 2, address_id: 1, unit_number: 'A2', floor: 1, unit_type: 'Appartement', created_by_agent_id: 2, agency_id: 1, created_at: '2024-01-16' },
  { id: 3, address_id: 1, unit_number: 'A3', floor: 1, unit_type: 'Appartement', created_by_agent_id: 1, agency_id: 1, created_at: '2024-01-17' },
  { id: 4, address_id: 1, unit_number: 'A4', floor: 2, unit_type: 'Appartement', created_by_agent_id: 2, agency_id: 1, created_at: '2024-01-17' },
  { id: 5, address_id: 1, unit_number: 'A5', floor: 2, unit_type: 'Appartement', created_by_agent_id: 1, agency_id: 1, created_at: '2024-01-18' },
  { id: 6, address_id: 1, unit_number: 'P1', floor: -1, unit_type: 'Parking', created_by_agent_id: 2, agency_id: 1, created_at: '2024-01-18' },
  { id: 7, address_id: 3, unit_number: 'B1', floor: 0, unit_type: 'Local commercial', created_by_agent_id: 1, agency_id: 1, created_at: '2024-03-11' },
  { id: 8, address_id: 3, unit_number: 'B2', floor: 0, unit_type: 'Local commercial', created_by_agent_id: 2, agency_id: 1, created_at: '2024-03-11' },
  { id: 9, address_id: 3, unit_number: 'B3', floor: 1, unit_type: 'Appartement', created_by_agent_id: 1, agency_id: 1, created_at: '2024-03-12' },
  { id: 10, address_id: 3, unit_number: 'B4', floor: 1, unit_type: 'Appartement', created_by_agent_id: 2, agency_id: 1, created_at: '2024-03-12' },
]

let nextPropertyId = 4
let nextUnitId = 11

export default <MockApi.obj[]>[
  {
    url: '/search/address\\?q=.*',
    type: 'get',
    response: (options: MockApi.request) => {
      const q = (options.params?.q || '').toLowerCase()
      const results = properties.filter(p => {
        const addr = p.address
        const full = `${addr.street_number} ${addr.street_name} ${addr.city} ${addr.postal_code}`.toLowerCase()
        return full.includes(q)
      })
      return { code: 200, msg: 'OK', data: results }
    }
  },
  {
    url: '/search/owner\\?q=.*',
    type: 'get',
    response: (options: MockApi.request) => {
      const q = (options.params?.q || '').toLowerCase()
      const results = properties.filter(p => {
        if (!p.owner) return false
        const full = `${p.owner.first_name} ${p.owner.last_name}`.toLowerCase()
        return full.includes(q)
      })
      return { code: 200, msg: 'OK', data: results }
    }
  },
  {
    url: '/list',
    type: 'get',
    response: {
      code: 200,
      msg: 'OK',
      data: properties
    }
  },
  {
    url: '/create',
    type: 'post',
    response: (options: MockApi.request) => {
      const body = options.body as any
      const newProperty: Property.PropertyItem = {
        id: nextPropertyId++,
        address: {
          id: nextPropertyId,
          street_number: body.street_number,
          street_name: body.street_name,
          city: body.city,
          postal_code: body.postal_code,
          is_building: body.is_building || false,
          units_count: body.units_count || 0
        },
        owner: {
          first_name: body.owner_first_name,
          last_name: body.owner_last_name,
          email: body.owner_email,
          phone: body.owner_phone
        },
        description: body.description,
        surface: body.surface,
        rooms: body.rooms,
        price: body.price,
        agency_id: 1,
        created_at: new Date().toISOString().slice(0, 10)
      }
      properties.push(newProperty)
      return { code: 200, msg: 'Bien créé avec succès', data: newProperty }
    }
  },
  {
    url: '/units\\?address_id=.*',
    type: 'get',
    response: (options: MockApi.request) => {
      const addressId = parseInt(options.params?.address_id)
      // Business rule: hide created_by_agent_id (anonymize creator)
      const filtered = units
        .filter(u => u.address_id === addressId)
        .map(u => ({ ...u, created_by_agent_id: undefined }))
      return { code: 200, msg: 'OK', data: filtered }
    }
  },
  {
    url: '/units/create',
    type: 'post',
    response: (options: MockApi.request) => {
      const body = options.body as any
      const newUnit: Property.Unit = {
        id: nextUnitId++,
        address_id: body.address_id,
        unit_number: body.unit_number,
        floor: body.floor,
        unit_type: body.unit_type,
        agency_id: 1,
        created_at: new Date().toISOString().slice(0, 10)
      }
      units.push(newUnit)
      return { code: 200, msg: 'Unité créée avec succès', data: newUnit }
    }
  },
  {
    url: '/units/\\d+',
    type: 'delete',
    response: (options: MockApi.request) => {
      const match = options.url.match(/\/units\/(\d+)/)
      if (match) {
        const id = parseInt(match[1])
        const idx = units.findIndex(u => u.id === id)
        if (idx >= 0) {
          units.splice(idx, 1)
          return { code: 200, msg: 'Unité supprimée', data: null }
        }
      }
      return { code: 200, msg: 'Unité non trouvée', data: null }
    }
  }
]
