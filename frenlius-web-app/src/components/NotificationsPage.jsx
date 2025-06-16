import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { formatNotificationDate, getNotificationSummary } from '../services/notificationService';
import NotificationModal from './NotificationModal';

const NotificationsPage = () => {
  // Estados locales
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest'

  // Context de notificaciones
  const {
    notifications,
    unreadCount,
    totalCount,
    stats,
    loading,
    error,
    hasMore,
    loadNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    loadStats
  } = useNotifications();

  // Cargar estadísticas al montar
  useEffect(() => {
    loadStats().catch(console.error);
  }, [loadStats]);

  // Filtrar notificaciones
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return notification.status === 'UNREAD';
      case 'read':
        return notification.status === 'READ';
      default:
        return true;
    }
  });

  // Ordenar notificaciones
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Manejar click en notificación
  const handleNotificationClick = async (notification) => {
    try {
      // Marcar como leída si no lo está
      if (notification.status === 'UNREAD') {
        await markAsRead(notification.notification_id);
      }
      
      // Abrir modal con detalles
      setSelectedNotification(notification);
      setModalOpen(true);
      
    } catch (error) {
      console.error('Error al abrir notificación:', error);
    }
  };

  // Manejar cambio de filtro
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Manejar marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  // Obtener estadísticas del filtro actual
  const getFilterStats = () => {
    switch (filter) {
      case 'unread':
        return { count: unreadCount, label: 'sin leer' };
      case 'read':
        return { count: totalCount - unreadCount, label: 'leídas' };
      default:
        return { count: totalCount, label: 'total' };
    }
  };

  const filterStats = getFilterStats();

  return (
    <div className="notifications-page-container">
      {/* Header con estadísticas */}
      <div className="notifications-header">
        <div className="header-stats">
          <div className="stat-card primary">
            <div className="stat-icon">
              <i className="fas fa-bell"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{totalCount}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
          
          <div className="stat-card danger">
            <div className="stat-icon">
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{unreadCount}</div>
              <div className="stat-label">Sin leer</div>
            </div>
          </div>
          
          <div className="stat-card success">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{totalCount - unreadCount}</div>
              <div className="stat-label">Leídas</div>
            </div>
          </div>
          
          {stats && (
            <div className="stat-card info">
              <div className="stat-icon">
                <i className="fas fa-calendar-week"></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.recent_7_days}</div>
                <div className="stat-label">Últimos 7 días</div>
              </div>
            </div>
          )}
        </div>

        {/* Acciones del header */}
        <div className="header-actions">
          {unreadCount > 0 && (
            <button
              className="btn btn-outline-success btn-modern"
              onClick={handleMarkAllAsRead}
              disabled={loading}
            >
              <i className="fas fa-check-double me-2"></i>
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* Controles de filtro y orden */}
      <div className="notifications-controls">
        <div className="filter-section">
          <div className="filter-label">
            <i className="fas fa-filter me-2"></i>
            <span>Filtrar:</span>
          </div>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              <i className="fas fa-list me-1"></i>
              Todas ({totalCount})
            </button>
            <button
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => handleFilterChange('unread')}
            >
              <i className="fas fa-exclamation-circle me-1"></i>
              Sin leer ({unreadCount})
            </button>
            <button
              className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
              onClick={() => handleFilterChange('read')}
            >
              <i className="fas fa-check-circle me-1"></i>
              Leídas ({totalCount - unreadCount})
            </button>
          </div>
        </div>

        <div className="sort-section">
          <div className="sort-label">
            <i className="fas fa-sort me-2"></i>
            <span>Ordenar:</span>
          </div>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Más recientes primero</option>
            <option value="oldest">Más antiguas primero</option>
          </select>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="notifications-content">
        {loading && sortedNotifications.length === 0 ? (
          // Estado de carga inicial
          <div className="notifications-loading">
            <div className="loading-spinner">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando notificaciones...</span>
              </div>
            </div>
            <h4>Cargando notificaciones...</h4>
            <p>Por favor espera un momento</p>
          </div>
        ) : error ? (
          // Estado de error
          <div className="notifications-error">
            <div className="error-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h4>Error al cargar notificaciones</h4>
            <p>{error}</p>
            <button
              className="btn btn-primary btn-modern"
              onClick={() => loadNotifications()}
            >
              <i className="fas fa-refresh me-2"></i>
              Intentar de nuevo
            </button>
          </div>
        ) : sortedNotifications.length === 0 ? (
          // Estado vacío
          <div className="notifications-empty">
            <div className="empty-icon">
              <i className="fas fa-bell-slash"></i>
            </div>
            <h4>
              {filter === 'all' ? 'No tienes notificaciones' : 
               filter === 'unread' ? 'No tienes notificaciones sin leer' : 
               'No tienes notificaciones leídas'}
            </h4>
            <p>
              {filter === 'all' ? 'Las alertas de seguridad aparecerán aquí cuando se detecten.' :
               filter === 'unread' ? 'Todas tus notificaciones están al día.' :
               'No has leído ninguna notificación aún.'}
            </p>
            {filter !== 'all' && (
              <button
                className="btn btn-outline-primary btn-modern"
                onClick={() => handleFilterChange('all')}
              >
                <i className="fas fa-list me-2"></i>
                Ver todas las notificaciones
              </button>
            )}
          </div>
        ) : (
          // Lista de notificaciones
          <div className="notifications-list-section">
            <div className="list-header">
              <h5>
                {filterStats.count} notificación{filterStats.count !== 1 ? 'es' : ''} {filterStats.label}
              </h5>
            </div>

            <div className="notifications-grid">
              {sortedNotifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`notification-card ${notification.status === 'UNREAD' ? 'unread' : 'read'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Header de la tarjeta */}
                  <div className="notification-card-header">
                    <div className="notification-type">
                      <div className="type-icon">
                        <i className="fas fa-shield-alt"></i>
                      </div>
                      <span className="type-label">Alerta de Seguridad</span>
                    </div>
                    <div className="notification-status">
                      {notification.status === 'UNREAD' ? (
                        <span className="status-badge unread">
                          <i className="fas fa-circle"></i>
                          Sin leer
                        </span>
                      ) : (
                        <span className="status-badge read">
                          <i className="fas fa-check"></i>
                          Leída
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contenido principal */}
                  <div className="notification-card-body">
                    <h6 className="notification-title">
                      {getNotificationSummary(notification)}
                    </h6>
                    <p className="notification-reason">
                      {notification.alert_reason.length > 120 
                        ? `${notification.alert_reason.substring(0, 120)}...` 
                        : notification.alert_reason}
                    </p>
                  </div>

                  {/* Footer de la tarjeta */}
                  <div className="notification-card-footer">
                    <div className="notification-meta">
                      <span className="meta-item">
                        <i className="fas fa-plane me-1"></i>
                        {notification.flight_name}
                      </span>
                      <span className="meta-item">
                        <i className="fas fa-image me-1"></i>
                        {notification.image_name}
                      </span>
                    </div>
                    <div className="notification-time">
                      <i className="fas fa-clock me-1"></i>
                      {formatNotificationDate(notification.created_at)}
                    </div>
                  </div>

                  {/* Indicador de feedback */}
                  {notification.feedback?.is_useful !== null && (
                    <div className="feedback-indicator">
                      <i className={`fas ${notification.feedback.is_useful ? 'fa-thumbs-up text-success' : 'fa-thumbs-down text-danger'}`}></i>
                    </div>
                  )}

                  {/* Overlay de hover */}
                  <div className="card-hover-overlay">
                    <div className="hover-content">
                      <i className="fas fa-eye"></i>
                      <span>Ver detalles</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón cargar más */}
            {hasMore && (
              <div className="load-more-section">
                <button
                  className="btn btn-outline-primary btn-modern btn-load-more"
                  onClick={loadMoreNotifications}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                      Cargando más...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-chevron-down me-2"></i>
                      Cargar más notificaciones
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {modalOpen && selectedNotification && (
        <NotificationModal
          notification={selectedNotification}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedNotification(null);
          }}
        />
      )}
    </div>
  );
};

export default NotificationsPage;