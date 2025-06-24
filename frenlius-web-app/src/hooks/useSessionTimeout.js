import { useState, useEffect, useCallback, useRef } from 'react';

const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas en milisegundos
const WARNING_TIME = 5 * 60 * 1000; // 5 minutos antes del vencimiento
const CHECK_INTERVAL = 60 * 1000; // Verificar cada minuto

/**
 * Hook personalizado para manejar el timeout de sesión
 * @param {Function} onSessionExpired - Callback cuando la sesión expira
 * @param {Function} onWarning - Callback cuando faltan 5 minutos para expirar
 * @returns {Object} - Estado y funciones del hook
 */
export const useSessionTimeout = (onSessionExpired, onWarning) => {
  const [isWarningShown, setIsWarningShown] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  const intervalRef = useRef(null);
  const warningShownRef = useRef(false);

  // Obtener timestamp de inicio de sesión directamente
  const getSessionStartTime = useCallback(() => {
    try {
      const startTime = sessionStorage.getItem('sessionStartTime');
      return startTime ? parseInt(startTime, 10) : null;
    } catch (error) {
      //console.error('Error obteniendo timestamp:', error);
      return null;
    }
  }, []);

  // Establecer timestamp de inicio de sesión
  const setSessionStartTime = useCallback(() => {
    const now = Date.now();
    sessionStorage.setItem('sessionStartTime', now.toString());
    setIsSessionActive(true);
    warningShownRef.current = false;
    setIsWarningShown(false);
    //console.log('🕒 Sesión iniciada a las:', new Date(now).toLocaleTimeString());
  }, []);

  // Limpiar sesión
  const clearSession = useCallback(() => {
    sessionStorage.removeItem('sessionStartTime');
    sessionStorage.removeItem('accessToken');
    setIsSessionActive(false);
    setTimeRemaining(null);
    setIsWarningShown(false);
    warningShownRef.current = false;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    //console.log('🧹 Sesión limpiada');
  }, []);

  // Verificar estado de la sesión (sin dependencias problemáticas)
  const checkSessionStatus = useCallback(() => {
    const startTime = sessionStorage.getItem('sessionStartTime');
    const startTimeNumber = startTime ? parseInt(startTime, 10) : null;
    
    if (!startTimeNumber) {
      setIsSessionActive(false);
      return;
    }

    const now = Date.now();
    const elapsed = now - startTimeNumber;
    const remaining = SESSION_DURATION - elapsed;

    // Actualizar tiempo restante
    setTimeRemaining(remaining);

    // Verificar si la sesión ha expirado
    if (remaining <= 0) {
      //console.log('⏰ Sesión expirada');
      clearSession();
      onSessionExpired?.();
      return;
    }

    // Verificar si mostrar warning
    if (remaining <= WARNING_TIME && !warningShownRef.current) {
      //console.log('⚠️ Mostrando advertencia de sesión');
      warningShownRef.current = true;
      setIsWarningShown(true);
      onWarning?.(remaining);
    }

    // Log para debug (solo cada 10 verificaciones para no saturar)
    if (Math.floor(elapsed / CHECK_INTERVAL) % 10 === 0) {
      const hoursRemaining = Math.floor(remaining / (60 * 60 * 1000));
      const minutesRemaining = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      ////console.log(`🕒 Tiempo restante: ${hoursRemaining}h ${minutesRemaining}m`);
    }
  }, [clearSession, onSessionExpired, onWarning]);

  // Extender sesión (reiniciar timer)
  const extendSession = useCallback(() => {
    //console.log('🔄 Extendiendo sesión');
    setSessionStartTime();
    setIsWarningShown(false);
    warningShownRef.current = false;
  }, [setSessionStartTime]);

  // Cerrar sesión manualmente
  const endSession = useCallback(() => {
    //console.log('👋 Cerrando sesión manualmente');
    clearSession();
    onSessionExpired?.();
  }, [clearSession, onSessionExpired]);

  // Formatear tiempo restante para mostrar
  const formatTimeRemaining = useCallback((time) => {
    if (!time || time <= 0) return '0m';
    
    const hours = Math.floor(time / (60 * 60 * 1000));
    const minutes = Math.floor((time % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);

  // Inicializar hook - SOLO UNA VEZ al montar
  useEffect(() => {
    // Verificar si ya hay una sesión activa
    const startTime = getSessionStartTime();
    if (startTime) {
      setIsSessionActive(true);
      checkSessionStatus();
    }

    // Configurar intervalo de verificación
    intervalRef.current = setInterval(checkSessionStatus, CHECK_INTERVAL);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // ¡DEPENDENCIAS VACÍAS! Solo ejecutar una vez al montar

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // Estado
    isSessionActive,
    isWarningShown,
    timeRemaining,
    
    // Funciones
    setSessionStartTime,
    clearSession,
    extendSession,
    endSession,
    formatTimeRemaining,
    
    // Información útil
    sessionDurationHours: SESSION_DURATION / (60 * 60 * 1000),
    warningTimeMinutes: WARNING_TIME / (60 * 1000),
  };
};