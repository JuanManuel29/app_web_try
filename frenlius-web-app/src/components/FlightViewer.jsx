import React, { useState, useEffect } from 'react';
import { apiGet } from '../services/apiClient';
import LazyImage from './LazyImage';
import LoadMoreButton from './LoadMoreButton';
import usePaginatedImages from '../hooks/usePaginatedImages';

const FlightViewer = () => {
  // Estados principales
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState('');
  
  // Estados de carga
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingFlights, setLoadingFlights] = useState(false);
  
  // Estados de error
  const [error, setError] = useState('');
  
  // Estado para lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Hook personalizado para manejo de imágenes paginadas
  const {
    images,
    loading: loadingImages,
    error: imagesError,
    hasMore,
    remainingImages,
    loadMoreImages,
    pagination,
    isInitialized
  } = usePaginatedImages(selectedFlight, 9); // 9 imágenes por página

  // Cargar rutas al montar el componente
  useEffect(() => {
    fetchRoutes();
  }, []);

  // Cargar vuelos cuando se selecciona una ruta
  useEffect(() => {
    if (selectedRoute) {
      fetchFlights(selectedRoute);
      setSelectedFlight('');
    }
  }, [selectedRoute]);

  // Obtener rutas disponibles
  const fetchRoutes = async () => {
    try {
      setLoadingRoutes(true);
      setError('');
      
      const response = await apiGet('https://9qqsfb1gy1.execute-api.us-east-2.amazonaws.com/prod/list-routes');
      const data = response.data.routes;
      
      setRoutes(data);
      //console.log('Rutas cargadas:', data);
    } catch (error) {
      console.error('Error cargando rutas:', error);
      
      // Manejar errores específicos de autorización
      if (error.response?.status === 401 || error.authExpired) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (error.response?.status === 403) {
        setError('No tienes permisos para acceder a las rutas.');
      } else {
        setError('No se pudieron cargar las rutas de vuelo. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setLoadingRoutes(false);
    }
  };

  // Obtener vuelos para una ruta específica
  const fetchFlights = async (routeName) => {
    try {
      setLoadingFlights(true);
      setError('');
      
      const response = await apiGet(`https://s6qtgo11jg.execute-api.us-east-2.amazonaws.com/prod/list-flights/${routeName}`);
      
      // Manejar la estructura de respuesta de API Gateway
      let data;
      if (response.data.body) {
        // Si la respuesta viene con body como string (API Gateway)
        data = JSON.parse(response.data.body);
      } else {
        // Si la respuesta viene directamente
        data = response.data;
      }
      
      // Extraer el array de vuelos
      const flights = data.flights || data || [];
      
      // Verificar que sea un array
      if (!Array.isArray(flights)) {
        console.error('La respuesta no contiene un array de vuelos:', flights);
        setError('Formato de respuesta inválido del servidor.');
        setFlights([]);
        return;
      }
      
      // Ordenar vuelos por fecha (más recientes primero)
      const sortedFlights = flights.sort((a, b) => {
        // Extraer fecha y hora del nombre del vuelo: "Ruta1-AAAAMMDD-HHMM"
        const dateA = extractDateFromFlightName(a);
        const dateB = extractDateFromFlightName(b);
        return dateB - dateA;
      });
      
      setFlights(sortedFlights);
      console.log('Vuelos cargados:', sortedFlights);
    } catch (error) {
      console.error('Error cargando vuelos:', error);
      setError('No se pudieron cargar los vuelos para esta ruta.');
      setFlights([]);
    } finally {
      setLoadingFlights(false);
    }
  };

  // Función auxiliar para extraer fecha del nombre del vuelo
  const extractDateFromFlightName = (flightName) => {
    try {
      // Formato: "Ruta-con-palabras-AAAAMMDD-HHMM"
      // Necesitamos encontrar los últimos 2 segmentos que son fecha y hora
      const parts = flightName.split('-');
      
      if (parts.length >= 2) {
        // Los últimos 2 elementos deben ser fecha (AAAAMMDD) y hora (HHMM)
        const timeStr = parts[parts.length - 1]; // HHMM (último)
        const dateStr = parts[parts.length - 2]; // AAAAMMDD (penúltimo)
        
        // Verificar que el penúltimo elemento sea una fecha válida (8 dígitos)
        // y el último sea una hora válida (4 dígitos)
        if (dateStr.length === 8 && /^\d{8}$/.test(dateStr) &&
            timeStr.length === 4 && /^\d{4}$/.test(timeStr)) {
          
          const year = parseInt(dateStr.substring(0, 4));
          const month = parseInt(dateStr.substring(4, 6)) - 1; // Los meses en JS van de 0-11
          const day = parseInt(dateStr.substring(6, 8));
          const hour = parseInt(timeStr.substring(0, 2));
          const minute = parseInt(timeStr.substring(2, 4));
          
          return new Date(year, month, day, hour, minute);
        }
      }
    } catch (error) {
      console.error('Error parseando fecha del vuelo:', error);
    }
    return new Date(0); // Fecha por defecto si hay error
  };

  // Formatear fecha para mostrar
  const formatFlightDate = (flightName) => {
    const date = extractDateFromFlightName(flightName);
    
    // Si no se pudo extraer una fecha válida, mostrar el nombre completo
    if (date.getTime() === 0) {
      return flightName;
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Manejar selección de ruta
  const handleRouteSelect = (event) => {
    setSelectedRoute(event.target.value);
    setError('');
  };

  // Manejar selección de vuelo
  const handleFlightSelect = (flightName) => {
    setSelectedFlight(flightName);
    setError('');
  };

  // Abrir lightbox
  const openLightbox = (imageIndex) => {
    setCurrentImageIndex(imageIndex);
    setLightboxOpen(true);
  };

  // Resetear selección
  const resetSelection = () => {
    setSelectedRoute('');
    setSelectedFlight('');
    setFlights([]);
    setError('');
  };

  // Manejar navegación del lightbox con teclado
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!lightboxOpen) return;
      
      switch (event.key) {
        case 'Escape':
          setLightboxOpen(false);
          break;
        case 'ArrowLeft':
          setCurrentImageIndex(
            currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1
          );
          break;
        case 'ArrowRight':
          setCurrentImageIndex(
            currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0
          );
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [lightboxOpen, currentImageIndex, images.length]);

  if (loadingRoutes) {
    return (
      <div className="flight-viewer-container">
        <div className="loading-card">
          <div className="card-header">
            <div className="header-icon">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
            <div className="header-content">
              <h4>Cargando vuelos...</h4>
              <p>Por favor espera un momento</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flight-viewer-container">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-section">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb modern-breadcrumb">
            <li className="breadcrumb-item">
              <i className="fas fa-images me-2"></i>
              Mis Vuelos
            </li>
            {selectedRoute && (
              <li className="breadcrumb-item active" aria-current="page">
                {selectedRoute}
              </li>
            )}
            {selectedFlight && (
              <li className="breadcrumb-item active" aria-current="page">
                {selectedFlight}
              </li>
            )}
          </ol>
        </nav>
      </div>

      {/* Header */}
      <div className="flight-viewer-header">
        <div className="header-content">
          <div className="header-icon">
            <i className="fas fa-images"></i>
          </div>
          <div className="header-text">
            <h1 className="page-title">Mis Vuelos</h1>
            <p className="page-subtitle">
              {!selectedRoute && 'Selecciona una ruta para ver los vuelos disponibles'}
              {selectedRoute && !selectedFlight && `Vuelos disponibles para la ruta ${selectedRoute}`}
              {selectedRoute && selectedFlight && `Imágenes del vuelo ${selectedFlight}`}
            </p>
          </div>
        </div>
        
        {(selectedRoute || selectedFlight) && (
          <button
            onClick={resetSelection}
            className="btn btn-outline-primary btn-modern"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Volver al inicio
          </button>
        )}
      </div>

      {/* Error Message */}
      {(error || imagesError) && (
        <div className="error-message mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error || imagesError}
        </div>
      )}

      {/* Route Selection */}
      {!selectedRoute && (
        <div className="route-selection-card">
          <div className="card-header">
            <div className="header-icon">
              <i className="fas fa-route"></i>
            </div>
            <div className="header-content">
              <h4>Selecciona una Ruta</h4>
              <p>Elige la ruta de la cual quieres ver los vuelos</p>
            </div>
          </div>
          
          <div className="card-body">
            <div className="form-section">
              <label className="form-label">
                <i className="fas fa-map-marked-alt me-2"></i>
                Ruta de vuelo
              </label>
              <div className="select-wrapper">
                <select
                  className="form-select modern-select"
                  value={selectedRoute}
                  onChange={handleRouteSelect}
                >
                  <option value="">Selecciona una ruta...</option>
                  {routes.map((route) => (
                    <option key={route} value={route}>
                      {route}
                    </option>
                  ))}
                </select>
                <div className="select-icon">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flight Selection */}
      {selectedRoute && !selectedFlight && (
        <div className="flights-section">
          <div className="section-header">
            <h3>
              <i className="fas fa-plane me-2"></i>
              Vuelos Disponibles
            </h3>
            <div className="flights-count">
              {loadingFlights ? (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              ) : (
                <span className="count-badge">
                  {flights.length} {flights.length === 1 ? 'vuelo' : 'vuelos'}
                </span>
              )}
            </div>
          </div>

          {loadingFlights ? (
            <div className="flights-loading">
              <div className="loading-spinner">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando vuelos...</span>
                </div>
              </div>
              <p className="loading-text">Cargando vuelos para {selectedRoute}...</p>
            </div>
          ) : flights.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-plane-slash"></i>
              </div>
              <h4>No hay vuelos disponibles</h4>
              <p>No se encontraron vuelos para la ruta <strong>{selectedRoute}</strong></p>
              <button
                onClick={() => setSelectedRoute('')}
                className="btn btn-primary btn-modern"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Seleccionar otra ruta
              </button>
            </div>
          ) : (
            <div className="flights-grid">
              {flights.map((flight, index) => (
                <div
                  key={flight}
                  className="flight-card"
                  onClick={() => handleFlightSelect(flight)}
                >
                  <div className="flight-card-header">
                    <div className="flight-icon">
                      <i className="fas fa-plane-departure"></i>
                    </div>
                    <div className="flight-date">
                      {formatFlightDate(flight)}
                    </div>
                  </div>
                  
                  <div className="flight-card-body">
                    <h5 className="flight-name">{flight}</h5>
                    <p className="flight-meta">
                      <i className="fas fa-images me-1"></i>
                      Haz clic para ver imágenes
                    </p>
                  </div>
                  
                  <div className="flight-card-arrow">
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Gallery - SISTEMA HÍBRIDO CON PROGRESO INTEGRADO */}
      {selectedFlight && (
        <div className="images-section">
          <div className="section-header">
            <h3>
              <i className="fas fa-camera me-2"></i>
              Imágenes del Vuelo
            </h3>
            <div className="section-actions">
              <button
                onClick={() => setSelectedFlight('')}
                className="btn btn-outline-secondary btn-sm"
              >
                <i className="fas fa-arrow-left me-1"></i>
                Volver a vuelos
              </button>
            </div>
          </div>

          {/* Estado inicial de carga */}
          {!isInitialized && loadingImages ? (
            <div className="images-loading">
              <div className="loading-spinner">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando imágenes...</span>
                </div>
              </div>
              <p className="loading-text">Cargando imágenes del vuelo {selectedFlight}...</p>
            </div>
          ) : images.length === 0 && !loadingImages ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-image-slash"></i>
              </div>
              <h4>No hay imágenes disponibles</h4>
              <p>No se encontraron imágenes para el vuelo <strong>{selectedFlight}</strong></p>
            </div>
          ) : (
            <>
              {/* Grid de imágenes */}
              <div className="images-grid">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="image-card"
                  >
                    <LazyImage
                      src={image.thumbnail}
                      alt={image.alt}
                      className="image-thumbnail"
                      onClick={() => openLightbox(index)}
                      onError={(e) => {
                        console.warn(`Error cargando imagen: ${image.name}`);
                      }}
                    />
                    <div className="image-info">
                      <div className="image-name" title={image.name}>{image.name}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* NUEVO: LoadMoreButton integrado con progreso completo */}
              <LoadMoreButton
                onClick={loadMoreImages}
                loading={loadingImages}
                remainingImages={remainingImages}
                totalImages={pagination.total_images}
                loadedImages={images.length}
                pageSize={9}
                disabled={!hasMore}
                className="centered"
              />
            </>
          )}
        </div>
      )}

      {/* Enhanced Lightbox Modal - SIN CAMBIOS */}
      {lightboxOpen && images.length > 0 && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <div className="lightbox-title">
                {images[currentImageIndex]?.name}
                <div className="lightbox-subtitle">
                  Vuelo: {selectedFlight}
                </div>
              </div>
              <div className="lightbox-actions">
                <button
                  className="lightbox-close"
                  onClick={() => setLightboxOpen(false)}
                  title="Cerrar (Esc)"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <div className="lightbox-content">
              <img
                src={images[currentImageIndex]?.src}
                alt={images[currentImageIndex]?.alt}
                className="lightbox-image"
                onError={(e) => {
                  console.error(`Error cargando imagen en lightbox: ${images[currentImageIndex]?.name}`);
                  e.target.style.display = 'none';
                }}
              />
            </div>
            
            <div className="lightbox-controls">
              <button
                className="lightbox-prev"
                onClick={() => setCurrentImageIndex(
                  currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1
                )}
                disabled={images.length <= 1}
                title="Imagen anterior (←)"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              
              <div className="lightbox-counter">
                {currentImageIndex + 1} de {images.length}
              </div>
              
              <button
                className="lightbox-next"
                onClick={() => setCurrentImageIndex(
                  currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0
                )}
                disabled={images.length <= 1}
                title="Imagen siguiente (→)"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightViewer;