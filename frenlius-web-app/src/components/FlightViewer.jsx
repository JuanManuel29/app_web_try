import React, { useState, useEffect } from 'react';
import { apiGet } from '../services/apiClient';
import LazyImage from './LazyImage';
import LoadMoreButton from './LoadMoreButton';
import usePaginatedImages from '../hooks/usePaginatedImages';
import usePaginatedFlights from '../hooks/usePaginatedFlights'; // NUEVO IMPORT

const FlightViewer = () => {
  // Estados principales
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedFlight, setSelectedFlight] = useState('');
  
  // Estados de carga
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  
  // Estados de error
  const [error, setError] = useState('');
  
  // Estado para lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ESTADOS PARA FILTROS DE FECHA (SOLO LO MÍNIMO)
  const [dateFilter, setDateFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [filterMode, setFilterMode] = useState('single');
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [filteredFlights, setFilteredFlights] = useState([]);

  // NUEVO HOOK: Paginación de vuelos
  const {
    flights,
    loading: loadingFlights,
    error: flightsError,
    hasMore: hasMoreFlights,
    pagination: flightsPagination,
    isInitialized: flightsInitialized,
    remainingFlights,
    loadMoreFlights,
    applyFilters: applyFlightsFilters,
    resetFilters: resetFlightsFilters,
    totalFlights,
    allFlightsLoaded
  } = usePaginatedFlights(selectedRoute, 12); // 12 vuelos por página

  // Hook personalizado para manejo de imágenes paginadas (ORIGINAL INTACTO)
  const {
    images,
    loading: loadingImages,
    error: imagesError,
    hasMore,
    remainingImages,
    loadMoreImages,
    pagination,
    isInitialized
  } = usePaginatedImages(selectedFlight, 9);

  // Cargar rutas al montar el componente
  useEffect(() => {
    fetchRoutes();
  }, []);

  // Limpiar filtros cuando cambien los vuelos
  useEffect(() => {
    if (allFlightsLoaded) {
      setFiltersApplied(false);
      setFilteredFlights([]);
    }
  }, [allFlightsLoaded]);

  // Obtener rutas disponibles (ORIGINAL)
  const fetchRoutes = async () => {
    try {
      setLoadingRoutes(true);
      setError('');
      
      const response = await apiGet('https://9qqsfb1gy1.execute-api.us-east-2.amazonaws.com/prod/list-routes');
      const data = response.data.routes;
      
      setRoutes(data);
    } catch (error) {
      console.error('Error cargando rutas:', error);
      
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

  // ELIMINADA: Ya no necesitamos fetchFlights, lo maneja el hook
  // const fetchFlights = async (routeName) => { ... }

  // ELIMINADA: Función auxiliar movida al hook
  // const extractDateFromFlightName = (flightName) => { ... }

  // NUEVA FUNCIÓN: Aplicar filtros manualmente usando el hook
  const handleApplyFilters = () => {
    const filtered = applyFlightsFilters(filterMode, dateFilter, dateFromFilter, dateToFilter);
    setFilteredFlights(filtered);
    setFiltersApplied(true);
  };

  // NUEVA FUNCIÓN: Limpiar filtros de fecha
  const clearDateFilters = () => {
    setDateFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setFilterMode('single');
    setFilteredFlights([]);
    setFiltersApplied(false);
    resetFlightsFilters(); // Usar función del hook
  };

  // NUEVA FUNCIÓN: Manejar cambio de modo de filtro
  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
    setDateFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setFilteredFlights([]);
    setFiltersApplied(false);
  };

  // NUEVA FUNCIÓN: Verificar si hay filtros configurados
  const hasFiltersConfigured = () => {
    return (filterMode === 'single' && dateFilter) || 
           (filterMode === 'range' && (dateFromFilter || dateToFilter));
  };

  // Formatear fecha para mostrar (mantener local para compatibilidad)
  const formatFlightDate = (flightName) => {
    try {
      const parts = flightName.split('-');
      
      if (parts.length >= 2) {
        const timeStr = parts[parts.length - 1];
        const dateStr = parts[parts.length - 2];
        
        if (dateStr.length === 8 && /^\d{8}$/.test(dateStr) &&
            timeStr.length === 4 && /^\d{4}$/.test(timeStr)) {
          
          const year = parseInt(dateStr.substring(0, 4));
          const month = parseInt(dateStr.substring(4, 6)) - 1;
          const day = parseInt(dateStr.substring(6, 8));
          const hour = parseInt(timeStr.substring(0, 2));
          const minute = parseInt(timeStr.substring(2, 4));
          
          const date = new Date(year, month, day, hour, minute);
          
          return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
    } catch (error) {
      console.error('Error formateando fecha del vuelo:', error);
    }
    return flightName;
  };

  // Manejar selección de ruta (ORIGINAL)
  const handleRouteSelect = (event) => {
    setSelectedRoute(event.target.value);
    setError('');
  };

  // Manejar selección de vuelo (ORIGINAL)
  const handleFlightSelect = (flightName) => {
    setSelectedFlight(flightName);
    setError('');
  };

  // Abrir lightbox (ORIGINAL)
  const openLightbox = (imageIndex) => {
    setCurrentImageIndex(imageIndex);
    setLightboxOpen(true);
  };

  // Resetear selección (ORIGINAL con limpiar filtros)
  const resetSelection = () => {
    setSelectedRoute('');
    setSelectedFlight('');
    setFlights([]);
    clearDateFilters();
    setError('');
  };

  // Manejar navegación del lightbox con teclado (ORIGINAL)
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

  // Usar error combinado
  const combinedError = error || flightsError;

  // Determinar qué vuelos mostrar
  const displayFlights = filtersApplied ? filteredFlights : flights;

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
      {/* Breadcrumb Navigation (ORIGINAL) */}
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

      {/* Header (ORIGINAL) */}
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
      {(combinedError || imagesError) && (
        <div className="error-message mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {combinedError || imagesError}
        </div>
      )}

      {/* Route Selection (ORIGINAL) */}
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

      {/* Flight Selection CON FILTROS AGREGADOS */}
      {selectedRoute && !selectedFlight && (
        <div className="flights-section">
          {/* MODIFICADO: Section header con filtros */}
          <div className="section-header">
            <h3>
              <i className="fas fa-plane me-2"></i>
              Vuelos Disponibles
            </h3>

            {/* NUEVO: Filtros de fecha */}
            {flightsInitialized && totalFlights > 0 && (
              <div className="date-filters-section">
                <div className="filter-mode-toggle">
                  <button
                    className={`btn btn-sm ${filterMode === 'single' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleFilterModeChange('single')}
                  >
                    <i className="fas fa-calendar-day me-1"></i>
                    Fecha específica
                  </button>
                  <button
                    className={`btn btn-sm ${filterMode === 'range' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleFilterModeChange('range')}
                  >
                    <i className="fas fa-calendar-week me-1"></i>
                    Rango de fechas
                  </button>
                </div>

                <div className="filter-inputs">
                  {filterMode === 'single' ? (
                    <div className="single-date-filter">
                      <label className="filter-label">
                        <i className="fas fa-calendar me-1"></i>
                        Fecha:
                      </label>
                      <input
                        type="date"
                        className="form-control date-input"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="range-date-filter">
                      <div className="date-range-input">
                        <label className="filter-label">
                          <i className="fas fa-calendar-plus me-1"></i>
                          Desde:
                        </label>
                        <input
                          type="date"
                          className="form-control date-input"
                          value={dateFromFilter}
                          onChange={(e) => setDateFromFilter(e.target.value)}
                        />
                      </div>
                      <div className="date-range-input">
                        <label className="filter-label">
                          <i className="fas fa-calendar-minus me-1"></i>
                          Hasta:
                        </label>
                        <input
                          type="date"
                          className="form-control date-input"
                          value={dateToFilter}
                          onChange={(e) => setDateToFilter(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {(dateFilter || dateFromFilter || dateToFilter) && (
                    <button
                      className="btn btn-outline-danger btn-sm clear-filters-btn"
                      onClick={clearDateFilters}
                      title="Limpiar filtros"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flights-count">
              {loadingFlights && !flightsInitialized ? (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              ) : hasFiltersConfigured() ? (
                <button
                  className="btn btn-primary btn-sm search-btn"
                  onClick={handleApplyFilters}
                >
                  <i className="fas fa-search me-1"></i>
                  Buscar
                </button>
              ) : (
                <span className="count-badge">
                  {displayFlights.length} {displayFlights.length === 1 ? 'vuelo' : 'vuelos'}
                  {filtersApplied && (
                    <small className="filter-indicator">filtrados</small>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* SISTEMA DE PAGINACIÓN CON FILTROS */}
          {loadingFlights && !flightsInitialized ? (
            <div className="flights-loading">
              <div className="loading-spinner">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando vuelos...</span>
                </div>
              </div>
              <p className="loading-text">Cargando vuelos para {selectedRoute}...</p>
            </div>
          ) : displayFlights.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-plane-slash"></i>
              </div>
              {filtersApplied ? (
                <>
                  <h4>No hay vuelos en las fechas seleccionadas</h4>
                  <p>No se encontraron vuelos para los filtros de fecha aplicados</p>
                  <button
                    onClick={clearDateFilters}
                    className="btn btn-primary btn-modern me-2"
                  >
                    <i className="fas fa-filter me-2"></i>
                    Limpiar filtros
                  </button>
                </>
              ) : (
                <>
                  <h4>No hay vuelos disponibles</h4>
                  <p>No se encontraron vuelos para la ruta <strong>{selectedRoute}</strong></p>
                </>
              )}
              <button
                onClick={() => setSelectedRoute('')}
                className="btn btn-outline-secondary btn-modern"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Seleccionar otra ruta
              </button>
            </div>
          ) : (
            <>
              {/* Grid de vuelos */}
              <div className="flights-grid">
                {displayFlights.map((flight, index) => (
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

              {/* Botón Cargar Más (solo si no hay filtros aplicados) */}
              {!filtersApplied && hasMoreFlights && (
                <div className="load-more-section">
cle                  
                  {/* Botón personalizado para vuelos */}
                  <div className="flights-load-more">
                    <button
                      onClick={loadMoreFlights}
                      disabled={loadingFlights}
                      className="btn btn-load-more-flights"
                    >
                      {loadingFlights ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Cargando...</span>
                          </div>
                          Cargando vuelos...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus me-2"></i>
                          Cargar más vuelos ({remainingFlights} restantes)
                        </>
                      )}
                    </button>
                    
                    <div className="flights-progress-info">
                      <small>
                        Mostrando {flights.length} de {flightsPagination.total_flights} vuelos
                      </small>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje si no hay más vuelos */}
              {!filtersApplied && !hasMoreFlights && flightsInitialized && flights.length > 0 && (
                <div className="pagination-info">
                  <span className="info-text">
                    <i className="fas fa-check-circle me-1"></i>
                    ✅ Todos los vuelos cargados ({flights.length} total)
                  </span>
                </div>
              )}

              {/* Indicador de progreso */}
              {flightsInitialized && (
                <div className="pagination-info">
                  <span className="info-text">
                    <i className="fas fa-plane me-1"></i>
                    Mostrando {displayFlights.length} 
                    {!filtersApplied && hasMoreFlights && <> de {flightsPagination.total_flights}</>} vuelos
                    {filtersApplied && <> filtrados</>}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Image Gallery - ORIGINAL COMPLETO */}
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
              {/* Grid de imágenes ORIGINAL */}
              <div className="images-grid">
                {images.map((image, index) => (
                  <div key={image.id} className="image-card">
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

              {/* LoadMoreButton ORIGINAL */}
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

      {/* Lightbox ORIGINAL COMPLETO */}
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