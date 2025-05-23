import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import { Amplify } from "aws-amplify";
import { getCurrentUser, signOut, signInWithRedirect, fetchAuthSession } from '@aws-amplify/auth';
import { Hub } from '@aws-amplify/core';
import awsConfig from "./aws-export";

// Components
import Navbar from "./components/NavBar";
import FlightSelection from "./components/FlightSelection";
import ImageUpload from './components/ImageUpload';

// Configure Amplify
Amplify.configure(awsConfig);

Hub.listen('auth', ({ payload }) => {
  switch (payload.event) {
    case 'signInWithRedirect':
      getCurrentUser() // ✅ Usa la función importada
        .then(user => console.log('Usuario autenticado:', user))
        .catch(() => console.log('No autenticado'));
      break;
  }
});



function App() {
  const [selectedRoute, setSelectedRoute] = useState("");
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        setUser(null);
        if (window.location.pathname !== '/') {
          navigate('/');
        }
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();

    // Listen for auth events
    const hubListener = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          getCurrentUser().then(user => {
            setUser(user);
            navigate('/');
          });
          break;
        case 'signedOut':
          setUser(null);
          navigate('/');
          break;
      }
    });

    return () => hubListener(); // Cleanup
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSignIn = async () => {
    try {

      console.log('Config:', Amplify.getConfig().Auth);

      await signInWithRedirect({
        provider: 'Cognito',
        options: {
          redirectTo: window.location.origin
        }
      });
    } catch (error) {
      console.error('Error signing in:', error);
      // Fallback manual
      window.location.href = `https://${awsConfig.Auth.Cognito.loginWith.oauth.domain}/oauth2/authorize?client_id=${awsConfig.Auth.Cognito.userPoolClientId}&response_type=code&scope=email+openid+profile&redirect_uri=${window.location.origin}`;
    }
  };

  if (!authChecked) {
    return <div className="text-center mt-5">Cargando...</div>;
  }

  return (
    <>
      <Navbar user={user} signOut={handleSignOut} handleSignIn={handleSignIn} />
      <div className="container mt-5">
        <Routes>
          <Route 
            path="/" 
            element={
              user ? (
                <div className="text-center">
                  <h1 className="text-navy">¡Bienvenido {user.username}!</h1>
                  <p>Selecciona "Upload Images" en el menú para comenzar.</p>
                </div>
              ) : (
                <div className="text-center">
                  <h1 className="text-navy">Haz click para iniciar sesión</h1>
                  <button 
                    onClick={handleSignIn} 
                    className="btn btn-primary"
                  >
                    Iniciar sesión
                  </button>
                </div>
              )
            } 
          />
          <Route 
            path="/upload" 
            element={
              user ? (
                <>
                  <div className="text-center">
                    <h1 className="text-navy">Subir imágenes de vuelo</h1>
                  </div>
                  <FlightSelection onRouteSelect={setSelectedRoute} />
                  {selectedRoute && <ImageUpload selectedRoute={selectedRoute} />}
                </>
              ) : (
                <div className="text-center">
                  <h2 className="text-danger">Debes iniciar sesión para acceder</h2>
                  <button 
                    onClick={handleSignIn} 
                    className="btn btn-primary mt-3"
                  >
                    Iniciar sesión
                  </button>
                </div>
              )
            } 
          />
        </Routes>
      </div>
    </>
  );
}

export default App;


