import React, { useState, useEffect } from 'react';
import { apiGet } from '../services/apiClient';
import LazyImage from './LazyImage';

const FlightViewer = () => {
  // Estados principales
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState('');
  const [images, setImages] = useState([]);
  
  // Estados de carga
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  
  // Estados de error
  const [error, setError] = useState('');
  
  // Estado para lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Cargar rutas al montar el componente
  useEffect(() => {
    fetchRoutes();
  }, []);

  // Cargar vuelos cuando se selecciona una ruta
  useEffect(() => {
    if (selectedRoute) {
      fetchFlights(selectedRoute);
      setSelectedFlight('');
      setImages([]);
    }
  }, [selectedRoute]);

  // Cargar imágenes cuando se selecciona un vuelo
  useEffect(() => {
    if (selectedFlight) {
      fetchImages(selectedFlight);
    }
  }, [selectedFlight]);

  // Obtener rutas disponibles
  const fetchRoutes = async () => {
    try {
      setLoadingRoutes(true);
      setError('');
      
      const response = await apiGet('https://9qqsfb1gy1.execute-api.us-east-2.amazonaws.com/prod/list-routes');
      const data = response.data.routes;
      
      setRoutes(data);
      console.log('Rutas cargadas:', data);
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

  // Obtener imágenes para un vuelo específico
  const fetchImages = async (flightName) => {
    try {
      setLoadingImages(true);
      setError('');
      
      console.log('🔍 Llamando API de imágenes para:', flightName);
      console.log('🔍 URL completa:', `https://fcjh115tmc.execute-api.us-east-2.amazonaws.com/prod/list-images/${flightName}`);
      
      // Usar tu API real de imágenes
      const response = await apiGet(`https://fcjh115tmc.execute-api.us-east-2.amazonaws.com/prod/list-images/${flightName}`);
      
      console.log('🔍 Respuesta completa:', response);
      console.log('🔍 Response.data:', response.data);
      
      // Manejar la estructura de respuesta de API Gateway
      let apiData;
      if (response.data.body) {
        // Si la respuesta viene con body como string (API Gateway)
        apiData = JSON.parse(response.data.body);
        console.log('🔍 Data parseada desde body:', apiData);
      } else {
        // Si la respuesta viene directamente
        apiData = response.data;
        console.log('🔍 Data directa:', apiData);
      }
      
      console.log('🔍 ApiData.images:', apiData.images);
      
      // Verificar que exista el array de imágenes
      if (!apiData.images || !Array.isArray(apiData.images)) {
        console.error('❌ No hay array de imágenes en la respuesta:', apiData);
        setError('No se encontraron imágenes en la respuesta del servidor.');
        setImages([]);
        return;
      }
      
      // Transformar la respuesta de tu API al formato que espera el componente
      const transformedImages = apiData.images.map((image, index) => ({
        id: index + 1,
        src: image.url, // URL pre-firmada de tu API
        thumbnail: image.url, // Usando la misma URL como thumbnail por ahora
        alt: `${image.filename} del vuelo ${flightName}`,
        name: image.filename,
        size: formatFileSize(image.size || 0),
        uploadDate: image.last_modified || new Date().toISOString(),
        key: image.key,
        etag: image.etag
      }));
      
      setImages(transformedImages);
      console.log('Imágenes cargadas:', transformedImages);
    } catch (error) {
      console.error('Error cargando imágenes:', error);
      
      // Manejar errores específicos
      if (error.response?.status === 401 || error.authExpired) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (error.response?.status === 403) {
        setError('No tienes permisos para acceder a las imágenes de este vuelo.');
      } else if (error.response?.status === 404) {
        setError('No se encontraron imágenes para este vuelo.');
      } else {
        setError('No se pudieron cargar las imágenes para este vuelo.');
      }
      setImages([]);
    } finally {
      setLoadingImages(false);
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

  // Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    setImages([]);
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
      {error && (
        <div className="error-message mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
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

      {/* Image Gallery */}
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

          {loadingImages ? (
            <div className="images-loading">
              <div className="loading-spinner">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando imágenes...</span>
                </div>
              </div>
              <p className="loading-text">Cargando imágenes del vuelo {selectedFlight}...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-image-slash"></i>
              </div>
              <h4>No hay imágenes disponibles</h4>
              <p>No se encontraron imágenes para el vuelo <strong>{selectedFlight}</strong></p>
            </div>
          ) : (
            <>
              <div className="images-info">
                <span className="images-count">
                  {images.length} {images.length === 1 ? 'imagen' : 'imágenes'}
                </span>
                <span className="flight-info">
                  Vuelo: <strong>{selectedFlight}</strong>
                </span>
              </div>
              
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
                      {/* <div className="image-meta">
                        <span className="image-size">{image.size}</span>
                      </div> */}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Enhanced Lightbox Modal */}
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
                {/* <a
                  href={images[currentImageIndex]?.src}
                  download={images[currentImageIndex]?.name}
                  className="lightbox-download"
                  title="Descargar imagen"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fas fa-download"></i>
                </a> */}
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
                {/* <div className="lightbox-info">
                  {images[currentImageIndex]?.size}
                </div> */}
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