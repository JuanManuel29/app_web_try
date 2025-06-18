import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { formatNotificationDate, getNotificationSummary } from '../services/notificationService';

const NotificationBell = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasNewAnimation, setHasNewAnimation] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const lastUnreadCount = useRef(0);
  const navigate = useNavigate(); // Para navegación

  const {
    unreadCount,
    getRecentNotifications,
    markAsRead,
    markAllAsRead,
    loading,
    error
  } = useNotifications();

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !bellRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Animación cuando llegan nuevas notificaciones
  useEffect(() => {
    if (unreadCount > lastUnreadCount.current && lastUnreadCount.current > 0) {
      setHasNewAnimation(true);
      
      // Reproducir sonido de notificación (opcional)
      if (window.playNotificationSound) {
        window.playNotificationSound();
      }
      
      // Quitar animación después de 3 segundos
      setTimeout(() => setHasNewAnimation(false), 3000);
    }
    
    lastUnreadCount.current = unreadCount;
  }, [unreadCount]);

  // Toggle dropdown
  const handleBellClick = () => {
    setDropdownOpen(!dropdownOpen);
    setHasNewAnimation(false); // Quitar animación al abrir
  };

  // Manejar click en notificación - CORREGIDO CON NAVEGACIÓN
  const handleNotificationClick = async (notification) => {
    try {
      // Marcar como leída si no lo está
      if (notification.status === 'UNREAD') {
        await markAsRead(notification.notification_id);
      }
      
      // Cerrar dropdown
      setDropdownOpen(false);
      
      // Navegar a la página de notificaciones
      navigate('/notifications');
      
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  // Obtener últimas 5 notificaciones para el dropdown
  const recentNotifications = getRecentNotifications(5);

  return (
    <div className="notification-bell-container">
      {/* Botón de campanita */}
      <button
        ref={bellRef}
        className={`notification-bell ${hasNewAnimation ? 'has-new' : ''} ${dropdownOpen ? 'active' : ''}`}
        onClick={handleBellClick}
        type="button"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        title={unreadCount > 0 ? `${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer` : 'Sin notificaciones nuevas'}
      >
        <div className="bell-icon-wrapper">
          <i className="fas fa-bell bell-icon"></i>
          
          {/* Badge simple: solo circulito rojo si hay notificaciones */}
          {unreadCount > 0 && (
            <span className="notification-badge"></span>
          )}
        </div>
      </button>

      {/* Dropdown de notificaciones */}
      {dropdownOpen && (
        <div ref={dropdownRef} className="notification-dropdown">
          {/* Header del dropdown */}
          <div className="dropdown-header">
            <div className="header-title">
              <i className="fas fa-bell me-2"></i>
              <span>Notificaciones</span>
            </div>
            <div className="header-actions">
              {unreadCount > 0 && (
                <button
                  className="mark-all-read-btn"
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  title="Marcar todas como leídas"
                >
                  <i className="fas fa-check-double"></i>
                </button>
              )}
            </div>
          </div>

          {/* Contenido del dropdown */}
          <div className="dropdown-content">
            {loading && recentNotifications.length === 0 ? (
              // Estado de carga inicial
              <div className="notification-loading">
                <div className="loading-spinner">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
                <p>Cargando notificaciones...</p>
              </div>
            ) : error ? (
              // Estado de error
              <div className="notification-error">
                <div className="error-icon">
                  <i className="fas fa-exclamation-triangle text-warning"></i>
                </div>
                <p>Error al cargar notificaciones</p>
                <small>{error}</small>
              </div>
            ) : recentNotifications.length === 0 ? (
              // Estado vacío
              <div className="notification-empty">
                <div className="empty-icon">
                  <i className="fas fa-bell-slash"></i>
                </div>
                <p>No tienes notificaciones</p>
                <small>Las alertas de seguridad aparecerán aquí</small>
              </div>
            ) : (
              // Lista de notificaciones
              <div className="notifications-list">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`notification-item ${notification.status === 'UNREAD' ? 'unread' : 'read'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Indicador de estado */}
                    <div className="status-indicator">
                      {notification.status === 'UNREAD' && (
                        <div className="unread-dot" title="Sin leer"></div>
                      )}
                    </div>

                    {/* Icono de tipo de notificación */}
                    <div className="notification-icon">
                      <i className="fas fa-shield-alt text-danger"></i>
                    </div>

                    {/* Contenido de la notificación */}
                    <div className="notification-content">
                      <div className="notification-summary">
                        {getNotificationSummary(notification)}
                      </div>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {formatNotificationDate(notification.created_at)}
                        </span>
                        {notification.status === 'UNREAD' && (
                          <span className="unread-label">
                            <i className="fas fa-circle"></i>
                            Nueva
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Flecha indicadora */}
                    <div className="notification-arrow">
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer del dropdown */}
          {recentNotifications.length > 0 && (
            <div className="dropdown-footer">
              <Link
                to="/notifications"
                className="view-all-link"
                onClick={() => setDropdownOpen(false)}
              >
                <i className="fas fa-list me-2"></i>
                Ver todas las notificaciones
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;