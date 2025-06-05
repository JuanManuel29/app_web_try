import React from 'react';
import IVSVideoPlayer from '../components/IVSVideoPlayer';

/**
 * Página principal para la sección de Streaming en Vivo
 * Contiene el reproductor IVS y información adicional
 */
const LiveStreamPage = () => {
  return (
    <div className="live-stream-page">
      {/* Header de la página */}
      <div className="page-header">
        <div className="container">
          <div className="header-content">
            <div className="header-icon">
              <i className="fas fa-broadcast-tower"></i>
            </div>
            <div className="header-text">
              <h1 className="page-title">Transmisión en Vivo</h1>
              <p className="page-subtitle">
                Accede a nuestras transmisiones en tiempo real
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="container">
        <div className="live-stream-content">
          {/* Reproductor de video principal */}
          <div className="video-section">
            <IVSVideoPlayer />
          </div>
          
          {/* Información adicional (opcional) */}
          {/* <div className="info-section">
            <div className="info-cards">
              <div className="info-card">
                <div className="card-icon">
                  <i className="fas fa-info-circle"></i>
                </div>
                <div className="card-content">
                  <h4>Transmisión en Tiempo Real</h4>
                  <p>
                    Accede a contenido en vivo con baja latencia usando la tecnología 
                    AWS Interactive Video Service (IVS).
                  </p>
                </div>
              </div>
              
              <div className="info-card">
                <div className="card-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="card-content">
                  <h4>Experiencia Compartida</h4>
                  <p>
                    Únete a otros espectadores y disfruta de contenido exclusivo 
                    en tiempo real desde cualquier dispositivo.
                  </p>
                </div>
              </div>
              
              <div className="info-card">
                <div className="card-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div className="card-content">
                  <h4>Acceso Seguro</h4>
                  <p>
                    Contenido protegido con autenticación avanzada para 
                    garantizar acceso exclusivo a usuarios autorizados.
                  </p>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default LiveStreamPage;