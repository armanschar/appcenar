import "./utils/LoadEnvConfig.js";
import express from "express";
import { engine } from "express-handlebars";
import Handlebars from "handlebars";
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";
import path from "path";
import { projectRoot } from "./utils/Paths.js";
import authRoutes from "./routes/authRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import commerceRoutes from "./routes/commerceRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import context from "./context/appcontext.js";
import flash from "connect-flash";
import session from "express-session";
import { Equals, EqualsLoose, ORDER_STATUS, DELIVERY_STATUS, multiply } from "./utils/helpers.js";

const app = express();

// Configuración de Handlebars
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    layoutsDir: path.join(projectRoot, "views", "layouts"),
    defaultLayout: "main",
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: {
      multiply,
      Equals,
      EqualsLoose,
      ORDER_STATUS,
      DELIVERY_STATUS,
      ifCond: function (v1, operator, v2, options) {
        switch (operator) {
          case "==": return (v1 == v2) ? options.fn(this) : options.inverse(this);
          case "===": return (v1 === v2) ? options.fn(this) : options.inverse(this);
          case "!=": return (v1 != v2) ? options.fn(this) : options.inverse(this);
          case "!==": return (v1 !== v2) ? options.fn(this) : options.inverse(this);
          case "<": return (v1 < v2) ? options.fn(this) : options.inverse(this);
          case "<=": return (v1 <= v2) ? options.fn(this) : options.inverse(this);
          case ">": return (v1 > v2) ? options.fn(this) : options.inverse(this);
          case ">=": return (v1 >= v2) ? options.fn(this) : options.inverse(this);
          default: return options.inverse(this);
        }
      },
      multiply: (a, b) => a * b,
      calculateTotal: (details) => {
        if (!details) return 0;
        return details.reduce((sum, item) => sum + (item.quantity * item.productPrice), 0);
      }
    }
  })
);

app.set("view engine", "hbs");
app.set("views", path.join(projectRoot, "views"));

// Middlewares de sesión y flash
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());

// Middleware para usuario
app.use((req, res, next) => {
  if (req.session?.user && req.session.isAuthenticated) {
    req.user = req.session.user;
  }
  next();
});

// Variables globales para las vistas
app.use((req, res, next) => {
  res.locals.user = req.user || false;
  res.locals.hasUser = !!req.user;
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  const errors = req.flash("error");
  res.locals.errors = errors;
  res.locals.hasErrors = errors.length > 0;
  res.locals.success = req.flash("success");
  res.locals.hasSuccess = res.locals.success.length > 0;
  next();
});

// Body parsers y archivos estáticos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(projectRoot, "public")));

// Rutas
app.use("/", authRoutes);
app.use("/client", clientRoutes);
app.use("/admin", adminRoutes);
app.use("/commerce", commerceRoutes);
app.use("/delivery", deliveryRoutes);

// Manejo de 404
app.use((req, res) => {
  const layout = (req.session.isAuthenticated && req.session.user) ? "main" : "authLayout";
  return res.status(404).render("errors/404", { "page-title": "Page Not Found", layout });
});

// Sincronización DB y servidor
try {
  const shouldForce = process.env.DB_FORCE === "true";
  const shouldAlter = process.env.DB_ALTER === "true";

  if (context.Sequelize) {
    if (shouldForce) {
      await context.Sequelize.sync({ force: true });
    } else {
      await context.Sequelize.sync({ alter: shouldAlter || false });
    }
  }

  app.listen(process.env.PORT, () => {
    console.log(`AppCenar running on port ${process.env.PORT}`);
  });
} catch (error) {
  console.error("Error connecting to the database:", error);
}
