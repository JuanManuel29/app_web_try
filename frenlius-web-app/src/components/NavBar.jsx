import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, signOut, handleSignIn }) => {
  const [expanded, setExpanded] = useState(false);
  const navbarRef = React.useRef(null);

  // Función para cerrar el navbar
  const closeNavbar = () => {
    setExpanded(false);
  };

  // Maneja el cierre al hacer clic fuera del navbar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && 
          !navbarRef.current.contains(event.target) && 
          expanded) {
        closeNavbar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expanded]);

  // Función para manejar el toggle del navbar
  const toggleNavbar = () => {
    setExpanded(!expanded);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/" onClick={closeNavbar}>
          Frenlius App
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleNavbar}
          aria-expanded={expanded}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div 
          ref={navbarRef}
          className={`collapse navbar-collapse ${expanded ? 'show' : ''}`}
          id="navbarNav"
        >
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link 
                className={`nav-link custom-nav-link ${location.pathname === '/' ? 'active' : ''}`}
                to="/" 
                onClick={closeNavbar}
              >
                <i className="fas fa-home nav-icon"></i>
                <span>Inicio</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link custom-nav-link ${location.pathname === '/upload' ? 'active' : ''}`}
                to="/upload" 
                onClick={closeNavbar}
              >
                <i className="fas fa-cloud-upload-alt nav-icon"></i>
                <span>Upload Images</span>
              </Link>
            </li>
          </ul>
          
          <div className="d-flex align-items-center">
            {user ? (
              <>
                <button 
                  onClick={() => {
                    signOut();
                    closeNavbar();
                  }} 
                  className="btn btn-outline-light btn-sm"
                >
                  <i className="fas fa-sign-out-alt me-1"></i>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  handleSignIn();
                  closeNavbar();
                }} 
                className="btn btn-outline-light btn-sm"
              >
                <i className="fas fa-sign-in-alt me-1"></i>
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;