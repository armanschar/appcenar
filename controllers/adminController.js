import context from '../context/appcontext.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';


const {
  OrderModel: Order,
  CommerceModel: Commerce,
  ClientModel: Client,
  DeliveryModel: Delivery,
  ProductModel: Product,
  ConfigurationModel: Configuration,
  AdminModel: Admin,
  CommerceTypeModel: CommerceType,
  Sequelize
} = context;


export const mostrarDashboard = async (req, res) => {
  try {
    const [
      totalPedidos,
      pedidosHoy,
      comerciosActivos,
      comerciosInactivos,
      clientesActivos,
      clientesInactivos,
      deliveryActivos,
      deliveryInactivos,
      totalProductos
    ] = await Promise.all([
      Order.count(),
      Order.count({
        where: Sequelize.where(
          Sequelize.fn('date', Sequelize.col('createdAt')),
          Sequelize.fn('date', 'now')
        )
      }),
      Commerce.count({ where: { isActive: true } }),
      Commerce.count({ where: { isActive: false } }),
      Client.count({ where: { isActive: true } }),
      Client.count({ where: { isActive: false } }),
      Delivery.count({ where: { isActive: true } }),
      Delivery.count({ where: { isActive: false } }),
      Product.count()
    ]);

    const totalComercios = comerciosActivos + comerciosInactivos;
    const totalClientes = clientesActivos + clientesInactivos;
    const totalDelivery = deliveryActivos + deliveryInactivos;

    const dashboardData = {
      totalPedidos,
      pedidosHoy,
      comerciosActivos,
      comerciosInactivos,
      totalComercios,
      clientesActivos,
      clientesInactivos,
      totalClientes,
      deliveryActivos,
      deliveryInactivos,
      totalDelivery,
      totalProductos,
      'page-title': 'Dashboard Administrativo',
      layout: 'main'
    };

    res.render("admin/dashboard", dashboardData);

  } catch (error) {
    console.error("Error al mostrar dashboard:", error);
    
    res.render("admin/dashboard", {
      totalPedidos: 0,
      pedidosHoy: 0,
      comerciosActivos: 0,
      comerciosInactivos: 0,
      totalComercios: 0,
      clientesActivos: 0,
      clientesInactivos: 0, 
      totalClientes: 0,
      deliveryActivos: 0,
      deliveryInactivos: 0,
      totalDelivery: 0,
      totalProductos: 0,
      'page-title': 'Dashboard Administrativo',
      layout: 'main',
      error: "Error al cargar los datos del dashboard"
    });
  }
};

// Listado de clientes
export const listadoClientes = async (req, res) => {
  try {
    const clientes = await Client.findAll({
      where: { role: 'Cliente' },
      include: [{
        model: Order,
        as: 'clientOrders',
        attributes: []
      }],
      attributes: [
        'id',
        'name',
        'lastName',
        'email',
        'username',
        'phone',
        'isActive',
        [Sequelize.fn('COUNT', Sequelize.col('clientOrders.id')), 'totalPedidos']
      ],
      group: ['Client.id'],
      order: [['lastName'], ['name']]
    });

    res.render('admin/list-clients', { 
      clientes: clientes.map(c => c.get({ plain: true })),
      'page-title': 'Lista de Clientes',
      layout: 'main'
    });
  } catch (error) {
    console.error('Error listado clientes:', error);
    res.status(500).send('Error al cargar el listado de clientes');
  }
};

// Activar cliente
export const activarCliente = async (req, res) => {
  const { id } = req.params;
  try {
    await Client.update({ isActive: true }, { where: { id } });
    res.redirect('/admin/clientes');
  } catch (error) {
    console.error('Error activar cliente:', error);
    res.status(500).send('Error al activar cliente');
  }
};

// Inactivar cliente
export const inactivarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    await Client.update({ isActive: false }, { where: { id } });
    res.redirect('/admin/clientes');
  } catch (error) {
    console.error('Error inactivando cliente:', error);
    res.status(500).send('Error inactivando cliente');
  }
};

// Listado de comercios
export const listarComercios = async (req, res) => {
  try {
    const comercios = await Commerce.findAll({
      include: [{
        model: Order,
        as: 'commerceOrders',
        attributes: []
      }],
      attributes: [
        'id',
        ['commerceName', 'name'],
        ['commerceLogo', 'logo'],
        'phone',
        ['openingTime', 'hora_apertura'],
        ['closingTime', 'hora_cierre'],
        'email',
        'isActive',
        [Sequelize.fn('COUNT', Sequelize.col('commerceOrders.id')), 'totalPedidos']
      ],
      group: ['Commerce.id'],
      order: [['commerceName']]
    });

    res.render('admin/list-commerces', {
      comercios: comercios.map(c => c.get({ plain: true })),
      'page-title': 'Listado de Comercios',
      layout: 'main'
    });

  } catch (error) {
    console.error('Error al obtener comercios:', error);
    res.status(500).send('Error al cargar el listado de comercios');
  }
};

// Activar comercio
export const activarComercio = async (req, res) => {
  const { id } = req.params;
  try {
    await Commerce.update({ isActive: true }, { where: { id } });
    res.redirect('/admin/comercios');
  } catch (error) {
    console.error('Error activar comercio:', error);
    res.status(500).send('Error al activar comercio');
  }
};

// Inactivar comercio
export const inactivarComercio = async (req, res) => {
  const { id } = req.params;
  try {
    await Commerce.update({ isActive: false }, { where: { id } });
    res.redirect('/admin/comercios');
  } catch (error) {
    console.error('Error inactivar comercio:', error);
    res.status(500).send('Error al inactivar comercio');
  }
};

// Listado de delivery
export const listadoDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findAll({
      include: [{
        model: Order,
        as: 'deliveryOrders',
        attributes: []
      }],
      attributes: [
        'id',
        'name',
        'lastName',
        'email',
        'phone',
        'isActive',
        [Sequelize.fn('COUNT', Sequelize.col('deliveryOrders.id')), 'totalPedidos']
      ],
      group: ['Delivery.id'],
      order: [['lastName'], ['name']]
    });

    res.render('admin/list-deliveries', {
      delivery: delivery.map(d => d.get({ plain: true })),
      'page-title': 'Listado de Delivery',
      layout: 'main'
    });
  } catch (error) {
    console.error('Error listado delivery:', error);
    res.status(500).send('Error al cargar el listado de delivery');
  }
};

// Activar delivery
export const activarDelivery = async (req, res) => {
  const { id } = req.params;
  try {
    await Delivery.update({ isActive: true }, { where: { id } });
    res.redirect('/admin/delivery');
  } catch (error) {
    console.error('Error activar delivery:', error);
    res.status(500).send('Error al activar delivery');
  }
};

// Inactivar delivery
export const inactivarDelivery = async (req, res) => {
  const { id } = req.params;
  try {
    await Delivery.update({ isActive: false }, { where: { id } });
    res.redirect('/admin/delivery');
  } catch (error) {
    console.error('Error inactivar delivery:', error);
    res.status(500).send('Error al inactivar delivery');
  }
};

// Mostrar todas las configuraciones
export const mostrarConfiguracion = async (req, res) => {
  try {
    const configuracion = await Configuration.findOne({
      where: { key: 'ITBIS_PERCENTAGE' }
    });

    if (!configuracion) {
      return res.status(404).send('Configuración no encontrada');
    }

    res.render('admin/settings', { 
      configuracion: configuracion.get({ plain: true }),
      'page-title': 'Configuración',
      layout: 'main'
    });
  } catch (error) {
    console.error('Error al mostrar configuración:', error);
    res.status(500).send('Error al mostrar configuración');
  }
};

// Editar una configuración (mostrar formulario)
export const editarConfiguracion = async (req, res) => {
  try {
    const configuracion = await Configuration.findByPk(req.params.id);

    if (!configuracion) {
      req.flash("error", "Configuración no encontrada.");
      return res.redirect("/admin/configurations");
    }

    res.render("admin/edit-settings", {
      "page-title": "Editar Configuración",
      layout: "main",
      configuracion: configuracion.get({ plain: true }),
      user: req.session.user || null
    });

  } catch (error) {
    console.error("Error al obtener configuración para editar:", error);
    req.flash("error", "Error al obtener configuración para editar.");
    res.redirect("/admin/configurations");
  }
};

// Actualizar configuración
export const actualizarConfiguracion = async (req, res) => {
  try {
    const { id } = req.params;
    const { key, value, description, isActive } = req.body;

    const configuracion = await Configuration.findByPk(id);
    if (!configuracion) {
      req.flash("error", "Configuración no encontrada.");
      return res.status(404).send('Configuración no encontrada');
    }

    await configuracion.update({
      key,
      value,
      description,
      isActive: isActive === 'true'
    });

    req.flash("success", "Configuración actualizada correctamente.");
    res.redirect('/admin/configuracion');
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    req.flash("error", "Hubo un error al actualizar la configuración.");
    res.status(500).send('Error al actualizar configuración');
  }
};

// Listado de administradores
export const listadoAdministradores = async (req, res) => {
  try {
    const administradores = await Admin.findAll({
      attributes: ['id', 'name', 'lastName', 'email', 'username', 'cedula', 'isActive'],
      order: [['lastName'], ['name']]
    });

    res.render('admin/list-admins', { 
      administradores: administradores.map(a => a.get({ plain: true })),
      currentUserId: req.user.id,
      'page-title': 'Lista de Administradores',
      layout: 'main'
    });
  } catch (error) {
    console.error('Error listado administradores:', error);
    res.status(500).send('Error al cargar el listado de administradores');
  }
};

// Mostrar formulario crear administrador
export const mostrarCrearAdmin = async (req, res) => {
  res.render('admin/create-admin', {
    'page-title': 'Crear Administrador',
    layout: 'main'
  });
};

// Crear administrador
export const crearAdministrador = async (req, res) => {
  const { name, lastName, cedula, email, username, password, confirmPassword } = req.body;
  
  try {
    // Validaciones
    if (!name || !lastName || !cedula || !email || !username || !password || !confirmPassword) {
      return res.render('admin/create-admin', {
        error: 'Todos los campos son requeridos',
        'page-title': 'Crear Administrador',
        layout: 'main',
        formData: req.body
      });
    }

    if (password !== confirmPassword) {
      return res.render('admin/create-admin', {
        error: 'Las contraseñas no coinciden',
        'page-title': 'Crear Administrador',
        layout: 'main',
        formData: req.body
      });
    }

    // Verificar si ya existe el usuario o email o cedula
    const existing = await Admin.findOne({
      where: {
        [Op.or]: [
          { username },
          { email },
          { cedula }
        ]
      }
    });

    if (existing) {
      return res.render('admin/create-admin', {
        error: 'Ya existe un administrador con ese usuario, email o cédula',
        'page-title': 'Crear Administrador',
        layout: 'main',
        formData: req.body
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear administrador
    await Admin.create({
      name,
      lastName,
      cedula,
      email,
      username,
      password: hashedPassword,
      role: 'Admin',
      isActive: true
    });

    res.redirect('/admin/administradores');
  } catch (error) {
    console.error('Error crear administrador:', error);
    res.render('admin/create-admin', {
      error: 'Error al crear el administrador',
      'page-title': 'Crear Administrador',
      layout: 'main',
      formData: req.body
    });
  }
};

// Mostrar formulario editar administrador
export const mostrarEditarAdmin = async (req, res) => {
  const { id } = req.params;
  
  try {
    const admin = await Admin.findByPk(id, {
      attributes: ['id', 'name', 'lastName', 'cedula', 'email', 'username']
    });

    if (!admin) {
      return res.redirect('/admin/administradores');
    }

    res.render('admin/edit-admin', {
      admin: admin.get({ plain: true }),
      'page-title': 'Editar Administrador',
      layout: 'main'
    });
  } catch (error) {
    console.error('Error mostrar editar admin:', error);
    res.redirect('/admin/administradores');
  }
};

// Editar administrador
export const editarAdministrador = async (req, res) => {
  const { id } = req.params;
  const { name, lastName, cedula, email, username, password, confirmPassword } = req.body;
  
  try {
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.redirect('/admin/administradores');
    }

    // Validaciones
    if (!name || !lastName || !cedula || !email || !username) {
      return res.render('admin/edit-admin', {
        admin: admin.get({ plain: true }),
        error: 'Todos los campos son requeridos',
        'page-title': 'Editar Administrador',
        layout: 'main'
      });
    }

    // Si se va a cambiar la contraseña
    if (password && password !== confirmPassword) {
      return res.render('admin/edit-admin', {
        admin: admin.get({ plain: true }),
        error: 'Las contraseñas no coinciden',
        'page-title': 'Editar Administrador',
        layout: 'main'
      });
    }

    // Verificar si ya existe otro usuario con el mismo username, email o cedula
    const existing = await Admin.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { username },
              { email },
              { cedula }
            ]
          },
          { id: { [Op.ne]: id } }
        ]
      }
    });

    if (existing) {
      return res.render('admin/edit-admin', {
        admin: admin.get({ plain: true }),
        error: 'Ya existe otro administrador con ese usuario, email o cédula',
        'page-title': 'Editar Administrador',
        layout: 'main'
      });
    }

    // Preparar datos de actualización
    const updateData = {
      name,
      lastName,
      cedula,
      email,
      username
    };

    // Si se va a cambiar la contraseña
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    await admin.update(updateData);

    res.redirect('/admin/administradores');
  } catch (error) {
    console.error('Error editar administrador:', error);
    const admin = await Admin.findByPk(id);
    
    res.render('admin/edit-admin', {
      admin: admin ? admin.get({ plain: true }) : {},
      error: 'Error al actualizar el administrador',
      'page-title': 'Editar Administrador',
      layout: 'main'
    });
  }
};

// Activar administrador
export const activarAdministrador = async (req, res) => {
  const { id } = req.params;
  
  // Verificar que no sea el usuario actual
  if (parseInt(id) === req.session.user.id) {
    return res.redirect('/admin/administradores');
  }
  
  try {
    await Admin.update({ isActive: true }, { where: { id } });
    res.redirect('/admin/administradores');
  } catch (error) {
    console.error('Error activar administrador:', error);
    res.redirect('/admin/administradores');
  }
};

// Inactivar administrador
export const inactivarAdministrador = async (req, res) => {
  const { id } = req.params;
  
  // Verificar que no sea el usuario actual
  if (parseInt(id) === req.session.user.id) {
    return res.redirect('/admin/administradores');
  }
  
  try {
    await Admin.update({ isActive: false }, { where: { id } });
    res.redirect('/admin/administradores');
  } catch (error) {
    console.error('Error inactivar administrador:', error);
    res.redirect('/admin/administradores');
  }
};

// Listar tipos de comercios
export const listarTiposComercios = async (req, res) => {
  try {
    const tipos = await CommerceType.findAll({
      include: [{
        model: Commerce,
        as: 'typeCommerces', 
        attributes: ['id']
      }]
    });

    // Agregar cantidad de comercios a cada tipo
    const tiposConCantidad = tipos.map(tipo => ({
      ...tipo.get({ plain: true }),
      cantidadComercios: tipo.typeCommerces ? tipo.typeCommerces.length : 0
    }));

    res.render('admin/commerce-types', { 
      tipos: tiposConCantidad,
      'page-title': 'Tipos de Comercios',
      layout: 'main'
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener los tipos de comercio');
  }
};

// Formulario crear tipo de comercio
export const formCrearTipoComercio = (req, res) => {
  res.render('admin/create-commerce-types', {
    'page-title': 'Crear Tipo de Comercio',
    layout: 'main'
  });
};

// Crear tipo de comercio
export const crearTipoComercio = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      if (req.file) {
        const filePath = path.join(process.cwd(), 'public', 'uploads', 'commerce-types', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(400).send('Nombre y descripción son requeridos');
    }
    const icon = req.file ? '/uploads/commerce-types/' + req.file.filename : null;

    await CommerceType.create({ name, description, icon });
    res.redirect('/admin/tipos-comercios');
  } catch (error) {
    console.error(error);

    if (req.file) {
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'commerce-types', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).send('Error al crear el tipo de comercio');
  }
};

// Formulario editar tipo de comercio
export const formEditarTipoComercio = async (req, res) => {
  try {
    const tipo = await CommerceType.findByPk(req.params.id);
    if (!tipo) return res.status(404).send('Tipo de comercio no encontrado');

    res.render('admin/edit-commerce-types', { 
      tipo: tipo.get({ plain: true }),
      'page-title': 'Editar Tipo de Comercio',
      layout: 'main'
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar el tipo de comercio');
  }
};

// Editar tipo de comercio
export const editarTipoComercio = async (req, res) => {
  try {
    const tipo = await CommerceType.findByPk(req.params.id);
    if (!tipo) return res.status(404).send('Tipo de comercio no encontrado');

    const { name, description } = req.body;

    // Si se subió un nuevo icono, eliminar el anterior
    if (req.file) {
      if (tipo.icon) {
        const oldPath = path.join(process.cwd(), 'public', tipo.icon);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      tipo.icon = '/uploads/commerce-types/' + req.file.filename;
    }

    await tipo.update({ name, description, icon: tipo.icon });
    res.redirect('/admin/tipos-comercios');
  } catch (error) {
    console.error(error);
    if (req.file) {
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'commerce-types', req.file.filename); 
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).send('Error al editar el tipo de comercio');
  }
};

// Confirmar eliminación tipo de comercio
export const confirmarEliminarTipoComercio = async (req, res) => {
  try {
    const tipo = await CommerceType.findByPk(req.params.id);
    if (!tipo) return res.status(404).send('Tipo de comercio no encontrado');

    res.render('admin/delete-commerce-types', { 
      tipo: tipo.get({ plain: true }),
      'page-title': 'Eliminar Tipo de Comercio',
      layout: 'main'
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar la confirmación de eliminación');
  }
};

// Eliminar tipo de comercio
export const eliminarTipoComercio = async (req, res) => {
  try {
    const tipo = await CommerceType.findByPk(req.params.id, {
      include: [{
        model: Commerce,
        as: 'typeCommerces'
      }]
    });
    if (!tipo) return res.status(404).send('Tipo de comercio no encontrado');

    // Eliminar icono
    if (tipo.icon) {
      const iconoPath = path.join(process.cwd(), 'public', tipo.icon);
      if (fs.existsSync(iconoPath)) fs.unlinkSync(iconoPath);
    }

    // Eliminar comercios asociados (only if they exist)
    if (tipo.typeCommerces && tipo.typeCommerces.length > 0) {
      for (const comercio of tipo.typeCommerces) {
        await comercio.destroy();
      }
    }

    await tipo.destroy();
    res.redirect('/admin/tipos-comercios');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al eliminar el tipo de comercio');
  }
};