import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { formatNotificationDate, getNotificationSummary } from '../services/notificationService';
import { notificationService } from '../services/notificationService';

const NotificationModal = ({ notification, isOpen, onClose }) => {
  // Estados locales
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState('initial'); // 'initial', 'comments', 'submitted'
  const [feedbackData, setFeedbackData] = useState({
    isUseful: null,
    comments: ''
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Context
  const { addFeedback } = useNotifications();

  // Cargar imagen al abrir modal
  useEffect(() => {
    if (isOpen && notification) {
      loadImage();
      initializeFeedback();
    }
  }, [isOpen, notification]);

  // Cargar imagen
  const loadImage = async () => {
    try {
      setImageLoading(true);
      setImageError(false);
      
      // Si ya tiene image_url, usarla directamente
      if (notification.image_url) {
        setImageUrl(notification.image_url);
      } else {
        // Obtener URL presignada
        const url = await notificationService.getImageUrl(notification.notification_id);
        setImageUrl(url);
      }
      
    } catch (error) {
      console.error('Error cargando imagen:', error);
      setImageError(true);
    } finally {
      setImageLoading(false);
    }
  };

  // Inicializar estado del feedback
  const initializeFeedback = () => {
    if (notification.feedback?.is_useful !== null && notification.feedback?.is_useful !== undefined) {
      setFeedbackStep('submitted');
      setFeedbackData({
        isUseful: notification.feedback.is_useful,
        comments: notification.feedback.comments || ''
      });
    } else {
      setFeedbackStep('initial');
      setFeedbackData({
        isUseful: null,
        comments: ''
      });
    }
  };

  // Manejar escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Manejar rating del feedback - MODIFICADO: SIEMPRE IR A COMENTARIOS
  const handleFeedbackRating = (isUseful) => {
    setFeedbackData(prev => ({ ...prev, isUseful }));
    
    // CAMBIO: Siempre ir al paso de comentarios, no importa la respuesta
    setFeedbackStep('comments');
  };

  // Enviar feedback
  const submitFeedback = async (isUseful, comments = '') => {
    try {
      setSubmittingFeedback(true);
      
      await addFeedback(notification.notification_id, isUseful, comments);
      
      setFeedbackData({ isUseful, comments });
      setFeedbackStep('submitted');
      
    } catch (error) {
      console.error('Error enviando feedback:', error);
      alert('Error al enviar feedback. Por favor intenta de nuevo.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Manejar envío de comentarios
  const handleCommentsSubmit = () => {
    submitFeedback(feedbackData.isUseful, feedbackData.comments);
  };

  // No renderizar si no está abierto
  if (!isOpen || !notification) return null;

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div className="notification-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header del modal */}
        <div className="notification-modal-header">
          <div className="modal-title-section">
            <div className="notification-type-header">
              <div className="type-icon-large">
                <i className="fas fa-shield-alt"></i>
              </div>
              <div className="type-info">
                <h3 className="modal-title">Alerta de Seguridad</h3>
                <p className="modal-subtitle">
                  {getNotificationSummary(notification)}
                </p>
              </div>
            </div>
          </div>
          
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="notification-modal-content">
          
          {/* Sección de imagen */}
          <div className="image-section">
            <h4 className="section-title">
              <i className="fas fa-image me-2"></i>
              Imagen Detectada
            </h4>
            
            <div className="image-container">
              {imageLoading ? (
                <div className="image-loading">
                  <div className="loading-spinner">
                    <i className="fas fa-spinner fa-spin"></i>
                  </div>
                  <p>Cargando imagen...</p>
                </div>
              ) : imageError || !imageUrl ? (
                <div className="image-error">
                  <div className="error-icon">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <p>No se pudo cargar la imagen</p>
                  <small>La imagen puede haber sido movida o eliminada</small>
                </div>
              ) : (
                <div className="image-display">
                  <img 
                    src={imageUrl} 
                    alt="Imagen de la alerta de seguridad"
                    className="notification-image"
                    onError={() => setImageError(true)}
                  />
                  <div className="image-info">
                    <i className="fas fa-info-circle me-2"></i>
                    {notification.image_name} - {notification.flight_name}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sección de detalles */}
          <div className="details-section">
            <h4 className="section-title">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Razón de la Alerta
            </h4>
            
            <div className="alert-reason-card">
              <p className="alert-reason-text">
                {notification.alert_reason}
              </p>
            </div>

            {/* Metadatos */}
            <div className="metadata-grid">
              <div className="metadata-item">
                <div className="metadata-label">
                  <i className="fas fa-plane me-2"></i>
                  Vuelo
                </div>
                <div className="metadata-value">{notification.flight_name}</div>
              </div>
              
              <div className="metadata-item">
                <div className="metadata-label">
                  <i className="fas fa-image me-2"></i>
                  Imagen
                </div>
                <div className="metadata-value">{notification.image_name}</div>
              </div>
              
              <div className="metadata-item">
                <div className="metadata-label">
                  <i className="fas fa-clock me-2"></i>
                  Fecha de detección
                </div>
                <div className="metadata-value">
                  {formatNotificationDate(notification.created_at)}
                </div>
              </div>
              
              <div className="metadata-item">
                <div className="metadata-label">
                  <i className="fas fa-eye me-2"></i>
                  Estado
                </div>
                <div className="metadata-value">
                  {notification.status === 'UNREAD' ? 'Sin leer' : `Leída ${formatNotificationDate(notification.read_at)}`}
                </div>
              </div>
            </div>
          </div>

          {/* Sección de feedback */}
          <div className="feedback-section">
            <h4 className="section-title">
              <i className="fas fa-comment-dots me-2"></i>
              Tu Opinión
            </h4>
            
            {feedbackStep === 'initial' && (
              <div className="feedback-initial">
                <p className="feedback-question">
                  ¿Esta notificación fue útil para identificar un riesgo de seguridad real?
                </p>
                <div className="feedback-buttons">
                  <button
                    className="btn btn-success btn-feedback"
                    onClick={() => handleFeedbackRating(true)}
                    disabled={submittingFeedback}
                  >
                    <i className="fas fa-thumbs-up me-2"></i>
                    Sí, fue útil
                  </button>
                  <button
                    className="btn btn-danger btn-feedback"
                    onClick={() => handleFeedbackRating(false)}
                    disabled={submittingFeedback}
                  >
                    <i className="fas fa-thumbs-down me-2"></i>
                    No, falso positivo
                  </button>
                </div>
                <p className="feedback-note">
                  <i className="fas fa-info-circle me-1"></i>
                  En el siguiente paso podrás agregar comentarios adicionales.
                </p>
              </div>
            )}

            {feedbackStep === 'comments' && (
              <div className="feedback-comments">
                <p className="feedback-explanation">
                  {feedbackData.isUseful 
                    ? 'Gracias por tu feedback positivo. ¿Hay algo específico que te gustaría comentar sobre esta alerta?' 
                    : 'Gracias por tu feedback. Por favor cuéntanos por qué consideras que esta alerta no fue útil.'
                  } Esto nos ayuda a mejorar nuestro sistema de detección.
                </p>
                
                <div className="comments-input">
                  <label className="feedback-comments-label">
                    <i className="fas fa-edit me-2"></i>
                    Comentarios {feedbackData.isUseful ? '(Opcional)' : ''}
                  </label>
                  <textarea
                    className="feedback-textarea"
                    rows="4"
                    placeholder={
                      feedbackData.isUseful 
                        ? "Comparte cualquier observación adicional (opcional)..."
                        : "Cuéntanos qué consideraste que no era correcto en esta alerta..."
                    }
                    value={feedbackData.comments}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, comments: e.target.value }))}
                    disabled={submittingFeedback}
                  />
                </div>
                
                <div className="feedback-actions">
                  <button
                    className="btn-cancel-feedback"
                    onClick={() => setFeedbackStep('initial')}
                    disabled={submittingFeedback}
                  >
                    <i className="fas fa-arrow-left me-1"></i>
                    Volver
                  </button>
                  <button
                    className="btn-submit-feedback"
                    onClick={handleCommentsSubmit}
                    disabled={submittingFeedback}
                  >
                    {submittingFeedback ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Enviar Feedback
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {feedbackStep === 'submitted' && (
              <div className="feedback-submitted">
                <div className="feedback-result">
                  <div className={`result-icon ${feedbackData.isUseful ? 'positive' : 'negative'}`}>
                    <i className={`fas ${feedbackData.isUseful ? 'fa-thumbs-up' : 'fa-thumbs-down'}`}></i>
                  </div>
                  <div className="result-content">
                    <h5>Feedback enviado</h5>
                    {/* <p>
                      Marcaste esta notificación como{' '}
                      <strong>{feedbackData.isUseful ? 'útil' : 'falso positivo'}</strong>
                    </p> */}
                    {feedbackData.comments && (
                      <div className="feedback-comments-display">
                        <strong>Tus comentarios:</strong>
                        <p>"{feedbackData.comments}"</p>
                      </div>
                    )}
                  </div>
                </div>
                <div><br /></div>
                <p className="feedback-thanks">
                  ¡Gracias por tu feedback! Esto nos ayuda a mejorar nuestro sistema de detección.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer del modal */}
        <div className="notification-modal-footer">
          <button
            className="btn btn-outline-primary"
            onClick={onClose}
          >
            <i className="fas fa-times me-1"></i>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;