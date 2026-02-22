import models from '../models/index.js';
import { DELIVERY_STATUSES } from '../config/deliveryStatuses.js';
import { ORDER_STATUSES } from '../config/orderStatuses.js';
import { Op } from 'sequelize';
import path from 'path';
import fs from 'fs';

const { Delivery, Order, OrderDetail, Commerce, Address } = models;

// Home del Delivery
export const getHomeDelivery = async (req, res) => {
  try {
    const deliveryId = req.session.user.id;

    const orders = await Order.findAll({
      where: {
        [Op.or]: [
          { deliveryId },
          { status: ORDER_STATUSES.PENDING }
        ]
      },
      include: [
        { model: Commerce, as: 'orderCommerce', attributes: ['id', 'commerceName', 'commerceLogo'] },
        { model: OrderDetail, as: 'orderDetails', attributes: ['id', 'quantity', 'productName', 'productPrice', 'productImage'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedOrders = orders.map(order => {
      const orderData = order.toJSON();
      return {
        ...orderData,
        commerce: orderData.orderCommerce, 
        details: orderData.orderDetails, 
        productsCount: order.orderDetails ? order.orderDetails.reduce((sum, item) => sum + item.quantity, 0) : 0,
        total: order.orderDetails ? order.orderDetails.reduce((sum, item) => sum + item.quantity * item.productPrice, 0) : 0,
        isAssigned: order.deliveryId === deliveryId,
        isPending: order.status === ORDER_STATUSES.PENDING
      };
    });

    res.render('delivery/home', {
      'page-title': 'Panel de Delivery',
      layout: 'main',
      user: req.session.user,
      orders: formattedOrders
    });

  } catch (error) {
    console.error('Error en getHomeDelivery:', error);
    res.status(500).send('Error al cargar los pedidos del delivery');
  }
};

// 2️⃣ Detalle de un pedido
export const getOrderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;
    const deliveryId = req.session.user.id;

    const order = await Order.findOne({
      where: { id: orderId, deliveryId },
      include: [
        { model: Commerce, as: 'orderCommerce', attributes: ['id', 'commerceName', 'commerceLogo'] },
        { model: OrderDetail, as: 'orderDetails', attributes: ['id', 'quantity', 'productName', 'productPrice', 'productImage'] },
        { model: Address, as: 'orderAddress', attributes: ['id', 'name', 'description'] }
      ]
    });

    if (!order) return res.status(404).send('Pedido no encontrado');

    const orderJSON = order.toJSON();
    orderJSON.commerce = orderJSON.orderCommerce; 
    orderJSON.details = orderJSON.orderDetails; 
    orderJSON.orderTime = new Date(order.createdAt).toLocaleTimeString();
    orderJSON.orderDate = new Date(order.createdAt).toLocaleDateString();
    
    orderJSON.deliveryAddress = order.orderAddress 
      ? `${order.orderAddress.name} - ${order.orderAddress.description}`
      : 'Dirección no especificada';

    orderJSON.total = order.orderDetails ? order.orderDetails.reduce((sum, item) => sum + item.quantity * item.productPrice, 0) : 0;

    res.render('delivery/order-detail', {
      'page-title': `Detalle del Pedido #${order.id}`,
      layout: 'main',
      user: req.session.user,
      order: orderJSON,
      isCompletable: order.status === ORDER_STATUSES.IN_PROCESS
    });

  } catch (error) {
    console.error('Error en getOrderDetail:', error);
    res.status(500).send('Error al cargar el detalle del pedido');
  }
};

// 3️⃣ Tomar pedido pendiente
export const takeOrder = async (req, res) => {
  try {
    const deliveryId = req.session.user.id;
    const orderId = req.params.id;

    const order = await Order.findOne({ where: { id: orderId, status: ORDER_STATUSES.PENDING } });
    if (!order) return res.status(404).send('Pedido no encontrado');

    const activeOrder = await Order.findOne({ where: { deliveryId, status: ORDER_STATUSES.IN_PROCESS } });
    if (activeOrder) return res.status(400).send('Ya tienes un pedido en proceso');

    await order.update({ deliveryId, status: ORDER_STATUSES.IN_PROCESS });

    const delivery = await Delivery.findByPk(deliveryId);
    if (delivery) await delivery.update({ deliveryStatus: DELIVERY_STATUSES.BUSY });

    res.redirect('/delivery/home');

  } catch (error) {
    console.error('Error al tomar pedido:', error);
    res.status(500).send('Error al tomar pedido');
  }
};

// 4️⃣ Completar un pedido
export const completeOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const deliveryId = req.session.user.id;

    const order = await Order.findOne({ where: { id: orderId, deliveryId } });
    const delivery = await Delivery.findByPk(deliveryId);

    if (!order || !delivery) return res.status(404).send('Pedido o delivery no encontrado');
    if (order.status !== ORDER_STATUSES.IN_PROCESS) return res.status(400).send('El pedido no está en proceso');

    await order.update({ status: ORDER_STATUSES.COMPLETED });
    await delivery.update({ deliveryStatus: DELIVERY_STATUSES.AVAILABLE });

    res.redirect('/delivery/home');

  } catch (error) {
    console.error('Error en completeOrder:', error);
    res.status(500).send('Error al completar el pedido');
  }
};

// 5️⃣ Perfil del Delivery
export const getProfile = async (req, res) => {
  try {
    const delivery = await Delivery.findByPk(req.session.user.id);
    if (!delivery) return res.status(404).send('Delivery no encontrado');

    res.render('delivery/profile', {
      'page-title': 'Mi Perfil',
      layout: 'main',
      user: delivery.toJSON()
    });

  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).send('Error al cargar perfil');
  }
};

// 6️⃣ Actualizar perfil con soporte de imagen
export const updateProfile = async (req, res) => {
  try {
    const { name, lastName, phone } = req.body;
    let profileImage = req.file ? `/uploads/profiles/${req.file.filename}` : null; 

    if (!name || !lastName || !phone) return res.status(400).send('Nombre, apellido y teléfono son obligatorios');

    const delivery = await Delivery.findByPk(req.session.user.id);
    if (!delivery) return res.status(404).send('Delivery no encontrado');

    // borrar imagen vieja si se sube nueva imagen
    if (profileImage && delivery.profileImage) {
      try {
        const oldPath = path.join(process.cwd(), 'public', delivery.profileImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch (err) {
        console.warn('No se pudo eliminar la imagen anterior:', err.message);
      }
    }

    await delivery.update({
      name,
      lastName,
      phone,
      profileImage: profileImage || delivery.profileImage
    });

    // actualizar sesion
    req.session.user = {
      ...req.session.user,
      name,
      lastName,
      phone,
      profileImage: profileImage || delivery.profileImage
    };

    res.redirect('/delivery/profile');

  } catch (error) {
    console.error('Error en updateProfile:', error);
    res.status(500).send('Error al actualizar perfil');
  }
};