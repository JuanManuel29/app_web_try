import { apiGet, apiPost } from './apiClient';

/**
 * Servicio para manejar todas las operaciones de notificaciones
 * Interactúa con la API de notificaciones en AWS
 */

const NOTIFICATIONS_BASE_URL = 'https://37t19oywnd.execute-api.us-east-2.amazonaws.com/prod';

class NotificationService {
  /**
   * Obtener notificaciones del usuario actual
   * @param {Object} options - Opciones de consulta
   * @param {number} options.limit - Número máximo de notificaciones
   * @param {string} options.lastKey - Clave para paginación
   * @param {string} options.status - Filtro por estado (UNREAD, READ)
   * @returns {Promise<Object>} Lista de notificaciones
   */
  async getNotifications(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', options.limit);
      if (options.lastKey) params.append('last_key', options.lastKey);
      if (options.status) params.append('status', options.status);
      
      const queryString = params.toString();
      const url = `${NOTIFICATIONS_BASE_URL}/notifications${queryString ? `?${queryString}` : ''}`;
      
      // console.log('🔔 Fetching notifications:', url);
      
      const response = await apiGet(url);
      
      // Manejar respuesta exitosa (incluso si está vacía)
      const result = {
        notifications: response.data.notifications || [],
        count: response.data.count || 0,
        nextKey: response.data.next_key,
        hasMore: response.data.has_more || false
      };
      
      // console.log(`✅ Successfully fetched ${result.count} notifications`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      
      // Verificar si es un error de red vs error del servidor
      if (error.response) {
        // Error del servidor
        const status = error.response.status;
        const message = error.response.data?.error || 'Error del servidor';
        
        if (status === 404) {
          // No encontrado - retornar estructura vacía
          console.log('📭 No notifications found, returning empty result');
          return {
            notifications: [],
            count: 0,
            nextKey: null,
            hasMore: false
          };
        } else if (status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        } else {
          throw new Error(`Error del servidor: ${message}`);
        }
      } else if (error.request) {
        // Error de red
        throw new Error('Error de conexión. Verifica tu conexión a internet.');
      } else {
        // Error desconocido
        throw new Error('Error inesperado al cargar notificaciones.');
      }
    }
  }

  /**
   * Obtener solo notificaciones no leídas
   * @param {number} limit - Número máximo de notificaciones
   * @returns {Promise<Object>} Lista de notificaciones no leídas
   */
  async getUnreadNotifications(limit = 5) {
    return this.getNotifications({ 
      status: 'UNREAD', 
      limit 
    });
  }

  /**
   * Marcar una notificación como leída
   * @param {string} notificationId - ID de la notificación
   * @returns {Promise<Object>} Notificación actualizada
   */
  async markAsRead(notificationId) {
    try {
      console.log('✅ Marking notification as read:', notificationId);
      
      const response = await apiPost(
        `${NOTIFICATIONS_BASE_URL}/notifications/${notificationId}/read`,
        {}
      );
      
      return response.data.notification;
      
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Notificación no encontrada');
      } else if (error.response?.status === 401) {
        throw new Error('No autorizado para marcar esta notificación');
      } else {
        throw new Error('No se pudo marcar la notificación como leída');
      }
    }
  }

  /**
   * Marcar múltiples notificaciones como leídas
   * @param {string[]} notificationIds - Array de IDs de notificaciones
   * @returns {Promise<void>}
   */
  async markMultipleAsRead(notificationIds) {
    try {
      console.log('✅ Marking multiple notifications as read:', notificationIds.length);
      
      // Ejecutar en paralelo para mejor performance
      const promises = notificationIds.map(id => this.markAsRead(id));
      await Promise.all(promises);
      
    } catch (error) {
      console.error('❌ Error marking multiple notifications as read:', error);
      throw new Error('No se pudieron marcar las notificaciones como leídas');
    }
  }

  /**
   * Agregar feedback a una notificación
   * @param {string} notificationId - ID de la notificación
   * @param {boolean} isUseful - Si la notificación fue útil
   * @param {string} comments - Comentarios adicionales
   * @returns {Promise<Object>} Notificación actualizada
   */
  async addFeedback(notificationId, isUseful, comments = '') {
    try {
      //console.log('💬 Adding feedback to notification:', notificationId, { isUseful, comments });
      
      const response = await apiPost(
        `${NOTIFICATIONS_BASE_URL}/notifications/${notificationId}/feedback`,
        {
          is_useful: isUseful,
          comments: comments.trim()
        }
      );
      
      return response.data.notification;
      
    } catch (error) {
      console.error('❌ Error adding feedback:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Notificación no encontrada');
      } else if (error.response?.status === 400) {
        throw new Error('Datos de feedback inválidos');
      } else {
        throw new Error('No se pudo enviar el feedback');
      }
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   * @returns {Promise<Object>} Estadísticas del usuario
   */
  async getStats() {
    try {
      //console.log('📊 Fetching notification stats');
      
      const response = await apiGet(`${NOTIFICATIONS_BASE_URL}/notifications/stats`);
      
      return response.data;
      
    } catch (error) {
      //console.error('❌ Error fetching notification stats:', error);
      
      if (error.response?.status === 404) {
        // Sin estadísticas disponibles
        return {
          total_notifications: 0,
          unread_count: 0,
          read_count: 0,
          recent_7_days: 0,
          feedback_stats: {
            total_with_feedback: 0,
            useful: 0,
            not_useful: 0,
            pending_feedback: 0
          }
        };
      } else {
        throw new Error('No se pudieron cargar las estadísticas');
      }
    }
  }

  /**
   * Obtener URL de imagen para una notificación
   * @param {string} notificationId - ID de la notificación
   * @returns {Promise<string>} URL presignada de la imagen
   */
  async getImageUrl(notificationId) {
    try {
      console.log('🖼️ Fetching image URL for notification:', notificationId);
      
      const response = await apiGet(
        `${NOTIFICATIONS_BASE_URL}/notifications/${notificationId}/image`
      );
      
      return response.data.image_url;
      
    } catch (error) {
      // console.error('❌ Error fetching image URL:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Imagen no encontrada');
      } else {
        throw new Error('No se pudo cargar la imagen');
      }
    }
  }

  /**
   * Verificar si hay nuevas notificaciones comparando con la última conocida
   * @param {string} lastNotificationId - ID de la última notificación conocida
   * @returns {Promise<Object>} Información sobre nuevas notificaciones
   */
  async checkForNewNotifications(lastNotificationId = null) {
    try {
      // Obtener las últimas 5 notificaciones
      const result = await this.getNotifications({ limit: 5 });
      
      if (!result.notifications.length) {
        return { hasNew: false, newCount: 0, notifications: [] };
      }
      
      // Si no tenemos referencia previa, todas las no leídas son "nuevas"
      if (!lastNotificationId) {
        const unreadCount = result.notifications.filter(n => n.status === 'UNREAD').length;
        return { 
          hasNew: unreadCount > 0, 
          newCount: unreadCount, 
          notifications: result.notifications 
        };
      }
      
      // Buscar el índice de la última notificación conocida
      const lastKnownIndex = result.notifications.findIndex(
        n => n.notification_id === lastNotificationId
      );
      
      if (lastKnownIndex === -1) {
        // La última conocida no está en las 5 más recientes = hay muchas nuevas
        const unreadCount = result.notifications.filter(n => n.status === 'UNREAD').length;
        return { 
          hasNew: unreadCount > 0, 
          newCount: unreadCount, 
          notifications: result.notifications 
        };
      }
      
      // Las nuevas son las que están antes de la última conocida
      const newNotifications = result.notifications.slice(0, lastKnownIndex);
      const newUnreadCount = newNotifications.filter(n => n.status === 'UNREAD').length;
      
      return {
        hasNew: newUnreadCount > 0,
        newCount: newUnreadCount,
        notifications: result.notifications
      };
      
    } catch (error) {
      //console.error('❌ Error checking for new notifications:', error);
      // En caso de error, retornar estado seguro
      return { hasNew: false, newCount: 0, notifications: [] };
    }
  }
}

// Crear instancia singleton
export const notificationService = new NotificationService();

// Helper functions para usar en componentes

/**
 * Formatear fecha de notificación para mostrar
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
export const formatNotificationDate = (dateString) => {
  try {
    if (!dateString) return 'Fecha no disponible';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Fecha inválida';
  }
};

/**
 * Crear resumen corto de una notificación para el dropdown
 * @param {Object} notification - Objeto de notificación
 * @returns {string} Resumen corto
 */
export const getNotificationSummary = (notification) => {
  if (!notification) return 'Notificación sin datos';
  
  const flightName = notification.flight_name || 'Vuelo desconocido';
  const imageName = notification.image_name || 'imagen';
  
  //return `Alerta de seguridad en ${imageName} del vuelo ${flightName}`;
  return `${flightName}/${imageName}`;
};

/**
 * Obtener icono y color basado en el tipo de notificación
 * @param {Object} notification - Objeto de notificación
 * @returns {Object} Icono y color
 */
export const getNotificationIcon = (notification) => {
  // Por ahora solo tenemos alertas de seguridad, pero esto se puede expandir
  if (!notification) {
    return {
      icon: 'fa-bell',
      color: 'secondary',
      bgColor: 'rgba(108, 117, 125, 0.1)'
    };
  }
  
  // Determinar prioridad basada en el contenido
  const alertReason = (notification.alert_reason || '').toLowerCase();
  
  if (alertReason.includes('arma') || alertReason.includes('weapon')) {
    return {
      icon: 'fa-exclamation-triangle',
      color: 'danger',
      bgColor: 'rgba(220, 53, 69, 0.1)'
    };
  } else if (alertReason.includes('sospechoso') || alertReason.includes('suspicious')) {
    return {
      icon: 'fa-eye',
      color: 'warning',
      bgColor: 'rgba(255, 193, 7, 0.1)'
    };
  } else {
    return {
      icon: 'fa-shield-alt',
      color: 'primary',
      bgColor: 'rgba(13, 110, 253, 0.1)'
    };
  }
};

/**
 * Validar estructura de notificación
 * @param {Object} notification - Objeto de notificación
 * @returns {boolean} True si la notificación es válida
 */
export const isValidNotification = (notification) => {
  return (
    notification &&
    typeof notification === 'object' &&
    notification.notification_id &&
    notification.client &&
    notification.created_at
  );
};

/**
 * Filtrar notificaciones válidas de una lista
 * @param {Array} notifications - Lista de notificaciones
 * @returns {Array} Lista filtrada de notificaciones válidas
 */
export const filterValidNotifications = (notifications) => {
  if (!Array.isArray(notifications)) return [];
  
  return notifications.filter(isValidNotification);
};

export default notificationService;