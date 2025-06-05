import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Obtiene el access token almacenado en sessionStorage
 * @returns {string|null} El access token o null si no existe
 */
export const getStoredAccessToken = () => {
  try {
    return sessionStorage.getItem('accessToken');
  } catch (error) {
    //console.error('Error obteniendo token del storage:', error);
    return null;
  }
};

/**
 * Almacena el access token en sessionStorage
 * @param {string} token - El access token a almacenar
 */
export const setStoredAccessToken = (token) => {
  try {
    if (token) {
      sessionStorage.setItem('accessToken', token);
      //console.log('Access token almacenado correctamente');
    }
  } catch (error) {
    //console.error('Error almacenando token:', error);
  }
};

/**
 * Elimina el access token del sessionStorage
 */
export const removeStoredAccessToken = () => {
  try {
    sessionStorage.removeItem('accessToken');
    //console.log('Access token eliminado del storage');
  } catch (error) {
    //console.error('Error eliminando token del storage:', error);
  }
};

/**
 * Obtiene un ID token fresco desde AWS Cognito (para API Gateway)
 * @returns {Promise<string|null>} El ID token o null si hay error
 */
export const getFreshAccessToken = async () => {
  try {
    const session = await fetchAuthSession();
    //console.log('Session obtenida:', session); // DEBUG
    
    // CAMBIO CRÍTICO: Usar ID token en lugar de access token
    const idToken = session.tokens?.idToken?.toString();
    //console.log('ID token extraído:', idToken ? 'Token obtenido' : 'Token no encontrado'); // DEBUG
    
    if (idToken) {
      setStoredAccessToken(idToken);
      return idToken;
    }
    
    return null;
  } catch (error) {
    //console.error('Error obteniendo ID token fresco:', error);
    return null;
  }
};

/**
 * Obtiene el access token (primero del storage, luego fresco si es necesario)
 * @returns {Promise<string|null>} El access token o null si no se puede obtener
 */
export const getAccessToken = async () => {
  // Primero intentar obtener del storage
  let token = getStoredAccessToken();
  
  if (token) {
    return token;
  }
  
  // Si no hay token en storage, obtener uno fresco
  //console.log('No hay token en storage, obteniendo token fresco...');
  return await getFreshAccessToken();
};

/**
 * Verifica si hay un token válido disponible
 * @returns {Promise<boolean>} true si hay token disponible, false si no
 */
export const hasValidToken = async () => {
  const token = await getAccessToken();
  return !!token;
};

/**
 * Crea headers de autorización para API calls
 * @returns {Promise<Object>} Headers con Authorization o headers vacíos si no hay token
 */
export const getAuthHeaders = async () => {
  const token = await getAccessToken();
  
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  //console.warn('No hay access token disponible para la API call');
  return {
    'Content-Type': 'application/json'
  };
};