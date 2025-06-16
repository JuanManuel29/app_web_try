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
      
      console.log('🔔 Fetching notifications:', url);
      
      const response = await apiGet(url);
      
      return {
        notifications: response.data.notifications || [],
        count: response.data.count || 0,
        nextKey: response.data.next_key,
        hasMore: response.data.has_more || false
      };
      
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw new Error('No se pudieron cargar las notificaciones');
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
      throw new Error('No se pudo marcar la notificación como leída');
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
      console.log('💬 Adding feedback to notification:', notificationId, { isUseful, comments });
      
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
      throw new Error('No se pudo enviar el feedback');
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   * @returns {Promise<Object>} Estadísticas del usuario
   */
  async getStats() {
    try {
      console.log('📊 Fetching notification stats');
      
      const response = await apiGet(`${NOTIFICATIONS_BASE_URL}/notifications/stats`);
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Error fetching notification stats:', error);
      throw new Error('No se pudieron cargar las estadísticas');
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
      console.error('❌ Error fetching image URL:', error);
      throw new Error('No se pudo cargar la imagen');
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
      
      // Si no tenemos referencia previa, todas son "nuevas"
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
      console.error('❌ Error checking for new notifications:', error);
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
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};

/**
 * Crear resumen corto de una notificación para el dropdown
 * @param {Object} notification - Objeto de notificación
 * @returns {string} Resumen corto
 */
export const getNotificationSummary = (notification) => {
  const flightName = notification.flight_name || 'Vuelo desconocido';
  const imageName = notification.image_name || 'imagen';
  
  return `Alerta de seguridad en ${imageName} del vuelo ${flightName}`;
};

/**
 * Obtener icono y color basado en el tipo de notificación
 * @param {Object} notification - Objeto de notificación
 * @returns {Object} Icono y color
 */
export const getNotificationIcon = (notification) => {
  // Por ahora solo tenemos alertas de seguridad, pero esto se puede expandir
  return {
    icon: 'fa-shield-alt',
    color: 'danger',
    bgColor: 'rgba(239, 68, 68, 0.1)'
  };
};

export default notificationService;