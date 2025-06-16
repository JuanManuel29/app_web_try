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
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [autoCheckActive, setAutoCheckActive] = useState(false);
  
  // Referencias
  const playerRef = useRef(null);
  const videoRef = useRef(null);
  const checkInterval = useRef(null);
  
  // Estados del player
  const [playerState, setPlayerState] = useState({
    duration: 0,
    position: 0,
    volume: 0.5,
    muted: false,
    quality: 'auto'
  });

  // Verificar si el SDK está cargado
  useEffect(() => {
    const checkSDK = () => {
      if (window.IVSPlayer && window.IVSPlayer.create) {
        // console.log('✅ AWS IVS SDK cargado correctamente');
        // console.log('🔍 Versión del SDK:', window.IVSPlayer.VERSION || 'Desconocida');
        // console.log('🔍 Métodos disponibles:', Object.getOwnPropertyNames(window.IVSPlayer));
        setSdkLoaded(true);
        return true;
      }
      return false;
    };

    // Verificar inmediatamente
    if (!checkSDK()) {
      // Si no está cargado, esperar un poco y verificar de nuevo
      const timer = setTimeout(() => {
        if (!checkSDK()) {
          //console.error('❌ AWS IVS SDK no se pudo cargar');
          setPlayerError('Error: AWS IVS Player no está disponible');
          setLoading(false);
        }
      }, 3000); // Aumentar el timeout a 3 segundos

      return () => clearTimeout(timer);
    }
  }, []);

  // Verificar estado del stream al montar el componente
  useEffect(() => {
    if (sdkLoaded) {
      checkStreamStatus();
      
      // Verificar estado cada 30 segundos
      setAutoCheckActive(true);
      checkInterval.current = setInterval(() => {
        console.log('🔄 Verificación automática de stream...');
        checkStreamStatus();
      }, 30000);
    }
    
    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
        setAutoCheckActive(false);
      }
      cleanupPlayer();
    };
  }, [sdkLoaded]);

  // Inicializar player cuando cambia el estado del stream
  useEffect(() => {
    if (sdkLoaded && streamData?.stream?.state === 'LIVE' && streamData?.channel?.playback_url) {
      initializePlayer();
    } else {
      cleanupPlayer();
    }
  }, [streamData, sdkLoaded]);

  // Verificar estado del stream
  const checkStreamStatus = async () => {
    try {
      setLoading(true);
      setError('');
      
      //console.log('🔍 Verificando estado del stream...');
      
      const response = await apiGet(
        'https://5cdcfdmyx6.execute-api.us-east-2.amazonaws.com/prod/stream-status'
      );
      
      //console.log('📡 Respuesta del stream:', response.data);
      setStreamData(response.data);
      
    } catch (err) {
      //console.error('❌ Error verificando stream:', err);
      
      // Manejar el caso específico de stream offline (no es realmente un error)
      if (err.response?.status === 500 && 
          err.response?.data?.message?.includes('not currently online')) {
        
        //console.log('📴 Stream offline - esto es normal');
        
        // Crear objeto de datos para stream offline
        setStreamData({
          channel: {
            name: 'Canal Principal',
            playback_url: null,
            latency_mode: 'LOW'
          },
          stream: {
            state: 'OFFLINE',
            health: 'UNKNOWN',
            viewerCount: 0,
            startTime: null
          },
          timestamp: new Date().toISOString(),
          status: 'offline'
        });
        
        // No mostrar como error, es estado normal
        setError('');
        
      } else if (err.response?.status === 401 || err.authExpired) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (err.response?.status === 403) {
        setError('No tienes permisos para acceder al stream.');
      } else {
        // Solo mostrar error para problemas reales de conectividad
        setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Inicializar AWS IVS Player
  const initializePlayer = async () => {
    try {
      if (!window.IVSPlayer) {
        //console.error('❌ AWS IVS Player no está disponible');
        setPlayerError('Error: AWS IVS Player no disponible');
        return;
      }

      if (!videoRef.current) {
        console.error('❌ Elemento de video no encontrado');
        setPlayerError('Error: Elemento de video no encontrado');
        return;
      }

      // Limpiar player anterior si existe
      cleanupPlayer();

    //   console.log('🎬 Inicializando AWS IVS Player...');
    //   console.log('🔗 Playback URL:', streamData.channel.playback_url);
    //   console.log('🔍 IVSPlayer methods:', Object.getOwnPropertyNames(window.IVSPlayer));
      
      // CORRECCIÓN: Usar el método correcto para crear player de video
      let player;
      
      // Método 1: Intentar con create() simple
      try {
        player = window.IVSPlayer.create();
        console.log('✅ Player creado con create():', player);
        console.log('🔍 Player methods:', Object.getOwnPropertyNames(player));
        console.log('🔍 Player prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(player)));
      } catch (createError) {
        console.warn('⚠️ create() falló:', createError);
        
        // Método 2: Intentar con parámetros específicos
        try {
          player = new window.IVSPlayer.Player();
          console.log('✅ Player creado con constructor:', player);
        } catch (constructorError) {
          console.warn('⚠️ Constructor falló:', constructorError);
          
          // Método 3: Crear con elemento video existente
          const video = document.createElement('video');
          video.setAttribute('playsinline', '');
          video.setAttribute('controls', 'false');
          player = window.IVSPlayer.create(video);
          console.log('✅ Player creado con elemento video:', player);
        }
      }
      
      if (!player) {
        throw new Error('No se pudo crear el player con ningún método');
      }

      playerRef.current = player;

      // Verificar métodos disponibles en el player
      const playerMethods = Object.getOwnPropertyNames(player);
      const prototypeMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(player));
      console.log('🔍 Player instance methods:', playerMethods);
      console.log('🔍 Player prototype methods:', prototypeMethods);

      // Buscar el método correcto para obtener el elemento video
      let videoElement;
      
      if (typeof player.getVideoElement === 'function') {
        videoElement = player.getVideoElement();
      } else if (typeof player.getVideo === 'function') {
        videoElement = player.getVideo();
      } else if (typeof player.video === 'object') {
        videoElement = player.video;
      } else if (typeof player.getHTMLVideoElement === 'function') {
        videoElement = player.getHTMLVideoElement();
      } else {
        // Crear nuestro propio elemento video y asociarlo
        videoElement = document.createElement('video');
        videoElement.setAttribute('playsinline', '');
        videoElement.setAttribute('controls', 'false');
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        
        console.log('⚠️ Creando elemento video manual');
      }

      if (!videoElement) {
        throw new Error('No se pudo obtener el elemento de video');
      }

      // Adjuntar el elemento de video al contenedor
      videoRef.current.appendChild(videoElement);
      console.log('✅ Elemento de video adjuntado al DOM');

      // Configurar event listeners
      const PlayerState = window.IVSPlayer.PlayerState;
      const PlayerEventType = window.IVSPlayer.PlayerEventType;

      if (PlayerState && typeof player.addEventListener === 'function') {
        player.addEventListener(PlayerState.READY, () => {
          console.log('✅ Player listo');
          setPlayerReady(true);
          setPlayerError('');
        });

        player.addEventListener(PlayerState.PLAYING, () => {
          console.log('▶️ Reproduciendo');
          setIsPlaying(true);
          setPlayerError('');
        });

        player.addEventListener(PlayerState.ENDED, () => {
          console.log('⏹️ Stream finalizado');
          setIsPlaying(false);
        });

        if (PlayerState.BUFFERING) {
          player.addEventListener(PlayerState.BUFFERING, () => {
            console.log('⏳ Buffering...');
          });
        }
      } else if (videoElement) {
        // Fallback: usar eventos nativos del elemento video
        console.log('🔄 Usando eventos nativos del video element');
        
        videoElement.addEventListener('loadstart', () => {
          console.log('✅ Video cargando');
          setPlayerReady(true);
          setPlayerError('');
        });

        videoElement.addEventListener('playing', () => {
          console.log('▶️ Video reproduciendo');
          setIsPlaying(true);
          setPlayerError('');
        });

        videoElement.addEventListener('pause', () => {
          console.log('⏸️ Video pausado');
          setIsPlaying(false);
        });

        videoElement.addEventListener('ended', () => {
          console.log('⏹️ Video finalizado');
          setIsPlaying(false);
        });

        videoElement.addEventListener('error', (error) => {
          console.error('❌ Error del video:', error);
          setPlayerError('Error de reproducción del video');
          setIsPlaying(false);
        });
      }

      // Configurar volumen inicial
      if (typeof player.setVolume === 'function') {
        player.setVolume(playerState.volume);
      } else if (videoElement) {
        videoElement.volume = playerState.volume;
      }
      
      // Cargar stream
      if (typeof player.load === 'function') {
        player.load(streamData.channel.playback_url);
        console.log('✅ Stream cargado con player.load()');
      } else if (videoElement) {
        videoElement.src = streamData.channel.playback_url;
        videoElement.load();
        console.log('✅ Stream cargado con video.src');
      } else {
        throw new Error('No se pudo cargar el stream');
      }
      
      // Intentar auto-play después de un pequeño delay
      setTimeout(() => {
        try {
          if (typeof player.play === 'function') {
            player.play();
          } else if (videoElement && typeof videoElement.play === 'function') {
            videoElement.play().catch(playError => {
              console.warn('⚠️ Auto-play falló:', playError);
            });
          }
        } catch (playError) {
          console.warn('⚠️ Auto-play falló:', playError);
        }
      }, 1000);
      
    } catch (err) {
      console.error('❌ Error inicializando player:', err);
      setPlayerError('Error inicializando el reproductor: ' + (err.message || err.toString()));
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
        console.log('🧹 Player limpiado correctamente');
      } catch (e) {
        console.warn('⚠️ Error limpiando player:', e);
      }
    }
    
    // Limpiar container
    if (videoRef.current) {
      videoRef.current.innerHTML = '';
    }
  };

  // Controles del player
  const togglePlay = () => {
    if (!playerRef.current) return;
    
    try {
      if (typeof playerRef.current.play === 'function' && typeof playerRef.current.pause === 'function') {
        // Usar métodos del player IVS
        if (isPlaying) {
          playerRef.current.pause();
        } else {
          playerRef.current.play();
        }
      } else {
        // Fallback: buscar elemento video en el DOM
        const videoElement = videoRef.current?.querySelector('video');
        if (videoElement) {
          if (isPlaying) {
            videoElement.pause();
          } else {
            videoElement.play().catch(playError => {
              console.warn('⚠️ Error en play:', playError);
              setPlayerError('Error reproduciendo video');
            });
          }
        }
      }
    } catch (err) {
      console.error('❌ Error toggling play:', err);
      setPlayerError('Error controlando reproducción');
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    
    try {
      const newMuted = !playerState.muted;
      
      if (typeof playerRef.current.setMuted === 'function') {
        // Usar método del player IVS
        playerRef.current.setMuted(newMuted);
      } else {
        // Fallback: usar elemento video
        const videoElement = videoRef.current?.querySelector('video');
        if (videoElement) {
          videoElement.muted = newMuted;
        }
      }
      
      setPlayerState(prev => ({ ...prev, muted: newMuted }));
    } catch (err) {
      console.error('❌ Error toggling mute:', err);
    }
  };

  const handleVolumeChange = (newVolume) => {
    if (!playerRef.current) return;
    
    try {
      if (typeof playerRef.current.setVolume === 'function') {
        // Usar método del player IVS
        playerRef.current.setVolume(newVolume);
      } else {
        // Fallback: usar elemento video
        const videoElement = videoRef.current?.querySelector('video');
        if (videoElement) {
          videoElement.volume = newVolume;
        }
      }
      
      setPlayerState(prev => ({ ...prev, volume: newVolume }));
    } catch (err) {
      console.error('❌ Error changing volume:', err);
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

  // Estado de carga inicial o problemas con SDK
  if (!sdkLoaded || (loading && !streamData)) {
    return (
      <div className="ivs-player-container">
        <div className="ivs-loading-card">
          <div className="loading-content">
            <div className="loading-spinner">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">
                  {!sdkLoaded ? 'Cargando SDK...' : 'Verificando stream...'}
                </span>
              </div>
            </div>
            <h4>
              {!sdkLoaded ? 'Cargando reproductor...' : 'Verificando transmisión en vivo...'}
            </h4>
            <p>
              {!sdkLoaded ? 'Iniciando AWS IVS Player' : 'Conectando con el servidor de streaming'}
            </p>
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
                  Reintentar
                </>
              )}
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
            <p>En este momento no hay ninguna transmisión activa. Las transmisiones aparecerán automáticamente cuando estén disponibles.</p>
            
            <div className="offline-info">
              <div className="info-item">
                <i className="fas fa-tv me-2"></i>
                <span>Canal: {streamData?.channel?.name || 'Canal Principal'}</span>
              </div>
              <div className="info-item">
                <i className="fas fa-clock me-2"></i>
                <span>Última verificación: {new Date().toLocaleTimeString()}</span>
              </div>
              <div className="info-item">
                <i className={`fas fa-sync-alt me-2 ${autoCheckActive ? 'fa-spin' : ''}`}></i>
                <span>
                  Verificación automática cada 30 segundos
                  {autoCheckActive && <span className="status-indicator"> • Activa</span>}
                </span>
              </div>
            </div>
            
            <div className="offline-actions">
              <button 
                onClick={checkStreamStatus}
                className="btn btn-primary btn-modern"
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
                    Verificar ahora
                  </>
                )}
              </button>
              
              <div className="offline-hint">
                <i className="fas fa-info-circle me-2"></i>
                <small>No necesitas recargar la página. El stream aparecerá automáticamente cuando esté disponible.</small>
              </div>
            </div>
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
          ref={videoRef}
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