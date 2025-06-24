import { useState, useCallback, useEffect, useRef } from 'react';
import { apiGet } from '../services/apiClient';

/**
 * Hook personalizado para manejar la paginación de vuelos
 * @param {string} routeName - Nombre de la ruta seleccionada
 * @param {number} pageSize - Número de vuelos por página (default: 12)
 * @returns {Object} Estado y funciones para manejar vuelos paginados
 */
const usePaginatedFlights = (routeName, pageSize = 12) => {
  // Estados principales
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_flights: 0,
    flights_per_page: pageSize,
    has_next_page: false,
    has_previous_page: false
  });

  // Referencias para mantener estado entre renders
  const currentPage = useRef(1);
  const isInitialized = useRef(false);
  const allFlights = useRef([]); // Almacenar todos los vuelos para filtrado y paginación local

  // Función auxiliar para extraer fecha del nombre del vuelo
  const extractDateFromFlightName = useCallback((flightName) => {
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
          
          return new Date(year, month, day, hour, minute);
        }
      }
    } catch (error) {
      console.error('Error parseando fecha del vuelo:', error);
    }
    return new Date(0);
  }, []);

  // Función auxiliar para extraer fecha en formato AAAAMMDD
  const extractDateStringFromFlightName = useCallback((flightName) => {
    try {
      const parts = flightName.split('-');
      
      if (parts.length >= 2) {
        const dateStr = parts[parts.length - 2];
        
        if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
          return dateStr;
        }
      }
    } catch (error) {
      console.error('Error extrayendo fecha del vuelo:', error);
    }
    return null;
  }, []);

  // Cargar vuelos iniciales
  const loadInitialFlights = useCallback(async () => {
    if (!routeName) {
      setFlights([]);
      setError('');
      isInitialized.current = false;
      return;
    }

    console.log('🛩️ Cargando vuelos iniciales para ruta:', routeName);
    
    setLoading(true);
    setError('');

    try {
      const response = await apiGet(`https://s6qtgo11jg.execute-api.us-east-2.amazonaws.com/prod/list-flights/${routeName}`);
      
      // Manejar la estructura de respuesta de API Gateway
      let data;
      if (response.data.body) {
        data = JSON.parse(response.data.body);
      } else {
        data = response.data;
      }
      
      // Extraer el array de vuelos
      const flightsArray = data.flights || data || [];
      
      if (!Array.isArray(flightsArray)) {
        throw new Error('Formato de respuesta inválido del servidor.');
      }

      // Ordenar vuelos por fecha (más recientes primero)
      const sortedFlights = flightsArray.sort((a, b) => {
        const dateA = extractDateFromFlightName(a);
        const dateB = extractDateFromFlightName(b);
        return dateB - dateA;
      });

      // Almacenar todos los vuelos
      allFlights.current = sortedFlights;

      // Calcular paginación
      const totalFlights = sortedFlights.length;
      const totalPages = Math.ceil(totalFlights / pageSize);
      const initialFlights = sortedFlights.slice(0, pageSize);

      // Actualizar estados
      setFlights(initialFlights);
      setPagination({
        current_page: 1,
        total_pages: totalPages,
        total_flights: totalFlights,
        flights_per_page: pageSize,
        has_next_page: totalPages > 1,
        has_previous_page: false
      });
      setHasMore(totalPages > 1);
      currentPage.current = 1;
      isInitialized.current = true;

      console.log('✅ Vuelos cargados:', {
        total: sortedFlights.length,
        primeraPagina: initialFlights.length,
        totalPaginas: totalPages,
        hasMore: totalPages > 1,
        pageSize
      });

    } catch (err) {
      console.error('❌ Error cargando vuelos:', err);
      handleApiError(err);
      allFlights.current = [];
      setFlights([]);
    } finally {
      setLoading(false);
    }
  }, [routeName, pageSize, extractDateFromFlightName]);

  // Cargar más vuelos (paginación local)
  const loadMoreFlights = useCallback(() => {
    if (!hasMore || loading) return;

    const nextPage = currentPage.current + 1;
    const startIndex = (nextPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const newFlights = allFlights.current.slice(startIndex, endIndex);

    console.log(`📄 Cargando página ${nextPage}: vuelos ${startIndex}-${endIndex}`);

    setFlights(prevFlights => [...prevFlights, ...newFlights]);
    
    setPagination(prev => ({
      ...prev,
      current_page: nextPage,
      has_next_page: nextPage < prev.total_pages,
      has_previous_page: nextPage > 1
    }));

    setHasMore(nextPage < pagination.total_pages);
    currentPage.current = nextPage;

    console.log(`📊 Ahora mostrando ${flights.length + newFlights.length} de ${allFlights.current.length} vuelos`);
  }, [hasMore, loading, pageSize, flights.length, pagination.total_pages]);

  // Aplicar filtros de fecha
  const applyFilters = useCallback((filterMode, dateFilter, dateFromFilter, dateToFilter) => {
    if (!allFlights.current.length) return [];

    let filtered = [...allFlights.current];

    if (filterMode === 'single' && dateFilter) {
      const filterDateStr = dateFilter.replace(/-/g, '');
      filtered = allFlights.current.filter(flight => {
        const flightDateStr = extractDateStringFromFlightName(flight);
        return flightDateStr === filterDateStr;
      });
    } else if (filterMode === 'range' && (dateFromFilter || dateToFilter)) {
      const fromDateStr = dateFromFilter ? dateFromFilter.replace(/-/g, '') : null;
      const toDateStr = dateToFilter ? dateToFilter.replace(/-/g, '') : null;
      
      filtered = allFlights.current.filter(flight => {
        const flightDateStr = extractDateStringFromFlightName(flight);
        if (!flightDateStr) return false;
        
        if (fromDateStr && flightDateStr < fromDateStr) return false;
        if (toDateStr && flightDateStr > toDateStr) return false;
        
        return true;
      });
    }

    console.log('🔍 Filtros aplicados:', filtered.length, 'vuelos de', allFlights.current.length, 'totales');

    // Los vuelos filtrados se muestran todos de una vez (sin paginación)
    return filtered;
  }, [extractDateStringFromFlightName]);

  // Resetear a todos los vuelos (primera página)
  const resetFilters = useCallback(() => {
    if (!allFlights.current.length) return;

    const totalFlights = allFlights.current.length;
    const totalPages = Math.ceil(totalFlights / pageSize);
    const initialFlights = allFlights.current.slice(0, pageSize);

    setFlights(initialFlights);
    setPagination({
      current_page: 1,
      total_pages: totalPages,
      total_flights: totalFlights,
      flights_per_page: pageSize,
      has_next_page: totalPages > 1,
      has_previous_page: false
    });
    setHasMore(totalPages > 1);
    currentPage.current = 1;

    console.log('🔄 Filtros reseteados, mostrando primera página');
  }, [pageSize]);

  // Manejar errores de API
  const handleApiError = useCallback((err) => {
    if (err.response?.status === 401 || err.authExpired) {
      setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
    } else if (err.response?.status === 403) {
      setError('No tienes permisos para acceder a los vuelos de esta ruta.');
    } else if (err.response?.status === 404) {
      setError('No se encontraron vuelos para esta ruta.');
    } else {
      setError('No se pudieron cargar los vuelos. Por favor, inténtalo de nuevo.');
    }
  }, []);

  // Limpiar cuando cambie la ruta
  useEffect(() => {
    setFlights([]);
    setError('');
    setHasMore(false);
    currentPage.current = 1;
    isInitialized.current = false;
    allFlights.current = [];
    
    if (routeName) {
      loadInitialFlights();
    }
  }, [routeName, loadInitialFlights]);

  // Calcular vuelos restantes
  const remainingFlights = Math.max(0, pagination.total_flights - flights.length);

  return {
    // Estados
    flights,
    loading,
    error,
    hasMore,
    pagination,
    isInitialized: isInitialized.current,
    remainingFlights,
    
    // Funciones
    loadMoreFlights,
    applyFilters,
    resetFilters,
    
    // Datos adicionales
    totalFlights: allFlights.current.length,
    allFlightsLoaded: allFlights.current.length > 0
  };
};

export default usePaginatedFlights;