import React, { useState, useEffect } from 'react';

/**
 * Modal que aparece cuando la sesión está por expirar
 * @param {boolean} show - Si mostrar el modal
 * @param {number} timeRemaining - Tiempo restante en milisegundos
 * @param {Function} onExtend - Callback para extender sesión
 * @param {Function} onLogout - Callback para cerrar sesión
 * @param {Function} formatTime - Función para formatear tiempo
 */
const SessionTimeoutModal = ({ 
  show, 
  timeRemaining, 
  onExtend, 
  onLogout, 
  formatTime 
}) => {
  const [countdown, setCountdown] = useState(0);

  // Actualizar countdown cada segundo
  useEffect(() => {
    if (!show || !timeRemaining) return;

    setCountdown(Math.floor(timeRemaining / 1000));

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [show, timeRemaining]);

  // Formatear segundos a mm:ss
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-warning text-dark border-0">
            <h5 className="modal-title d-flex align-items-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Sesión por Expirar
            </h5>
          </div>
          
          <div className="modal-body text-center py-4">
            <div className="mb-4">
              <div className="session-timeout-icon mb-3">
                <i className="fas fa-clock text-warning" style={{ fontSize: '3rem' }}></i>
              </div>
              
              <h6 className="mb-3">Tu sesión está por expirar</h6>
              
              <p className="text-muted mb-3">
                Por seguridad, las sesiones se cierran automáticamente después de 8 horas de inactividad.
              </p>
              
              {countdown > 0 && (
                <div className="countdown-display">
                  <div className="bg-light rounded p-3 mb-3">
                    <div className="text-muted small mb-1">Tiempo restante:</div>
                    <div className="h4 mb-0 text-warning font-monospace">
                      {formatCountdown(countdown)}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="alert alert-info small mb-0">
                <i className="fas fa-info-circle me-1"></i>
                Haz clic en "Continuar Sesión" para extender tu tiempo de uso.
              </div>
            </div>
          </div>
          
          <div className="modal-footer border-0 justify-content-center">
            <button 
              type="button" 
              className="btn btn-outline-secondary me-2"
              onClick={onLogout}
            >
              <i className="fas fa-sign-out-alt me-1"></i>
              Cerrar Sesión
            </button>
            <button 
              type="button" 
              className="btn btn-warning"
              onClick={onExtend}
            >
              <i className="fas fa-refresh me-1"></i>
              Continuar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;