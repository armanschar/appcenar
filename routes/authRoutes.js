import express from 'express';
import {
    GetLogin,
    PostLogin,
    GetRegisterClientDelivery,
    PostRegisterClientDelivery,
    GetRegisterCommerce,
    PostRegisterCommerce,
    GetActivate,
    PostLogout,
    GetReset,
    PostReset,
    GetForgot,
    PostForgot,
} from '../controllers/authController.js';
import { uploadSingleProfile, uploadSingleCommerceLogo, handleMulterError } from '../config/multer.js';
import { requireGuest } from '../middlewares/authMiddleware.js';

const router = express.Router();

// autenticacion solo para usuarios no autenticados
router.get('/', requireGuest, GetLogin);
router.post('/', requireGuest, PostLogin);
router.get('/register-client-delivery', requireGuest, GetRegisterClientDelivery);
router.post('/register-client-delivery', requireGuest, uploadSingleProfile, handleMulterError, PostRegisterClientDelivery);
router.get('/register-commerce', requireGuest, GetRegisterCommerce);
router.post('/register-commerce', requireGuest, uploadSingleCommerceLogo, handleMulterError, PostRegisterCommerce);

// rutas que funcionan independientemente del estado de autenticación
router.get('/activate/:token', GetActivate);
router.get('/reset/:token', GetReset);
router.post('/reset', PostReset);

router.get('/forgot', requireGuest, GetForgot);
router.post('/forgot', requireGuest, PostForgot);

// rutas de cierre de sesión
router.post('/logout', PostLogout);

export default router;