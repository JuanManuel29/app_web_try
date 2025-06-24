import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { Amplify } from "aws-amplify";
import { getCurrentUser, signOut, fetchAuthSession } from '@aws-amplify/auth';
import { Hub } from '@aws-amplify/core';
import awsConfig from "./aws-export";

// Components
import Navbar from "./components/NavBar";
import FlightSelection from "./components/FlightSelection";
import ImageUpload from './components/ImageUpload';
import FlightViewer from './components/FlightViewer';
import LiveStreamPage from './pages/LiveStreamPage';
import NotificationsPage from './components/NotificationsPage';
import SessionTimeoutModal from './components/SessionTimeoutModal';

// Auth Components
import Login from './components/Auth/Login';
import ForgotPassword from './components/Auth/ForgotPassword';
import NewPasswordRequired from './components/Auth/NewPasswordRequired';

// Notification Context
import { NotificationProvider } from './contexts/NotificationContext';

// Hooks
import { useSessionTimeout } from './hooks/useSessionTimeout';

// Auth Utils
import { 
  setSessionStartTime, 
  clearSessionData, 
  isSessionExpired 
} from './utils/authUtils';

// Configure Amplify
Amplify.configure(awsConfig);

function App() {
  const [selectedRoute, setSelectedRoute] = useState("");
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' | 'forgotPassword' | 'newPasswordRequired'
  const [newPasswordData, setNewPasswordData] = useState({ username: '', signInStep: null }); // Para cambio de contraseña obligatorio
  const navigate = useNavigate();

  // Session timeout hook
  const {
    isSessionActive,
    isWarningShown,
    timeRemaining,
    setSessionStartTime: startSessionTimer,
    clearSession: clearSessionTimer,
    extendSession,
    endSession,
    formatTimeRemaining,
  } = useSessionTimeout(
    // onSessionExpired
    () => {
      console.log('🔒 Sesión expirada automáticamente');
      handleSessionExpired();
    },
    // onWarning
    (remaining) => {
      console.log('⚠️ Advertencia: sesión expirará en', formatTimeRemaining(remaining));
    }
  );

  // Manejar expiración de sesión
  const handleSessionExpired = async () => {
    try {
      await signOut();
      setUser(null);
      setAuthView('login');
      clearSessionData();
      clearSessionTimer();
      
      console.log('Sesión cerrada por inactividad');
      
    } catch (error) {
      console.error('Error cerrando sesión expirada:', error);
      // Forzar limpieza aunque haya error
      setUser(null);
      setAuthView('login');
      clearSessionData();
      clearSessionTimer();
    }
  };

  // Manejar extensión de sesión
  const handleExtendSession = () => {
    console.log('🔄 Usuario extendió la sesión');
    extendSession();
  };

  // Manejar logout desde modal
  const handleLogoutFromModal = () => {
    console.log('👋 Usuario cerró sesión desde modal');
    endSession();
  };

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        // Verificar si la sesión ha expirado
        if (isSessionExpired()) {
          console.log('🔒 Sesión expirada detectada en verificación inicial');
          await handleSessionExpired();
          return;
        }
        
        // También obtener y almacenar el access token si no existe
        try {
          const session = await fetchAuthSession();
          const accessToken = session.tokens?.accessToken?.toString();
          
          if (accessToken && !sessionStorage.getItem('accessToken')) {
            sessionStorage.setItem('accessToken', accessToken);
            console.log('Access token restaurado en sesión existente');
          }
        } catch (tokenError) {
          console.log('No se pudo obtener access token en verificación:', tokenError);
        }
        
        setUser(currentUser);
        
        // Iniciar timer de sesión si no existe
        if (!sessionStorage.getItem('sessionStartTime')) {
          setSessionStartTime();
          startSessionTimer();
        }
        
        //console.log('Usuario autenticado:', currentUser);
      } catch (err) {
        //console.log('Usuario no autenticado:', err);
        setUser(null);
        // Limpiar token si no hay usuario autenticado
        clearSessionData();
        clearSessionTimer();
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();

    // Listen for auth events
    const hubListener = Hub.listen('auth', ({ payload }) => {
      //console.log('Auth event:', payload.event);
      switch (payload.event) {
        case 'signedIn':
          getCurrentUser()
            .then(user => {
              console.log('Usuario logueado:', user);
              setUser(user);
              setAuthView('login'); // Reset auth view
              
              // Establecer timestamp de sesión
              setSessionStartTime();
              startSessionTimer();
              
              navigate('/');
            })
            .catch(err => console.log('Error obteniendo usuario:', err));
          break;
        case 'signedOut':
          console.log('Usuario deslogueado');
          setUser(null);
          setAuthView('login'); // Reset to login view
          
          // Limpiar datos de sesión
          clearSessionData();
          clearSessionTimer();
          
          navigate('/');
          break;
      }
    });

    return () => hubListener(); // Cleanup
  }, [navigate, startSessionTimer, clearSessionTimer]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setAuthView('login');
      
      // Limpiar datos de sesión
      clearSessionData();
      clearSessionTimer();
      
      console.log('Sign out exitoso y datos de sesión eliminados');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Auth Success Handler
  const handleAuthSuccess = () => {
    // El Hub listener se encargará de actualizar el estado del usuario
    console.log('Autenticación exitosa');
  };

  // Auth View Switchers
  const switchToLogin = () => setAuthView('login');
  const switchToForgotPassword = () => setAuthView('forgotPassword');
  const switchToNewPasswordRequired = (username, signInStep) => {
    setNewPasswordData({ username, signInStep });
    setAuthView('newPasswordRequired');
  };

  // Loading state
  if (!authChecked) {
    return (
      <div className="loading-container">
        <div className="text-center">
          <div className="loading-spinner">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
          <div className="loading-text mt-4">
            <h5 className="mb-2">Verificando autenticación...</h5>
            <p className="text-muted mb-0">Por favor espera un momento</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar componentes de autenticación
  if (!user) {
    return (
      <div className="auth-app">
        {authView === 'login' && (
          <Login
            onSuccess={handleAuthSuccess}
            onSwitchToForgotPassword={switchToForgotPassword}
            onNewPasswordRequired={switchToNewPasswordRequired}
          />
        )}
        
        {authView === 'forgotPassword' && (
          <ForgotPassword
            onSuccess={() => {
              // Después de cambiar contraseña exitosamente, ir al login
              setAuthView('login');
            }}
            onSwitchToLogin={switchToLogin}
          />
        )}

        {authView === 'newPasswordRequired' && (
          <NewPasswordRequired
            username={newPasswordData.username}
            signInStep={newPasswordData.signInStep}
            onSuccess={handleAuthSuccess}
            onBackToLogin={switchToLogin}
          />
        )}
      </div>
    );
  }

  // Usuario autenticado - mostrar aplicación principal con NotificationProvider
  return (
    <NotificationProvider>
      <Navbar user={user} signOut={handleSignOut} />
      
      {/* Modal de timeout de sesión */}
      <SessionTimeoutModal
        show={isWarningShown}
        timeRemaining={timeRemaining}
        onExtend={handleExtendSession}
        onLogout={handleLogoutFromModal}
        formatTime={formatTimeRemaining}
      />
      
      <div className="main-content">
        <Routes>
          <Route 
            path="/" 
            element={
              <div className="hero-section">
                <div className="welcome-container">
                  <div className="welcome-card glass-effect">
                    <div className="welcome-header">
                      <div className="welcome-icon">
                        <i className="fas fa-rocket"></i>
                      </div>
                      <h1 className="welcome-title">
                        ¡Bienvenido de vuelta, <span className="gradient-text">{user.username}</span>!
                      </h1>
                      <p className="welcome-subtitle">
                        Gestiona tus vuelos y visualiza datos en tiempo real
                      </p>
                    </div>
                    <div className="welcome-features">
                      <div className="row g-4">
                        <div className="col-lg-3 col-md-6">
                          <Link to="/upload" className="text-decoration-none">
                            <div className="action-card h-100">
                              <div className="action-icon">
                                <i className="fas fa-cloud-upload-alt"></i>
                              </div>
                              <h4>Subir Imágenes</h4>
                              <p>Selecciona una ruta y carga tus imágenes de vuelo</p>
                              <div className="action-arrow">
                                <i className="fas fa-arrow-right"></i>
                              </div>
                            </div>
                          </Link>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <Link to="/flights" className="text-decoration-none">
                            <div className="action-card h-100">
                              <div className="action-icon secondary">
                                <i className="fas fa-images"></i>
                              </div>
                              <h4>Mis Vuelos</h4>
                              <p>Explora y visualiza las imágenes de tus vuelos</p>
                              <div className="action-arrow">
                                <i className="fas fa-arrow-right"></i>
                              </div>
                            </div>
                          </Link>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <Link to="/live" className="text-decoration-none">
                            <div className="action-card h-100">
                              <div className="action-icon">
                                <i className="fas fa-broadcast-tower"></i>
                              </div>
                              <h4>Stream en Vivo</h4>
                              <p>Monitoreo en tiempo real de vuelos</p>
                              <div className="action-arrow">
                                <i className="fas fa-arrow-right"></i>
                              </div>
                            </div>
                          </Link>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <Link to="/notifications" className="text-decoration-none">
                            <div className="action-card h-100">
                              <div className="action-icon secondary">
                                <i className="fas fa-bell"></i>
                              </div>
                              <h4>Alertas</h4>
                              <p>Alertas de seguridad y notificaciones del sistema</p>
                              <div className="action-arrow">
                                <i className="fas fa-arrow-right"></i>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* User Info Section */}
                    {/* <div className="user-info-section">
                      <div className="user-stats">
                        <div className="stat-item">
                          <div className="stat-icon">
                            <i className="fas fa-user-circle"></i>
                          </div>
                          <div className="stat-content">
                            <h6>Usuario</h6>
                            <p>{user.attributes?.email || user.username}</p>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-icon">
                            <i className="fas fa-calendar-check"></i>
                          </div>
                          <div className="stat-content">
                            <h6>Miembro desde</h6>
                            <p>
                              {user.attributes?.email_verified === 'true' ? 'Verificado' : 'Pendiente'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div> */}
                  </div>
                </div>
              </div>
            } 
          />
          
          <Route 
            path="/upload" 
            element={
              <div className="upload-page">
                <div className="page-header">
                  <div className="container">
                    <div className="header-content">
                      <div className="header-icon">
                        <i className="fas fa-cloud-upload-alt"></i>
                      </div>
                      <div className="header-text">
                        <h1 className="page-title">Subir Imágenes de Vuelo</h1>
                        <p className="page-subtitle">Selecciona una ruta de vuelo y carga tus imágenes</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="container">
                  <div className="upload-content">
                    <FlightSelection onRouteSelect={setSelectedRoute} />
                    {selectedRoute && <ImageUpload selectedRoute={selectedRoute} />}
                  </div>
                </div>
              </div>
            } 
          />
          
          <Route 
            path="/flights" 
            element={
              <div className="flights-page">
                <div className="page-header">
                  <div className="container">
                    <div className="header-content">
                      <div className="header-icon">
                        <i className="fas fa-images"></i>
                      </div>
                      <div className="header-text">
                        <h1 className="page-title">Mis Vuelos</h1>
                        <p className="page-subtitle">Explora y visualiza las imágenes de tus vuelos</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="container">
                  <div className="flights-content">
                    <FlightViewer />
                  </div>
                </div>
              </div>
            } 
          />

          {/* Stream en Vivo */}
          <Route 
            path="/live" 
            element={<LiveStreamPage />} 
          />

          {/* NUEVA RUTA: Página de Notificaciones */}
          <Route 
            path="/notifications" 
            element={
              <div className="notifications-page">
                <div className="page-header">
                  <div className="container">
                    <div className="header-content">
                      <div className="header-icon">
                        <i className="fas fa-bell"></i>
                      </div>
                      <div className="header-text">
                        <h1 className="page-title">Notificaciones</h1>
                        <p className="page-subtitle">Alertas de seguridad y notificaciones del sistema</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="container">
                  <div className="notifications-content">
                    <NotificationsPage />
                  </div>
                </div>
              </div>
            } 
          />  
          
          {/* Ruta de fallback */}
          <Route 
            path="*" 
            element={
              <div className="not-found-page">
                <div className="container">
                  <div className="not-found-content">
                    <div className="not-found-icon">
                      <i className="fas fa-plane-slash"></i>
                    </div>
                    <h2>Página no encontrada</h2>
                    <p>La página que buscas no existe o ha sido movida.</p>
                    <Link to="/" className="btn btn-primary btn-modern">
                      <i className="fas fa-home me-2"></i>
                      Volver al inicio
                    </Link>
                  </div>
                </div>
              </div>
            } 
          />
        </Routes>
      </div>
    </NotificationProvider>
  );
}

export default App;