# Frenlius App 🛩️

Una aplicación web moderna para la gestión y carga de imágenes de vuelo, construida con React y AWS Cognito.

![Frenlius App](https://img.shields.io/badge/React-18.x-blue)
![AWS Cognito](https://img.shields.io/badge/AWS-Cognito-orange)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.x-purple)
![License](https://img.shields.io/badge/License-MIT-green)

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#️-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Configuración](#️-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Funcionalidades](#-funcionalidades)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

## ✨ Características

- 🔐 **Autenticación segura** con AWS Cognito
- 📱 **Diseño responsive** con glassmorphism moderno
- 🖼️ **Carga de imágenes** con drag & drop
- ✈️ **Selección de rutas de vuelo** con validación de fechas
- 🎨 **UI/UX moderna** con animaciones suaves
- 🔒 **Gestión de usuarios** controlada por administrador
- ⚡ **Performance optimizada** con lazy loading
- 🌐 **Soporte multi-idioma** (Español)

## 🛠️ Tecnologías

### Frontend
- **React 18** - Framework principal
- **React Router DOM** - Enrutamiento
- **Vite** - Build tool y dev server
- **Bootstrap 5** - Framework CSS base
- **CSS Custom Properties** - Design system moderno
- **Font Awesome** - Iconografía
- **Google Fonts** - Tipografía (Inter, JetBrains Mono)

### Backend & Servicios
- **AWS Cognito** - Autenticación y autorización
- **AWS Amplify** - SDK para integración con AWS
- **AWS S3** - Almacenamiento de imágenes
- **AWS API Gateway** - APIs REST

### Herramientas de Desarrollo
- **ESLint** - Linting de código
- **Git** - Control de versiones
- **Chrome DevTools** - Debugging

## 📋 Requisitos Previos

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Git**
- **Cuenta AWS** con acceso a Cognito y S3

## 🎯 Uso

### Para Usuarios

1. **Primer Login:**
   - Usar credenciales proporcionadas por el administrador
   - Cambiar contraseña temporal en el primer acceso
   - Acceder al dashboard principal

2. **Subir Imágenes:**
   - Ir a "Upload Images"
   - Seleccionar ruta de vuelo
   - Configurar fecha/hora (actual o manual)
   - Subir imágenes por drag & drop o selección

3. **Gestión de Archivos:**
   - Vista previa de archivos seleccionados
   - Validación automática de formatos
   - Progress bars en tiempo real

### Para Administradores

1. **Crear Usuarios:**
   ```bash
   # Usar AWS CLI o consola de AWS Cognito
   # Los usuarios recibirán contraseña temporal
   ```

2. **Gestionar Accesos:**
   - Activar/desactivar usuarios
   - Resetear contraseñas
   - Configurar permisos

## 🔧 Funcionalidades

### Autenticación
- ✅ Login con username
- ✅ Cambio de contraseña obligatorio (primer login)
- ✅ Recuperación de contraseña
- ✅ Logout automático por inactividad
- ✅ Validación de formularios en tiempo real

### Gestión de Vuelos
- ✅ Selección de rutas predefinidas
- ✅ Configuración de fecha/hora actual o manual
- ✅ Validación de fechas (no futuras)
- ✅ Generación automática de nombres de vuelo

### Carga de Imágenes
- ✅ Drag & drop interface
- ✅ Selección múltiple de archivos
- ✅ Validación de formatos (JPEG, PNG, GIF, WebP)
- ✅ Límite de tamaño (50MB por archivo)
- ✅ Progress bars en tiempo real
- ✅ Vista previa de archivos

### UI/UX
- ✅ Diseño glassmorphism moderno
- ✅ Animaciones suaves y transiciones
- ✅ Responsive design (mobile-first)
- ✅ Loading states profesionales
- ✅ Feedback visual para todas las acciones

## 🎨 Design System

### Colores Principales
- **Primary:** `#3b82f6` (Blue)
- **Secondary:** `#6366f1` (Indigo)
- **Success:** `#10b981` (Emerald)
- **Danger:** `#ef4444` (Red)
- **Warning:** `#f59e0b` (Amber)

### Tipografía
- **Primary:** Inter (300, 400, 500, 600, 700, 800)
- **Monospace:** JetBrains Mono (400, 500, 600)

### Espaciado
- **Sistema 8px:** 0.5rem, 1rem, 1.5rem, 2rem, 3rem, 4rem

## 📱 Responsive Breakpoints

- **Mobile:** < 576px
- **Tablet:** 576px - 768px
- **Desktop:** 768px - 1200px
- **Large:** > 1200px

## 🔒 Seguridad

- **Autenticación:** AWS Cognito con tokens JWT
- **Autorización:** Role-based access control
- **Validación:** Client-side y server-side
- **Encriptación:** HTTPS/TLS en producción
- **CORS:** Configurado para dominios autorizados

## 📈 Performance

### Optimizaciones Implementadas
- ✅ Lazy loading de componentes
- ✅ Memoización con React.memo
- ✅ Optimización de imágenes
- ✅ Code splitting automático
- ✅ CSS minificado y comprimido
- ✅ Font loading optimizado

### Métricas Objetivo
- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **Time to Interactive:** < 3.5s

## 📊 Monitoring

### Métricas Recomendadas
- Tiempo de carga de página
- Errores de autenticación
- Uploads exitosos vs fallidos
- Tiempo de respuesta de APIs

### Herramientas Sugeridas
- **AWS CloudWatch** - Logging y métricas
- **Google Analytics** - Analítica web
- **Sentry** - Error tracking
- **Lighthouse** - Performance audits

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Convenciones de Código
- **ESLint:** Seguir reglas configuradas
- **Commits:** Usar Conventional Commits
- **CSS:** BEM methodology para clases
- **JavaScript:** ES6+ features

## 📝 Changelog

### v1.0.0 (2024-12-XX)
- ✅ Sistema de autenticación completo
- ✅ Carga de imágenes con drag & drop
- ✅ Gestión de rutas de vuelo
- ✅ UI/UX moderna con glassmorphism
- ✅ Responsive design completo

### Próximas Features
- 🔜 Dashboard con métricas
- 🔜 Gestión avanzada de archivos
- 🔜 Modo oscuro
- 🔜 Notificaciones push
- 🔜 Exportación de datos

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo

- **Desarrollo Frontend** - Juan Manuel Uribe Quintero
- **Arquitectura AWS** - Juan Carlos Suarez / Juan Manuel Uribe Quintero
- **UI/UX Design** - Juan Manuel Uribe Quintero

## 📞 Soporte

¿Necesitas ayuda? Contáctanos:

- **Email:** soporte@frenlius.com
- **Issues:** [GitHub Issues](https://github.com/tu-usuario/frenlius-web-app/issues)
- **Documentación:** [Wiki del Proyecto](https://github.com/tu-usuario/frenlius-web-app/wiki)