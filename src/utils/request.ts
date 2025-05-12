import { ElMessage } from 'element-plus'
import axios from 'axios'
import { getCookie } from '.'

const request = axios.create({
  baseURL: "https://monestimationimmobiliere.fr/myimmo/public/api",
  withCredentials: true,
  timeout: 60000
})

const token = getCookie('token')

request.interceptors.request.use(
  config => {
    if (config.headers && token) {
      config.headers['Authorization'] = token
    }
    return config
  },
  error => {
    console.error(error)
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    // Check if response.data exists and has a code property
    if (response.data && typeof response.data === 'object') {
      const { code, msg, data } = response.data;
      
      // If there's a code and it's not 200, handle as error
      if (code !== undefined && code !== 200) {
        const errorMessage = msg || 'Unknown error';
        ElMessage({
          message: `Error code ${code}: ${errorMessage}`,
          type: 'error',
          duration: 5 * 1000
        });
        return Promise.reject(new Error(errorMessage));
      } 
      
      // Return the original response for successful requests
      return response.data;
    }
    
    // If response.data doesn't follow the expected structure, return as is
    return response;
  },
  error => {
    console.error('Response error:', error);
    
    // Extract error message from axios error object
    const errorMessage = error.response?.data?.message || error.message || 'Network error';
    
    ElMessage({
      message: errorMessage,
      type: 'error',
      duration: 5 * 1000
    });
    return Promise.reject(error);
  }
)

export default request