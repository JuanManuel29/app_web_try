import axios from 'axios';
import { getAccessToken, removeStoredAccessToken } from '../utils/authUtils';

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  timeout: 30000, // 30 segundos timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para requests - agregar token automáticamente
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('⚠️ No hay token disponible para la request');
      }
    } catch (error) {
      console.error('❌ Error obteniendo token para request:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses - manejar errores de autorización
apiClient.interceptors.response.use(
  (response) => {
    // Request exitosa, retornar response
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Si es error 401 (Unauthorized)
    if (error.response?.status === 401) {
      
      // Limpiar token inválido
      removeStoredAccessToken();
      
      // Si no hemos intentado retry aún
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Intentar obtener un token fresco
          const freshToken = await getAccessToken();
          
          if (freshToken) {
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          console.error('❌ Error obteniendo token fresco:', refreshError);
        }
      }
      
      // Si llegamos aquí, el token realmente expiró o es inválido
      console.error('🚫 Sesión expirada, redirigir a login');
      
      // Aquí podrías emitir un evento para redirigir al login
      // O lanzar un error específico que la app pueda manejar
      error.authExpired = true;
    }
    
    // Para otros errores, solo loggear
    if (error.response) {
      console.error(`❌ Error ${error.response.status}: ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      console.error('❌ Error de red: No response recibida');
    } else {
      console.error('❌ Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Funciones helper para diferentes tipos de requests
export const apiGet = (url, config = {}) => {
  return apiClient.get(url, config);
};

export const apiPost = (url, data, config = {}) => {
  return apiClient.post(url, data, config);
};

export const apiPut = (url, data, config = {}) => {
  return apiClient.put(url, data, config);
};

export const apiDelete = (url, config = {}) => {
  return apiClient.delete(url, config);
};

// Exportar cliente base también
export default apiClient;