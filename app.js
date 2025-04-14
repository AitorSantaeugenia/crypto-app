// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require('dotenv/config');

// ℹ️ Connects to the database
require('./db');

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require('express');
const session = require('express-session');

// Handles the handlebars
// https://www.npmjs.com/package/hbs
const hbs = require('hbs');
const path = require('path');

const app = express();

// Configura session ANTES de usarlo
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'super hyper secret key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

// ℹ️ This function is getting exported from the config folder. It runs most middlewares
require('./config')(app);

// Configure Handlebars partials directory
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Register Handlebars helpers
hbs.registerHelper('eq', function (a, b) {
    return a === b;
});

// Después de la configuración de handlebars
hbs.handlebars.registerHelper('isPositive', function(num) {
    return parseFloat(num) >= 0;
});

// Añade este helper junto a los otros
hbs.handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context, null, 2);
});

// Helpers para formatear números
hbs.handlebars.registerHelper('formatNumber', function(number) {
    return new Intl.NumberFormat('en-US').format(number);
});

hbs.handlebars.registerHelper('formatCurrency', function(number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
});

hbs.handlebars.registerHelper('formatVolume', function(number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        compactDisplay: 'short'
    }).format(number);
});

hbs.handlebars.registerHelper('formatDate', function(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

// default value for title local
const projectName = 'CryptoFolio';
const capitalized = (string) => string[0].toUpperCase() + string.slice(1).toLowerCase();

app.locals.title = `${capitalized(projectName)}`;

// Añadir method-override ANTES de las rutas
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// 👇 Start handling routes here
const index = require('./routes/index');
app.use('/', index);

//------------------------------------------------------------
const signup = require('./routes/signup.route');
app.use('/', signup);

//cryptocurrency routes
const cryptoRoutes = require('./routes/cryptocurrency.route');
app.use('/cryptocurrency', cryptoRoutes);

//graphsjs routes
const graphs = require('./routes/graphs.route');
app.use('/', graphs);

//user routes
const dashboardRoutes = require('./routes/dashboard.route');
app.use('/dashboard', dashboardRoutes);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require('./error-handling')(app);

module.exports = app;
