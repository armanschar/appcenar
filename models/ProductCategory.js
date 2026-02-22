import { DataTypes } from 'sequelize';
import connection from '../config/database.js';

const ProductCategory = connection.define('ProductCategory', {
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
  commerceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'commerces',
      key: 'id'
    }
  }
}, {
  tableName: 'product_categories',
  timestamps: true
});

// Asociaciones
ProductCategory.associate = (models) => {
  // Cada categoría pertenece a un comercio
  ProductCategory.belongsTo(models.Commerce, { foreignKey: 'commerceId', as: 'commerce' });

  // Cada categoría tiene muchos productos (alias debe coincidir con el usado en Product)
  ProductCategory.hasMany(models.Product, { foreignKey: 'categoryId', as: 'products' });
};

export default ProductCategory;
