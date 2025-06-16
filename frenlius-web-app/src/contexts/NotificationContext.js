import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { notificationService, formatNotificationDate } from '../services/notificationService';

// Crear contexto
const NotificationContext = createContext();

// Tipos de acciones
const NOTIFICATION_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATIONS: 'ADD_NOTIFICATIONS',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_MULTIPLE_AS_READ: 'MARK_MULTIPLE_AS_READ',
  ADD_FEEDBACK: 'ADD_FEEDBACK',
  SET_STATS: 'SET_STATS',
  SET_ERROR: 'SET_ERROR',
  UPDATE_LAST_CHECK: 'UPDATE_LAST_CHECK',
  SET_DROPDOWN_OPEN: 'SET_DROPDOWN_OPEN'
};

// Estado inicial
const initialState = {
  notifications: [],
  unreadCount: 0,
  totalCount: 0,
  stats: null,
  loading: false,
  error: null,
  lastCheck: null,
  lastNotificationId: null,
  dropdownOpen: false,
  hasMore: false,
  nextKey: null
};

// Reducer para manejar estado
function notificationReducer(state, action) {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error
      };

    case NOTIFICATION_ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload.notifications,
        unreadCount: action.payload.notifications.filter(n => n.status === 'UNREAD').length,
        totalCount: action.payload.count || action.payload.notifications.length,
        hasMore: action.payload.hasMore || false,
        nextKey: action.payload.nextKey || null,
        lastNotificationId: action.payload.notifications.length > 0 
          ? action.payload.notifications[0].notification_id 
          : state.lastNotificationId,
        loading: false,
        error: null
      };

    case NOTIFICATION_ACTIONS.ADD_NOTIFICATIONS:
      const existingIds = new Set(state.notifications.map(n => n.notification_id));
      const newNotifications = action.payload.filter(n => !existingIds.has(n.notification_id));
      const updatedNotifications = [...newNotifications, ...state.notifications];
      
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => n.status === 'UNREAD').length,
        totalCount: state.totalCount + newNotifications.length,
        lastNotificationId: updatedNotifications.length > 0 
          ? updatedNotifications[0].notification_id 
          : state.lastNotificationId
      };

    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      const readNotifications = state.notifications.map(notification =>
        notification.notification_id === action.payload.notificationId
          ? { ...notification, status: 'READ', read_at: new Date().toISOString() }
          : notification
      );
      
      return {
        ...state,
        notifications: readNotifications,
        unreadCount: readNotifications.filter(n => n.status === 'UNREAD').length
      };

    case NOTIFICATION_ACTIONS.MARK_MULTIPLE_AS_READ:
      const multiReadNotifications = state.notifications.map(notification =>
        action.payload.notificationIds.includes(notification.notification_id)
          ? { ...notification, status: 'READ', read_at: new Date().toISOString() }
          : notification
      );
      
      return {
        ...state,
        notifications: multiReadNotifications,
        unreadCount: multiReadNotifications.filter(n => n.status === 'UNREAD').length
      };

    case NOTIFICATION_ACTIONS.ADD_FEEDBACK:
      const feedbackNotifications = state.notifications.map(notification =>
        notification.notification_id === action.payload.notificationId
          ? { 
              ...notification, 
              feedback: {
                ...notification.feedback,
                is_useful: action.payload.isUseful,
                comments: action.payload.comments,
                feedback_at: new Date().toISOString()
              }
            }
          : notification
      );
      
      return {
        ...state,
        notifications: feedbackNotifications
      };

    case NOTIFICATION_ACTIONS.SET_STATS:
      return {
        ...state,
        stats: action.payload
      };

    case NOTIFICATION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case NOTIFICATION_ACTIONS.UPDATE_LAST_CHECK:
      return {
        ...state,
        lastCheck: action.payload
      };

    case NOTIFICATION_ACTIONS.SET_DROPDOWN_OPEN:
      return {
        ...state,
        dropdownOpen: action.payload
      };

    default:
      return state;
  }
}

// Provider component
export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Cargar notificaciones iniciales
  const loadNotifications = useCallback(async (options = {}) => {
    try {
      dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: true });
      
      const result = await notificationService.getNotifications(options);
      
      dispatch({ 
        type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS, 
        payload: result 
      });
      
      // Guardar en localStorage para persistencia
      if (result.notifications.length > 0) {
        localStorage.setItem('lastNotificationId', result.notifications[0].notification_id);
        localStorage.setItem('notificationsLastCheck', new Date().toISOString());
      }
      
    } catch (error) {
      console.error('Error loading notifications:', error);
      dispatch({ 
        type: NOTIFICATION_ACTIONS.SET_ERROR, 
        payload: error.message 
      });
    }
  }, []);

  // Cargar más notificaciones (paginación)
  const loadMoreNotifications = useCallback(async () => {
    if (!state.hasMore || state.loading) return;
    
    try {
      dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: true });
      
      const result = await notificationService.getNotifications({
        lastKey: state.nextKey,
        limit: 20
      });
      
      // Agregar nuevas notificaciones a las existentes
      const existingIds = new Set(state.notifications.map(n => n.notification_id));
      const newNotifications = result.notifications.filter(n => !existingIds.has(n.notification_id));
      
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS,
        payload: {
          notifications: [...state.notifications, ...newNotifications],
          count: state.totalCount + newNotifications.length,
          hasMore: result.hasMore,
          nextKey: result.nextKey
        }
      });
      
    } catch (error) {
      console.error('Error loading more notifications:', error);
      dispatch({ 
        type: NOTIFICATION_ACTIONS.SET_ERROR, 
        payload: error.message 
      });
    }
  }, [state.hasMore, state.loading, state.nextKey, state.notifications, state.totalCount]);

  // Verificar nuevas notificaciones
  const checkForNewNotifications = useCallback(async () => {
    try {
      const lastNotificationId = localStorage.getItem('lastNotificationId');
      const result = await notificationService.checkForNewNotifications(lastNotificationId);
      
      if (result.hasNew && result.newCount > 0) {
        console.log(`🔔 Found ${result.newCount} new notifications`);
        
        // Actualizar estado con todas las notificaciones
        dispatch({ 
          type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS, 
          payload: {
            notifications: result.notifications,
            count: result.notifications.length,
            hasMore: false,
            nextKey: null
          }
        });
        
        // Actualizar localStorage
        if (result.notifications.length > 0) {
          localStorage.setItem('lastNotificationId', result.notifications[0].notification_id);
        }
        localStorage.setItem('notificationsLastCheck', new Date().toISOString());
        
        // Mostrar notificación toast (opcional)
        if (window.showNotificationToast) {
          window.showNotificationToast(`${result.newCount} nueva${result.newCount > 1 ? 's' : ''} notificación${result.newCount > 1 ? 'es' : ''}`);
        }
        
        return result.newCount;
      }
      
      // Actualizar timestamp del último check
      dispatch({ 
        type: NOTIFICATION_ACTIONS.UPDATE_LAST_CHECK, 
        payload: new Date().toISOString() 
      });
      localStorage.setItem('notificationsLastCheck', new Date().toISOString());
      
      return 0;
      
    } catch (error) {
      console.error('Error checking for new notifications:', error);
      return 0;
    }
  }, []);

  // Marcar como leída
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      dispatch({ 
        type: NOTIFICATION_ACTIONS.MARK_AS_READ, 
        payload: { notificationId } 
      });
      
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }, []);

  // Marcar múltiples como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = state.notifications
        .filter(n => n.status === 'UNREAD')
        .map(n => n.notification_id);
      
      if (unreadIds.length === 0) return;
      
      await notificationService.markMultipleAsRead(unreadIds);
      
      dispatch({ 
        type: NOTIFICATION_ACTIONS.MARK_MULTIPLE_AS_READ, 
        payload: { notificationIds: unreadIds } 
      });
      
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }, [state.notifications]);

  // Agregar feedback
  const addFeedback = useCallback(async (notificationId, isUseful, comments = '') => {
    try {
      await notificationService.addFeedback(notificationId, isUseful, comments);
      
      dispatch({ 
        type: NOTIFICATION_ACTIONS.ADD_FEEDBACK, 
        payload: { notificationId, isUseful, comments } 
      });
      
    } catch (error) {
      console.error('Error adding feedback:', error);
      throw error;
    }
  }, []);

  // Cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      const stats = await notificationService.getStats();
      
      dispatch({ 
        type: NOTIFICATION_ACTIONS.SET_STATS, 
        payload: stats 
      });
      
      return stats;
      
    } catch (error) {
      console.error('Error loading stats:', error);
      throw error;
    }
  }, []);

  // Control del dropdown
  const setDropdownOpen = useCallback((isOpen) => {
    dispatch({ 
      type: NOTIFICATION_ACTIONS.SET_DROPDOWN_OPEN, 
      payload: isOpen 
    });
  }, []);

  // Polling automático cada 60 segundos
  useEffect(() => {
    // Carga inicial
    loadNotifications({ limit: 20 });
    
    // Configurar polling
    const pollInterval = setInterval(() => {
      console.log('🔄 Checking for new notifications...');
      checkForNewNotifications();
    }, 60000); // 60 segundos
    
    return () => clearInterval(pollInterval);
  }, [loadNotifications, checkForNewNotifications]);

  // Restaurar estado desde localStorage al iniciar
  useEffect(() => {
    const lastCheck = localStorage.getItem('notificationsLastCheck');
    if (lastCheck) {
      dispatch({ 
        type: NOTIFICATION_ACTIONS.UPDATE_LAST_CHECK, 
        payload: lastCheck 
      });
    }
  }, []);

  // Valor del contexto
  const contextValue = {
    // Estado
    ...state,
    
    // Acciones
    loadNotifications,
    loadMoreNotifications,
    checkForNewNotifications,
    markAsRead,
    markAllAsRead,
    addFeedback,
    loadStats,
    setDropdownOpen,
    
    // Helpers
    getUnreadNotifications: () => state.notifications.filter(n => n.status === 'UNREAD'),
    getRecentNotifications: (limit = 5) => state.notifications.slice(0, limit),
    hasUnreadNotifications: () => state.unreadCount > 0
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useNotifications() {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  
  return context;
}

export default NotificationContext;