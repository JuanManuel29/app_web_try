import React from 'react';

/**
 * Componente integrado que combina progress bar + botón "Cargar más" en una sola sección
 * El botón aparece directamente donde antes estaba el texto "Siguiente: X imágenes más"
 */
const LoadMoreButton = ({ 
  onClick, 
  loading = false, 
  remainingImages = 0, 
  totalImages = 0,
  loadedImages = 0,
  pageSize = 9,
  disabled = false,
  className = ''
}) => {
  // Calcular cuántas imágenes se cargarán en el siguiente batch
  const nextBatchSize = Math.min(remainingImages, pageSize);
  
  // Calcular porcentaje de progreso
  const progressPercentage = totalImages > 0 ? (loadedImages / totalImages) * 100 : 0;
  
  // Si no quedan imágenes, mostrar solo el resumen final
  if (remainingImages <= 0 && totalImages > 0) {
    return (
      <div className={`load-more-container completed ${className}`}>
        {/* Resumen final */}
        <div className="load-more-info">
          <div className="progress-indicator">
            <div className="progress-text completed">
              <i className="fas fa-check-circle me-2"></i>
              <span className="completed-text">
                ¡Todas las imágenes cargadas! ({totalImages} imagen{totalImages !== 1 ? 'es' : ''})
              </span>
            </div>
            
            {/* Barra de progreso completa */}
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill completed"
                  style={{ width: '100%' }}
                ></div>
              </div>
              <small className="progress-label">
                ✅ Carga completa
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay imágenes en total, no mostrar nada
  if (totalImages === 0) {
    return null;
  }

  return (
    <div className={`load-more-container ${className}`}>
      {/* Información de progreso con botón integrado */}
      <div className="load-more-info">
        <div className="progress-indicator">
          {/* Texto de progreso principal */}
          <div className="progress-text">
            <i className="fas fa-images me-2"></i>
            <span className="progress-main">
              {loadedImages} de {totalImages} imagen{totalImages !== 1 ? 'es' : ''} cargada{loadedImages !== 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Barra de progreso visual */}
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${Math.max(5, progressPercentage)}%` }}
              >
                {/* Animación de shimmer mientras carga */}
                {loading && <div className="progress-shimmer"></div>}
              </div>
            </div>
            
            {/* Labels informativos */}
            <div className="progress-labels">
              <small className="progress-label left">
                {Math.round(progressPercentage)}% completado
              </small>
              <small className="progress-label right">
                {remainingImages} restante{remainingImages !== 1 ? 's' : ''}
              </small>
            </div>
          </div>

          {/* AQUÍ VA EL BOTÓN INTEGRADO - Reemplaza el texto "Siguiente:" */}
          {remainingImages > 0 && (
            <div className="integrated-button-section">
              <button
                onClick={onClick}
                disabled={loading || disabled || remainingImages <= 0}
                className="btn btn-load-more-integrated"
                type="button"
              >
                <div className="btn-content">
                  {loading ? (
                    <>
                      <div className="btn-icon loading">
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                      </div>
                      <div className="btn-text">
                        <span className="main-text">Cargando {nextBatchSize} imágenes...</span>
                        <small className="sub-text">Obteniendo del servidor • {remainingImages - nextBatchSize} después</small>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="btn-icon">
                        <i className="fas fa-plus"></i>
                      </div>
                      <div className="btn-text">
                        <span className="main-text">
                          Cargar {nextBatchSize} imagen{nextBatchSize !== 1 ? 'es' : ''} más
                        </span>
                      </div>
                      <div className="btn-arrow">
                        <i className="fas fa-chevron-down"></i>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Efecto de ondulación */}
                <div className="ripple-effect"></div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hints contextuales mejorados */}
      {!loading && remainingImages > 20 && loadedImages < totalImages * 0.3 && (
        <div className="load-more-hint">
          <i className="fas fa-lightbulb me-1"></i>
          <small>
            💡 Tip: Carga progresiva activada - Solo cargas las imágenes que necesitas ver
          </small>
        </div>
      )}
    </div>
  );
};

export default LoadMoreButton;