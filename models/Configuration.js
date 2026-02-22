import { DataTypes } from 'sequelize';
import connection from '../config/database.js';

const Configuration = connection.define('Configuration', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'configurations',
    timestamps: true,
    indexes: [
      {
        fields: ['key']
      },
      {
        fields: ['isActive']
      }
    ]
  });

export default Configuration;
