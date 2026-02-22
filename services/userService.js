import { Op } from 'sequelize';
import context from '../context/appcontext.js';
import { ROLES } from '../config/roles.js';

export async function findUserByEmailOrUsername(emailOrUsername) {
  try {
    // buscar en la tabla de clientes
    let user = await context.ClientModel.findOne({
      where: {
        [Op.or]: [
          { email: { [Op.like]: emailOrUsername } },
          { username: { [Op.like]: emailOrUsername } },
        ],
      },
    });
    if (user) {
      return { ...user.toJSON(), tableType: 'client' };
    }

    // buscar en la tabla de delivery
    user = await context.DeliveryModel.findOne({
      where: {
        [Op.or]: [
          { email: { [Op.like]: emailOrUsername } },
          { username: { [Op.like]: emailOrUsername } },
        ],
      },
    });
    if (user) {
      return { ...user.toJSON(), tableType: 'delivery' };
    }

    // buscar en la tabla de comercios (solo por email, sin username)
    user = await context.CommerceModel.findOne({
      where: {
        email: { [Op.like]: emailOrUsername }
      },
    });
    if (user) {
      return { ...user.toJSON(), tableType: 'commerce' };
    }

    // buscar en la tabla de administradores
    user = await context.AdminModel.findOne({
      where: {
        [Op.or]: [
          { email: { [Op.like]: emailOrUsername } },
          { username: { [Op.like]: emailOrUsername } },
        ],
      },
    });
    if (user) {
      return { ...user.toJSON(), tableType: 'admin' };
    }

    return null;
  } catch (error) {
    console.error('Error finding user:', error);
    throw error;
  }
}

export async function emailExists(email) {
  try {
    const tables = [
      context.ClientModel,
      context.DeliveryModel,
      context.CommerceModel,
      context.AdminModel
    ];

    for (const table of tables) {
      const user = await table.findOne({
        where: { email: { [Op.like]: email } }
      });
      if (user) return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking email existence:', error);
    throw error;
  }
}

export async function usernameExists(username) {
  try {
    const tables = [
      context.ClientModel,
      context.DeliveryModel,
      context.AdminModel
    ];

    for (const table of tables) {
      const user = await table.findOne({
        where: { username: { [Op.like]: username } }
      });
      if (user) return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking username existence:', error);
    throw error;
  }
}

export async function commerceNameExists(commerceName) {
  try {
    const commerce = await context.CommerceModel.findOne({
      where: { commerceName: { [Op.like]: commerceName } }
    });
    return !!commerce;
  } catch (error) {
    console.error('Error checking commerce name existence:', error);
    throw error;
  }
}

export function getModelByRole(role) {
  switch (role) {
    case ROLES.CLIENTE:
      return context.ClientModel;
    case ROLES.DELIVERY:
      return context.DeliveryModel;
    case ROLES.COMERCIO:
      return context.CommerceModel;
    case ROLES.ADMIN:
      return context.AdminModel;
    default:
      throw new Error(`Invalid role: ${role}`);
  }
}

export async function findUserByActivationToken(token) {
  try {
    const tables = [
      { model: context.ClientModel, type: 'client' },
      { model: context.DeliveryModel, type: 'delivery' },
      { model: context.CommerceModel, type: 'commerce' }
    ];

    for (const { model, type } of tables) {
      const user = await model.findOne({
        where: { activationToken: token }
      });
      if (user) {
        return { ...user.toJSON(), tableType: type };
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding user by activation token:', error);
    throw error;
  }
}

export async function findUserByResetToken(token) {
  try {
    const tables = [
      { model: context.ClientModel, type: 'client' },
      { model: context.DeliveryModel, type: 'delivery' },
      { model: context.CommerceModel, type: 'commerce' },
      { model: context.AdminModel, type: 'admin' }
    ];

    for (const { model, type } of tables) {
      const user = await model.findOne({
        where: {
          resetToken: token,
          resetTokenExpiration: {
            [Op.gte]: Date.now(),
          },
        }
      });
      if (user) {
        return { ...user.toJSON(), tableType: type };
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding user by reset token:', error);
    throw error;
  }
}
