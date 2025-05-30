import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { apiPost } from '../services/apiClient'; // ← IMPORT CORREGIDO

const ImageUpload = ({ selectedRoute }) => {
  const [images, setImages] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Validar archivo
  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 30 * 1024 * 1024; // 30MB
    
    if (!allowedTypes.includes(file.type)) {
      return 'Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)';
    }
    
    if (file.size > maxSize) {
      return 'El archivo es demasiado grande (máximo 30MB)';
    }
    
    return null;
  };

  // Procesar archivos
  const processFiles = (fileList) => {
    const validFiles = [];
    const errors = [];
    
    Array.from(fileList).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError('');
    }
    
    setImages(prevImages => [...prevImages, ...validFiles]);
  };

  // Manejar drag & drop
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    processFiles(files);
  }, []);

  // Manejar selección de archivos
  const handleFileSelect = (event) => {
    const files = event.target.files;
    processFiles(files);
  };

  // Manejar selección de carpeta
  const handleFolderSelect = (event) => {
    const files = event.target.files;
    processFiles(files);
  };

  // Remover imagen
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setError('');
  };

  // Limpiar todo
  const clearAll = () => {
    setImages([]);
    setUploadProgress({});
    setUploadComplete(false);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Subir imágenes - CAMBIO CRÍTICO AQUÍ
  const handleSubmit = async () => {
    if (!selectedRoute || images.length === 0) {
      setError('Selecciona una ruta y al menos una imagen.');
      return;
    }

    setUploading(true);
    setUploadComplete(false);
    setError('');
    
    const imageNames = images.map(image => `${selectedRoute}/${image.name}`).join(',');

    try {
      // Usar URL completa como en FlightSelection
      const data = await apiPost('https://xsw6ikn9dd.execute-api.us-east-2.amazonaws.com/prod/upload-image', {
        image_keys: imageNames
      });

      console.log('Respuesta completa de apiPost:', data); // ← DEBUG
      
      // Verificar si urls está en data directamente o en data.data
      const urls = data.urls || data.data?.urls || data;
      
      if (!urls || !Array.isArray(urls)) {
        throw new Error('No se recibieron URLs válidas del servidor');
      }

      // Subir cada imagen con progreso
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const uploadUrl = urls.find(url => url.image_key.endsWith(`/${image.name}`)).uploadUrl;

        setUploadProgress(prev => ({
          ...prev,
          [i]: { progress: 0, status: 'uploading' }
        }));

        try {
          // NOTA: Esta parte sigue usando axios directo porque es para subir a S3
          // No necesita autenticación de Cognito
          await axios.put(uploadUrl, image, {
            headers: {
              'Content-Type': image.type
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(prev => ({
                ...prev,
                [i]: { progress, status: 'uploading' }
              }));
            }
          });

          setUploadProgress(prev => ({
            ...prev,
            [i]: { progress: 100, status: 'completed' }
          }));
        } catch (error) {
          setUploadProgress(prev => ({
            ...prev,
            [i]: { progress: 0, status: 'error' }
          }));
          throw error;
        }
      }

      setUploadComplete(true);
      setTimeout(() => {
        clearAll();
      }, 3000);

    } catch (error) {
      console.error('Error al subir las imágenes:', error);
      
      // Mejorar manejo de errores
      if (error.response?.status === 401) {
        setError('Error de autenticación. Por favor, inicia sesión nuevamente.');
      } else if (error.response?.status === 403) {
        setError('No tienes permisos para subir imágenes a esta ruta.');
      } else {
        setError('Error al subir las imágenes. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload-container">
      <div className="image-upload-card">
        {/* Header */}
        <div className="card-header">
          <div className="header-icon">
            <i className="fas fa-cloud-upload-alt"></i>
          </div>
          <div className="header-content">
            <h4>Subir Imágenes</h4>
            <p>Arrastra y suelta tus imágenes o haz clic para seleccionar</p>
          </div>
        </div>

        <div className="card-body">
          {/* Upload Zone */}
          <div 
            className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${images.length > 0 ? 'has-files' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-content">
              <div className="upload-icon">
                <i className={`fas ${isDragOver ? 'fa-hand-paper' : 'fa-cloud-upload-alt'}`}></i>
              </div>
              
              <div className="upload-text">
                <h5>
                  {isDragOver ? 'Suelta las imágenes aquí' : 'Arrastra y suelta tus imágenes'}
                </h5>
                <p>
                  o <span className="upload-link">haz clic para seleccionar archivos</span>
                </p>
                <small>Formatos soportados: JPEG, PNG, GIF, WebP (máx. 10MB cada uno)</small>
              </div>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Action Buttons */}
          <div className="upload-actions">
            <button
              type="button"
              className="btn btn-outline-primary btn-modern"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.webkitdirectory = true;
                input.multiple = true;
                input.accept = 'image/*';
                input.onchange = handleFolderSelect;
                input.click();
              }}
              disabled={uploading}
            >
              <i className="fas fa-folder-open me-2"></i>
              Seleccionar Carpeta
            </button>
            
            {images.length > 0 && (
              <button
                type="button"
                className="btn btn-outline-danger btn-modern"
                onClick={clearAll}
                disabled={uploading}
              >
                <i className="fas fa-trash me-2"></i>
                Limpiar Todo
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <pre>{error}</pre>
            </div>
          )}

          {/* Files List */}
          {images.length > 0 && (
            <div className="files-section">
              <div className="files-header">
                <h5>
                  <i className="fas fa-images me-2"></i>
                  Imágenes seleccionadas ({images.length})
                </h5>
                <div className="files-stats">
                  <span className="total-size">
                    Total: {formatFileSize(images.reduce((acc, img) => acc + img.size, 0))}
                  </span>
                </div>
              </div>

              <div className="files-list">
                {images.map((image, index) => {
                  const progress = uploadProgress[index];
                  return (
                    <div key={index} className={`file-item ${progress?.status || ''}`}>
                      <div className="file-info">
                        <div className="file-icon">
                          <i className="fas fa-file-image"></i>
                        </div>
                        <div className="file-details">
                          <div className="file-name" title={image.name}>
                            {image.name}
                          </div>
                          <div className="file-meta">
                            <span className="file-size">{formatFileSize(image.size)}</span>
                            {progress && (
                              <span className={`file-status ${progress.status}`}>
                                {progress.status === 'uploading' && `${progress.progress}%`}
                                {progress.status === 'completed' && '✓ Completado'}
                                {progress.status === 'error' && '✗ Error'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {progress && progress.status === 'uploading' && (
                        <div className="file-progress">
                          <div 
                            className="progress-bar" 
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        </div>
                      )}
                      
                      {!uploading && (
                        <button
                          className="remove-file"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          title="Eliminar archivo"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload Button */}
          {images.length > 0 && (
            <div className="upload-submit">
              <button
                type="button"
                className="btn btn-primary btn-lg btn-upload"
                onClick={handleSubmit}
                disabled={uploading || !selectedRoute}
              >
                {uploading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    Subiendo imágenes...
                  </>
                ) : uploadComplete ? (
                  <>
                    <i className="fas fa-check-circle me-2"></i>
                    ¡Subida completada!
                  </>
                ) : (
                  <>
                    <i className="fas fa-rocket me-2"></i>
                    Subir {images.length} imagen{images.length !== 1 ? 'es' : ''}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Success Message */}
          {uploadComplete && (
            <div className="success-message">
              <div className="success-content">
                <div className="success-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="success-text">
                  <h5>¡Subida exitosa!</h5>
                  <p>Todas las imágenes se han subido correctamente al vuelo <strong>{selectedRoute}</strong></p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;