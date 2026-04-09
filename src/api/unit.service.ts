import apiService from '@/api/apiRequests';

export const UnitService = {
async save(unit: any) {
  console.log('UNIT SAVE payload envoyé au backend:', unit);

  try {
    const response = await apiService.post('/unit/save', unit);
    console.log('UNIT SAVE réponse backend:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('UNIT SAVE erreur backend:', error?.response?.data);
    throw error;
  }
},
};