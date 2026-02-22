export const ORDER_STATUSES = {
    PENDING: 'Pendiente',
    IN_PROCESS: 'En Proceso',
    COMPLETED: 'Completado'
};

export const isValidOrderStatus = (status) => {
    return Object.values(ORDER_STATUSES).includes(status);
};

export const getAllOrderStatuses = () => {
    return Object.values(ORDER_STATUSES);
};
