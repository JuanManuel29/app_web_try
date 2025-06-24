import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { formatNotificationDate, getNotificationSummary } from '../services/notificationService';

const NotificationBell = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasNewAnimation, setHasNewAnimation] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); // Nuevo estado para animaciones
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const lastUnreadCount = useRef(0);
  const navigate = useNavigate();

  const {
    unreadCount,
    getRecentNotifications,
    markAsRead,
    markAllAsRead,
    loading,
    error
  } = useNotifications();

  // Función para cerrar el dropdown con animación
  const handleCloseDropdown = () => {
    if (dropdownOpen && !isAnimating) {
      setIsAnimating(true);
      
      // Añadir clase de salida
      const dropdown = dropdownRef.current;
      if (dropdown) {
        dropdown.classList.remove('show');
        dropdown.classList.add('hide');
        
        // Esperar a que termine la animación antes de cerrar
        setTimeout(() => {
          setDropdownOpen(false);
          setIsAnimating(false);
        }, 400); // Duración de la animación
      }
    }
  };

  // Cerrar dropdown al hacer click fuera - MEJORADO CON ANIMACIONES
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        bellRef.current && 
        !bellRef.current.contains(event.target) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target)
      ) {
        handleCloseDropdown();
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [dropdownOpen, isAnimating]);

  // Manejar tecla Escape para cerrar dropdown
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && dropdownOpen) {
        handleCloseDropdown();
      }
    };

    if (dropdownOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
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

  // Toggle dropdown - MEJORADO CON ANIMACIONES
  const handleBellClick = (e) => {
    e.stopPropagation();
    
    if (!dropdownOpen && !isAnimating) {
      setIsAnimating(true);
      setDropdownOpen(true);
      setHasNewAnimation(false); // Quitar animación al abrir
      
      // Añadir clase show después de un frame para activar la animación
      requestAnimationFrame(() => {
        const dropdown = dropdownRef.current;
        if (dropdown) {
          dropdown.classList.remove('hide');
          dropdown.classList.add('show');
          setIsAnimating(false);
        }
      });
    } else if (dropdownOpen && !isAnimating) {
      handleCloseDropdown();
    }
  };

  // Manejar click en notificación - CORREGIDO CON NAVEGACIÓN
  const handleNotificationClick = async (notification) => {
    try {
      // Marcar como leída si no lo está
      if (notification.status === 'UNREAD') {
        await markAsRead(notification.notification_id);
      }
      
      // Cerrar dropdown con animación
      handleCloseDropdown();
      
      // Navegar a la página de notificaciones después de un pequeño delay
      setTimeout(() => {
        navigate('/notifications');
      }, 200);
      
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
      {/* Botón de campanita - MEJORADO CON ESTADOS ARIA */}
      <button
        ref={bellRef}
        className={`notification-bell ${hasNewAnimation ? 'has-new' : ''} ${dropdownOpen ? 'active' : ''}`}
        onClick={handleBellClick}
        type="button"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        title={unreadCount > 0 ? `${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer` : 'Sin notificaciones nuevas'}
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        <div className="bell-icon-wrapper">
          <i className="fas fa-bell bell-icon"></i>
          
          {/* Badge simple: solo circulito rojo si hay notificaciones */}
          {unreadCount > 0 && (
            <span 
              className="notification-badge"
              aria-label={`${unreadCount} notificaciones sin leer`}
            ></span>
          )}
        </div>
      </button>

      {/* Dropdown de notificaciones - MEJORADO CON ANIMACIONES */}
      {dropdownOpen && (
        <div 
          ref={dropdownRef} 
          className={`notification-dropdown ${dropdownOpen ? 'show' : 'hide'}`}
          role="menu"
          aria-label="Lista de notificaciones"
        >
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
                  aria-label="Marcar todas las notificaciones como leídas"
                >
                  <i className="fas fa-check-double"></i>
                  <span>Marcar todas</span>
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
                  <i className="fas fa-spinner fa-spin loading-icon"></i>
                </div>
                <p>Cargando notificaciones...</p>
              </div>
            ) : error ? (
              // Estado de error
              <div className="notification-error">
                <i className="fas fa-exclamation-triangle error-icon"></i>
                <p>Error al cargar notificaciones</p>
                <small>Por favor intenta de nuevo</small>
              </div>
            ) : recentNotifications.length === 0 ? (
              // Estado vacío
              <div className="notification-empty">
                <i className="fas fa-bell-slash empty-icon"></i>
                <p>No hay notificaciones</p>
                <small>Te notificaremos cuando recibas una nueva alerta</small>
              </div>
            ) : (
              // Lista de notificaciones
              <div className="notifications-list">
                {recentNotifications.map((notification, index) => (
                  <div
                    key={notification.notification_id}
                    className={`notification-item ${notification.status === 'UNREAD' ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Notificación: ${getNotificationSummary(notification)}. ${notification.status === 'UNREAD' ? 'Sin leer' : 'Leída'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick(notification);
                      }
                    }}
                  >
                    {/* Status indicator */}
                    <div className="status-indicator">
                      {notification.status === 'UNREAD' && (
                        <div className="unread-dot" aria-hidden="true"></div>
                      )}
                    </div>

                    {/* Notification icon */}
                    <div className="notification-icon" aria-hidden="true">
                      <i className="fas fa-shield-alt"></i>
                    </div>

                    {/* Notification content */}
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
                            <i className="fas fa-circle" aria-hidden="true"></i>
                            Sin leer
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="notification-arrow" aria-hidden="true">
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
                onClick={() => {
                  handleCloseDropdown();
                  // Pequeño delay para permitir que la animación termine
                  setTimeout(() => navigate('/notifications'), 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCloseDropdown();
                    setTimeout(() => navigate('/notifications'), 200);
                  }
                }}
              >
                <i className="fas fa-list me-1"></i>
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