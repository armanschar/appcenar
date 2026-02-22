import { DataTypes } from 'sequelize';
import connection from '../config/database.js';
import { ROLES } from '../config/roles.js';
import { DELIVERY_STATUSES } from '../config/deliveryStatuses.js';

const Delivery = connection.define('Delivery', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
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
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
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
  profileImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM(ROLES.DELIVERY),
    allowNull: false,
    defaultValue: ROLES.DELIVERY,
    validate: {
      isIn: [[ROLES.DELIVERY]]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  deliveryStatus: {
    type: DataTypes.ENUM(...Object.values(DELIVERY_STATUSES)),
    allowNull: false,
    defaultValue: DELIVERY_STATUSES.NOT_AVAILABLE
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
  tableName: 'deliveries',
  timestamps: true
});

Delivery.associate = (models) => {
  Delivery.hasMany(models.Order, { foreignKey: 'deliveryId', as: 'orders' });
};

export default Delivery;
