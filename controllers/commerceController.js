import Order from '../models/Order.js';
import OrderDetail from '../models/OrderDetail.js';
import Delivery from '../models/Delivery.js';
import Commerce from '../models/Commerce.js';
import Category from '../models/ProductCategory.js';
import Product from '../models/Product.js';
import { ORDER_STATUSES } from '../config/orderStatuses.js';
import { DELIVERY_STATUSES } from '../config/deliveryStatuses.js';
import fs from 'fs';
import path from 'path';

// ====== HOME - Pedidos ======
export async function getHome(req, res) {
  try {
    const commerceId = req.session.user.id;

    const commerce = await Commerce.findByPk(commerceId);

    const orders = await Order.findAll({
      where: { commerceId },
      order: [['orderDate', 'DESC'], ['orderTime', 'DESC']],
      include: [
        { model: Commerce,
          as: 'orderCommerce',
          attributes: ['commerceLogo', 'commerceName'] },
          { model: OrderDetail, as: 'orderDetails', attributes: ['productId', 'quantity', 'productPrice'] }
      ]
    });

    const ordersData = orders.map(order => {
      const plainOrder = order.get({ plain: true });

      // Calcular cantidad total de productos
      const totalItemCount = plainOrder.orderDetails ? 
        plainOrder.orderDetails.reduce((sum, item) => sum + item.quantity, 0) : 0;

        if (!plainOrder.orderCommerce) {
          plainOrder.orderCommerce.commerceLogo = plainOrder.orderCommerce.logo || plainOrder.orderCommerce.commerceLogo;
        }
      return {
        ...plainOrder,
        productsCount: totalItemCount
      };
    });

    res.render('commerce/home', {
      'page-title': 'Home del Comercio',
      layout: 'main',
      user: req.session.user,
      orders: ordersData,
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar los pedidos.');
    res.redirect('/');
  }
}

// ====== DETALLE PEDIDO ======
export async function getOrderDetail(req, res) {
  try {
    const { orderId } = req.params;
    const commerceId = req.session.user.id;

    const order = await Order.findOne({
      where: { id: orderId, commerceId },
      include: [{ model: Commerce, as: 'orderCommerce', attributes: ['commerceName'] }]
    });

    if (!order) {
      req.flash('error', 'Pedido no encontrado.');
      return res.redirect('/commerce/home');
    }

    const orderDetails = await OrderDetail.findAll({ where: { orderId } });

    res.render('commerce/order-detail', {
      'page-title': `Detalle Pedido #${orderId}`,
      layout: 'main',
      user: req.session.user,
      order,
      orderDetails,
      canAssignDelivery: order.status === ORDER_STATUSES.PENDING,
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar el detalle del pedido.');
    res.redirect('/commerce/home');
  }
}

// ====== ASIGNAR DELIVERY ======
export async function assignDeliveryToOrder(req, res) {
  try {
    const { orderId } = req.params;
    const commerceId = req.session.user.id;

    const order = await Order.findOne({
      where: { id: orderId, commerceId, status: ORDER_STATUSES.PENDING }
    });

    if (!order) {
      req.flash('error', 'Pedido no disponible para asignar delivery.');
      return res.redirect(`/commerce/orders/${orderId}`);
    }

    const deliveryAvailable = await Delivery.findOne({
      where: { deliveryStatus: DELIVERY_STATUSES.AVAILABLE }
    });

    if (!deliveryAvailable) {
      req.flash('error', 'No hay delivery disponible en este momento, intenta más tarde.');
      return res.redirect(`/commerce/orders/${orderId}`);
    }

    await order.update({
      deliveryId: deliveryAvailable.id,
      status: ORDER_STATUSES.IN_PROCESS
    });

    await deliveryAvailable.update({
      deliveryStatus: DELIVERY_STATUSES.NOT_AVAILABLE
    });

    req.flash('success', 'Delivery asignado y estado del pedido actualizado.');
    res.redirect(`/commerce/home`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al asignar delivery.');
    res.redirect(`/commerce/orders/${req.params.orderId}`);
  }
}

// ====== PERFIL ======
export async function getProfile(req, res) {
  try {
    const commerce = await Commerce.findByPk(req.session.user.id);
    if (!commerce) {
      req.flash('error', 'Comercio no encontrado');
      return res.redirect('/commerce/home');
    }
    res.render('commerce/profile', {
      'page-title': 'Mi Perfil',
      layout: 'main',
      commerce,
      user: req.session.user,
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar el perfil');
    res.redirect('/commerce/home');
  }
}

export async function updateProfile(req, res) {
  const { openingTime, closingTime, phone, email } = req.body;
  const commerceId = req.session.user.id;

  if (!openingTime) req.flash('error', 'Hora de apertura es requerida');
  if (!closingTime) req.flash('error', 'Hora de cierre es requerida');
  if (!phone) req.flash('error', 'Teléfono es requerido');
  if (!email) req.flash('error', 'Correo es requerido');

  if (req.session.flash.error) {
    try {
      const commerce = await Commerce.findByPk(commerceId);
      return res.render('commerce/profile', {
        'page-title': 'Mi Perfil',
        layout: 'main',
        commerce,
        user: req.session.user,
        formData: req.body,
      });
    } catch (error) {
      console.error(error);
      req.flash('error', 'Error al cargar el perfil');
      return res.redirect('/commerce/home');
    }
  }

  try {
    const commerce = await Commerce.findByPk(commerceId);
    if (!commerce) {
      req.flash('error', 'Comercio no encontrado');
      return res.redirect('/commerce/home');
    }

    commerce.openingTime = openingTime;
    commerce.closingTime = closingTime;
    commerce.phone = phone;
    commerce.email = email;

    if (req.file) {
      if (commerce.commerceLogo && commerce.commerceLogo !== '/uploads/commerce-logos/default-commerce-logo.png') {
        const oldLogoPath = path.join(process.cwd(), 'public', commerce.commerceLogo);
        fs.unlink(oldLogoPath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error('Error deleting old commerce logo:', err);
          }
        });
      }
      
      commerce.commerceLogo = `/uploads/commerce-logos/${req.file.filename}`;
    }
    await commerce.save();

    req.session.user = {
      ...req.session.user,
      openingTime,
      closingTime,
      phone,
      email,
      logo: commerce.commerceLogo
    };

    req.flash('success', 'Perfil actualizado correctamente');
    res.redirect('/commerce/profile');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al actualizar el perfil');
    res.redirect('/commerce/profile');
  }
}


// ====== LOGOUT ======
export function logout(req, res) {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      req.flash('error', 'Error al cerrar sesión.');
      return res.redirect('/commerce/home');
    }
    res.redirect('/');
  });
}

// ====== CATEGORÍAS ======
// Listar categorías
export async function getCategories(req, res) {
  try {
    const commerceId = req.session.user.id;
    const categories = await Category.findAll({
      where: { commerceId },
      include: [{ model: Product, as: 'categoryProducts', attributes: ['id'] }],  // <-- alias corregido
      order: [['createdAt', 'DESC']]
    });

    const categoriesWithCount = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      productsCount: cat.categoryProducts ? cat.categoryProducts.length : 0  // <-- alias corregido
    }));

    res.render('commerce/categories', {
      'page-title': 'Mantenimiento de Categorías',
      layout: 'main',
      categories: categoriesWithCount,
      user: req.session.user,
    });
  } catch (error) {
    console.error(error);
    res.render('commerce/categories', {
      'page-title': 'Mantenimiento de Categorías',
      layout: 'main',
      categories: [],
      user: req.session.user,
    });
  }
}

// Mostrar formulario crear categoría
export async function showCreateCategoryForm(req, res) {
  res.render('commerce/create-category', {
    'page-title': 'Crear Categoría',
    layout: 'main',
    user: req.session.user,
    formData: {},
  });
}

// Mostrar formulario editar categoría
export async function showEditCategoryForm(req, res) {
  try {
    const { id } = req.params;
    const commerceId = req.session.user.id;

    const category = await Category.findOne({ where: { id, commerceId } });
    if (!category) {
      req.flash('error', 'Categoría no encontrada');
      return res.redirect('/commerce/categories');
    }

    res.render('commerce/edit-category', {
      'page-title': 'Editar categoría',
      layout: 'main',
      category,
      user: req.session.user,
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar la categoría');
    res.redirect('/commerce/categories');
  }
}

// Crear categoría
export async function createCategory(req, res) {
  const { name, description } = req.body;
  if (!name){
    req.flash('error', 'El nombre es requerido');
    res.redirect('/commerce/categories/create');
  }
  if (!description){
    req.flash('error', 'La descripción es requerida');
    res.redirect('/commerce/categories/create');
  }

  if (req.session.flash.error) {
    const categories = await Category.findAll({ where: { commerceId: req.session.user.id } });
    return res.render('commerce/categories', {
      'page-title': 'Mantenimiento de Categorías',
      layout: 'main',
      categories,
      user: req.session.user,
    });
  }

  try {
    await Category.create({
      commerceId: req.session.user.id,
      name,
      description
    });
    req.flash('success', 'Categoría creada correctamente');
    res.redirect('/commerce/categories');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al crear categoría');
    res.redirect('/commerce/categories');
  }
}

// Editar categoría
export async function editCategory(req, res) {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const category = await Category.findOne({ where: { id, commerceId: req.session.user.id } });
    if (!category) {
      req.flash('error', 'Categoría no encontrada');
      return res.redirect('/commerce/categories');
    }
    category.name = name;
    category.description = description;
    await category.save();

    req.flash('success', 'Categoría actualizada');
    res.redirect('/commerce/categories');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al actualizar categoría');
    res.redirect('/commerce/categories');
  }
}

// Eliminar categoría
export async function deleteCategory(req, res) {
  const { id } = req.params;
  try {
    const category = await Category.findOne({ where: { id, commerceId: req.session.user.id } });
    if (!category) {
      req.flash('error', 'Categoría no encontrada');
      return res.redirect('/commerce/categories');
    }
    await category.destroy();
    req.flash('success', 'Categoría eliminada');
    res.redirect('/commerce/categories');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al eliminar categoría');
    res.redirect('/commerce/categories');
  }
}

// ====== PRODUCTOS ======
// Listar productos
export async function getProducts(req, res) {
  try {
    const commerceId = req.session.user.id;
    const products = await Product.findAll({
      where: { commerceId },
      include: [{ model: Category, as: 'category' }],  // <-- alias corregido
      order: [['createdAt', 'DESC']]
    });

    res.render('commerce/products', {
      'page-title': 'Mantenimiento de Productos',
      layout: 'main',
      products,
      user: req.session.user,
    });
  } catch (error) {
    console.error(error);
    res.render('commerce/products', {
      'page-title': 'Mantenimiento de Productos',
      layout: 'main',
      products: [],
      user: req.session.user,
    });
  }
}

// Mostrar formulario crear producto
export async function showCreateProductForm(req, res) {
  const categories = await Category.findAll({ where: { commerceId: req.session.user.id } });
  res.render('commerce/edit-product', {
    'page-title': 'Crear Producto',
    layout: 'main',
    categories,
    user: req.session.user,
    formData: {},
  });
}

// Crear producto
export async function createProduct(req, res) {
  const { name, description, price, categoryId } = req.body;

  if (!name) req.flash('error', 'Nombre requerido');
  if (!description) req.flash('error', 'Descripción requerida');
  if (!price) req.flash('error', 'Precio requerido');
  if (!categoryId) req.flash('error', 'Categoría requerida');

  if (req.session.flash.error) {
    const categories = await Category.findAll({ where: { commerceId: req.session.user.id } });
    return res.render('commerce/edit-product', {
      'page-title': 'Crear Producto',
      layout: 'main',
      categories,
      formData: req.body,
      user: req.session.user,
    });
  }

  try {
    await Product.create({
      commerceId: req.session.user.id,
      name,
      description,
      price,
      categoryId,
      image: req.file ? `/uploads/${req.file.filename}` : null
    });
    req.flash('success', 'Producto creado correctamente');
    res.redirect('/commerce/products');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al crear producto');
    res.redirect('/commerce/products');
  }
}

// Mostrar formulario editar producto
export async function showEditProductForm(req, res) {
  try {
    const product = await Product.findOne({ where: { id: req.params.id, commerceId: req.session.user.id } });
    if (!product) {
      req.flash('error', 'Producto no encontrado');
      return res.redirect('/commerce/products');
    }
    const categories = await Category.findAll({ where: { commerceId: req.session.user.id } });

    const categoriesData = categories.map(cat => ({
  id: cat.id,
  name: cat.name,
  description: cat.description,
  selected: cat.id === product.categoryId
}));


const productData = {
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price,
  categoryId: product.categoryId,
  image: product.image
};


    res.render('commerce/edit-product', {
      'page-title': 'Editar Producto',
      layout: 'main',
      product: productData,
      categories: categoriesData,
      user: req.session.user,
      formData: {},
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar producto');
    res.redirect('/commerce/products');
  }
}

// Editar producto
export async function editProduct(req, res) {
  const { name, description, price, categoryId } = req.body;
  try {
    const product = await Product.findOne({ where: { id: req.params.id, commerceId: req.session.user.id } });
    if (!product) {
      req.flash('error', 'Producto no encontrado');
      return res.redirect('/commerce/products');
    }

    product.name = name;
    product.description = description;
    product.price = price;
    product.categoryId = categoryId;
    if (req.file) product.image = `/uploads/${req.file.filename}`;
    await product.save();

    req.flash('success', 'Producto actualizado');
    res.redirect('/commerce/products');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al actualizar producto');
    res.redirect('/commerce/products');
  }
}

// Eliminar producto
export async function deleteProduct(req, res) {
  try {
    const product = await Product.findOne({ where: { id: req.params.id, commerceId: req.session.user.id } });
    if (!product) {
      req.flash('error', 'Producto no encontrado');
      return res.redirect('/commerce/products');
    }
    await product.destroy();
    req.flash('success', 'Producto eliminado');
    res.redirect('/commerce/products');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al eliminar producto');
    res.redirect('/commerce/products');
  }
}
