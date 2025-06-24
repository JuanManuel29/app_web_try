import React, { useState } from 'react';
import { signIn, fetchAuthSession } from 'aws-amplify/auth';
import AuthLayout from './AuthLayout';
import { setSessionStartTime } from '../../utils/authUtils';

const Login = ({ onSuccess, onSwitchToForgotPassword, onNewPasswordRequired }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validaciones en tiempo real
  const [validation, setValidation] = useState({
    username: { isValid: true, message: '' },
    password: { isValid: true, message: '' },
  });

  // Manejar cambios en inputs
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    
    // Validar en tiempo real
    validateField(field, value);
  };

  // Validar campo específico
  const validateField = (field, value) => {
    let isValid = true;
    let message = '';

    switch (field) {
      case 'username':
        if (!value) {
          isValid = false;
          message = 'El nombre de usuario es requerido';
        } else if (value.length < 3) {
          isValid = false;
          message = 'Mínimo 3 caracteres';
        } else if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
          isValid = false;
          message = 'Solo letras, números, puntos, guiones y guiones bajos';
        }
        break;
      
      case 'password':
        if (!value) {
          isValid = false;
          message = 'La contraseña es requerida';
        } else if (value.length < 8) {
          isValid = false;
          message = 'Mínimo 8 caracteres';
        }
        break;
    }

    setValidation(prev => ({
      ...prev,
      [field]: { isValid, message }
    }));

    return isValid;
  };

  // Validar formulario completo
  const validateForm = () => {
    const usernameValid = validateField('username', formData.username);
    const passwordValid = validateField('password', formData.password);
    
    return usernameValid && passwordValid;
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
      const { isSignedIn, nextStep } = await signIn({
        username: formData.username,
        password: formData.password,
      });

      if (isSignedIn) {
        // Obtener el access token después del login exitoso
        try {
          const session = await fetchAuthSession();
          const accessToken = session.tokens?.accessToken?.toString();
          
          if (accessToken) {
            // Almacenar el token para uso en API calls
            sessionStorage.setItem('accessToken', accessToken);
            console.log('Access token almacenado exitosamente');
            
            // NUEVO: Establecer timestamp de inicio de sesión
            setSessionStartTime();
            console.log('🕒 Timestamp de sesión establecido en login exitoso');
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
        // Manejar pasos adicionales (MFA, NEW_PASSWORD_REQUIRED, etc.)
        console.log('Next step required:', nextStep.signInStep);
        
        switch (nextStep.signInStep) {
          case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
            // Primera vez del usuario - necesita cambiar contraseña
            onNewPasswordRequired(formData.username, nextStep);
            break;
          case 'CONFIRM_SIGN_UP':
            setError('Tu cuenta no ha sido activada. Contacta al administrador.');
            break;
          case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
            setError('Se requiere autenticación de dos factores.');
            break;
          default:
            setError(`Se requieren pasos adicionales para completar el login: ${nextStep.signInStep}`);
        }
      }
    } catch (err) {
      console.error('Error en login:', err);
      
      // Mensajes de error amigables
      switch (err.name) {
        case 'NotAuthorizedException':
          setError('Nombre de usuario o contraseña incorrectos');
          break;
        case 'UserNotConfirmedException':
          setError('Tu cuenta no ha sido activada. Contacta al administrador.');
          break;
        case 'PasswordResetRequiredException':
          setError('Debes restablecer tu contraseña');
          break;
        case 'UserNotFoundException':
          setError('No existe una cuenta con este nombre de usuario');
          break;
        case 'TooManyRequestsException':
          setError('Demasiados intentos. Intenta más tarde.');
          break;
        default:
          setError('Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Iniciar Sesión"
      subtitle="Accede a tu cuenta de Frenlius"
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {/* Username Field */}
        <div className="form-group">
          <label className="form-label">
            <i className="fas fa-user me-2"></i>
            Nombre de Usuario
          </label>
          <div className="input-wrapper">
            <input
              type="text"
              className={`form-control auth-input ${
                !validation.username.isValid ? 'is-invalid' : 
                formData.username && validation.username.isValid ? 'is-valid' : ''
              }`}
              placeholder="Username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              disabled={loading}
              autoComplete="username"
              autoFocus
            />
            <div className="input-icon">
              {formData.username && (
                <i className={`fas ${
                  validation.username.isValid ? 'fa-check text-success' : 'fa-times text-danger'
                }`}></i>
              )}
            </div>
          </div>
          {!validation.username.isValid && (
            <div className="invalid-feedback">
              <i className="fas fa-exclamation-circle me-1"></i>
              {validation.username.message}
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className="form-group">
          <label className="form-label">
            <i className="fas fa-lock me-2"></i>
            Contraseña
          </label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              className={`form-control auth-input ${
                !validation.password.isValid ? 'is-invalid' : 
                formData.password && validation.password.isValid ? 'is-valid' : ''
              }`}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          {!validation.password.isValid && (
            <div className="invalid-feedback">
              <i className="fas fa-exclamation-circle me-1"></i>
              {validation.password.message}
            </div>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="auth-links">
          <button
            type="button"
            className="auth-link"
            onClick={onSwitchToForgotPassword}
            disabled={loading}
          >
            ¿Olvidaste tu contraseña?
          </button>
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
          disabled={loading || !formData.username || !formData.password}
        >
          {loading ? (
            <>
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              Iniciando sesión...
            </>
          ) : (
            <>
              <i className="fas fa-sign-in-alt me-2"></i>
              Iniciar Sesión
            </>
          )}
        </button>

        {/* Help Text */}
        <div className="auth-help">
          <div className="help-item">
            <i className="fas fa-info-circle me-2"></i>
            <small>Si no tienes acceso, contacta al administrador del sistema.</small>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;