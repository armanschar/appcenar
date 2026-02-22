import { DataTypes } from 'sequelize';
import connection from '../config/database.js';

const Product = connection.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { notEmpty: true }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  commerceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'commerces',
      key: 'id'
    }
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'product_categories',
      key: 'id'
    }
  }
}, {
  tableName: 'products',
  timestamps: true
});

// Asociación en función aparte
Product.associate = (models) => {
  // Cada producto pertenece a una categoría (alias: 'category')
  Product.belongsTo(models.ProductCategory, { foreignKey: 'categoryId', as: 'category' });

  // Cada producto pertenece a un comercio (alias: 'commerce')
  Product.belongsTo(models.Commerce, { foreignKey: 'commerceId', as: 'commerce' });
};

export default Product;
