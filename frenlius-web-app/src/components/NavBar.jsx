import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';

const Navbar = ({ user, signOut, handleSignIn }) => {
  const [expanded, setExpanded] = useState(false);
  const navbarRef = React.useRef(null);
  const location = useLocation(); // Hook para obtener la ubicación actual

  // Función para cerrar el navbar
  const closeNavbar = () => {
    setExpanded(false);
  };

  // Maneja el cierre al hacer clic fuera del navbar
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Verificar que el click no sea en el botón toggler
      const toggleButton = document.querySelector('.navbar-toggler');
      
      if (navbarRef.current && 
          !navbarRef.current.contains(event.target) && 
          !toggleButton.contains(event.target) &&
          expanded) {
        closeNavbar();
      }
    };

    if (expanded) {
      // Pequeño delay para evitar que se active inmediatamente
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expanded]);

  // Función para manejar el toggle del navbar
  const toggleNavbar = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    setExpanded(prevExpanded => {
      return !prevExpanded;
    });
  };

  // Función helper para determinar si un link está activo
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/" onClick={closeNavbar}>
          <div className="d-flex align-items-center">
            <div className="brand-icon me-2">
              <i className="fas fa-paper-plane"></i>
            </div>
            <span className="brand-text">Frenlius App</span>
          </div>
        </Link>
        
        <button
          className={`navbar-toggler custom-toggler ${expanded ? 'active' : ''}`}
          type="button"
          onClick={toggleNavbar}
          aria-expanded={expanded}
          aria-label="Toggle navigation"
        >
          <div className="toggler-line"></div>
          <div className="toggler-line"></div>
          <div className="toggler-line"></div>
        </button>

        <div 
          ref={navbarRef}
          className={`navbar-collapse ${expanded ? 'show' : ''}`}
          id="navbarNav"
        >
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {/* Inicio */}
            <li className="nav-item">
              <Link 
                className={`nav-link custom-nav-link ${isActiveLink('/') ? 'active' : ''}`}
                to="/" 
                onClick={closeNavbar}
              >
                <i className="fas fa-home nav-icon"></i>
                <span>Inicio</span>
              </Link>
            </li>
            
            {/* Subir Imágenes */}
            <li className="nav-item">
              <Link 
                className={`nav-link custom-nav-link ${isActiveLink('/upload') ? 'active' : ''}`}
                to="/upload" 
                onClick={closeNavbar}
              >
                <i className="fas fa-cloud-upload-alt nav-icon"></i>
                <span>Subir Imágenes</span>
              </Link>
            </li>
            
            {/* Mis Vuelos */}
            <li className="nav-item">
              <Link 
                className={`nav-link custom-nav-link ${isActiveLink('/flights') ? 'active' : ''}`}
                to="/flights" 
                onClick={closeNavbar}
              >
                <i className="fas fa-images nav-icon"></i>
                <span>Mis Vuelos</span>
              </Link>
            </li>

            {/* Stream en Vivo */}
            <li className="nav-item">
              <Link 
                className={`nav-link custom-nav-link ${isActiveLink('/live') ? 'active' : ''}`}
                to="/live" 
                onClick={closeNavbar}
              >
                <i className="fas fa-broadcast-tower nav-icon"></i>
                <span>Stream en Vivo</span>
              </Link>
            </li>

            {/* NUEVO: Notificaciones */}
            <li className="nav-item">
              <Link 
                className={`nav-link custom-nav-link ${isActiveLink('/notifications') ? 'active' : ''}`}
                to="/notifications" 
                onClick={closeNavbar}
              >
                <i className="fas fa-bell nav-icon"></i>
                <span>Notificaciones</span>
              </Link>
            </li>
          </ul>
          
          {/* User Section */}
          <div className="d-flex align-items-center">
            {user ? (
              <div className="d-flex align-items-center gap-3">
                {/* NUEVO: Campanita de notificaciones */}
                <NotificationBell />

                {/* User Info */}
                <div className="user-info d-none d-md-flex align-items-center">
                  <div className="user-avatar me-2">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user.username}</div>
                    <div className="user-email">
                      {user.attributes?.email || 'Usuario verificado'}
                    </div>
                  </div>
                </div>
                
                {/* Logout Button */}
                <button 
                  onClick={() => {
                    signOut();
                    closeNavbar();
                  }} 
                  className="btn btn-outline-light btn-modern btn-sm"
                >
                  <i className="fas fa-sign-out-alt me-1"></i>
                  <span className="d-none d-sm-inline">Cerrar sesión</span>
                  <span className="d-sm-none">Salir</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  handleSignIn && handleSignIn();
                  closeNavbar();
                }} 
                className="btn btn-outline-light btn-modern btn-sm"
              >
                <i className="fas fa-sign-in-alt me-1"></i>
                <span>Iniciar sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;