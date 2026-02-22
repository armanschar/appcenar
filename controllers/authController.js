import context from "../context/appcontext.js";
import bcrypt from "bcrypt";
import { promisify } from "util";
import { randomBytes } from "crypto";
import { sendEmail } from "../services/emailService.js";
import { ROLES, isValidRole, ROLE_REDIRECTS } from "../config/roles.js";
import { DELIVERY_STATUSES } from "../config/deliveryStatuses.js";
import { 
  findUserByEmailOrUsername, 
  emailExists, 
  usernameExists, 
  commerceNameExists, 
  getModelByRole,
  findUserByActivationToken,
  findUserByResetToken 
} from "../services/userService.js";

export function GetLogin(req, res, next) {
  res.render("auth/login", { "page-title": "Login", layout: "authLayout" });
}

export async function PostLogin(req, res, next) {
  const { emailOrUsername, password } = req.body;

  try {
    const user = await findUserByEmailOrUsername(emailOrUsername);

    if (!user) {
      req.flash(
        "error",
        "El correo electrónico o nombre de usuario no está registrado."
      );
      return res.redirect("/");
    }

    if (!user.isActive) {
      req.flash(
        "error",
        "Tu cuenta está inactiva. Revisa tu correo o contacta a un administrador."
      );
      return res.redirect("/");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      req.flash("error", "Contraseña incorrecta.");
      return res.redirect("/");
    }

    req.session.isAuthenticated = true;
    req.session.user = {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      role: user.role,
      commerceName: user.commerceName || null,
      profileImage: user.profileImage || null,
      tableType: user.tableType
    };
    req.session.save((error) => {
      if (error) {
        console.error("Error saving session:", error);
        req.flash("error", "Error al iniciar sesión. Inténtalo de nuevo.");
        return res.redirect("/");
      }

      const redirectUrl = ROLE_REDIRECTS[user.role] || "/";
      return res.redirect(redirectUrl);
    });
  } catch (error) {
    console.error("Error during login:", error);
    req.flash("error", "Error al iniciar sesión. Inténtalo de nuevo.");
    return res.redirect("/");
  }
}

export function GetRegisterClientDelivery(req, res, next) {
  res.render("auth/register-client-delivery", {
    "page-title": "Registro Cliente/Delivery",
    layout: "authLayout",
    roles: [ROLES.CLIENTE, ROLES.DELIVERY],
    formData: req.session.formData || {},
  });

  delete req.session.formData;
}

export async function PostRegisterClientDelivery(req, res, next) {
  const {
    name,
    lastName,
    phone,
    email,
    password,
    confirmPassword,
    username,
    role,
  } = req.body;

  try {
    if (password !== confirmPassword) {
      req.session.formData = { name, lastName, phone, email, username, role };

      req.flash("error", "Las contraseñas no coinciden.");
      return res.redirect("/register-client-delivery");
    }
    if (password.length < 6) {
      req.session.formData = { name, lastName, phone, email, username, role };

      req.flash("error", "La contraseña debe tener al menos 6 caracteres.");
      return res.redirect("/register-client-delivery");
    }
    if (
      !isValidRole(role) ||
      (role !== ROLES.CLIENTE && role !== ROLES.DELIVERY)
    ) {
      req.session.formData = { name, lastName, phone, email, username, role };
      req.flash("error", "Rol no válido. Debe ser Cliente o Delivery.");
      return res.redirect("/register-client-delivery");
    }

    // revisar si ya está registrado
    const emailInUse = await emailExists(email);
    const usernameInUse = await usernameExists(username);

    if (emailInUse || usernameInUse) {
      req.session.formData = { name, lastName, phone, email, username, role };
      req.flash(
        "error",
        "El correo electrónico y/o nombre de usuario ya están en uso."
      );
      return res.redirect("/register-client-delivery");
    }

    const randomBytesAsync = promisify(randomBytes);
    const buffer = await randomBytesAsync(32);
    const token = buffer.toString("hex");

    const hashedPassword = await bcrypt.hash(password, 10);

    let profileImagePath = null;
    if (req.file) {
      profileImagePath = `/uploads/profiles/${req.file.filename}`;
    }

    // asignar el modelo según el rol
    const UserModel = getModelByRole(role);

    const userData = {
      name,
      lastName,
      phone,
      email,
      profileImage: profileImagePath,
      password: hashedPassword,
      username,
      role,
      isActive: false,
      activationToken: token,
    };

    // añadir campos específicos de delivery
    if (role === ROLES.DELIVERY) {
      userData.deliveryStatus = DELIVERY_STATUSES.NOT_AVAILABLE;
    }

    await UserModel.create(userData);

    await sendEmail({
      to: email,
      subject: "Registro exitoso en AppCenar",
      html: `<p>Gracias por registrarte en AppCenar.</p>
                   <p>Por favor, haz clic en el siguiente enlace para activar tu cuenta:</p>
                   <a href="${process.env.APP_URL}/activate/${token}">Activar Cuenta</a>
                   <p>Si no te registraste en AppCenar, ignora este correo.</p>`,
    });

    req.flash(
      "success",
      "Registro exitoso. Revisa tu correo para activar tu cuenta."
    );
    return res.redirect("/");
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    req.flash("error", "Error al registrar usuario. Inténtalo de nuevo.");
    return res.redirect("/register-client-delivery");
  }
}

export async function GetRegisterCommerce(req, res, next) {
  try {
    const commerceTypes = await context.CommerceTypeModel.findAll({
      where: {
        isActive: true,
      },
      order: [["name", "ASC"]],
    });

    // convertir a objeto plano
    const plainCommerceTypes = commerceTypes.map((ct) =>
      ct.get({ plain: true })
    );

    res.render("auth/register-commerce", {
      "page-title": "Registro Comercio",
      layout: "authLayout",
      roles: [ROLES.COMERCIO],
      formData: req.session.formData || {},
      commerceTypes: plainCommerceTypes,
    });

    delete req.session.formData;
  } catch (error) {
    console.error("Error loading commerce registration:", error);
    req.flash("error", "Error al cargar la página de registro.");
    res.redirect("/");
  }
}

export async function PostRegisterCommerce(req, res, next) {
  const {
    commerceName,
    phone,
    email,
    openingTime,
    closingTime,
    commerceTypeId,
    password,
    confirmPassword,
  } = req.body;

  try {
    if (
      !commerceName ||
      !phone ||
      !email ||
      !openingTime ||
      !closingTime ||
      !commerceTypeId ||
      !password ||
      !confirmPassword
    ) {
      req.session.formData = {
        commerceName,
        phone,
        email,
        openingTime,
        closingTime,
        commerceTypeId,
      };
      req.flash("error", "Todos los campos son requeridos.");
      return res.redirect("/register-commerce");
    }

    if (password !== confirmPassword) {
      req.session.formData = {
        commerceName,
        phone,
        email,
        openingTime,
        closingTime,
        commerceTypeId,
      };
      req.flash("error", "Las contraseñas no coinciden.");
      return res.redirect("/register-commerce");
    }

    if (password.length < 6) {
      req.session.formData = {
        commerceName,
        phone,
        email,
        openingTime,
        closingTime,
        commerceTypeId,
      };
      req.flash("error", "La contraseña debe tener al menos 6 caracteres.");
      return res.redirect("/register-commerce");
    }
    // revisar si ya está registrado
    const emailInUse = await emailExists(email);
    const commerceNameInUse = await commerceNameExists(commerceName);

    if (emailInUse || commerceNameInUse) {
      req.session.formData = {
        commerceName,
        phone,
        email,
        openingTime,
        closingTime,
        commerceTypeId,
      };
      req.flash(
        "error",
        "El correo electrónico y/o nombre de comercio ya están en uso."
      );
      return res.redirect("/register-commerce");
    }

    // generar token
    const randomBytesAsync = promisify(randomBytes);
    const buffer = await randomBytesAsync(32);
    const token = buffer.toString("hex");

    // Hashear password
    const hashedPassword = await bcrypt.hash(password, 10);

    let logoPath = null;
    if (req.file) {
      logoPath = `/uploads/commerce-logos/${req.file.filename}`;
    }

    // crear comercio con el modelo
    await context.CommerceModel.create({
      commerceName,
      phone,
      email,
      password: hashedPassword,
      role: ROLES.COMERCIO,
      isActive: false,
      activationToken: token,
      openingTime,
      closingTime,
      commerceLogo: logoPath,
      commerceTypeId: parseInt(commerceTypeId),
    });

    await sendEmail({
      to: email,
      subject: "Registro exitoso en AppCenar - Comercio",
      html: `<p>Gracias por registrar tu comercio "${commerceName}" en AppCenar.</p>
             <p>Por favor, haz clic en el siguiente enlace para activar tu cuenta:</p>
             <a href="${process.env.APP_URL}/activate/${token}">Activar Cuenta de Comercio</a>
             <p>Si no te registraste en AppCenar, ignora este correo.</p>`,
    });

    req.flash(
      "success",
      "Registro de comercio exitoso. Revisa tu correo para activar tu cuenta."
    );
    return res.redirect("/");
  } catch (error) {
    console.error("Error al registrar comercio:", error);
    req.flash("error", "Error al registrar comercio. Inténtalo de nuevo.");
    return res.redirect("/register-commerce");
  }
}

export async function GetActivate(req, res, next) {
  const { token } = req.params;

  if (!token) {
    req.flash("error", "Token de activación no proporcionado.");
    return res.redirect("/");
  }

  try {
    const user = await findUserByActivationToken(token);

    if (!user) {
      req.flash("error", "Token de activación inválido o expirado.");
      return res.redirect("/");
    }

    if (user.isActive) {
      req.flash(
        "success",
        "Tu cuenta ya está activada. Puedes iniciar sesión."
      );
      return res.redirect("/");
    }

    // Asignar el modelo adecuado y actualizar el usuario
    const UserModel = getModelByRole(user.role);
    await UserModel.update(
      { 
        isActive: true, 
        activationToken: null 
      },
      { 
        where: { id: user.id } 
      }
    );

    req.flash(
      "success",
      "Cuenta activada exitosamente. Ya puedes iniciar sesión."
    );
    return res.redirect("/");
  } catch (error) {
    console.error("Error al activar cuenta:", error);
    req.flash("error", "Error al activar cuenta. Inténtalo de nuevo.");
    return res.redirect("/");
  }
}

export function PostLogout(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      console.error("Error destroying session:", error);
      req.flash("error", "Error al cerrar sesión.");
      return res.redirect("/");
    }

    res.redirect("/");
  });
}

export function GetForgot(req, res, next) {
  res.render("auth/forgot", {
    "page-title": "Forgot Password",
    layout: "authLayout",
  });
}

export async function PostForgot(req, res, next) {
  const { Email } = req.body;

  try {
    const randomBytesAsync = promisify(randomBytes);
    const buffer = await randomBytesAsync(32);
    const token = buffer.toString("hex");
    
    const user = await findUserByEmailOrUsername(Email);
    if (!user) {
      req.flash(
        "error",
        "No se encontró un usuario con este correo electrónico."
      );
      return res.redirect("/forgot");
    }

    // asignar el modelo adecuado y actualizar el usuario
    const UserModel = getModelByRole(user.role);
    const result = await UserModel.update(
      {
        resetToken: token,
        resetTokenExpiration: new Date(Date.now() + 3600000) // 1 hora
      },
      {
        where: { id: user.id }
      }
    );

    if (!result) {
      req.flash(
        "error",
        "Ocurrió un error al guardar el token de restablecimiento."
      );
      return res.redirect("/forgot");
    }
    await sendEmail({
      to: Email,
      subject: "Restablecimiento de contraseña - AppCenar",
      html: `
            <h2>Solicitud de restablecimiento para la cuenta de correo: ${user.email}</h2>
            <p>Hemos recibido una solicitud para restablecer su contraseña en AppCenar.</p>
            <p>Haga clic en el siguiente enlace para restablecer su contraseña:</p>
            <p><a href="${process.env.APP_URL}/reset/${token}">Restablecer contraseña</a></p>
            <p>Si no solicitó este cambio, ignore este correo electrónico.</p>
            <p>Este enlace expirará en 1 hora por seguridad.</p>
          `,
    });
    req.flash(
      "success",
      "Se ha enviado un enlace de restablecimiento de contraseña a su correo electrónico."
    );
    return res.redirect("/");
  } catch (error) {
    console.error("Error during password reset:", error);
    req.flash(
      "error",
      "Ocurrió un error al procesar la solicitud de restablecimiento de contraseña."
    );
    return res.redirect("/forgot");
  }
}

export async function GetReset(req, res, next) {
  const token = req.params.token;

  if (!token) {
    req.flash("error", "Token de restablecimiento no válido.");
    return res.redirect("/forgot");
  }
  try {
    const user = await findUserByResetToken(token);

    if (!user) {
      req.flash("error", "Token de restablecimiento no válido o expirado.");
      return res.redirect("/forgot");
    }

    res.render("auth/reset", {
      "page-title": "Reset Password",
      layout: "authLayout",
      userId: user.id,
      token: token,
    });
  } catch (error) {
    console.error("Error fetching reset token:", error);
    req.flash(
      "error",
      "Ocurrió un error al procesar el token de restablecimiento."
    );
    return res.redirect("/forgot");
  }
}

export async function PostReset(req, res, next) {
  const { userId, token, Password, ConfirmPassword } = req.body;

  try {
    if (Password !== ConfirmPassword) {
      return res.render("auth/reset", {
        "page-title": "Reset Password",
        layout: "authLayout",
        userId: userId,
        token: token,
        error: "Las contraseñas no coinciden.",
      });
    }

    const user = await findUserByResetToken(token);

    if (!user || user.id != userId) {
      req.flash("error", "Token de restablecimiento no válido o expirado.");
      return res.redirect("/forgot");
    }

    const hashedPassword = await bcrypt.hash(Password, 10);

    // Asignar el modelo adecuado y actualizar el usuario
    const UserModel = getModelByRole(user.role);
    await UserModel.update(
      {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiration: null
      },
      {
        where: { id: user.id }
      }
    );
    
    req.flash("success", "Contraseña restablecida exitosamente.");
    return res.redirect("/");
  } catch (error) {
    console.error("Error during password reset:", error);
    return res.render("auth/reset", {
      "page-title": "Reset Password",
      layout: "authLayout",
      userId: userId,
      token: token,
      error: "Ocurrió un error al restablecer la contraseña.",
    });
  }
}
