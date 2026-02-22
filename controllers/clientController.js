import context from "../context/appcontext.js";
import { Op } from "sequelize";
import { formatDominicanCurrency } from "../utils/helpers.js";
import { ORDER_STATUSES } from "../config/orderStatuses.js";

export async function GetClientHome(req, res, next) {
  try {
    // Limpiar carrito al cambiar de contexto
    if (req.session.cart && req.session.cart.length > 0) {
      req.session.cart = [];
      req.session.cartCommerceId = null;
    }

    // obtener todos los tipos de comercio
    const commerceTypes = await context.CommerceTypeModel.findAll({
      where: {
        isActive: true
      },
      order: [['name', 'ASC']]
    });

    // convertir instancia de sequelize a objeto plano para poder enviar a la vista
    const plainCommerceTypes = commerceTypes.map(ct => ct.get({ plain: true }));

    res.render("client/home", {
      "page-title": "Home - Cliente",
      layout: "main",
      user: req.session.user,
      commerceTypes: plainCommerceTypes
    });
  } catch (error) {
    console.error("Error loading client home:", error);
    req.flash("error", "Error al cargar la página. Inténtalo de nuevo.");
    res.redirect("/");
  }
}

export async function GetClientProfile(req, res, next) {
  try {
    const user = await context.ClientModel.findByPk(req.session.user.id);
    
    if (!user) {
      req.flash("error", "Usuario no encontrado.");
      return res.redirect("/client/home");
    }

    // Obtener mensajes flash
    const errors = req.flash("error");
    const success = req.flash("success");
    
    res.render("client/profile", {
      "page-title": "Mi Perfil",
      layout: "main",
      user: req.session.user,
      userData: user.get({ plain: true }),
      formData: req.session.formData || {}
    });
    
    delete req.session.formData;
  } catch (error) {
    console.error("Error loading client profile:", error);
    req.flash("error", "Error al cargar el perfil. Inténtalo de nuevo.");
    res.redirect("/client/home");
  }
}

export async function PostClientProfile(req, res, next) {
  const { name, lastName, phone } = req.body;
  
  try {
    // validacion
    if (!name || !lastName || !phone) {
      req.session.formData = { name, lastName, phone };
      req.flash("error", "Todos los campos son requeridos excepto la foto.");
      return res.redirect("/client/profile");
    }

    // Validación adicional del teléfono
    if (phone.trim().length < 10) {
      req.session.formData = { name, lastName, phone };
      req.flash("error", "El número de teléfono debe tener al menos 10 dígitos.");
      return res.redirect("/client/profile");
    }

    if (phone.trim().length > 20) {
      req.session.formData = { name, lastName, phone };
      req.flash("error", "El número de teléfono no puede exceder 20 caracteres.");
      return res.redirect("/client/profile");
    }

    const user = await context.ClientModel.findByPk(req.session.user.id);
    
    if (!user) {
      req.flash("error", "Usuario no encontrado.");
      return res.redirect("/client/home");
    }

    let profileImagePath = user.profileImage; // por defecto mantener la imagen actual
    if (req.file) {
      profileImagePath = `/uploads/profiles/${req.file.filename}`;
    }

    await user.update({
      name: name.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      profileImage: profileImagePath
    });

    req.session.user.name = name.trim();
    req.session.user.lastName = lastName.trim();
    req.session.user.profileImage = profileImagePath;

    req.flash("success", "Perfil actualizado exitosamente.");
    return res.redirect("/client/profile");
    
  } catch (error) {
    console.error("Error updating client profile:", error);
    req.session.formData = { name, lastName, phone };

    // Revisar si es un error de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => {
        switch (err.path) {
          case 'phone':
            if (err.validatorKey === 'len') {
              return 'El número de teléfono debe tener entre 10 y 20 caracteres.';
            }
            return 'El número de teléfono no es válido.';
          case 'name':
            return 'El nombre no puede estar vacío.';
          case 'lastName':
            return 'El apellido no puede estar vacío.';
          default:
            return err.message;
        }
      });
      req.flash("error", validationErrors.join(' '));
    } else {
      req.flash("error", "Error al actualizar el perfil. Inténtalo de nuevo.");
    }
    
    return res.redirect("/client/profile");
  }
}

export async function GetProductCatalog(req, res, next) {
  try {
    const commerceId = req.params.id;
    
    if (!commerceId) {
      req.flash("error", "Comercio no especificado.");
      return res.redirect("/client/home");
    }

    // obtener informacion del comercio
    const commerce = await context.CommerceModel.findOne({
      where: {
        id: commerceId,
        isActive: true
      },
      include: [
        {
          model: context.CommerceTypeModel,
          as: 'commerceType'
        }
      ]
    });

    if (!commerce) {
      req.flash("error", "Comercio no encontrado.");
      return res.redirect("/client/home");
    }

    // Obtener categorías reales del comercio
    const categories = await context.ProductCategoryModel.findAll({
      where: { commerceId: commerceId },
      order: [['name', 'ASC']]
    });

    if (categories.length === 0) {
      req.flash("info", `${commerce.commerceName} aún no tiene productos disponibles.`);
      return res.redirect("/client/home");
    }

    // Obtener productos reales del comercio
    const products = await context.ProductModel.findAll({
      where: { commerceId: commerceId },
      include: [
        {
          model: context.ProductCategoryModel,
          as: 'productCategory'
        }
      ],
      order: [['name', 'ASC']]
    });

    // Organizar productos por categorías
    const categoriesWithProducts = categories.map(category => {
      const categoryProducts = products.filter(product => product.categoryId === category.id);
      return {
        id: category.id,
        name: category.name,
        description: category.description,
        commerceId: category.commerceId,
        products: categoryProducts.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: parseFloat(product.price),
          image: product.image,
          categoryId: product.categoryId,
          commerceId: product.commerceId
        }))
      };
    }).filter(category => category.products.length > 0); // Solo mostrar categorías con productos

    // Gestión del carrito por comercio
    const cart = req.session.cart || [];
    const currentCommerceId = parseInt(commerceId);
    
    if (req.session.cartCommerceId && req.session.cartCommerceId !== currentCommerceId) {
      // Cambió de comercio, limpiar carrito
      req.session.cart = [];
      req.session.cartCommerceId = currentCommerceId;
    } else if (!req.session.cartCommerceId) {
      // Primera vez, asignar comercio
      req.session.cartCommerceId = currentCommerceId;
    }

    // Carrito actual
    const currentCart = req.session.cart || [];

    res.render("client/product-catalog", {
      "page-title": `${commerce.commerceName} - Catálogo`,
      layout: "main",
      user: req.session.user,
      commerce: commerce.get({ plain: true }),
      categories: categoriesWithProducts,
      cart: currentCart,
      cartCount: currentCart.length,
      subtotal: currentCart.reduce((sum, item) => sum + item.price, 0)
    });
  } catch (error) {
    console.error("Error loading product catalog:", error);
    req.flash("error", "Error al cargar el catálogo de productos. Inténtalo de nuevo.");
    res.redirect("/client/home");
  }
}

export async function PostAddToCart(req, res, next) {
  try {
    const { product } = req.body;
    
    if (!product || !product.id) {
      return res.status(400).json({ success: false, message: "Producto requerido." });
    }

    // Verificar que el producto existe en la base de datos
    const dbProduct = await context.ProductModel.findOne({
      where: { id: product.id },
      include: [
        {
          model: context.CommerceModel,
          as: 'productCommerceOwner',
          where: { isActive: true }
        }
      ]
    });

    if (!dbProduct) {
      return res.status(404).json({ success: false, message: "Producto no encontrado o comercio inactivo." });
    }

    // Inicializar carrito
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Verificar si ya está en carrito
    const existingProduct = req.session.cart.find(item => item.id === parseInt(product.id));
    if (existingProduct) {
      return res.status(400).json({ success: false, message: "Producto ya está en el carrito." });
    }

    // Agregar producto al carrito usando datos de la base de datos
    req.session.cart.push({
      id: dbProduct.id,
      name: dbProduct.name,
      price: parseFloat(dbProduct.price),
      image: dbProduct.image,
      description: dbProduct.description,
      commerceId: dbProduct.commerceId
    });

    return res.json({ 
      success: true, 
      message: "Producto agregado al carrito.",
      cartCount: req.session.cart.length
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res.status(500).json({ success: false, message: "Error al agregar producto al carrito." });
  }
}

export async function PostRemoveFromCart(req, res, next) {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ success: false, message: "ID de producto requerido." });
    }

    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Remover producto del carrito
    req.session.cart = req.session.cart.filter(item => item.id !== parseInt(productId));

    return res.json({ 
      success: true, 
      message: "Producto eliminado del carrito.",
      cartCount: req.session.cart.length
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return res.status(500).json({ success: false, message: "Error al eliminar producto del carrito." });
  }
}

// Selección de direcciones para pedido
export async function GetOrderAddresses(req, res, next) {
  try {
    const { commerceId } = req.query;
    
    if (!commerceId) {
      req.flash("error", "Comercio no especificado.");
      return res.redirect("/client/home");
    }

    // Verificar carrito
    const cart = req.session.cart || [];
    if (cart.length === 0) {
      req.flash("error", "Tu carrito está vacío.");
      return res.redirect(`/client/commerce/${commerceId}/catalog`);
    }

    // Obtener información del comercio
    const commerce = await context.CommerceModel.findOne({
      where: {
        id: commerceId,
        isActive: true
      },
      include: [
        {
          model: context.CommerceTypeModel,
          as: 'commerceType'
        }
      ]
    });

    if (!commerce) {
      req.flash("error", "Comercio no encontrado.");
      return res.redirect("/client/home");
    }

    // Obtener direcciones del usuario
    const addresses = await context.AddressModel.findAll({
      where: {
        clientId: req.session.user.id
      },
      order: [['createdAt', 'DESC']]
    });

    // Obtener configuración ITBIS
    const itbisConfig = await context.ConfigurationModel.findOne({
      where: { key: 'ITBIS_PERCENTAGE' }
    });
    const itbisPercentage = itbisConfig ? parseFloat(itbisConfig.value) : 18; // agrega valor por defecto

    // Calcular totales
    const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    const itbisAmount = (subtotal * itbisPercentage) / 100;
    const total = subtotal + itbisAmount;

    res.render("client/order-addresses", {
      "page-title": "Seleccionar Dirección",
      layout: "main",
      user: req.session.user,
      commerce: commerce.get({ plain: true }),
      addresses: addresses.map(addr => addr.get({ plain: true })),
      cart: cart,
      subtotal: subtotal.toFixed(2),
      itbisPercentage: itbisPercentage,
      itbisAmount: itbisAmount.toFixed(2),
      total: total.toFixed(2),
      hasAddresses: addresses.length > 0
    });
  } catch (error) {
    console.error("Error loading order addresses:", error);
    req.flash("error", "Error al cargar las direcciones. Inténtalo de nuevo.");
    res.redirect("/client/home");
  }
}

export async function PostOrderAddresses(req, res, next) {
  try {
    const { addressId, commerceId } = req.body;
    
    if (!addressId || !commerceId) {
      req.flash("error", "Debes seleccionar una dirección y especificar el comercio.");
      return res.redirect(`/client/order-addresses?commerceId=${commerceId}`);
    }

    // Validar carrito
    const cart = req.session.cart || [];
    if (cart.length === 0) {
      req.flash("error", "Tu carrito está vacío.");
      return res.redirect(`/client/commerce/${commerceId}/catalog`);
    }

    // Validar que la dirección pertenece al usuario
    const address = await context.AddressModel.findOne({
      where: {
        id: addressId,
        clientId: req.session.user.id
      }
    });

    if (!address) {
      req.flash("error", "Dirección no válida.");
      return res.redirect(`/client/order-addresses?commerceId=${commerceId}`);
    }

    // Validar que el comercio existe
    const commerce = await context.CommerceModel.findOne({
      where: {
        id: commerceId,
        isActive: true
      }
    });

    if (!commerce) {
      req.flash("error", "Comercio no encontrado.");
      return res.redirect("/client/home");
    }

    // Validar que todos los productos del carrito aún existen en la base de datos
    const productIds = cart.map(item => item.id);
    const validProducts = await context.ProductModel.findAll({
      where: { 
        id: productIds,
        commerceId: commerceId
      }
    });

    if (validProducts.length !== cart.length) {
      req.session.cart = [];
      req.session.cartCommerceId = null;
      req.flash("error", "Algunos productos de tu carrito ya no están disponibles. Tu carrito ha sido actualizado.");
      return res.redirect(`/client/commerce/${commerceId}/catalog`);
    }

    // Obtener configuración ITBIS
    const itbisConfig = await context.ConfigurationModel.findOne({
      where: { key: 'ITBIS_PERCENTAGE' }
    });
    const itbisPercentage = itbisConfig ? parseFloat(itbisConfig.value) : 18;

    // Calcular totales
    const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    const itbisAmount = (subtotal * itbisPercentage) / 100;
    const total = subtotal + itbisAmount;

    // Crear pedido con transacción
    const transaction = await context.Sequelize.transaction();
    
    try {
      // Crear pedido
      const now = new Date();
      const order = await context.OrderModel.create({
        clientId: req.session.user.id,
        commerceId: parseInt(commerceId),
        addressId: parseInt(addressId),
        deliveryId: null, // se asignara despues
        subtotal: subtotal.toFixed(2),
        itbis: itbisAmount.toFixed(2),
        itbisRate: itbisPercentage,
        total: total.toFixed(2),
        status: ORDER_STATUSES.PENDING,
        orderDate: now.toISOString().split('T')[0], // año-mes-día
        orderTime: now.toTimeString().split(' ')[0] // hora-minuto-segundo
      }, { transaction });

      // Crear detalles del pedido
      const orderDetails = cart.map(item => ({
        orderId: order.id,
        productId: item.id,
        productName: item.name,
        productPrice: parseFloat(item.price),
        productImage: item.image || '',
        productDescription: item.description || '',
        quantity: 1
      }));

      await context.OrderDetailsModel.bulkCreate(orderDetails, { transaction });

      // Confirmar transacción
      await transaction.commit();

      // Limpiar carrito
      req.session.cart = [];
      req.session.cartCommerceId = null;

      req.flash("success", `¡Pedido creado exitosamente! Tu pedido está siendo procesado por ${commerce.commerceName}.`);
      
      res.redirect("/client/home");

    } catch (transactionError) {
      // Revertir transacción
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error("Error creating order:", error);
    req.flash("error", "El pedido no se procesó correctamente. Por favor, inténtalo de nuevo.");
    res.redirect(`/client/order-addresses?commerceId=${req.body.commerceId || commerceId}`);
  }
}

export async function GetClientOrders(req, res, next) {
  try {
    const orders = await context.OrderModel.findAll({
      where: { clientId: req.session.user.id },
      include: [
        { 
          model: context.CommerceModel, 
          as: 'orderCommerce', 
          include: [
            { 
              model: context.CommerceTypeModel, 
              as: 'commerceType' 
            }
          ]
        },
        { 
          model: context.OrderDetailsModel, 
          as: 'orderDetails'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Procesar datos para la vista
    const ordersData = orders.map(order => {
      const plainOrder = order.get({ plain: true });
      
      // Calcular cantidad total de productos
      const totalItemCount = plainOrder.orderDetails ? 
        plainOrder.orderDetails.reduce((sum, item) => sum + item.quantity, 0) : 0;
      
      return {
        ...plainOrder,
        commerce: plainOrder.orderCommerce, // Map orderCommerce to commerce for view compatibility
        itemCount: totalItemCount,
        formattedDate: new Date(plainOrder.createdAt).toLocaleDateString('es-DO'),
        formattedTime: plainOrder.orderTime,
        formattedTotal: formatDominicanCurrency(plainOrder.total)
      };
    });

    res.render("client/orders", {
      "page-title": "Mis Pedidos",
      layout: "main",
      user: req.session.user,
      orders: ordersData,
      orderCount: ordersData.length,
      hasOrders: ordersData.length > 0,
      ORDER_STATUS: ORDER_STATUSES
    });
  } catch (error) {
    console.error("Error loading client orders:", error);
    req.flash("error", "Error al cargar los pedidos. Inténtalo de nuevo.");
    res.redirect("/client/home");
  }
}

// Detalle de orden
export async function GetClientOrderDetail(req, res, next) {
  try {
    const orderId = req.params.id;
    
    if (!orderId) {
      req.flash("error", "ID de pedido no especificado.");
      return res.redirect("/client/orders");
    }

    const order = await context.OrderModel.findOne({
      where: { 
        id: orderId, 
        clientId: req.session.user.id 
      },
      include: [
        { 
          model: context.CommerceModel, 
          as: 'orderCommerce', 
          include: [
            { 
              model: context.CommerceTypeModel, 
              as: 'commerceType' 
            }
          ]
        },
        { 
          model: context.OrderDetailsModel, 
          as: 'orderDetails'
        },
        {
          model: context.AddressModel,
          as: 'orderAddress'
        }
      ]
    });

    if (!order) {
      req.flash("error", "Pedido no encontrado.");
      return res.redirect("/client/orders");
    }

    // Procesar datos del pedido
    const orderData = order.get({ plain: true });
    orderData.commerce = orderData.orderCommerce; // Map orderCommerce to commerce for view compatibility
    orderData.address = orderData.orderAddress; // Map orderAddress to address for view compatibility
    orderData.formattedDate = new Date(orderData.createdAt).toLocaleDateString('es-DO');
    orderData.formattedTime = orderData.orderTime;
    orderData.formattedTotal = formatDominicanCurrency(orderData.total);
    
    // Calcular cantidad total de productos
    orderData.itemCount = orderData.orderDetails ? 
      orderData.orderDetails.reduce((sum, item) => sum + item.quantity, 0) : 0;

    // Formatear datos de productos
    if (orderData.orderDetails) {
      orderData.orderDetails.forEach(item => {
        item.formattedUnitPrice = formatDominicanCurrency(item.productPrice);
        item.formattedSubtotal = formatDominicanCurrency(item.productPrice * item.quantity);
        
        // Estructura para plantilla
        item.product = {
          productName: item.productName,
          productDescription: item.productDescription,
          productImage: item.productImage
        };
        
        item.unitPrice = item.productPrice;
        item.subtotal = item.productPrice * item.quantity;
      });
      // Alias para plantilla
      orderData.items = orderData.orderDetails;
    }

    res.render("client/order-detail", {
      "page-title": `Pedido #${orderData.id}`,
      layout: "main",
      user: req.session.user,
      order: orderData,
      ORDER_STATUS: ORDER_STATUSES
    });
  } catch (error) {
    console.error("Error loading order detail:", error);
    req.flash("error", "Error al cargar el detalle del pedido. Inténtalo de nuevo.");
    res.redirect("/client/orders");
  }
}

export async function GetClientAddresses(req, res, next) {
  try {
    // obtener las direcciones del usuario loggeado
    const addresses = await context.AddressModel.findAll({
      where: {
        clientId: req.session.user.id
      },
      order: [['createdAt', 'DESC']]
    });

    res.render("client/addresses", {
      "page-title": "Mis Direcciones",
      layout: "main",
      user: req.session.user,
      addresses: addresses.map(addr => addr.get({ plain: true })),
      addressCount: addresses.length
    });
  } catch (error) {
    console.error("Error loading client addresses:", error);
    req.flash("error", "Error al cargar las direcciones. Inténtalo de nuevo.");
    res.redirect("/client/home");
  }
}

export function GetCreateAddress(req, res, next) {
  res.render("client/create-address", {
    "page-title": "Crear Dirección",
    layout: "main",
    user: req.session.user,
    formData: req.session.formData || {}
  });
  
  delete req.session.formData;
}

export async function PostCreateAddress(req, res, next) {
  const { name, description } = req.body;
  
  try {
    if (!name || !description) {
      req.session.formData = { name, description };
      req.flash("error", "Todos los campos son requeridos.");
      return res.redirect("/client/addresses/create");
    }

    await context.AddressModel.create({
      name: name.trim(),
      description: description.trim(),
      clientId: req.session.user.id
    });

    req.flash("success", "Dirección creada exitosamente.");
    return res.redirect("/client/addresses");
    
  } catch (error) {
    console.error("Error creating address:", error);
    req.session.formData = { name, description };
    req.flash("error", "Error al crear la dirección. Inténtalo de nuevo.");
    return res.redirect("/client/addresses/create");
  }
}

export async function GetEditAddress(req, res, next) {
  try {
    const addressId = req.params.id;
    
    const address = await context.AddressModel.findOne({
      where: {
        id: addressId,
        clientId: req.session.user.id
      }
    });

    if (!address) {
      req.flash("error", "Dirección no encontrada.");
      return res.redirect("/client/addresses");
    }

    res.render("client/edit-address", {
      "page-title": "Editar Dirección",
      layout: "main",
      user: req.session.user,
      address: address.get({ plain: true }),
      formData: req.session.formData || {}
    });

    // Limpiar datos del formulario de la sesión después de renderizar
    delete req.session.formData;
  } catch (error) {
    console.error("Error loading address for edit:", error);
    req.flash("error", "Error al cargar la dirección. Inténtalo de nuevo.");
    res.redirect("/client/addresses");
  }
}


export async function PostEditAddress(req, res, next) {
  const { name, description } = req.body;
  const addressId = req.params.id;
  
  try {

    if (!name || !description) {
      req.session.formData = { name, description };
      req.flash("error", "Todos los campos son requeridos.");
      return res.redirect(`/client/addresses/edit/${addressId}`);
    }


    const address = await context.AddressModel.findOne({
      where: {
        id: addressId,
        clientId: req.session.user.id
      }
    });

    if (!address) {
      req.flash("error", "Dirección no encontrada.");
      return res.redirect("/client/addresses");
    }


    await address.update({
      name: name.trim(),
      description: description.trim()
    });

    req.flash("success", "Dirección actualizada exitosamente.");
    return res.redirect("/client/addresses");
    
  } catch (error) {
    console.error("Error updating address:", error);
    req.session.formData = { name, description };
    req.flash("error", "Error al actualizar la dirección. Inténtalo de nuevo.");
    return res.redirect(`/client/addresses/edit/${addressId}`);
  }
}


export async function GetDeleteAddress(req, res, next) {
  try {
    const addressId = req.params.id;
    
    const address = await context.AddressModel.findOne({
      where: {
        id: addressId,
        clientId: req.session.user.id
      }
    });

    if (!address) {
      req.flash("error", "Dirección no encontrada.");
      return res.redirect("/client/addresses");
    }

    res.render("client/delete-address", {
      "page-title": "Eliminar Dirección",
      layout: "main",
      user: req.session.user,
      address: address.get({ plain: true })
    });
  } catch (error) {
    console.error("Error loading address for delete:", error);
    req.flash("error", "Error al cargar la dirección. Inténtalo de nuevo.");
    res.redirect("/client/addresses");
  }
}

export async function PostDeleteAddress(req, res, next) {
  try {
    const addressId = req.params.id;
    
    const address = await context.AddressModel.findOne({
      where: {
        id: addressId,
        clientId: req.session.user.id
      }
    });

    if (!address) {
      req.flash("error", "Dirección no encontrada.");
      return res.redirect("/client/addresses");
    }

    await address.destroy();

    req.flash("success", "Dirección eliminada exitosamente.");
    return res.redirect("/client/addresses");
    
  } catch (error) {
    console.error("Error deleting address:", error);
    req.flash("error", "Error al eliminar la dirección. Inténtalo de nuevo.");
    return res.redirect("/client/addresses");
  }
}


export async function GetClientFavorites(req, res, next) {
  try {
    const favorites = await context.FavoriteModel.findAll({
      where: {
        clientId: req.session.user.id
      },
      include: [
        {
          model: context.CommerceModel,
          as: 'favoriteCommerce',
          where: {
            isActive: true
          },
          include: [
            {
              model: context.CommerceTypeModel,
              as: 'commerceType'
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // convertir las instancias de sequelize a objetos planos
    const favoriteCommerces = favorites.map(favorite => {
      const favoriteData = favorite.get({ plain: true });
      return {
        favoriteId: favoriteData.id,
        commerce: favoriteData.favoriteCommerce,
        addedAt: favoriteData.createdAt
      };
    });

    res.render("client/favorites", {
      "page-title": "Mis Favoritos",
      layout: "main",
      user: req.session.user,
      favorites: favoriteCommerces,
      favoriteCount: favoriteCommerces.length
    });
  } catch (error) {
    console.error("Error loading client favorites:", error);
    req.flash("error", "Error al cargar los favoritos. Inténtalo de nuevo.");
    res.redirect("/client/home");
  }
}

export async function GetCommerceList(req, res, next) {
  try {
    // Limpiar carrito al cambiar de contexto
    if (req.session.cart && req.session.cart.length > 0) {
      req.session.cart = [];
      req.session.cartCommerceId = null;
    }

    const { type, search } = req.query;
    
    if (!type) {
      req.flash("error", "Tipo de comercio no especificado.");
      return res.redirect("/client/home");
    }

    const commerceType = await context.CommerceTypeModel.findByPk(type);
    if (!commerceType) {
      req.flash("error", "Tipo de comercio no encontrado.");
      return res.redirect("/client/home");
    }

    const whereClause = {
      commerceTypeId: type,
      isActive: true
    };

    if (search && search.trim()) {
      whereClause.commerceName = {
        [Op.like]: `%${search.trim()}%`
      };
    }

    const commerces = await context.CommerceModel.findAll({
      where: whereClause,
      include: [
        {
          model: context.CommerceTypeModel,
          as: 'commerceType'
        },
        {
          model: context.FavoriteModel,
          as: 'receivedFavorites',
          where: { clientId: req.session.user.id },
          required: false
        }
      ],
      order: [['commerceName', 'ASC']]
    });

    const commercesWithFavorites = commerces.map(commerce => {
      const commerceData = commerce.get({ plain: true });

      commerceData.commerceLogo = commerceData.logo || commerceData.commerceLogo;
      commerceData.isFavorite = commerceData.receivedFavorites && commerceData.receivedFavorites.length > 0;
      return commerceData;
    });

    res.render("client/commerce-list", {
      "page-title": `${commerceType.name} - Comercios`,
      layout: "main",
      user: req.session.user,
      commerceType: commerceType.get({ plain: true }),
      commerces: commercesWithFavorites,
      commerceCount: commercesWithFavorites.length,
      searchTerm: search || ''
    });
  } catch (error) {
    console.error("Error loading commerce list:", error);
    req.flash("error", "Error al cargar los comercios. Inténtalo de nuevo.");
    res.redirect("/client/home");
  }
}

export async function PostToggleFavorite(req, res, next) {
  try {
    const { commerceId } = req.body;
    const clientId = req.session.user.id;

    if (!commerceId) {
      return res.status(400).json({ success: false, message: "ID de comercio requerido." });
    }

    const commerce = await context.CommerceModel.findOne({
      where: {
        id: commerceId,
        isActive: true
      }
    });

    if (!commerce) {
      return res.status(404).json({ success: false, message: "Comercio no encontrado." });
    }

    const existingFavorite = await context.FavoriteModel.findOne({
      where: {
        clientId: clientId,
        commerceId: commerceId
      }
    });

    if (existingFavorite) {
      await existingFavorite.destroy();
      return res.json({ success: true, isFavorite: false, message: "Eliminado de favoritos." });
    } else {
      // Agregar a favoritos
      await context.FavoriteModel.create({
        clientId: clientId,
        commerceId: commerceId
      });
      return res.json({ success: true, isFavorite: true, message: "Agregado a favoritos." });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return res.status(500).json({ success: false, message: "Error al procesar la solicitud." });
  }
}
