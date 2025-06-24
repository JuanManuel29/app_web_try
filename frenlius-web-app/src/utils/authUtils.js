import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Obtiene el access token almacenado en sessionStorage
 * @returns {string|null} El access token o null si no existe
 */
export const getStoredAccessToken = () => {
  try {
    return sessionStorage.getItem('accessToken');
  } catch (error) {
    ////console.error('Error obteniendo token del storage:', error);
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
      ////console.log('Access token almacenado correctamente');
    }
  } catch (error) {
    ////console.error('Error almacenando token:', error);
  }
};

/**
 * Elimina el access token del sessionStorage
 */
export const removeStoredAccessToken = () => {
  try {
    sessionStorage.removeItem('accessToken');
    ////console.log('Access token eliminado del storage');
  } catch (error) {
    ////console.error('Error eliminando token del storage:', error);
  }
};

/**
 * Obtiene un ID token fresco desde AWS Cognito (para API Gateway)
 * @returns {Promise<string|null>} El ID token o null si hay error
 */
export const getFreshAccessToken = async () => {
  try {
    const session = await fetchAuthSession();
    ////console.log('Session obtenida:', session); // DEBUG
    
    // CAMBIO CRÍTICO: Usar ID token en lugar de access token
    const idToken = session.tokens?.idToken?.toString();
    ////console.log('ID token extraído:', idToken ? 'Token obtenido' : 'Token no encontrado'); // DEBUG
    
    if (idToken) {
      setStoredAccessToken(idToken);
      return idToken;
    }
    
    return null;
  } catch (error) {
    ////console.error('Error obteniendo ID token fresco:', error);
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
  ////console.log('No hay token en storage, obteniendo token fresco...');
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

// ==================== NUEVAS FUNCIONES PARA MANEJO DE SESIÓN ====================

/**
 * Establece el timestamp de inicio de sesión
 */
export const setSessionStartTime = () => {
  try {
    const now = Date.now();
    sessionStorage.setItem('sessionStartTime', now.toString());
    //console.log('🕒 Timestamp de sesión establecido:', new Date(now).toLocaleString());
  } catch (error) {
    //console.error('Error estableciendo timestamp de sesión:', error);
  }
};

/**
 * Obtiene el timestamp de inicio de sesión
 * @returns {number|null} Timestamp o null si no existe
 */
export const getSessionStartTime = () => {
  try {
    const startTime = sessionStorage.getItem('sessionStartTime');
    return startTime ? parseInt(startTime, 10) : null;
  } catch (error) {
    //console.error('Error obteniendo timestamp de sesión:', error);
    return null;
  }
};

/**
 * Verifica si la sesión ha expirado (8 horas)
 * @returns {boolean} true si ha expirado, false si no
 */
export const isSessionExpired = () => {
  try {
    const startTime = getSessionStartTime();
    if (!startTime) return true;

    const now = Date.now();
    const elapsed = now - startTime;
    const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas en ms

    return elapsed >= SESSION_DURATION;
  } catch (error) {
    //console.error('Error verificando expiración de sesión:', error);
    return true; // En caso de error, asumir que expiró
  }
};

/**
 * Obtiene el tiempo restante de sesión en milisegundos
 * @returns {number} Tiempo restante (0 si expiró)
 */
export const getSessionTimeRemaining = () => {
  try {
    const startTime = getSessionStartTime();
    if (!startTime) return 0;

    const now = Date.now();
    const elapsed = now - startTime;
    const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas en ms
    const remaining = SESSION_DURATION - elapsed;

    return Math.max(0, remaining);
  } catch (error) {
    ////console.error('Error calculando tiempo restante:', error);
    return 0;
  }
};

/**
 * Limpia todos los datos de sesión del storage
 */
export const clearSessionData = () => {
  try {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('sessionStartTime');
    //console.log('🧹 Datos de sesión limpiados completamente');
  } catch (error) {
    //console.error('Error limpiando datos de sesión:', error);
  }
};

/**
 * Reinicia el timestamp de sesión (extiende la sesión)
 */
export const extendSession = () => {
  try {
    setSessionStartTime();
    //console.log('🔄 Sesión extendida exitosamente');
  } catch (error) {
    //console.error('Error extendiendo sesión:', error);
  }
};

/**
 * Verifica si falta poco tiempo para que expire la sesión (5 minutos)
 * @returns {boolean} true si faltan 5 minutos o menos
 */
export const isSessionNearExpiry = () => {
  try {
    const remaining = getSessionTimeRemaining();
    const WARNING_TIME = 5 * 60 * 1000; // 5 minutos en ms
    
    return remaining <= WARNING_TIME && remaining > 0;
  } catch (error) {
    //console.error('Error verificando proximidad de expiración:', error);
    return false;
  }
};