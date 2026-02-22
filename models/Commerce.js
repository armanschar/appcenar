import { DataTypes } from 'sequelize';
import connection from '../config/database.js';
import { ROLES } from '../config/roles.js';

const Commerce = connection.define('Commerce', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  commerceName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 100]
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 20]
    }
  },
  openingTime: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  closingTime: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  commerceLogo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  commerceTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'commerce_types',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM(ROLES.COMERCIO),
    allowNull: false,
    defaultValue: ROLES.COMERCIO,
    validate: {
      isIn: [[ROLES.COMERCIO]]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  activationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetTokenExpiration: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'commerces',
  timestamps: true
});

// Definimos las asociaciones en la función associate que recibe los modelos
Commerce.associate = (models) => {
  Commerce.hasMany(models.Product, { foreignKey: 'commerceId', as: 'commerceProducts' });
  Commerce.hasMany(models.ProductCategory, { foreignKey: 'commerceId', as: 'commerceCategories' });
};

export default Commerce;
