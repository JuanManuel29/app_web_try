import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  onClick, 
  onError,
  placeholder = true 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  // IntersectionObserver para lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px' // Comenzar a cargar 100px antes de que sea visible
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = (e) => {
    setHasError(true);
    console.warn('Error cargando imagen:', src);
    if (onError) onError(e);
  };

  return (
    <div 
      ref={imgRef} 
      className={`lazy-image-container ${className}`} 
      onClick={onClick}
    >
      {/* Shimmer placeholder mientras carga */}
      {placeholder && !isLoaded && !hasError && (
        <div className="image-placeholder">
          <div className="placeholder-shimmer"></div>
          <div className="placeholder-content">
            <i className="fas fa-image placeholder-icon"></i>
            <span className="placeholder-text">Cargando...</span>
          </div>
        </div>
      )}

      {/* Imagen real */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy" // Doble protección con lazy loading nativo
        />
      )}

      {/* Estado de error */}
      {hasError && (
        <div className="image-error">
          <i className="fas fa-exclamation-triangle"></i>
          <span>Error al cargar</span>
        </div>
      )}

      {/* Overlay para interacción (solo si hay onClick) */}
      {onClick && isLoaded && !hasError && (
        <div className="image-overlay">
          <div className="overlay-content">
            <i className="fas fa-search-plus"></i>
            <span>Ver imagen</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;