import express from 'express';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { ROLES } from '../config/roles.js';
import * as adminController from '../controllers/adminController.js';
import {
  mostrarConfiguracion,
  editarConfiguracion,
  actualizarConfiguracion,
} from '../controllers/adminController.js';
import { uploadSingleCommerceTypeIcon } from '../config/multer.js';

const router = express.Router();

// Autenticación obligatoria para las rutas de admin
router.use(requireAuth);
router.use(requireRole(ROLES.ADMIN));

// Rutas de administrador
router.get('/dashboard', adminController.mostrarDashboard);
router.get('/clientes', adminController.listadoClientes);

//activar y inacticar clientes

router.post('/clientes/inactivar/:id', adminController.inactivarCliente);
router.post('/clientes/activar/:id', adminController.activarCliente);


router.get("/comercios", adminController.listarComercios);

//activar y inactivar comercios

router.post("/comercio/activar/:id", adminController.activarComercio);
router.post("/comercio/inactivar/:id", adminController.inactivarComercio);

// Listado de delivery
router.get('/delivery', adminController.listadoDelivery);

// Activar / Inactivar delivery
router.post('/delivery/activar/:id', adminController.activarDelivery);
router.post('/delivery/inactivar/:id', adminController.inactivarDelivery);

router.get('/configuracion', mostrarConfiguracion);

// Formulario de edición
router.get('/configuracion/editar/:id', editarConfiguracion);

// Guardar cambios
router.post('/configuracion/editar/:id', actualizarConfiguracion);

// Manejo de administradores
router.get('/administradores', adminController.listadoAdministradores);
router.get('/administradores/crear', adminController.mostrarCrearAdmin);
router.post('/administradores/crear', adminController.crearAdministrador);
router.get('/administradores/editar/:id', adminController.mostrarEditarAdmin);
router.post('/administradores/editar/:id', adminController.editarAdministrador);
router.post('/administradores/activar/:id', adminController.activarAdministrador);
router.post('/administradores/inactivar/:id', adminController.inactivarAdministrador);

router.get('/tipos-comercios', adminController.listarTiposComercios);

// Crear tipo de comercio
router.get('/tipos-comercios/crear', adminController.formCrearTipoComercio);
router.post('/tipos-comercios/crear', uploadSingleCommerceTypeIcon, adminController.crearTipoComercio);

// Editar tipo de comercio
router.get('/tipos-comercios/editar/:id', adminController.formEditarTipoComercio);
router.post('/tipos-comercios/editar/:id', uploadSingleCommerceTypeIcon, adminController.editarTipoComercio);

// Eliminar tipo de comercio
router.get('/tipos-comercios/eliminar/:id', adminController.confirmarEliminarTipoComercio);
router.post('/tipos-comercios/eliminar/:id', adminController.eliminarTipoComercio);

export default router;