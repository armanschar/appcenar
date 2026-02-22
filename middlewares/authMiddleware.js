import { ROLE_REDIRECTS } from "../config/roles.js";

// revisar si el usuario está autenticado
export function requireAuth(req, res, next) {
  if (!req.session.isAuthenticated) {
    req.flash("error", "Debes iniciar sesión para acceder a esta página.");
    return res.redirect("/");
  }
  next();
}

// revisar si el usuario no esta autenticado (para páginas de login/registro)
export function requireGuest(req, res, next) {
  if (req.session.isAuthenticated) {
    const redirectUrl = ROLE_REDIRECTS[req.session.user.role] || "/";
    return res.redirect(redirectUrl);
  }
  next();
}

// revisar si el usuario tiene un rol específico
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.isAuthenticated) {
      req.flash("error", "Debes iniciar sesión para acceder a esta página.");
      return res.redirect("/");
    }
    
    if (req.session.user.role !== role) {
      req.flash("error", "No tienes permisos para acceder a esta página.");
      const redirectUrl = ROLE_REDIRECTS[req.session.user.role] || "/";
      return res.redirect(redirectUrl);
    }
    
    next();
  };
}

// revisar si el usuario tiene alguno de los roles especificados
export function requireRoles(roles) {
  return (req, res, next) => {
    if (!req.session.isAuthenticated) {
      req.flash("error", "Debes iniciar sesión para acceder a esta página.");
      return res.redirect("/");
    }
    
    if (!roles.includes(req.session.user.role)) {
      req.flash("error", "No tienes permisos para acceder a esta página.");
      const redirectUrl = ROLE_REDIRECTS[req.session.user.role] || "/";
      return res.redirect(redirectUrl);
    }
    
    next();
  };
}

export default {
  requireAuth,
  requireGuest,
  requireRole,
  requireRoles
};
