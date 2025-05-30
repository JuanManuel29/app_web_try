import React from 'react';

const AuthLayout = ({ 
  children, 
  title, 
  subtitle, 
  showBackButton = false, 
  onBack = null 
}) => {
  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            {showBackButton && (
              <button 
                onClick={onBack} 
                className="auth-back-button"
                type="button"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Volver
              </button>
            )}
            
            <div className="auth-brand">
              <div className="auth-brand-icon">
                <i className="fas fa-paper-plane"></i>
              </div>
              <h1 className="auth-brand-text">Frenlius</h1>
            </div>
            
            <div className="auth-title-section">
              <h2 className="auth-title">{title}</h2>
              {subtitle && <p className="auth-subtitle">{subtitle}</p>}
            </div>
          </div>

          {/* Content */}
          <div className="auth-content">
            {children}
          </div>

          {/* Footer */}
          <div className="auth-footer">
            <p>© 2025 Frenlius App. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;