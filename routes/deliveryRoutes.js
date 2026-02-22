import express from 'express';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { ROLES } from '../config/roles.js';
import * as deliveryController from '../controllers/deliveryController.js';
import { uploadSingleProfile, handleMulterError } from '../config/multer.js';

const router = express.Router();

// Autenticación obligatoria
router.use(requireAuth);
router.use(requireRole(ROLES.DELIVERY));

// Home y detalle
router.get('/home', deliveryController.getHomeDelivery);
router.get('/order/:id', deliveryController.getOrderDetail);

// Tomar y completar pedido
router.post('/order/:id/take', deliveryController.takeOrder);
router.post('/order/:id/complete', deliveryController.completeOrder);

// Perfil
router.get('/profile', deliveryController.getProfile);
router.post('/profile/update', uploadSingleProfile, handleMulterError, deliveryController.updateProfile);

export default router;
