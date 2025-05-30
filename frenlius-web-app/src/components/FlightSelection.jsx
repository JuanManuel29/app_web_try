import React, { useState, useEffect } from "react";
import { apiGet } from "../services/apiClient";

const FlightSelection = ({ onRouteSelect }) => {
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showManualFields, setShowManualFields] = useState(false);
    const [customDateTime, setCustomDateTime] = useState('');
    const [flightName, setFlightName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isBuilding, setIsBuilding] = useState(false);

    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                setLoading(true);
                console.log('Llamando API /list-routes con autenticación...');
                
                const response = await apiGet("https://9qqsfb1gy1.execute-api.us-east-2.amazonaws.com/prod/list-routes");
                
                const data = response.data.routes;
                setRoutes(data);
                setError("");
                console.log('Rutas obtenidas exitosamente:', data);
            } catch (error) {
                console.error("Error al obtener rutas:", error);
                
                // Manejar errores específicos de autorización
                if (error.response?.status === 401 || error.authExpired) {
                    setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
                } else if (error.response?.status === 403) {
                    setError("No tienes permisos para acceder a las rutas.");
                } else {
                    setError("No se pudieron cargar las rutas de vuelo. Por favor, inténtalo de nuevo.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRoutes();
    }, []);

    const handleSelect = (event) => {
        const route = event.target.value;
        setSelectedRoute(route);
        setFlightName("");
        setErrorMessage("");
        setShowManualFields(false);
    };

    const handleUseCurrentTime = () => {
        setShowManualFields(false);
        setErrorMessage("");
        setIsBuilding(true);
        
        // Simular un pequeño delay para mostrar el loading
        setTimeout(() => {
            const now = new Date();
            const formattedDate = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
            const fullFlightName = `${selectedRoute}-${formattedDate}`;
            setFlightName(fullFlightName);
            onRouteSelect(fullFlightName);
            setIsBuilding(false);
        }, 800);
    };

    const handleManualSelection = () => {
        setShowManualFields(!showManualFields);
        setErrorMessage("");
        if (!showManualFields) {
            setFlightName("");
            // Establecer datetime actual como valor por defecto
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            setCustomDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
        }
    };

    // Validar fecha y hora
    const validateDateTime = (dateTimeValue) => {
        if (!dateTimeValue) {
            setErrorMessage("Por favor selecciona una fecha y hora.");
            return false;
        }

        const selectedDateTime = new Date(dateTimeValue);
        const now = new Date();

        // Verificar que no sea una fecha inválida
        if (isNaN(selectedDateTime.getTime())) {
            setErrorMessage("Fecha y hora no válidas.");
            return false;
        }

        // Verificar que no sea futura
        if (selectedDateTime > now) {
            setErrorMessage("La fecha y hora no pueden ser futuras.");
            return false;
        }

        // Verificar que no sea muy antigua (opcional - por ejemplo, no más de 1 año atrás)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        if (selectedDateTime < oneYearAgo) {
            setErrorMessage("La fecha no puede ser mayor a un año atrás.");
            return false;
        }

        setErrorMessage("");
        return true;
    };

    const handleBuildCustomFlightName = () => {
        const isValid = validateDateTime(customDateTime);
        if (isValid) {
            setIsBuilding(true);
            
            setTimeout(() => {
                const selectedDateTime = new Date(customDateTime);
                const year = selectedDateTime.getFullYear();
                const month = String(selectedDateTime.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDateTime.getDate()).padStart(2, '0');
                const hours = String(selectedDateTime.getHours()).padStart(2, '0');
                const minutes = String(selectedDateTime.getMinutes()).padStart(2, '0');
                
                const formattedDate = `${year}${month}${day}-${hours}${minutes}`;
                const fullFlightName = `${selectedRoute}-${formattedDate}`;
                setFlightName(fullFlightName);
                onRouteSelect(fullFlightName);
                setErrorMessage("");
                setIsBuilding(false);
            }, 1000);
        }
    };

    if (loading) {
        return (
            <div className="flight-selection-container">
                <div className="flight-selection-card loading-card">
                    <div className="card-header">
                        <div className="header-icon">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                        <div className="header-content">
                            <h4>Cargando rutas de vuelo...</h4>
                            <p>Por favor espera un momento</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flight-selection-container">
                <div className="flight-selection-card error-card">
                    <div className="card-header">
                        <div className="header-icon error">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <div className="header-content">
                            <h4>Error al cargar rutas</h4>
                            <p>{error}</p>
                        </div>
                    </div>
                    <div className="card-actions">
                        <button 
                            onClick={() => window.location.reload()} 
                            className="btn btn-primary btn-modern"
                        >
                            <i className="fas fa-refresh me-2"></i>
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flight-selection-container">
            <div className="flight-selection-card">
                {/* Header */}
                <div className="card-header">
                    <div className="header-icon">
                        <i className="fas fa-route"></i>
                    </div>
                    <div className="header-content">
                        <h4>Selecciona una ruta de vuelo</h4>
                        <p>Elige la ruta y configura la fecha de tu vuelo</p>
                    </div>
                </div>

                {/* Route Selection */}
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
                                onChange={handleSelect}
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

                    {/* Time Selection */}
                    {selectedRoute && (
                        <div className="time-selection-section">
                            <label className="form-label">
                                <i className="fas fa-clock me-2"></i>
                                Configuración de fecha y hora
                            </label>
                            
                            <div className="time-options">
                                <button 
                                    className={`time-option ${!showManualFields ? 'active' : ''}`}
                                    onClick={handleUseCurrentTime}
                                    disabled={isBuilding}
                                >
                                    <div className="option-icon">
                                        <i className="fas fa-stopwatch"></i>
                                    </div>
                                    <div className="option-content">
                                        <h5>Hora actual</h5>
                                        <p>Usar fecha y hora del momento</p>
                                    </div>
                                    {isBuilding && !showManualFields && (
                                        <div className="option-loading">
                                            <div className="spinner-border spinner-border-sm" role="status"></div>
                                        </div>
                                    )}
                                </button>
                                
                                <button 
                                    className={`time-option ${showManualFields ? 'active' : ''}`}
                                    onClick={handleManualSelection}
                                    disabled={isBuilding}
                                >
                                    <div className="option-icon">
                                        <i className="fas fa-calendar-alt"></i>
                                    </div>
                                    <div className="option-content">
                                        <h5>Fecha personalizada</h5>
                                        <p>Seleccionar con calendario</p>
                                    </div>
                                    <div className="option-toggle">
                                        <i className={`fas fa-chevron-${showManualFields ? 'up' : 'down'}`}></i>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* DateTime Picker */}
                    {showManualFields && (
                        <div className="manual-fields-section">
                            <div className="fields-header">
                                <h5>
                                    <i className="fas fa-calendar-alt me-2"></i>
                                    Seleccionar fecha y hora
                                </h5>
                                <p>Elige la fecha y hora exacta de tu vuelo</p>
                            </div>
                            
                            <div className="datetime-picker-container">
                                <div className="datetime-field">
                                    <label className="field-label">
                                        <i className="fas fa-clock me-2"></i>
                                        Fecha y Hora del Vuelo
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="form-control modern-datetime-input"
                                        value={customDateTime}
                                        onChange={(e) => setCustomDateTime(e.target.value)}
                                        max={new Date().toISOString().slice(0, 16)} // No permitir fechas futuras
                                        min={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)} // Máximo 1 año atrás
                                    />
                                    <small className="datetime-help">
                                        <i className="fas fa-info-circle me-1"></i>
                                        Selecciona una fecha pasada (no futura) dentro del último año
                                    </small>
                                </div>
                            </div>
                            
                            <div className="build-section">
                                <button 
                                    className="btn btn-primary btn-build"
                                    onClick={handleBuildCustomFlightName}
                                    disabled={isBuilding || !customDateTime}
                                >
                                    {isBuilding ? (
                                        <>
                                            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                            Construyendo...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-cogs me-2"></i>
                                            Construir nombre de vuelo
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            {errorMessage && (
                                <div className="error-message">
                                    <i className="fas fa-exclamation-circle me-2"></i>
                                    {errorMessage}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Flight Name Result */}
                    {flightName && (
                        <div className="flight-result-section">
                            <div className="result-card">
                                <div className="result-header">
                                    <div className="result-icon">
                                        <i className="fas fa-check-circle"></i>
                                    </div>
                                    <h5>Vuelo configurado exitosamente</h5>
                                </div>
                                <div className="result-content">
                                    <div className="flight-name">
                                        <label>Nombre del vuelo:</label>
                                        <span className="flight-code">{flightName}</span>
                                    </div>
                                    <div className="result-actions">
                                        <button 
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => {
                                                setFlightName("");
                                                setSelectedRoute("");
                                                setShowManualFields(false);
                                                setCustomDateTime('');
                                            }}
                                        >
                                            <i className="fas fa-redo me-1"></i>
                                            Cambiar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FlightSelection;