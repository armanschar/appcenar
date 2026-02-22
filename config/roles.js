export const ROLES = {
    CLIENTE: 'Cliente',
    DELIVERY: 'Delivery',
    COMERCIO: 'Comercio',
    ADMIN: 'Admin',
}

export const ROLE_REDIRECTS = {
    [ROLES.CLIENTE]: '/client/home',
    [ROLES.DELIVERY]: '/delivery/home',
    [ROLES.COMERCIO]: '/commerce/home',
    [ROLES.ADMIN]: '/admin/dashboard',
}

export const isValidRole = (role) => {
    return Object.values(ROLES).includes(role);
}

export const getAllRoles = () => {
    return Object.values(ROLES);
}

export const hasPermission = (userRole, requiredRoles) => {
    if (Array.isArray(requiredRoles)) {
        return requiredRoles.includes(userRole);
    }
    return userRole === requiredRoles;
}

export default ROLES;