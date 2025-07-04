# 📚 Documentation API - CRM Immobilier

## 🔗 Base URL
```
https://monestimationimmobiliere.fr/myimmo/public/api
```

---

## 🔐 Authentification

### 1. **Login**
- **Route** : `POST /login`
- **Payload** :
```json
{
  "email": "string",
  "password": "string"
}
```
- **Response** :
```json
{
  "user": {
    "name": "string",
    "email": "string", 
    "phone": "string",
    "avatar": "string|null",
    "status": "string",
    "id": "number|null"
  },
  "token": "string"
}
```

### 2. **Logout**
- **Route** : `GET /user/logout`
- **Headers** : `Authorization: Bearer {token}`
- **Response** : Status 200

### 3. **Get User Info**
- **Route** : `GET /user/info?token={token}`
- **Response** :
```json
{
  "name": "string",
  "email": "string",
  "phone": "string", 
  "avatar": "string|null",
  "status": "string",
  "id": "number",
  "token": "string"
}
```

---

## 🏠 Propriétés

### 4. **Obtenir une propriété par ID**
- **Route** : `GET /property/show/{idFantoir}`
- **Headers** : `Authorization: Bearer {token}`
- **Response** : `PropertyData`

### 5. **Créer une propriété**
- **Route** : `POST /property/create`
- **Headers** : `Authorization: Bearer {token}`
- **Payload** : `PropertyData`
- **Response** : `PropertyData`

### 6. **Mettre à jour une propriété**
- **Route** : `POST /property/update/{propertyId}`
- **Headers** : `Authorization: Bearer {token}`
- **Payload** : `PropertyData`
- **Response** :
```json
{
  "property": "PropertyData"
}
```

### 7. **Supprimer une propriété**
- **Route** : `DELETE /property/delete/{propertyId}`
- **Headers** : `Authorization: Bearer {token}`
- **Response** : Status 200

---

## 🏠 Propriétés Personnalisées

### 8. **Créer une propriété personnalisée**
- **Route** : `POST /property/custom/create`
- **Headers** : `Authorization: Bearer {token}`
- **Payload** : `PropertyData` (avec `is_custom: true`)
- **Response** : `PropertyData`

### 9. **Obtenir les propriétés personnalisées**
- **Route** : `GET /property/custom`
- **Headers** : `Authorization: Bearer {token}`
- **Response** : `PropertyData[]`

### 10. **Mettre à jour une propriété personnalisée**
- **Route** : `POST /property/custom/update/{propertyId}`
- **Headers** : `Authorization: Bearer {token}`
- **Payload** : `PropertyData`
- **Response** :
```json
{
  "property": "PropertyData"
}
```

### 11. **Supprimer une propriété personnalisée**
- **Route** : `DELETE /property/custom/delete/{propertyId}`
- **Headers** : `Authorization: Bearer {token}`
- **Response** : Status 200

---

## ⭐ Favoris

### 12. **Ajouter aux favoris**
- **Route** : `POST /property/{propertyId}/favorite`
- **Headers** : `Authorization: Bearer {token}`
- **Response** : Status 200

### 13. **Retirer des favoris**
- **Route** : `DELETE /property/{propertyId}/favorite`
- **Headers** : `Authorization: Bearer {token}`
- **Response** : Status 200

### 14. **Obtenir les favoris**
- **Route** : `GET /property/favorites`
- **Headers** : `Authorization: Bearer {token}`
- **Response** : `PropertyData[]`

---

## 📍 Adresses & Recherche

### 15. **Rechercher communes**
- **Route** : `GET /communes/{queryString}`
- **Response** :
```json
[
  {
    "code_postal": "string",
    "nom_commune": "string", 
    "code_insee": "string"
  }
]
```

### 16. **Rechercher rues par code INSEE**
- **Route** : `GET /addresses/{codeInsee}/nom_voie/{queryString}`
- **Response** :
```json
[
  {
    "nom_voie": "string",
    "id_fantoir": "string"
  }
]
```

### 17. **Obtenir adresses par FANTOIR**
- **Route** : `GET /addresses/{idFantoir}?type={type}`
- **Headers** : `Authorization: Bearer {token}`
- **Paramètres** : 
  - `type` : `address|estimation|rappel|maj`
- **Response** : `any[]`

---

## 📅 Rappels

### 18. **Obtenir rappels utilisateur**
- **Route** : `GET /reminders/user`
- **Headers** : `Authorization: Bearer {token}`
- **Response** : `ReminderData[]`

### 19. **Obtenir rappels agence**
- **Route** : `GET /reminders/agency`
- **Headers** : `Authorization: Bearer {token}`
- **Response** : `ReminderData[]`

### 20. **Créer un rappel**
- **Route** : `POST /reminders`
- **Headers** : `Authorization: Bearer {token}`
- **Payload** :
```json
{
  "property_id": "string",
  "title": "string",
  "description": "string",
  "date": "string",
  "type": "rappel|estimation|visite|autre",
  "priority": "low|medium|high",
  "completed": "boolean",
  "sharing": "boolean"
}
```
- **Response** : `ReminderData`

### 21. **Obtenir un rappel par ID**
- **Route** : `GET /reminders/{id}`
- **Headers** : `Authorization: Bearer {token}`
- **Response** : `ReminderData`

### 22. **Mettre à jour un rappel**
- **Route** : `PUT /reminders/{id}`
- **Headers** : `Authorization: Bearer {token}`
- **Payload** : `Partial<ReminderData>`
- **Response** : `ReminderData`

### 23. **Supprimer un rappel**
- **Route** : `DELETE /reminders/{id}`
- **Headers** : `Authorization: Bearer {token}`
- **Response** : Status 200

---

## 📋 Types de Données

### PropertyData
```typescript
{
  id_fantoir_long: string;
  numero?: string;
  rep?: string;
  nom_voie?: string;
  numero_appartement?: string;
  code_postal?: string;
  nom_commune?: string;
  owner: string;
  email: string;
  phone: string;
  property_type: string;
  year_built: number;
  year_buy: number;
  surface: number;
  area: number;
  orientation: string;
  property_condition: string;
  bedrooms: number;
  bathrooms: number;
  fitted_kitchen: boolean;
  equipped_kitchen: boolean;
  american_kitchen: boolean;
  scullery: boolean;
  heating_type: string;
  window: string;
  window_type: string;
  shutter: string;
  cheminee: boolean;
  district_heating: boolean;
  patio: boolean;
  Garage: boolean;
  pool: boolean;
  veranda: boolean;
  garden: boolean;
  parking: boolean;
  Carport: boolean;
  kitchen_ext: boolean;
  elevator: boolean;
  balcony: boolean;
  cellar: boolean;
  bike_room: boolean;
  guardian: boolean;
  roof: string;
  adjoining: boolean;
  basement: boolean;
  dependency: boolean;
  ground: boolean;
  comment: string;
  date_rappel: string | null;
  comment_rappel?: string;
  id?: number;
  price?: number;
  is_custom?: boolean;
  user_id?: number;
  agency_id?: number;
}
```

### ReminderData
```typescript
{
  id?: string;
  property_id: string;
  title: string;
  description?: string;
  date: string;
  type: 'rappel' | 'estimation' | 'visite' | 'autre';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  sharing: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 🔧 Configuration

### Headers requis pour les routes authentifiées
```
Authorization: Bearer {token}
Content-Type: application/json
```

### Timeout
- **Défaut** : 10000ms (10 secondes)

### Gestion des erreurs
- **401** : Token expiré/invalide → Redirection vers login
- **404** : Ressource non trouvée
- **500** : Erreur serveur

---

## 📝 Notes

1. **Token** : Stocké dans les cookies avec une expiration de 7 jours
2. **Encoding** : Les paramètres d'URL sont automatiquement encodés via `encodeURIComponent()`
3. **Propriétés personnalisées** : Marquées avec `is_custom: true`
4. **FANTOIR** : Code géographique français pour identifier les voies
5. **Autocomplete** : Minimum 3 caractères pour déclencher la recherche des rues

---

## 🚀 Exemples d'utilisation

### Connexion
```javascript
const response = await apiService.post('/login', {
  email: 'test@example.com',
  password: 'motdepasse123'
});
```

### Recherche d'adresses
```javascript
// 1. Rechercher une ville
const cities = await axios.get('/communes/75001');

// 2. Rechercher une rue
const streets = await axios.get('/addresses/75001/nom_voie/rue%20de%20la%20paix');

// 3. Obtenir les propriétés
const properties = await apiService.get('/addresses/750010001?type=address');
```

### Créer une propriété
```javascript
const newProperty = await PropertyService.createProperty({
  id_fantoir_long: '750010001',
  owner: 'Jean Dupont',
  email: 'jean@example.com',
  phone: '0123456789',
  property_type: 'appartement',
  surface: 75,
  // ... autres champs
});
```
