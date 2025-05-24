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
- [Instalación](#-instalación)
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

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/frenlius-web-app.git
cd frenlius-web-app
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:
```env
VITE_AWS_REGION=us-east-2
VITE_AWS_USER_POOL_ID=us-east-2_khpKAsiNV
VITE_AWS_USER_POOL_CLIENT_ID=101q5gvqu674oef9gvqv5hv911
```

### 4. Iniciar el servidor de desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## ⚙️ Configuración

### AWS Cognito Setup

1. **User Pool Configuration:**
   - Sign-in: Username only
   - Password policy: 8+ characters, mixed case, numbers, symbols
   - No self-registration (admin-managed users)

2. **User Creation:**
   ```bash
   aws cognito-idp admin-create-user \
     --user-pool-id us-east-2_khpKAsiNV \
     --username nuevo_usuario \
     --temporary-password TempPass123! \
     --message-action SUPPRESS
   ```

### Configuración de S3

- Bucket configurado para recibir imágenes
- CORS habilitado para la aplicación
- Políticas de acceso via API Gateway

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

## 📁 Estructura del Proyecto

```
frenlius-web-app/
├── public/
│   ├── vite.svg
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── AuthLayout.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── NewPasswordRequired.jsx
│   │   ├── FlightSelection.jsx
│   │   ├── ImageUpload.jsx
│   │   └── NavBar.jsx
│   ├── styles/
│   │   ├── main.css
│   │   ├── navbar-styles.css
│   │   ├── pages-styles.css
│   │   ├── components-styles.css
│   │   └── auth-styles.css
│   ├── App.jsx
│   ├── main.jsx
│   └── aws-export.js
├── package.json
├── vite.config.js
└── README.md
```

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

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Linting con ESLint

# Utilidades
npm run clean        # Limpiar node_modules y cache
npm run type-check   # Verificar tipos TypeScript (si aplica)
```

## 🌐 Deployment

### Build para Producción
```bash
npm run build
```

### Variables de Entorno (Producción)
```env
VITE_AWS_REGION=us-east-2
VITE_AWS_USER_POOL_ID=your_production_user_pool_id
VITE_AWS_USER_POOL_CLIENT_ID=your_production_client_id
VITE_API_ENDPOINT=https://your-api.amazonaws.com/prod
```

### Deployment Options
- **AWS Amplify Hosting**
- **Vercel**
- **Netlify**
- **AWS S3 + CloudFront**

## 🐛 Troubleshooting

### Problemas Comunes

**Error: "User not found"**
```bash
# Verificar que el usuario existe en Cognito
aws cognito-idp admin-get-user \
  --user-pool-id us-east-2_khpKAsiNV \
  --username nombre_usuario
```

**Error: "Email not verified"**
```bash
# Verificar email manualmente
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id us-east-2_khpKAsiNV \
  --username nombre_usuario
```

**Problemas de CORS**
- Verificar configuración en API Gateway
- Comprobar headers permitidos
- Revisar dominios autorizados

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

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm test

# Coverage report
npm run test:coverage

# Tests e2e (si están configurados)
npm run test:e2e
```

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

- **Desarrollo Frontend** - [Tu Nombre]
- **Arquitectura AWS** - [Tu Nombre]
- **UI/UX Design** - [Tu Nombre]

## 📞 Soporte

¿Necesitas ayuda? Contáctanos:

- **Email:** soporte@frenlius.com
- **Issues:** [GitHub Issues](https://github.com/tu-usuario/frenlius-web-app/issues)
- **Documentación:** [Wiki del Proyecto](https://github.com/tu-usuario/frenlius-web-app/wiki)

---

⭐ **¡Si te gusta este proyecto, déjanos una estrella!** ⭐

Hecho con ❤️ usando React y AWS
