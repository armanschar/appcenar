import express from 'express';
import {
    GetClientHome,
    GetClientProfile,
    PostClientProfile,
    GetClientOrders,
    GetClientOrderDetail,
    GetClientAddresses,
    GetCreateAddress,
    PostCreateAddress,
    GetEditAddress,
    PostEditAddress,
    GetDeleteAddress,
    PostDeleteAddress,
    GetClientFavorites,
    GetCommerceList,
    PostToggleFavorite,
    GetProductCatalog,
    PostAddToCart,
    PostRemoveFromCart,
    GetOrderAddresses,
    PostOrderAddresses
} from '../controllers/clientController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { uploadSingleProfile, handleMulterError } from '../config/multer.js';
import { ROLES } from '../config/roles.js';

const router = express.Router();

// autenticacion obligatoria para las rutas de cliente
router.use(requireAuth);
router.use(requireRole(ROLES.CLIENTE));

// ruts de cliente
router.get('/home', GetClientHome);
router.get('/profile', GetClientProfile);
router.post('/profile', uploadSingleProfile, handleMulterError, PostClientProfile);
router.get('/orders', GetClientOrders);
router.get('/orders/:id', GetClientOrderDetail);

// manejo de direcciones
router.get('/addresses', GetClientAddresses);
router.get('/addresses/create', GetCreateAddress);
router.post('/addresses/create', PostCreateAddress);
router.get('/addresses/edit/:id', GetEditAddress);
router.post('/addresses/edit/:id', PostEditAddress);
router.get('/addresses/delete/:id', GetDeleteAddress);
router.post('/addresses/delete/:id', PostDeleteAddress);

// lista comercios y favoritos

router.get('/favorites', GetClientFavorites);

router.get('/commerces', GetCommerceList);
router.post('/toggle-favorite', PostToggleFavorite);

// producto catalog y carrito
router.get('/commerce/:id/catalog', GetProductCatalog);

// manejo carrito
router.post('/cart/add', PostAddToCart);
router.post('/cart/remove', PostRemoveFromCart);

// confirmar orden
router.get('/order-addresses', GetOrderAddresses);
router.post('/order-addresses', PostOrderAddresses);

export default router;
