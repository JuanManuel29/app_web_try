import axios from 'axios';
import { 
  getAccessToken, 
  removeStoredAccessToken, 
  isSessionExpired,
  clearSessionData 
} from '../utils/authUtils';

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  timeout: 30000, // 30 segundos timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Variable para controlar si ya se emitió evento de sesión expirada
let sessionExpiredEventEmitted = false;

// Función para emitir evento de sesión expirada
const emitSessionExpiredEvent = () => {
  if (!sessionExpiredEventEmitted) {
    sessionExpiredEventEmitted = true;
    
    // Crear evento personalizado
    const event = new CustomEvent('sessionExpired', {
      detail: {
        reason: 'token_expired',
        timestamp: Date.now()
      }
    });
    
    // Emitir evento
    window.dispatchEvent(event);
    
    console.log('🚫 Evento de sesión expirada emitido');
    
    // Reset flag después de un tiempo para permitir futuros eventos
    setTimeout(() => {
      sessionExpiredEventEmitted = false;
    }, 5000);
  }
};

// Interceptor para requests - agregar token automáticamente
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Verificar si la sesión ha expirado antes de hacer la request
      if (isSessionExpired()) {
        console.log('🔒 Sesión expirada detectada en request interceptor');
        clearSessionData();
        emitSessionExpiredEvent();
        return Promise.reject(new Error('Sesión expirada'));
      }

      const token = await getAccessToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('⚠️ No hay token disponible para la request');
      }
    } catch (error) {
      console.error('❌ Error obteniendo token para request:', error);
      
      // Si hay error obteniendo token, podría ser que la sesión expiró
      if (isSessionExpired()) {
        clearSessionData();
        emitSessionExpiredEvent();
        return Promise.reject(new Error('Sesión expirada'));
      }
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
    
    // Si es error 401 (Unauthorized) o 403 (Forbidden)
    if (error.response?.status === 401 || error.response?.status === 403) {
      //console.log('🔒 Error de autorización detectado:', error.response.status);
      
      // Verificar si la sesión ha expirado
      if (isSessionExpired()) {
        console.log('🔒 Sesión confirmada como expirada');
        clearSessionData();
        emitSessionExpiredEvent();
        return Promise.reject(new Error('Sesión expirada'));
      }
      
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
            //console.log('🔄 Reintentando request con token fresco');
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          console.error('❌ Error obteniendo token fresco:', refreshError);
        }
      }
      
      // Si llegamos aquí, el token realmente expiró o es inválido
      console.error('🚫 Token definitivamente inválido, limpiando sesión');
      clearSessionData();
      emitSessionExpiredEvent();
      
      return Promise.reject(new Error('Token de autorización inválido'));
    }
    
    // Si es error 429 (Too Many Requests)
    if (error.response?.status === 429) {
      console.warn('⚠️ Demasiadas requests, implementar retry con backoff');
      
      // Implementar retry con exponential backoff
      const retryAfter = error.response.headers['retry-after'] || 1;
      const delay = Math.min(1000 * Math.pow(2, originalRequest.retryCount || 0), 10000);
      
      if (!originalRequest.retryCount) {
        originalRequest.retryCount = 0;
      }
      
      if (originalRequest.retryCount < 3) {
        originalRequest.retryCount++;
        
        console.log(`🔄 Reintentando en ${delay}ms (intento ${originalRequest.retryCount})`);
        
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(apiClient(originalRequest));
          }, delay);
        });
      }
    }
    
    // Para otros errores, simplemente rechazar
    console.error('❌ Error en API response:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        method: error.config?.method,
        url: error.config?.url
      }
    });
    
    return Promise.reject(error);
  }
);

// Función helper para verificar si una response es exitosa
export const isSuccessResponse = (response) => {
  return response && response.status >= 200 && response.status < 300;
};

// Función helper para extraer error message de response
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Error desconocido en la comunicación con el servidor';
};

// Función helper para manejar errores comunes
export const handleApiError = (error, context = '') => {
  const message = getErrorMessage(error);
  
  console.error(`❌ Error en ${context}:`, {
    message,
    status: error.response?.status,
    data: error.response?.data
  });
  
  // Retornar objeto de error estandarizado
  return {
    success: false,
    error: message,
    status: error.response?.status || 0,
    data: null
  };
};

// Función para hacer requests con manejo de errores estandarizado
export const makeApiRequest = async (requestConfig, context = '') => {
  try {
    const response = await apiClient(requestConfig);
    
    return {
      success: true,
      data: response.data,
      status: response.status,
      error: null
    };
  } catch (error) {
    return handleApiError(error, context);
  }
};

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

export default apiClient;