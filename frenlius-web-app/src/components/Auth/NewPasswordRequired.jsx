import React, { useState, useMemo } from 'react';
import { confirmSignIn, fetchAuthSession } from 'aws-amplify/auth';
import AuthLayout from './AuthLayout';

const NewPasswordRequired = ({ username, signInStep, onSuccess, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validaciones en tiempo real
  const [validation, setValidation] = useState({
    newPassword: { isValid: true, message: '', strength: 0 },
    confirmPassword: { isValid: true, message: '' },
  });

  // Criterios de contraseña
  const passwordCriteria = [
    { test: (pwd) => pwd.length >= 8, label: 'Mínimo 8 caracteres' },
    { test: (pwd) => /[a-z]/.test(pwd), label: 'Una letra minúscula' },
    { test: (pwd) => /[A-Z]/.test(pwd), label: 'Una letra mayúscula' },
    { test: (pwd) => /\d/.test(pwd), label: 'Un número' },
    { test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd), label: 'Un carácter especial' },
  ];

  // Manejar cambios en inputs
  const handleInputChange = (field, value) => {
    console.log('Input change:', field, value); // DEBUG
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    
    // Validar en tiempo real
    validateField(field, value);
  };

  // Validar campo específico
  const validateField = (field, value) => {
    let isValid = true;
    let message = '';
    let strength = 0;

    switch (field) {
      case 'newPassword':
        if (!value) {
          isValid = false;
          message = 'La nueva contraseña es requerida';
        } else {
          // Calcular fuerza de contraseña
          strength = passwordCriteria.filter(criteria => criteria.test(value)).length;
          
          if (strength < 3) {
            isValid = false;
            message = 'La contraseña es muy débil';
          } else if (strength < 5) {
            message = 'Contraseña moderada';
          } else {
            message = 'Contraseña fuerte';
          }
        }
        break;
      
      case 'confirmPassword':
        if (!value) {
          isValid = false;
          message = 'Confirma tu nueva contraseña';
        } else if (value !== formData.newPassword) {
          isValid = false;
          message = 'Las contraseñas no coinciden';
        }
        break;
    }

    setValidation(prev => ({
      ...prev,
      [field]: { isValid, message, strength }
    }));

    return isValid;
  };

  // Validar formulario completo (memoizado para evitar loops)
  const isFormValid = useMemo(() => {
    console.log('Validating form with data:', formData); // DEBUG
    
    // Validar nueva contraseña
    const passwordValid = formData.newPassword && 
      formData.newPassword.length >= 8 && 
      passwordCriteria.filter(criteria => criteria.test(formData.newPassword)).length >= 3;
    
    // Validar confirmación
    const confirmValid = formData.confirmPassword && 
      formData.confirmPassword === formData.newPassword;
    
    console.log('Validation results:', { passwordValid, confirmValid }); // DEBUG
    return passwordValid && confirmValid;
  }, [formData.newPassword, formData.confirmPassword]);

  // Función de validación para campos individuales (mantener como estaba)
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
          }
          
          onSuccess();
        } catch (tokenError) {
          console.error('Error obteniendo access token:', tokenError);
          // Continuar con el login aunque no se obtenga el token
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
          setError('Error al cambiar contraseña. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Obtener color de fuerza de contraseña
  const getPasswordStrengthColor = () => {
    const strength = validation.newPassword.strength;
    if (strength <= 2) return 'danger';
    if (strength <= 3) return 'warning';
    if (strength <= 4) return 'info';
    return 'success';
  };

  return (
    <AuthLayout
      title="Cambiar Contraseña"
      subtitle={`Hola ${username}, debes crear una nueva contraseña segura`}
      showBackButton={true}
      onBack={onBackToLogin}
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {/* Info Message */}
        <div className="auth-info">
          <i className="fas fa-info-circle me-2"></i>
          <div>
            <p className="mb-2">Esta es tu primera vez iniciando sesión. Por seguridad, debes crear una nueva contraseña.</p>
            <p className="mb-0"><strong>Importante:</strong> Tu nueva contraseña debe cumplir con todos los requisitos de seguridad.</p>
          </div>
        </div>

        {/* New Password Field */}
        <div className="form-group">
          <label className="form-label">
            <i className="fas fa-lock me-2"></i>
            Nueva Contraseña
          </label>
          <div className="input-wrapper">
            <input
              type={showNewPassword ? 'text' : 'password'}
              className={`form-control auth-input ${
                !validation.newPassword.isValid ? 'is-invalid' : 
                formData.newPassword && validation.newPassword.isValid ? 'is-valid' : ''
              }`}
              placeholder="Crea una contraseña segura"
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              disabled={loading}
              autoFocus
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowNewPassword(!showNewPassword)}
              disabled={loading}
            >
              <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          
          {/* Password Strength Bar */}
          {formData.newPassword && (
            <div className="password-strength">
              <div className="strength-bar">
                <div 
                  className={`strength-fill strength-${getPasswordStrengthColor()}`}
                  style={{ width: `${(validation.newPassword.strength / 5) * 100}%` }}
                ></div>
              </div>
              <small className={`strength-text text-${getPasswordStrengthColor()}`}>
                {validation.newPassword.message}
              </small>
            </div>
          )}
          
          {/* Password Criteria */}
          {formData.newPassword && (
            <div className="password-criteria">
              {passwordCriteria.map((criteria, index) => (
                <div 
                  key={index} 
                  className={`criteria-item ${criteria.test(formData.newPassword) ? 'valid' : 'invalid'}`}
                >
                  <i className={`fas ${criteria.test(formData.newPassword) ? 'fa-check' : 'fa-times'} me-1`}></i>
                  <small>{criteria.label}</small>
                </div>
              ))}
            </div>
          )}
          
          {!validation.newPassword.isValid && (
            <div className="invalid-feedback">
              <i className="fas fa-exclamation-circle me-1"></i>
              {validation.newPassword.message}
            </div>
          )}
        </div>

        {/* Confirm New Password Field */}
        <div className="form-group">
          <label className="form-label">
            <i className="fas fa-lock me-2"></i>
            Confirmar Nueva Contraseña
          </label>
          <div className="input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className={`form-control auth-input ${
                !validation.confirmPassword.isValid ? 'is-invalid' : 
                formData.confirmPassword && validation.confirmPassword.isValid ? 'is-valid' : ''
              }`}
              placeholder="Confirma tu nueva contraseña"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          {!validation.confirmPassword.isValid && (
            <div className="invalid-feedback">
              <i className="fas fa-exclamation-circle me-1"></i>
              {validation.confirmPassword.message}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="auth-error">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary btn-auth"
          disabled={loading || !isFormValid}
        >
          {loading ? (
            <>
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              Cambiando contraseña...
            </>
          ) : (
            <>
              <i className="fas fa-check me-2"></i>
              Cambiar Contraseña
            </>
          )}
        </button>

        {/* Help Text */}
        <div className="auth-help">
          <div className="help-item">
            <i className="fas fa-shield-alt me-2"></i>
            <small>Una vez cambies tu contraseña, podrás acceder normalmente a la aplicación.</small>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};

export default NewPasswordRequired;