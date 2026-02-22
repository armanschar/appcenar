import { Sequelize } from "sequelize";
import connection from "../config/database.js";

import ClientModel from "../models/Client.js";
import AdminModel from "../models/Admin.js";
import DeliveryModel from "../models/Delivery.js";
import CommerceModel from "../models/Commerce.js";
import CommerceTypeModel from "../models/CommerceType.js";
import AddressModel from "../models/Address.js";
import FavoriteModel from "../models/Favorite.js";
import OrderModel from "../models/Order.js";
import OrderDetailsModel from  "../models/OrderDetail.js";
import ProductModel from "../models/Product.js";
import ProductCategoryModel from "../models/ProductCategory.js";
import ConfigurationModel from "../models/Configuration.js";

// Test de conexión
try {
  await connection.authenticate();
  console.log("Conexion exitosa a la base de datos.");
} catch (error) {
  console.error("Error inicializando la base de datos", error);
}

// =======================
// Comercio - Tipo de Comercio
// =======================
CommerceModel.belongsTo(CommerceTypeModel, {
  foreignKey: "commerceTypeId",
  as: "commerceType",
});
CommerceTypeModel.hasMany(CommerceModel, {
  foreignKey: "commerceTypeId",
  as: "typeCommerces",
});

// =======================
// Cliente - Direcciones
// =======================
ClientModel.hasMany(AddressModel, {
  foreignKey: "clientId",
  as: "addresses",
});
AddressModel.belongsTo(ClientModel, {
  foreignKey: "clientId",
  as: "addressClient",
});

// =======================
// Favoritos
// =======================
ClientModel.hasMany(FavoriteModel, {
  foreignKey: "clientId",
  as: "clientFavorites",
});
CommerceModel.hasMany(FavoriteModel, {
  foreignKey: "commerceId",
  as: "receivedFavorites",
});
FavoriteModel.belongsTo(ClientModel, {
  foreignKey: "clientId",
  as: "favoriteClient",
});
FavoriteModel.belongsTo(CommerceModel, {
  foreignKey: "commerceId",
  as: "favoriteCommerce",
});

// =======================
// Ordenes
// =======================
ClientModel.hasMany(OrderModel, {
  foreignKey: "clientId",
  as: "clientOrders",
});
OrderModel.belongsTo(ClientModel, {
  foreignKey: "clientId",
  as: "orderClient",
});

CommerceModel.hasMany(OrderModel, {
  foreignKey: "commerceId",
  as: "commerceOrders",
});
OrderModel.belongsTo(CommerceModel, {
  foreignKey: "commerceId",
  as: "orderCommerce",
});

DeliveryModel.hasMany(OrderModel, {
  foreignKey: "deliveryId",
  as: "deliveryOrders",
});
OrderModel.belongsTo(DeliveryModel, {
  foreignKey: "deliveryId",
  as: "orderDelivery",
});

AddressModel.hasMany(OrderModel, {
  foreignKey: "addressId",
  as: "addressOrders",
});
OrderModel.belongsTo(AddressModel, {
  foreignKey: "addressId",
  as: "orderAddress",
});

// =======================
// Detalles de Orden
// =======================
OrderModel.hasMany(OrderDetailsModel, {
  foreignKey: "orderId",
  as: "orderDetails",
});
OrderDetailsModel.belongsTo(OrderModel, {
  foreignKey: "orderId",
  as: "parentOrder",
});

ProductModel.hasMany(OrderDetailsModel, {
  foreignKey: "productId",
  as: "productOrderDetails",
});
OrderDetailsModel.belongsTo(ProductModel, {
  foreignKey: "productId",
  as: "relatedProduct",
});

// =======================
// Productos - Comercio
// =======================
CommerceModel.hasMany(ProductModel, {
  foreignKey: "commerceId",
  as: "commerceOwnProducts",
});
ProductModel.belongsTo(CommerceModel, {
  foreignKey: "commerceId",
  as: "productCommerceOwner",
});

// =======================
// Productos - Categoria
// =======================
ProductCategoryModel.hasMany(ProductModel, {
  foreignKey: "categoryId",
  as: "categoryProducts",
});
ProductModel.belongsTo(ProductCategoryModel, {
  foreignKey: "categoryId",
  as: "productCategory",
});

// =======================
// Categoria - Comercio
// =======================
CommerceModel.hasMany(ProductCategoryModel, {
  foreignKey: "commerceId",
  as: "commerceOwnCategories",
});
ProductCategoryModel.belongsTo(CommerceModel, {
  foreignKey: "commerceId",
  as: "categoryCommerceOwner",
});

export default {
  Sequelize: connection,
  ClientModel,
  AdminModel,
  DeliveryModel,
  CommerceModel,
  CommerceTypeModel,
  AddressModel,
  FavoriteModel,
  OrderModel,
  OrderDetailsModel,
  ProductModel,
  ProductCategoryModel,
  ConfigurationModel
};
