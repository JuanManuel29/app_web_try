import React, { useState, useEffect } from 'react';
import { apiPost } from '../services/apiClient';

const CreateRouteModal = ({ isOpen, onClose, onRouteCreated, existingRoutes = [] }) => {
  const [routeName, setRouteName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validation, setValidation] = useState({
    isValid: false,
    message: '',
    details: []
  });

  // Limpiar formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setRouteName('');
      setError('');
      setValidation({ isValid: false, message: '', details: [] });
    }
  }, [isOpen]);

  // Validar en tiempo real mientras el usuario escribe
  useEffect(() => {
    if (routeName.trim()) {
      validateRouteName(routeName.trim());
    } else {
      setValidation({ isValid: false, message: '', details: [] });
    }
  }, [routeName, existingRoutes]);

  // Función de validación en frontend (similar a la del backend)
  const validateRouteName = (name) => {
    const issues = [];
    let isValid = true;

    // Verificar longitud mínima
    if (name.length < 3) {
      issues.push('Debe tener al menos 3 caracteres');
      isValid = false;
    }

    // Verificar longitud máxima
    if (name.length > 50) {
      issues.push('No puede exceder 50 caracteres');
      isValid = false;
    }

    // Verificar caracteres válidos
    if (!/^[a-zA-Z-]+$/.test(name)) {
      issues.push('Solo se permiten letras y guiones');
      isValid = false;
    }

    // Verificar que empiece con letra
    if (name && !name[0].match(/[a-zA-Z]/)) {
      issues.push('Debe empezar con una letra');
      isValid = false;
    }

    // Verificar que no termine con guión
    if (name.endsWith('-')) {
      issues.push('No puede terminar con guión');
      isValid = false;
    }

    // Verificar guiones consecutivos
    if (name.includes('--')) {
      issues.push('No se permiten guiones consecutivos');
      isValid = false;
    }

    // Verificar duplicados (case-insensitive)
    const existingLower = existingRoutes.map(route => route.toLowerCase());
    if (existingLower.includes(name.toLowerCase())) {
      issues.push('Esta ruta ya existe');
      isValid = false;
    }

    setValidation({
      isValid,
      message: isValid ? 'Nombre válido' : 'Corrige los siguientes errores:',
      details: issues
    });
  };

  // Formatear nombre como lo hará el backend (preview)
  const formatPreview = (name) => {
    if (!name) return '';
    
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validation.isValid || loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiPost('https://ymnvioh0y3.execute-api.us-east-2.amazonaws.com/prod/create-route', {
        new_route: routeName.trim()
      });

      console.log('Ruta creada exitosamente:', response.data);
      
      // Notificar al componente padre
      onRouteCreated({
        newRoute: response.data.new_route,
        originalInput: response.data.original_input,
        allRoutes: response.data.all_routes
      });
      
      // Cerrar modal
      onClose();
      
    } catch (err) {
      console.error('Error creando ruta:', err);
      
      if (err.response?.status === 409) {
        setError('Esta ruta ya existe. Elige un nombre diferente.');
      } else if (err.response?.status === 400) {
        setError(err.response.data?.message || 'Formato de nombre inválido.');
      } else if (err.response?.status === 401 || err.authExpired) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else {
        setError('Error al crear la ruta. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // No renderizar nada si el modal no está abierto
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header del modal */}
        <div className="modal-header">
          <div className="modal-title-section">
            <h3 className="modal-title">
              <i className="fas fa-plus-circle me-2"></i>
              Crear Nueva Ruta
            </h3>
            <p className="modal-subtitle">
              Agrega una nueva ruta de vuelo al sistema
            </p>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={loading}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            
            {/* Input principal */}
            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-route me-2"></i>
                Nombre de la Ruta
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className={`form-control modern-input ${
                    routeName ? (validation.isValid ? 'is-valid' : 'is-invalid') : ''
                  }`}
                  placeholder="Ruta-de-vuelo"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  disabled={loading}
                  autoFocus
                  maxLength={50}
                />
                <div className="input-icon">
                  {routeName && (
                    <i className={`fas ${
                      validation.isValid ? 'fa-check text-success' : 'fa-times text-danger'
                    }`}></i>
                  )}
                </div>
              </div>
              
              {/* Contador de caracteres */}
              <div className="character-counter">
                <small className={routeName.length > 45 ? 'text-warning' : 'text-muted'}>
                  {routeName.length}/50 caracteres
                </small>
              </div>
            </div>

            {/* Preview del nombre formateado */}
            {routeName && validation.isValid && (
              <div className="preview-section">
                <label className="form-label">
                  <i className="fas fa-eye me-2"></i>
                  Preview (como se guardará)
                </label>
                <div className="preview-box">
                  <span className="preview-text">{formatPreview(routeName)}</span>
                  <i className="fas fa-magic text-primary ms-2" title="Auto-formateado"></i>
                </div>
              </div>
            )}

            {/* Validación en tiempo real */}
            {routeName && (
              <div className="validation-section">
                <div className={`validation-message ${validation.isValid ? 'valid' : 'invalid'}`}>
                  <i className={`fas ${validation.isValid ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`}></i>
                  {validation.message}
                </div>
                {validation.details.length > 0 && (
                  <ul className="validation-details">
                    {validation.details.map((detail, index) => (
                      <li key={index}>
                        <i className="fas fa-times text-danger me-1"></i>
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Reglas y limitaciones */}
            <div className="rules-section">
              <h6 className="rules-title">
                <i className="fas fa-info-circle me-2"></i>
                Reglas para el nombre
              </h6>
              <div className="rules-grid">
                <div className="rule-item">
                  <i className="fas fa-check text-success me-2"></i>
                  <span>Solo letras y guiones</span>
                </div>
                <div className="rule-item">
                  <i className="fas fa-check text-success me-2"></i>
                  <span>Mínimo 3 caracteres</span>
                </div>
                <div className="rule-item">
                  <i className="fas fa-check text-success me-2"></i>
                  <span>Empezar con letra</span>
                </div>
                <div className="rule-item">
                  <i className="fas fa-times text-danger me-2"></i>
                  <span>Sin espacios o números</span>
                </div>
                <div className="rule-item">
                  <i className="fas fa-times text-danger me-2"></i>
                  <span>Sin caracteres especiales</span>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {/* Botones del footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary btn-modern"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-modern"
                disabled={!validation.isValid || loading}
              >
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus me-2"></i>
                    Crear Ruta
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRouteModal;