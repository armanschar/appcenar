import {DataTypes} from 'sequelize';
import connection from ''

const Users = connection.define('Users', {
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
    allowNull: true, //Solo para clientes y delivery
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
    allowNull: true, //Solo para clientes, delivery y admin
    unique: true,
},
password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
        notEmpty: true,
        len: [6, 100] // Minimo 6 caracteres de pass
    }
},
phone: {
    type: DataTypes.STRING(20), // Limitar a 20 caracteres
    allowNull: false, 
    validate: {
        notEmpty: true,
        len: [10, 20] // Minimo 10 caracteres de telefono
    }
},
profileImage: {
    type: DataTypes.STRING,
    allowNull: true, // Para clientes delivery y comercio
},
role: {
    type: DataTypes.ENUM(ROLES.CLIENTE, ROLES.DELIVERY, ROLES.COMERCIO, ROLES.ADMIN),
    allowNull: false,
    defaultValue: ROLES.CLIENTE
},
isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false // Por defecto no activo hasta verificar email
},
commerceName: {
    type: DataTypes.STRING,
    allowNull: true, // Solo para comercios
    validate: {
        len: [3, 100] // Minimo 3 caracteres para nombre comercio
    }
},
openingTime: {
    type: DataTypes.TIME,
    allowNull: true, // Solo para comercios
},
closingTime: {
    type: DataTypes.TIME,
    allowNull: true, // Solo para comercios
},
//Campo para admin
cedula: {
    type: DataTypes.STRING(15),
    allowNull: true, // Solo para admin
    unique: true,
    validate: {
        len: [11, 15] 
    }
},
//Campos para delivery
deliveryStatus: {
    type: DataTypes.ENUM('Disponible', 'No Disponible'),
    allowNull: true, // Solo para delivery
    defaultValue: 'No Disponible'
},
activationToken: {
    type: DataTypes.STRING,
    allowNull: true // Token para verificar email
},
resetToken: {
    type: DataTypes.STRING,
    allowNull: true // Token para resetear pass
},
resetTokenExpiration: {
    type: DataTypes.DATE,
    allowNull: true // Expiracion del token de reseteo
},
}, {
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeValidate: (user, options) => {
            if (user.role === ROLES.COMERCIO) {
                if (!user.commerceName) {
                    throw new Error('El nombre del comercio es obligatorio para Comercios.');
                }
                if (!user.openingTime || !user.closingTime) {
                    throw new Error('El horario de apertura y cierre es obligatorio para Comercios.');
                }
            }
    
    if (user.role === ROLES.CLIENTE || user.role === ROLES.DELIVERY) {
        if (!user.username) {
            throw new Error('El nombre de usuario es obligatorio para Clientes y Delivery.');
        }
        if (!user.lastName) {
            throw new Error('El apellido es obligatorio para Clientes y Delivery.');
        }
    }
    if (user.role === ROLES.ADMIN) {
        if (!user.username) {
            throw new Error('El nombre de usuario es obligatorio para Administradores.');
        }
        if (!user.cedula) {
            throw new Error('La cédula es obligatoria para Administradores.');
        }
    }
        }
    }
});

module.exports = Users;
