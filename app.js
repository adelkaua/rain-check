// app.js - entry point: configures Express, middleware, routes and error handling
require('dotenv').config(); // load PORT etc. from .env

const path = require('path');
const express = require('express');

const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine: EJS templates live in /views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Variables available in every EJS template
app.locals.siteName = 'Rain Check';

// ---- Middleware (order matters!) ----
app.use(requestLogger);                              // custom middleware: logs every request
app.use(express.static(path.join(__dirname, 'public'))); // built-in: css, images
app.use(express.urlencoded({ extended: false }));    // built-in: parses HTML form data
app.use(express.json());                             // built-in: parses JSON bodies

// ---- Routes ----
app.use('/', routes);

// ---- 404 and centralized error handler (must be LAST) ----
app.use(notFound);
app.use(errorHandler);

// Safety net: the server must never crash because of a failed promise
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

app.listen(PORT, () => {
  console.log(`Rain Check is running at http://localhost:${PORT}`);
});
