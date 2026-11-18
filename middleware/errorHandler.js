// 404 handler and centralized error-handling middleware

// Runs when no route matched
function notFound(req, res) {
  res.status(404).render('404', { title: 'Page not found', url: req.originalUrl });
}

// Express recognizes error middleware by its 4 arguments (err, req, res, next)
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Technical details go to the console only, never to the user
  console.error('[ERROR]', err.stack || err);

  if (res.headersSent) return next(err);

  const status = err.statusCode || 500;
  // Only our own ApiError messages are safe/friendly to show
  const message = err.name === 'ApiError'
    ? err.message
    : 'Something went wrong on our side. Please try again later.';

  res.status(status).render('error', { title: 'Error', status, message });
}

module.exports = { notFound, errorHandler };
