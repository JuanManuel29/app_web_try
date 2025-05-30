import React, { useState, useEffect } from 'react';
import { apiGet } from '../services/apiClient';

const FlightViewer = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState({
    routes: false,
    flights: false,
    images: false
  });
  const [error, setError] = useState('');

  // Cargar rutas al montar el componente
  useEffect(() => {
    fetchRoutes();
  }, []);

  // Cargar vuelos cuando se selecciona una ruta
  useEffect(() => {
    if (selectedRoute) {
      fetchFlights(selectedRoute);
    } else {
      setFlights([]);
      setSelectedFlight('');
      setImages([]);
    }
  }, [selectedRoute]);

  // Cargar imágenes cuando se selecciona un vuelo
  useEffect(() => {
    if (selectedFlight) {
      fetchImages(selectedFlight);
    } else {
      setImages([]);
    }
  }, [selectedFlight]);

  const fetchRoutes = async () => {
    setLoading(prev => ({ ...prev, routes: true }));
    setError('');
    
    try {
      const response = await apiGet('https://9qqsfb1gy1.execute-api.us-east-2.amazonaws.com/prod/list-routes');
      setRoutes(response.data.routes || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      setError('Error al cargar las rutas');
    } finally {
      setLoading(prev => ({ ...prev, routes: false }));
    }
  };

  const fetchFlights = async (routeName) => {
    setLoading(prev => ({ ...prev, flights: true }));
    setError('');
    
    try {
      const response = await apiGet(`https://s6qtgo11jg.execute-api.us-east-2.amazonaws.com/prod/list-routes/${routeName}`);
      setFlights(response.data.flights || response.data || []);
    } catch (error) {
      console.error('Error fetching flights:', error);
      setError('Error al cargar los vuelos');
    } finally {
      setLoading(prev => ({ ...prev, flights: false }));
    }
  };

  const fetchImages = async (flightName) => {
    setLoading(prev => ({ ...prev, images: true }));
    setError('');
    
    try {
      // TODO: Reemplazar con la URL real de tu nueva API cuando esté lista
      const response = await apiGet(`https://s6qtgo11jg.execute-api.us-east-2.amazonaws.com/prod/flights/${flightName}/images`);
      setImages(response.data.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Error al cargar las imágenes');
    } finally {
      setLoading(prev => ({ ...prev, images: false }));
    }
  };

  const handleRouteChange = (e) => {
    setSelectedRoute(e.target.value);
    setSelectedFlight('');
  };

  const handleFlightChange = (e) => {
    setSelectedFlight(e.target.value);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  const downloadImage = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
      setError('Error al descargar la imagen');
    }
  };

  const openImageModal = (image, index) => {
    // TODO: Implementar modal para vista previa de imagen
    window.open(image.url, '_blank');
  };

  return (
    <div className="flight-viewer-container">
      <div className="card">
        {/* Header */}
        <div className="card-header">
          <div className="header-icon">
            <i className="fas fa-images"></i>
          </div>
          <div className="header-content">
            <h4>Mis Vuelos</h4>
            <p>Visualiza las imágenes de tus vuelos guardados</p>
          </div>
        </div>

        <div className="card-body">
          {/* Route Selection */}
          <div className="selection-section">
            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-route me-2"></i>
                Seleccionar Ruta
              </label>
              <div className="select-wrapper">
                <select
                  className="form-select modern-select"
                  value={selectedRoute}
                  onChange={handleRouteChange}
                  disabled={loading.routes}
                >
                  <option value="">
                    {loading.routes ? 'Cargando rutas...' : 'Selecciona una ruta...'}
                  </option>
                  {routes.map((route) => (
                    <option key={route} value={route}>
                      {route}
                    </option>
                  ))}
                </select>
                <div className="select-icon">
                  {loading.routes ? (
                    <div className="spinner-border spinner-border-sm" role="status"></div>
                  ) : (
                    <i className="fas fa-chevron-down"></i>
                  )}
                </div>
              </div>
            </div>

            {/* Flight Selection */}
            {selectedRoute && (
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-plane me-2"></i>
                  Seleccionar Vuelo
                </label>
                <div className="select-wrapper">
                  <select
                    className="form-select modern-select"
                    value={selectedFlight}
                    onChange={handleFlightChange}
                    disabled={loading.flights}
                  >
                    <option value="">
                      {loading.flights ? 'Cargando vuelos...' : 'Selecciona un vuelo...'}
                    </option>
                    {flights.map((flight) => (
                      <option key={flight} value={flight}>
                        {flight}
                      </option>
                    ))}
                  </select>
                  <div className="select-icon">
                    {loading.flights ? (
                      <div className="spinner-border spinner-border-sm" role="status"></div>
                    ) : (
                      <i className="fas fa-chevron-down"></i>
                    )}
                  </div>
                </div>
                
                {flights.length > 0 && (
                  <div className="flights-info">
                    <small className="text-muted">
                      <i className="fas fa-info-circle me-1"></i>
                      {flights.length} vuelo{flights.length !== 1 ? 's' : ''} encontrado{flights.length !== 1 ? 's' : ''} para {selectedRoute}
                    </small>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {/* Images Section */}
          {selectedFlight && (
            <div className="images-section">
              <div className="images-header">
                <h5>
                  <i className="fas fa-images me-2"></i>
                  Imágenes del Vuelo: {selectedFlight}
                </h5>
                {loading.images && (
                  <div className="loading-indicator">
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    Cargando imágenes...
                  </div>
                )}
              </div>

              {!loading.images && images.length === 0 && (
                <div className="no-images">
                  <div className="no-images-icon">
                    <i className="fas fa-image"></i>
                  </div>
                  <h6>No hay imágenes</h6>
                  <p>Este vuelo no tiene imágenes cargadas.</p>
                </div>
              )}

              {!loading.images && images.length > 0 && (
                <>
                  <div className="images-stats">
                    <span className="total-count">
                      {images.length} imagen{images.length !== 1 ? 'es' : ''}
                    </span>
                    <span className="total-size">
                      Tamaño total: {formatFileSize(images.reduce((acc, img) => acc + (img.size || 0), 0))}
                    </span>
                  </div>

                  <div className="images-grid">
                    {images.map((image, index) => (
                      <div key={index} className="image-card">
                        <div 
                          className="image-preview"
                          onClick={() => openImageModal(image, index)}
                        >
                          <img
                            src={image.url}
                            alt={`Imagen ${index + 1}`}
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="image-error" style={{ display: 'none' }}>
                            <i className="fas fa-exclamation-triangle"></i>
                            <span>Error al cargar</span>
                          </div>
                          <div className="image-overlay">
                            <i className="fas fa-search-plus"></i>
                          </div>
                        </div>
                        
                        <div className="image-info">
                          <div className="image-details">
                            <h6 className="image-name" title={image.filename || 'Imagen'}>
                              {image.filename || `Imagen ${index + 1}`}
                            </h6>
                            <div className="image-meta">
                              <span className="image-size">{formatFileSize(image.size || 0)}</span>
                              {image.last_modified && (
                                <span className="image-date">{formatDate(image.last_modified)}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="image-actions">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => window.open(image.url, '_blank')}
                              title="Ver en nueva pestaña"
                            >
                              <i className="fas fa-external-link-alt"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => downloadImage(image.url, image.filename || `imagen-${index + 1}.jpg`)}
                              title="Descargar imagen"
                            >
                              <i className="fas fa-download"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlightViewer;