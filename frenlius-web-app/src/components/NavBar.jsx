import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, signOut, handleSignIn }) => {
  const [expanded, setExpanded] = useState(false);
  const navbarRef = React.useRef(null);

  // Cierra el navbar cuando se hace clic en cualquier enlace/acción
  const closeNavbar = () => {
    setExpanded(false);
  };

  useEffect(() => {
    setExpanded(false); // Solo se ejecuta al montar el componente
  }, []);

  // Maneja el cierre al hacer clic fuera del navbar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && 
          !navbarRef.current.contains(event.target) && 
          !event.target.classList.contains('navbar-toggler') &&
          expanded) {
        closeNavbar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expanded]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/" onClick={closeNavbar}>
          Frenlius App
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => {
            setExpanded(!expanded);
          }}
          aria-expanded={expanded}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div 
          ref={navbarRef}
          className={`collapse navbar-collapse ${expanded ? 'show' : ''}`}
          style={{
            transition: 'height 0.3s ease, opacity 0.3s ease',
            overflow: 'hidden',
            // Añade estas propiedades CSS para mayor control
            height: expanded ? 'auto' : '0',
            opacity: expanded ? '1' : '0'
          }}
        >
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link 
                className="nav-link" 
                to="/" 
                onClick={() => {
                  closeNavbar();
                  // Asegura que la página se scrollée al inicio
                  window.scrollTo(0, 0);
                }}
              >
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className="nav-link" 
                to="/upload" 
                onClick={() => {
                  closeNavbar();
                  window.scrollTo(0, 0);
                }}
              >
                Upload Images
              </Link>
            </li>
          </ul>
          
          <div className="d-flex">
            {user ? (
              <>
                <span className="navbar-text text-light me-3">
                  Welcome, {user.attributes?.email || user.username}
                </span>
                <button 
                  onClick={() => {
                    signOut();
                    closeNavbar();
                    window.scrollTo(0, 0);
                  }} 
                  className="btn btn-outline-light"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  handleSignIn();
                  closeNavbar();
                }} 
                className="btn btn-outline-light"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
