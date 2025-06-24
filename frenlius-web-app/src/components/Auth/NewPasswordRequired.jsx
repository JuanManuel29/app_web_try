import React, { useState, useMemo } from 'react';
import { confirmSignIn, fetchAuthSession } from 'aws-amplify/auth';
import { setSessionStartTime } from '../../utils/authUtils';

const NewPasswordRequired = ({ username, signInStep, onSuccess, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Criterios de validación de contraseña
  const passwordCriteria = [
    { test: (pwd) => pwd.length >= 8, label: 'Al menos 8 caracteres' },
    { test: (pwd) => /[A-Z]/.test(pwd), label: 'Una letra mayúscula' },
    { test: (pwd) => /[a-z]/.test(pwd), label: 'Una letra minúscula' },
    { test: (pwd) => /\d/.test(pwd), label: 'Un número' },
    { test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd), label: 'Un carácter especial' }
  ];

  // Manejar cambios en campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validar campo en tiempo real
    validateField(name, value);

    // Limpiar error general si el usuario está escribiendo
    if (error) {
      setError('');
    }
  };

  // Validar campo individual
  const validateField = (field, value) => {
    let isValid = true;
    let message = '';
    let strength = 0;

    if (field === 'newPassword') {
      if (!value) {
        isValid = false;
        message = 'La nueva contraseña es requerida';
      } else {
        const passedCriteria = passwordCriteria.filter(criteria => criteria.test(value));
        strength = passedCriteria.length;
        
        if (value.length < 8) {
          isValid = false;
          message = 'La contraseña debe tener al menos 8 caracteres';
        } else if (strength < 3) {
          isValid = false;
          message = 'La contraseña debe cumplir al menos 3 criterios de seguridad';
        }
      }
    } else if (field === 'confirmPassword') {
      if (!value) {
        isValid = false;
        message = 'Confirma tu nueva contraseña';
      } else if (value !== formData.newPassword) {
        isValid = false;
        message = 'Las contraseñas no coinciden';
      }
    }

    setFieldErrors(prev => ({
      ...prev,
      [field]: { isValid, message, strength }
    }));

    return isValid;
  };

  // Validar formulario completo (memoizado para evitar loops)
  const isFormValid = useMemo(() => {
    // Validar nueva contraseña
    const passwordValid = formData.newPassword && 
      formData.newPassword.length >= 8 && 
      passwordCriteria.filter(criteria => criteria.test(formData.newPassword)).length >= 3;
    
    // Validar confirmación
    const confirmValid = formData.confirmPassword && 
      formData.confirmPassword === formData.newPassword;
    
    return passwordValid && confirmValid;
  }, [formData.newPassword, formData.confirmPassword]);

  // Función de validación para campos individuales
  const validateForm = () => {
    const passwordValid = validateField('newPassword', formData.newPassword);
    const confirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);
    
    return passwordValid && confirmPasswordValid;
  };

  // Manejar submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { isSignedIn } = await confirmSignIn({
        challengeResponse: formData.newPassword,
      });

      if (isSignedIn) {
        // Obtener el access token después del cambio de contraseña exitoso
        try {
          const session = await fetchAuthSession();
          const accessToken = session.tokens?.accessToken?.toString();
          
          if (accessToken) {
            // Almacenar el token para uso en API calls
            sessionStorage.setItem('accessToken', accessToken);
            console.log('Access token almacenado exitosamente después de cambio de contraseña');
            
            // NUEVO: Establecer timestamp de inicio de sesión
            setSessionStartTime();
            console.log('🕒 Timestamp de sesión establecido después de cambio de contraseña');
          }
          
          onSuccess();
        } catch (tokenError) {
          console.error('Error obteniendo access token:', tokenError);
          // Continuar con el login aunque no se obtenga el token
          // pero establecer timestamp de sesión de todas formas
          setSessionStartTime();
          onSuccess();
        }
      } else {
        setError('Error completando el cambio de contraseña');
      }
    } catch (err) {
      console.error('Error cambiando contraseña:', err);
      
      // Mensajes de error amigables
      switch (err.name) {
        case 'InvalidPasswordException':
          setError('La contraseña no cumple con los requisitos de seguridad');
          break;
        case 'InvalidParameterException':
          setError('La contraseña ingresada no es válida');
          break;
        case 'NotAuthorizedException':
          setError('No autorizado para cambiar contraseña. Intenta iniciar sesión nuevamente.');
          break;
        case 'TooManyRequestsException':
          setError('Demasiados intentos. Intenta más tarde.');
          break;
        default:
          setError('Error cambiando contraseña. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <i className="fas fa-key text-warning"></i>
          </div>
          <h2 className="auth-title">Nueva Contraseña Requerida</h2>
          <p className="auth-subtitle">
            Hola <strong>{username}</strong>, necesitas establecer una nueva contraseña para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">
              <i className="fas fa-lock me-2"></i>
              Nueva Contraseña
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              className={`form-control ${fieldErrors.newPassword && !fieldErrors.newPassword.isValid ? 'is-invalid' : ''}`}
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Ingresa tu nueva contraseña"
              disabled={loading}
              autoComplete="new-password"
            />
            {fieldErrors.newPassword && !fieldErrors.newPassword.isValid && (
              <div className="invalid-feedback">
                {fieldErrors.newPassword.message}
              </div>
            )}
            
            {/* Indicador de fortaleza de contraseña */}
            {formData.newPassword && (
              <div className="password-strength mt-2">
                <div className="password-criteria">
                  {passwordCriteria.map((criteria, index) => (
                    <div key={index} className={`criteria-item ${criteria.test(formData.newPassword) ? 'valid' : 'invalid'}`}>
                      <i className={`fas ${criteria.test(formData.newPassword) ? 'fa-check text-success' : 'fa-times text-danger'} me-2`}></i>
                      <span className="criteria-text">{criteria.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              <i className="fas fa-lock me-2"></i>
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={`form-control ${fieldErrors.confirmPassword && !fieldErrors.confirmPassword.isValid ? 'is-invalid' : ''}`}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirma tu nueva contraseña"
              disabled={loading}
              autoComplete="new-password"
            />
            {fieldErrors.confirmPassword && !fieldErrors.confirmPassword.isValid && (
              <div className="invalid-feedback">
                {fieldErrors.confirmPassword.message}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-warning w-100 auth-submit-btn"
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Cambiando contraseña...
              </>
            ) : (
              <>
                <i className="fas fa-key me-2"></i>
                Establecer Nueva Contraseña
              </>
            )}
          </button>

          <div className="auth-links">
            <button
              type="button"
              className="btn btn-link"
              onClick={onBackToLogin}
              disabled={loading}
            >
              <i className="fas fa-arrow-left me-1"></i>
              Volver al inicio de sesión
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <div className="auth-security-info">
            <i className="fas fa-shield-alt me-2"></i>
            <small className="text-muted">
              Tu sesión será válida por 8 horas después del cambio de contraseña
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPasswordRequired;