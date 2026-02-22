import Address from './Address.js';
import Admin from './Admin.js';
import Client from './Client.js';
import Commerce from './Commerce.js';
import CommerceType from './CommerceType.js';
import Configuration from './Configuration.js';
import Delivery from './Delivery.js';
import Favorite from './Favorite.js';
import Order from './Order.js';
import OrderDetail from './OrderDetail.js';
import Product from './Product.js';
import ProductCategory from './ProductCategory.js';

const models = {
  Address,
  Admin,
  Client,
  Commerce,
  CommerceType,
  Configuration,
  Delivery,
  Favorite,
  Order,
  OrderDetail,
  Product,
  ProductCategory
};

// Inicializar asociaciones
Object.values(models).forEach(model => {
  if (model.associate) model.associate(models);
});

export default models;
