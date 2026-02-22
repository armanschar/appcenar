export const DELIVERY_STATUSES = {
    AVAILABLE: 'Disponible',
    NOT_AVAILABLE: 'No Disponible'
};

export const isValidDeliveryStatus = (status) => {
    return Object.values(DELIVERY_STATUSES).includes(status);
};

export const getAllDeliveryStatuses = () => {
    return Object.values(DELIVERY_STATUSES);
};
