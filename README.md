# AppCenar

AppCenar es una plataforma de entrega de comida desarrollada con Node.js, Express y Sequelize. Proporciona funcionalidad para clientes, comercios, repartidores y administradores.

## Tipo de Aplicación

Aplicación web full-stack con CRUD completo para gestión de:
- Usuarios (clientes, comercios, repartidores, administradores)
- Productos y categorías
- Pedidos y detalles de pedidos
- Direcciones de entrega
- Tipos de comercios
- Favoritos y configuraciones del sistema

## Características

- **Portal de Cliente**: Navegar restaurantes, realizar pedidos, gestionar direcciones y favoritos
- **Portal de Comercio**: Gestionar productos, categorías y pedidos
- **Portal de Repartidor**: Ver y gestionar entregas
- **Portal de Administrador**: Gestionar usuarios, tipos de comercios y configuración del sistema
- **Autenticación de Usuarios**: Login, registro y recuperación de contraseña
- **Notificaciones por Email**: Servicio automatizado de correo para notificaciones

## Tecnologías

- **Backend**: Node.js con Express.js
- **Motor de Plantillas**: Handlebars (HBS)
- **Base de Datos**: SQLite (por defecto), MySQL/MariaDB via Sequelize ORM
- **Autenticación**: Express Session con bcrypt para hash de contraseñas
- **Carga de Archivos**: Multer
- **Email**: Nodemailer

## Requisitos Previos

- Node.js (v14 o superior recomendado)
- npm o yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone <url-de-tu-repositorio>
cd appcenar
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
   - Copiar `.env.example` a `.env`:
     ```bash
     copy .env.example .env
     ```
   - Actualizar las siguientes variables en `.env`:
     - `SESSION_SECRET`: Genera una clave secreta fuerte (puedes usar un generador online)
     - `EMAIL_USER`: Tu correo para notificaciones (Gmail recomendado)
     - `EMAIL_PASSWORD`: Contraseña de aplicación de Gmail (ver instrucciones abajo)
     - `PORT`: Puerto de la aplicación (por defecto: 8095)
     - `DB_DIALECT`: Tipo de base de datos (sqlite, mysql)

4. Configurar Gmail para envío de emails (opcional):
   - Habilitar verificación en 2 pasos en tu cuenta de Google
   - Generar una [Contraseña de Aplicación](https://support.google.com/accounts/answer/185833)
   - Usar esa contraseña en `EMAIL_PASSWORD`

5. Iniciar la aplicación:
```bash
npm start
```

o para ambiente QA:
```bash
npm run qa
```

## Credenciales de Prueba

La aplicación incluye una base de datos de ejemplo con un usuario administrador de prueba:

- **Usuario**: unadmin3
- **Contraseña**: (establecer la primera vez o usar reset de contraseña)
- **Email**: unadmi413n@admin.com

**Nota**: Esta es una cuenta de demostración con datos ficticios. Para uso en producción, crear nuevos usuarios con información real.

## Configuración de Base de Datos

### SQLite (Por Defecto)
La aplicación usa SQLite por defecto. El archivo de base de datos se creará automáticamente en la carpeta `database/`.

### MySQL/MariaDB
Para usar MySQL o MariaDB, actualizar el archivo `.env`:
```env
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nombre_de_tu_base_de_datos
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
```

## Estructura del Proyecto

```
appcenar/
├── config/          # Archivos de configuración (base de datos, roles, estados)
├── context/         # Contexto de la aplicación
├── controllers/     # Controladores de rutas
├── database/        # Almacenamiento de base de datos SQLite
├── middlewares/     # Middleware personalizado
├── models/          # Modelos de Sequelize
├── public/          # Recursos estáticos (CSS, JS, imágenes, uploads)
├── routes/          # Definición de rutas
├── services/        # Servicios de lógica de negocio
├── utils/           # Funciones y helpers de utilidad
├── views/           # Plantillas Handlebars
├── app.js           # Punto de entrada de la aplicación
└── package.json     # Dependencias del proyecto
```

## Scripts Disponibles

- `npm start` - Iniciar la aplicación con nodemon (modo desarrollo)
- `npm run qa` - Iniciar la aplicación en ambiente QA
- `npm test` - Ejecutar pruebas (no implementado aún)

## Roles de Usuario

La aplicación soporta cuatro roles de usuario:

1. **Cliente**: Puede navegar restaurantes, realizar pedidos, gestionar direcciones
2. **Comercio**: Puede gestionar productos, categorías y ver pedidos
3. **Repartidor**: Puede ver y gestionar entregas
4. **Administrador**: Puede gestionar todos los usuarios, tipos de comercios y configuración del sistema

## Variables de Entorno

| Variable | Descripción | Por Defecto |
|----------|-------------|-------------|
| NODE_ENV | Entorno (development/production/qa) | development |
| PORT | Puerto del servidor | 8095 |
| DB_DIALECT | Tipo de base de datos (sqlite/mysql) | sqlite |
| DB_FILENAME | Nombre del archivo de base de datos SQLite | appcenar.db |
| DB_FOLDER | Ruta de la carpeta de base de datos | database |
| DB_ALTER | Auto-alterar esquema de base de datos | false |
| DB_FORCE | Forzar reinicio de base de datos (ADVERTENCIA: elimina datos) | false |
| APP_URL | URL de la aplicación | http://localhost:8095 |
| SESSION_SECRET | Secreto de encriptación de sesión | (generar uno propio) |
| EMAIL_SERVICE | Proveedor de servicio de email | gmail |
| EMAIL_USER | Cuenta de correo | - |
| EMAIL_PASSWORD | Contraseña de correo o contraseña de aplicación | - |

## Notas de Seguridad

- Nunca subir el archivo `.env` al control de versiones (ya está en .gitignore)
- La base de datos incluida contiene solo datos de demostración ficticios sin información personal real
- Usar un `SESSION_SECRET` fuerte en producción (generar uno único)
- Para Gmail, usar una [Contraseña de Aplicación](https://support.google.com/accounts/answer/185833) en lugar de la contraseña regular
- Configurar tus propias credenciales de email en el archivo `.env` antes de usar el sistema de notificaciones
- En producción, crear nuevos usuarios administradores y eliminar las cuentas de demostración

## Deployment en Producción

Para desplegar esta aplicación en producción, se recomienda usar plataformas de hosting que permitan configurar variables de entorno de forma segura:

### Plataformas Recomendadas:
- **Railway**: Soporte nativo para Node.js y SQLite/PostgreSQL
- **Render**: Deploy automático desde GitHub con variables de entorno
- **Heroku**: Clásica plataforma PaaS con addons de base de datos
- **Vercel/Netlify**: Para despliegues serverless (requiere adaptación)
- **VPS (DigitalOcean, AWS, Azure)**: Control completo con PM2 o Docker

### Configuración de Variables de Entorno:

No subir el archivo `.env` al repositorio. En su lugar:

1. Configurar las variables de entorno directamente en el panel de la plataforma de hosting
2. Cada plataforma tiene su propia sección de "Environment Variables" o "Config Vars"
3. Agregar todas las variables del archivo `.env.example` con valores reales:
   - `SESSION_SECRET`: Generar una clave única y fuerte
   - `EMAIL_USER` y `EMAIL_PASSWORD`: Credenciales reales de producción
   - `DB_DIALECT`, `DB_HOST`, `DB_NAME`, etc.: Configuración de base de datos de producción

### Ejemplo de variables en producción:
```
NODE_ENV=production
PORT=8080
DB_DIALECT=mysql
DB_HOST=db.example.com
DB_NAME=appcenar_prod
DB_USER=prod_user
DB_PASSWORD=************
SESSION_SECRET=************
EMAIL_USER=noreply@tudominio.com
EMAIL_PASSWORD=************
```

De esta forma, las credenciales reales nunca se exponen en el código fuente.

## Contribuir

1. Hacer fork del repositorio
2. Crear una rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Hacer commit de los cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Hacer push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir un Pull Request


