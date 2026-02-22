import { DataTypes } from 'sequelize';
import connection from '../config/database.js';

const Favorite = connection.define('Favorite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    }
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
  tableName: 'favorites',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['clientId', 'commerceId'] // evitar duplicados de favoritos
    }
  ]
});

export default Favorite;
