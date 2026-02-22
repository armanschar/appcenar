import { ORDER_STATUSES } from "../config/orderStatuses.js";
import { DELIVERY_STATUSES } from "../config/deliveryStatuses.js";

export function multiply(a, b) {
  return a * b;
}

export function Equals(a, b) {
  return a === b;
}

export function EqualsLoose(a, b) {
  return a == b;
}

// Formateo de moneda dominicana
export function formatDominicanCurrency(amount) {
  const num = parseFloat(amount);
  // Si es número entero, no mostrar decimales
  if (num % 1 === 0) {
    return num.toString();
  }
  // Si tiene decimales (por ITBIS), mostrar 2 decimales
  return num.toFixed(2);
}

// utils/helpers.js
import hbs from 'hbs';

// ===== Helper ifCond =====
hbs.registerHelper('ifCond', function(v1, operator, v2, options) {
  switch (operator) {
    case '==': return (v1 == v2) ? options.fn(this) : options.inverse(this);
    case '===': return (v1 === v2) ? options.fn(this) : options.inverse(this);
    case '!=': return (v1 != v2) ? options.fn(this) : options.inverse(this);
    case '!==': return (v1 !== v2) ? options.fn(this) : options.inverse(this);
    case '<': return (v1 < v2) ? options.fn(this) : options.inverse(this);
    case '<=': return (v1 <= v2) ? options.fn(this) : options.inverse(this);
    case '>': return (v1 > v2) ? options.fn(this) : options.inverse(this);
    case '>=': return (v1 >= v2) ? options.fn(this) : options.inverse(this);
    default: return options.inverse(this);
  }
});

export const ORDER_STATUS = ORDER_STATUSES;
export const DELIVERY_STATUS = DELIVERY_STATUSES;
