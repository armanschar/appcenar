import { DataTypes } from "sequelize";
import connection from "../config/database.js";
import { ORDER_STATUSES } from "../config/orderStatuses.js";

const Order = connection.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "clients",
        key: "id",
      },
    },
    commerceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "commerces",
        key: "id",
      },
    },
    addressId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "addresses",
        key: "id",
      },
    },
    deliveryId: {
      type: DataTypes.INTEGER,
      allowNull: true, // debe ser null porque al principio no tienen delivery designado
      references: {
        model: "deliveries",
        key: "id",
      },
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    itbis: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    itbisRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ORDER_STATUSES)),
      allowNull: false,
      defaultValue: ORDER_STATUSES.PENDING,
    },
    orderDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    orderTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
  },
  {
    tableName: "orders",
    timestamps: true,
    indexes: [
      {
        fields: ["clientId"],
        name: "idx_orders_client_id"
      },
      {
        fields: ["commerceId"],
        name: "idx_orders_commerce_id"
      },
      {
        fields: ["deliveryId"],
        name: "idx_orders_delivery_id"
      },
      {
        fields: ["status"],
        name: "idx_orders_status"
      }
    ],
  }
);

Order.associate = (models) => {
  Order.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
  Order.belongsTo(models.Commerce, { foreignKey: 'commerceId', as: 'commerce' });
  Order.belongsTo(models.Delivery, { foreignKey: 'deliveryId', as: 'delivery' });
  Order.hasMany(models.OrderDetail, { foreignKey: 'orderId', as: 'details' });
};


export default Order;
