import { DataTypes } from "sequelize";
import connection from "../config/database.js";

const OrderDetail = connection.define("OrderDetail",{
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "orders",
            key: "id"
        }
    },
    productId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "products",
            key: "id"
        }
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    productPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    productImage: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    productDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    }
}, {
    tableName: "order_details",
    timestamps: true,
    indexes: [
        {
            fields: ['orderId'],
            name: 'idx_order_details_order_id'
        },
        {
            fields: ['productId'],
            name: 'idx_order_details_product_id'
        },
        {
            unique: true,
            fields: ['orderId', 'productId'],
            name: 'unique_order_product'
        }
    ]
});

OrderDetail.associate = (models) => {
  OrderDetail.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
  OrderDetail.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
};

export default OrderDetail;