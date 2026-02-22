import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// confirmar que el directorio existe, si no, crearlo
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// configuracion de multer para subir imagenes de perfil
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileName = `${uuidv4()}-${file.originalname}`;
    cb(null, fileName);
  }
});

// evitar archivos que no sean de tipo imagen
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)'), false);
  }
};

// configuracion de multer para subir imagenes de perfil
export const uploadProfilePicture = multer({
  storage: profileStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limite
    files: 1 // un archivo por solicitud
  }
});

// middleware para subir una sola imagen de perfil
export const uploadSingleProfile = uploadProfilePicture.single('profileImage');

// configuracion de multer para subir logos de comercio
const commerceLogoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'commerce-logos');
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileName = `${uuidv4()}-${file.originalname}`;
    cb(null, fileName);
  }
});

// configuracion de multer para logos de comercio
export const uploadCommerceLogo = multer({
  storage: commerceLogoStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limite
    files: 1 // un archivo por solicitud
  }
});

// middleware para subir logo de comercio
export const uploadSingleCommerceLogo = uploadCommerceLogo.single('logo');


// middleware para manejar errores de multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      req.flash('error', 'El archivo es demasiado grande. Máximo 5MB permitido.');
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      req.flash('error', 'Demasiados archivos. Solo se permite un archivo.');
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      req.flash('error', 'Campo de archivo inesperado.');
    } else {
      req.flash('error', 'Error al subir el archivo.');
    }
  } else if (err) {
    req.flash('error', err.message || 'Error al procesar el archivo.');
  }
  
  if (err) {
    return res.redirect('back');
  }
  
  next();
};

// funcion para eliminar imagenes de perfil antiguas
export const deleteOldProfilePicture = (filename) => {
  if (filename && filename !== 'default-avatar.png') {
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'profiles', filename);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Error deleting old profile picture:', err);
      }
    });
  }
};

// configuracion de multer para subir iconos de tipos de comercio
const commerceTypeIconStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'commerce-types'); // Changed from 'icons' to 'commerce-types'
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileName = `${uuidv4()}-${file.originalname}`;
    cb(null, fileName);
  }
});

// configuracion de multer para iconos de tipos de comercio
export const uploadCommerceTypeIcon = multer({
  storage: commerceTypeIconStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limite para iconos (más pequeño)
    files: 1 // un archivo por solicitud
  }
});

// middleware para subir icono de tipo de comercio
export const uploadSingleCommerceTypeIcon = uploadCommerceTypeIcon.single('icon');
export default {
  uploadSingleProfile,
  uploadSingleCommerceLogo,
  uploadSingleCommerceTypeIcon,
  handleMulterError,
  deleteOldProfilePicture
};