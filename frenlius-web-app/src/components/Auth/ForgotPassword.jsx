import React, { useState } from 'react';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import AuthLayout from './AuthLayout';

const ForgotPassword = ({ onSuccess, onSwitchToLogin }) => {
  const [step, setStep] = useState('request'); // 'request' | 'confirm'
  const [username, setUsername] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validaciones
  const [validation, setValidation] = useState({
    username: { isValid: true, message: '' },
    code: { isValid: true, message: '' },
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

  // Validar campo específico
  const validateField = (field, value) => {
    let isValid = true;
    let message = '';
    let strength = 0;

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
      
      case 'code':
        if (!value) {
          isValid = false;
          message = 'El código es requerido';
        } else if (!/^\d{6}$/.test(value)) {
          isValid = false;
          message = 'El código debe tener 6 dígitos';
        }
        break;
      
      case 'newPassword':
        if (!value) {
          isValid = false;
          message = 'La nueva contraseña es requerida';
        } else {
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

  // Manejar cambios en inputs
  const handleInputChange = (field, value) => {
    if (field === 'username') {
      setUsername(value);
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    setError('');
    validateField(field, value);
  };

  // Solicitar código de recuperación
  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    if (!validateField('username', username)) {
      setError('Por favor ingresa un nombre de usuario válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword({ username: username });
      setStep('confirm');
    } catch (err) {
      console.error('Error solicitando reset:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      
      switch (err.name) {
        case 'UserNotFoundException':
          setError('No existe una cuenta con este nombre de usuario');
          break;
          
        case 'InvalidParameterException':
          // Verificar si el mensaje específico indica email no verificado
          if (err.message && err.message.includes('Cannot reset password for the user as there is no registered/verified email')) {
            setError('Tu email no ha sido verificado, por lo que no puedes restablecer tu contraseña. Por favor contacta al administrador del sistema.');
          } else {
            setError('Nombre de usuario no válido');
          }
          break;
          
        case 'TooManyRequestsException':
          setError('Demasiados intentos. Intenta más tarde.');
          break;
          
        case 'NotAuthorizedException':
          setError('Tu cuenta necesita ser activada por el administrador. Por favor contacta al administrador del sistema para verificar tu email y poder restablecer tu contraseña.');
          break;
          
        case 'UserNotConfirmedException':
          setError('Tu cuenta necesita ser activada por el administrador. Tu email no ha sido verificado, por lo que no puedes restablecer tu contraseña. Por favor contacta al administrador del sistema.');
          break;
          
        case 'LimitExceededException':
          setError('Se ha excedido el límite de intentos. Intenta más tarde.');
          break;
          
        default:
          // Para cualquier otro error, verificar el mensaje
          console.error('Error no manejado:', err);
          if (err.message && (
            err.message.includes('email') || 
            err.message.includes('verified') || 
            err.message.includes('confirmed') ||
            err.message.includes('Cannot reset password')
          )) {
            setError('Tu cuenta necesita ser activada. Por favor contacta al administrador del sistema para verificar tu email antes de poder restablecer tu contraseña.');
          } else {
            setError('Error al enviar código. Intenta de nuevo o contacta al administrador si el problema persiste.');
          }
      }
    } finally {
      setLoading(false);
    }
  };

  // Confirmar nueva contraseña
  const handleConfirmReset = async (e) => {
    e.preventDefault();
    
    const codeValid = validateField('code', formData.code);
    const passwordValid = validateField('newPassword', formData.newPassword);
    const confirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);
    
    if (!codeValid || !passwordValid || !confirmPasswordValid) {
      setError('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmResetPassword({
        username: username,
        confirmationCode: formData.code,
        newPassword: formData.newPassword,
      });
      
      onSuccess();
    } catch (err) {
      console.error('Error confirmando reset:', err);
      
      switch (err.name) {
        case 'CodeMismatchException':
          setError('Código de verificación incorrecto');
          break;
        case 'ExpiredCodeException':
          setError('El código ha expirado. Solicita uno nuevo.');
          break;
        case 'InvalidPasswordException':
          setError('La contraseña no cumple con los requisitos');
          break;
        case 'TooManyFailedAttemptsException':
          setError('Demasiados intentos fallidos. Intenta más tarde.');
          break;
        default:
          setError('Error al cambiar contraseña. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      await resetPassword({ username: username });
      setError(''); // Clear any existing errors
      // Show success message temporarily
      const successMsg = 'Código reenviado correctamente';
      setError('');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      console.error('Error reenviando código:', err);
      setError('Error al reenviar código');
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

  if (step === 'request') {
    return (
      <AuthLayout
        title="Recuperar Contraseña"
        subtitle="Ingresa tu nombre de usuario para recibir un código de recuperación"
        showBackButton={true}
        onBack={onSwitchToLogin}
      >
        <form onSubmit={handleRequestReset} className="auth-form">
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
                  username && validation.username.isValid ? 'is-valid' : ''
                }`}
                placeholder="tu_usuario"
                value={username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={loading}
                autoFocus
                autoComplete="username"
              />
              <div className="input-icon">
                {username && (
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

          {/* Info Message */}
          <div className="auth-info">
            <i className="fas fa-info-circle me-2"></i>
            <div>
              <p className="mb-2">Te enviaremos un código de 6 dígitos al email asociado a tu cuenta para que puedas crear una nueva contraseña.</p>
              <p className="mb-0"><strong>Nota:</strong> Tu correo debió haberse verificado por el administrador para poder restablecer la contraseña.</p>
            </div>
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
            disabled={loading || !username}
          >
            {loading ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                Enviando código...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane me-2"></i>
                Enviar Código
              </>
            )}
          </button>

          {/* Switch to Login */}
          <div className="auth-switch">
            <span>¿Recordaste tu contraseña? </span>
            <button
              type="button"
              className="auth-link"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Volver al login
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Crear Nueva Contraseña"
      subtitle={`Código enviado al email de ${username}`}
      showBackButton={true}
      onBack={() => setStep('request')}
    >
      <form onSubmit={handleConfirmReset} className="auth-form">
        {/* Verification Code */}
        <div className="form-group">
          <label className="form-label">
            <i className="fas fa-key me-2"></i>
            Código de Verificación
          </label>
          <div className="input-wrapper">
            <input
              type="text"
              className={`form-control auth-input code-input ${
                !validation.code.isValid ? 'is-invalid' : 
                formData.code && validation.code.isValid ? 'is-valid' : ''
              }`}
              placeholder="000000"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
              maxLength="6"
              autoFocus
            />
            <div className="input-icon">
              {formData.code && (
                <i className={`fas ${
                  validation.code.isValid ? 'fa-check text-success' : 'fa-times text-danger'
                }`}></i>
              )}
            </div>
          </div>
          {!validation.code.isValid && (
            <div className="invalid-feedback">
              <i className="fas fa-exclamation-circle me-1"></i>
              {validation.code.message}
            </div>
          )}
          
          {/* Resend Code */}
          <div className="auth-links">
            <button
              type="button"
              className="auth-link"
              onClick={handleResendCode}
              disabled={loading}
            >
              ¿No recibiste el código? Reenviar
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="form-group">
          <label className="form-label">
            <i className="fas fa-lock me-2"></i>
            Nueva Contraseña
          </label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              className={`form-control auth-input ${
                !validation.newPassword.isValid ? 'is-invalid' : 
                formData.newPassword && validation.newPassword.isValid ? 'is-valid' : ''
              }`}
              placeholder="Crea una contraseña segura"
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              disabled={loading}
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

        {/* Confirm New Password */}
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
          disabled={loading || !formData.code || !formData.newPassword || !formData.confirmPassword}
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

        {/* Switch to Login */}
        <div className="auth-switch">
          <span>¿Recordaste tu contraseña? </span>
          <button
            type="button"
            className="auth-link"
            onClick={onSwitchToLogin}
            disabled={loading}
          >
            Volver al login
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;