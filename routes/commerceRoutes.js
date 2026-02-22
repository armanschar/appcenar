// routes/commerceRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { uploadSingleCommerceLogo, handleMulterError } from '../config/multer.js';
import { ROLES } from '../config/roles.js';
import { 
    getHome, 
    getOrderDetail, 
    assignDeliveryToOrder,
    getProfile,
    updateProfile,
    logout,
    getCategories,
    showCreateCategoryForm,
    createCategory,
    showEditCategoryForm,
    editCategory,
    deleteCategory,
    getProducts,
    showCreateProductForm,
    createProduct,
    showEditProductForm,
    editProduct,
    deleteProduct
} from '../controllers/commerceController.js';

const router = express.Router();

// Configuración multer para subir imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Autenticación obligatoria
router.use(requireAuth);
router.use(requireRole(ROLES.COMERCIO));

/* ==============================
   HOME
============================== */
router.get('/home', getHome);

/* ==============================
   ORDERS
============================== */
router.get('/orders/:orderId', getOrderDetail);
router.post('/orders/:orderId/assign-delivery', assignDeliveryToOrder);

/* ==============================
   LOGOUT
============================== */
router.post('/logout', logout);

/* ==============================
   PERFIL - Using Controller Methods
============================== */
router.get('/profile', getProfile);
router.post('/profile', uploadSingleCommerceLogo, handleMulterError, updateProfile);

/* ==============================
   CATEGORÍAS - Using Controller Methods
============================== */

// Listar categorías
router.get('/categories', getCategories);

// Crear categoría - GET
router.get('/categories/create', showCreateCategoryForm);

// Crear categoría - POST
router.post('/categories/create', createCategory);

// Editar categoría - GET
router.get('/categories/:id/edit', showEditCategoryForm);

// Editar categoría - POST
router.post('/categories/:id/edit', editCategory);

// Eliminar categoría - POST
router.post('/categories/:id/delete', deleteCategory);

/* ==============================
   PRODUCTOS - Using Controller Methods
============================== */

// Listar productos
router.get('/products', getProducts);

// Crear producto - GET
router.get('/products/create', showCreateProductForm);

// Crear producto - POST
router.post('/products/create', upload.single('image'), createProduct);

// Editar producto - GET
router.get('/products/:id/edit', showEditProductForm);

// Editar producto - POST
router.post('/products/:id/edit', upload.single('image'), editProduct);

// Eliminar producto - POST
router.post('/products/:id/delete', deleteProduct);

export default router;