import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet } from '../services/apiClient';

/**
 * Hook personalizado para manejo de imágenes paginadas con caché inteligente
 * Implementa sistema híbrido de "cargar más" en lugar de paginación tradicional
 */
const usePaginatedImages = (flightName, pageSize = 9) => {
  // Estados principales
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 0,
    total_images: 0,
    total_pages: 0,
    images_loaded: 0
  });

  // Caché de imágenes por vuelo
  const cache = useRef(new Map());
  const currentPage = useRef(1);
  const isInitialized = useRef(false);

  // Limpiar estado cuando cambia el vuelo
  useEffect(() => {
    if (flightName) {
      resetState();
      loadInitialImages();
    } else {
      resetState();
    }
  }, [flightName]);

  // Resetear todo el estado
  const resetState = useCallback(() => {
    setImages([]);
    setLoading(false);
    setError('');
    setHasMore(false);
    setPagination({
      current_page: 0,
      total_images: 0,
      total_pages: 0,
      images_loaded: 0
    });
    currentPage.current = 1;
    isInitialized.current = false;
  }, []);

  // Cargar imágenes iniciales
  const loadInitialImages = useCallback(async () => {
    if (!flightName || isInitialized.current) return;

    setLoading(true);
    setError('');

    try {
      // Verificar caché primero
      const cacheKey = `${flightName}_page_1`;
      if (cache.current.has(cacheKey)) {
        const cachedData = cache.current.get(cacheKey);
        setImages(cachedData.images);
        setPagination(cachedData.pagination);
        setHasMore(cachedData.pagination.has_next_page);
        currentPage.current = 1;
        isInitialized.current = true;
        setLoading(false);
        return;
      }

      // Llamar a la API
      const response = await apiGet(
        `https://fcjh115tmc.execute-api.us-east-2.amazonaws.com/prod/list-images/${flightName}?page=1&limit=${pageSize}`
      );

      console.log('🔍 Respuesta de API (página 1):', response);

      // Manejar estructura de respuesta
      let apiData;
      if (response.data.body) {
        apiData = JSON.parse(response.data.body);
      } else {
        apiData = response.data;
      }

      if (!apiData.images || !Array.isArray(apiData.images)) {
        throw new Error('Formato de respuesta inválido');
      }

      // Transformar imágenes
      const transformedImages = apiData.images.map((image, index) => ({
        id: `${flightName}_1_${index}`,
        src: image.url,
        thumbnail: image.url,
        alt: `${image.filename} del vuelo ${flightName}`,
        name: image.filename,
        size: formatFileSize(image.size || 0),
        uploadDate: image.last_modified || new Date().toISOString(),
        key: image.key,
        etag: image.etag,
        page: 1
      }));

      // Actualizar estados
      setImages(transformedImages);
      setPagination(apiData.pagination);
      setHasMore(apiData.pagination.has_next_page);
      currentPage.current = 1;
      isInitialized.current = true;

      // Guardar en caché
      cache.current.set(cacheKey, {
        images: transformedImages,
        pagination: apiData.pagination,
        timestamp: Date.now()
      });

    } catch (err) {
      console.error('❌ Error cargando imágenes iniciales:', err);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [flightName, pageSize]);

  // Cargar más imágenes
  const loadMoreImages = useCallback(async () => {
    if (!flightName || loading || !hasMore) return;

    const nextPage = currentPage.current + 1;
    console.log('📸 Cargando más imágenes, página:', nextPage);

    setLoading(true);
    setError('');

    try {
      // Verificar caché
      const cacheKey = `${flightName}_page_${nextPage}`;
      let newImages;
      let newPagination;

      if (cache.current.has(cacheKey)) {

        const cachedData = cache.current.get(cacheKey);
        newImages = cachedData.images;
        newPagination = cachedData.pagination;
      } else {
        // Llamar a la API
        const response = await apiGet(
          `https://fcjh115tmc.execute-api.us-east-2.amazonaws.com/prod/list-images/${flightName}?page=${nextPage}&limit=${pageSize}`
        );

        // Manejar estructura de respuesta
        let apiData;
        if (response.data.body) {
          apiData = JSON.parse(response.data.body);
        } else {
          apiData = response.data;
        }

        if (!apiData.images || !Array.isArray(apiData.images)) {
          throw new Error('Formato de respuesta inválido');
        }

        // Transformar nuevas imágenes
        newImages = apiData.images.map((image, index) => ({
          id: `${flightName}_${nextPage}_${index}`,
          src: image.url,
          thumbnail: image.url,
          alt: `${image.filename} del vuelo ${flightName}`,
          name: image.filename,
          size: formatFileSize(image.size || 0),
          uploadDate: image.last_modified || new Date().toISOString(),
          key: image.key,
          etag: image.etag,
          page: nextPage
        }));

        newPagination = apiData.pagination;

        // Guardar en caché
        cache.current.set(cacheKey, {
          images: newImages,
          pagination: newPagination,
          timestamp: Date.now()
        });
      }

      // Agregar nuevas imágenes a las existentes
      setImages(prevImages => [...prevImages, ...newImages]);
      setPagination(newPagination);
      setHasMore(newPagination.has_next_page);
      currentPage.current = nextPage;

    } catch (err) {
      console.error('❌ Error cargando más imágenes:', err);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [flightName, pageSize, loading, hasMore, images.length]);

  // Manejar errores de API
  const handleApiError = useCallback((err) => {
    if (err.response?.status === 401 || err.authExpired) {
      setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
    } else if (err.response?.status === 403) {
      setError('No tienes permisos para acceder a las imágenes de este vuelo.');
    } else if (err.response?.status === 404) {
      setError('No se encontraron imágenes para este vuelo.');
    } else {
      setError('No se pudieron cargar las imágenes. Por favor, inténtalo de nuevo.');
    }
  }, []);

  // Formatear tamaño de archivo
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Limpiar caché cuando sea necesario (opcional)
  const clearCache = useCallback(() => {
    cache.current.clear();
    console.log('🗑️ Caché de imágenes limpiado');
  }, []);

  // Información del caché para debugging
  const getCacheInfo = useCallback(() => {
    return {
      cacheSize: cache.current.size,
      cacheKeys: Array.from(cache.current.keys()),
      totalCachedImages: Array.from(cache.current.values()).reduce(
        (total, cached) => total + cached.images.length, 0
      )
    };
  }, []);

  return {
    // Estados principales
    images,
    loading,
    error,
    hasMore,
    pagination,
    
    // Acciones
    loadMoreImages,
    resetState,
    clearCache,
    
    // Información útil
    isInitialized: isInitialized.current,
    currentPage: currentPage.current,
    remainingImages: pagination.total_images - images.length,
    
    // Debug (opcional)
    getCacheInfo
  };
};

export default usePaginatedImages;