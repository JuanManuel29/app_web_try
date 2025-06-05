import React, { useState, useEffect, useRef } from 'react';
import { apiGet } from '../services/apiClient';

/**
 * Componente VideoPlayer para AWS IVS
 * Reproduce streams en vivo y maneja estados offline/online
 */
const IVSVideoPlayer = () => {
  // Estados principales
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerError, setPlayerError] = useState('');
  
  // Referencias
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const checkInterval = useRef(null);
  
  // Estados del player
  const [playerState, setPlayerState] = useState({
    duration: 0,
    position: 0,
    volume: 0.5,
    muted: false,
    quality: 'auto'
  });

  // Verificar estado del stream al montar el componente
  useEffect(() => {
    checkStreamStatus();
    
    // Verificar estado cada 30 segundos
    checkInterval.current = setInterval(checkStreamStatus, 30000);
    
    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
      if (playerRef.current) {
        try {
          playerRef.current.delete();
        } catch (e) {
          console.warn('Error cleaning up player:', e);
        }
      }
    };
  }, []);

  // Inicializar player cuando cambia el estado del stream
  useEffect(() => {
    if (streamData?.stream?.state === 'LIVE' && streamData?.channel?.playback_url) {
      initializePlayer();
    } else {
      cleanupPlayer();
    }
  }, [streamData]);

  // Verificar estado del stream
  const checkStreamStatus = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Verificando estado del stream...');
      
      const response = await apiGet(
        'https://5cdcfdmyx6.execute-api.us-east-2.amazonaws.com/prod/stream-status'
      );
      
      console.log('📡 Respuesta del stream:', response.data);
      setStreamData(response.data);
      
    } catch (err) {
      console.error('❌ Error verificando stream:', err);
      
      if (err.response?.status === 401 || err.authExpired) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (err.response?.status === 403) {
        setError('No tienes permisos para acceder al stream.');
      } else {
        setError('Error verificando el estado del stream. Intentando reconectar...');
      }
    } finally {
      setLoading(false);
    }
  };

  // Inicializar AWS IVS Player
  const initializePlayer = async () => {
    try {
      // Verificar si AWS IVS está disponible
      if (!window.IVSPlayer) {
        console.error('AWS IVS Player no está cargado');
        setPlayerError('Error: AWS IVS Player no disponible');
        return;
      }

      // Limpiar player anterior si existe
      cleanupPlayer();

      console.log('🎬 Inicializando AWS IVS Player...');
      
      const player = window.IVSPlayer.create();
      playerRef.current = player;

      // Configurar event listeners
      player.addEventListener(window.IVSPlayer.PlayerState.READY, () => {
        console.log('✅ Player listo');
        setPlayerReady(true);
        setPlayerError('');
      });

      player.addEventListener(window.IVSPlayer.PlayerState.PLAYING, () => {
        console.log('▶️ Reproduciendo');
        setIsPlaying(true);
        setPlayerError('');
      });

      player.addEventListener(window.IVSPlayer.PlayerState.ENDED, () => {
        console.log('⏹️ Stream finalizado');
        setIsPlaying(false);
      });

      player.addEventListener(window.IVSPlayer.PlayerEventType.ERROR, (error) => {
        console.error('❌ Error del player:', error);
        setPlayerError('Error de reproducción: ' + error.type);
        setIsPlaying(false);
      });

      player.addEventListener(window.IVSPlayer.PlayerEventType.TIME_UPDATE, (position) => {
        setPlayerState(prev => ({
          ...prev,
          position: position
        }));
      });

      // Adjuntar player al DOM
      if (containerRef.current) {
        containerRef.current.appendChild(player.getVideoElement());
      }

      // Cargar stream
      player.load(streamData.channel.playback_url);
      
      // Configurar volumen inicial
      player.setVolume(playerState.volume);
      
    } catch (err) {
      console.error('Error inicializando player:', err);
      setPlayerError('Error inicializando el reproductor');
    }
  };

  // Limpiar player
  const cleanupPlayer = () => {
    if (playerRef.current) {
      try {
        playerRef.current.delete();
        playerRef.current = null;
        setPlayerReady(false);
        setIsPlaying(false);
        setPlayerError('');
      } catch (e) {
        console.warn('Error limpiando player:', e);
      }
    }
    
    // Limpiar container
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  };

  // Controles del player
  const togglePlay = () => {
    if (!playerRef.current) return;
    
    try {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    } catch (err) {
      console.error('Error toggling play:', err);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    
    try {
      const newMuted = !playerState.muted;
      playerRef.current.setMuted(newMuted);
      setPlayerState(prev => ({ ...prev, muted: newMuted }));
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  };

  const handleVolumeChange = (newVolume) => {
    if (!playerRef.current) return;
    
    try {
      playerRef.current.setVolume(newVolume);
      setPlayerState(prev => ({ ...prev, volume: newVolume }));
    } catch (err) {
      console.error('Error changing volume:', err);
    }
  };

  // Formatear tiempo de stream
  const formatStreamTime = (startTime) => {
    if (!startTime) return 'Recién iniciado';
    
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000);
    
    if (diff < 60) return `${diff}s en vivo`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m en vivo`;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m en vivo`;
  };

  // Obtener indicador de calidad de stream
  const getStreamHealthIndicator = (health) => {
    switch (health) {
      case 'HEALTHY':
        return { icon: 'fa-circle', color: 'success', text: 'Excelente' };
      case 'STARVING':
        return { icon: 'fa-exclamation-triangle', color: 'warning', text: 'Conexión inestable' };
      default:
        return { icon: 'fa-question-circle', color: 'secondary', text: 'Desconocido' };
    }
  };

  // Estado de carga inicial
  if (loading && !streamData) {
    return (
      <div className="ivs-player-container">
        <div className="ivs-loading-card">
          <div className="loading-content">
            <div className="loading-spinner">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Verificando stream...</span>
              </div>
            </div>
            <h4>Verificando transmisión en vivo...</h4>
            <p>Conectando con el servidor de streaming</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="ivs-player-container">
        <div className="ivs-error-card">
          <div className="error-content">
            <div className="error-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h4>Error de Conexión</h4>
            <p>{error}</p>
            <button 
              onClick={checkStreamStatus}
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

  // Stream offline
  if (streamData?.stream?.state !== 'LIVE') {
    return (
      <div className="ivs-player-container">
        <div className="ivs-offline-card">
          <div className="offline-content">
            <div className="offline-icon">
              <i className="fas fa-broadcast-tower"></i>
            </div>
            <h4>No hay transmisión en vivo</h4>
            <p>En este momento no hay ninguna transmisión activa.</p>
            <div className="offline-info">
              <div className="info-item">
                <i className="fas fa-tv me-2"></i>
                <span>Canal: {streamData.channel.name}</span>
              </div>
              <div className="info-item">
                <i className="fas fa-clock me-2"></i>
                <span>Última verificación: {new Date(streamData.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
            <button 
              onClick={checkStreamStatus}
              className="btn btn-outline-primary btn-modern"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  Verificando...
                </>
              ) : (
                <>
                  <i className="fas fa-refresh me-2"></i>
                  Verificar de nuevo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stream activo
  const healthIndicator = getStreamHealthIndicator(streamData.stream.health);

  return (
    <div className="ivs-player-container">
      {/* Header del stream */}
      <div className="ivs-stream-header">
        <div className="stream-status">
          <div className="live-indicator">
            <div className="live-dot"></div>
            <span className="live-text">EN VIVO</span>
          </div>
          <div className="stream-info">
            <span className="stream-title">{streamData.channel.name}</span>
            <div className="stream-meta">
              <span className="viewer-count">
                <i className="fas fa-users me-1"></i>
                {streamData.stream.viewerCount || 0} espectador{streamData.stream.viewerCount !== 1 ? 'es' : ''}
              </span>
              <span className="stream-time">
                <i className="fas fa-clock me-1"></i>
                {formatStreamTime(streamData.stream.startTime)}
              </span>
              <span className={`stream-health text-${healthIndicator.color}`}>
                <i className={`fas ${healthIndicator.icon} me-1`}></i>
                {healthIndicator.text}
              </span>
            </div>
          </div>
        </div>
        
        <div className="stream-actions">
          <button 
            onClick={checkStreamStatus}
            className="btn btn-outline-light btn-sm"
            disabled={loading}
            title="Actualizar estado"
          >
            <i className={`fas fa-refresh ${loading ? 'fa-spin' : ''}`}></i>
          </button>
        </div>
      </div>

      {/* Contenedor del video player */}
      <div className="ivs-video-container">
        <div 
          ref={containerRef}
          className="ivs-video-element"
        />
        
        {/* Overlay de loading del player */}
        {!playerReady && (
          <div className="player-loading-overlay">
            <div className="loading-content">
              <div className="spinner-border text-white" role="status">
                <span className="visually-hidden">Cargando video...</span>
              </div>
              <p>Cargando reproductor...</p>
            </div>
          </div>
        )}
        
        {/* Overlay de error del player */}
        {playerError && (
          <div className="player-error-overlay">
            <div className="error-content">
              <i className="fas fa-exclamation-triangle"></i>
              <p>{playerError}</p>
              <button 
                onClick={initializePlayer}
                className="btn btn-outline-light btn-sm"
              >
                <i className="fas fa-redo me-2"></i>
                Reintentar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controles personalizados (opcionales) */}
      {playerReady && (
        <div className="ivs-controls">
          <div className="controls-left">
            <button 
              onClick={togglePlay}
              className="control-btn play-btn"
              title={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </button>
            
            <button 
              onClick={toggleMute}
              className="control-btn volume-btn"
              title={playerState.muted ? 'Activar sonido' : 'Silenciar'}
            >
              <i className={`fas ${playerState.muted ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
            </button>
            
            <div className="volume-slider">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={playerState.volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="volume-range"
              />
            </div>
          </div>
          
          <div className="controls-right">
            <span className="stream-quality">
              Calidad: {streamData.channel.latency_mode === 'LOW' ? 'Baja latencia' : 'Normal'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default IVSVideoPlayer;