// Custom middleware #1: logs method, URL, status code and duration of each request
module.exports = function requestLogger(req, res, next) {
  const start = Date.now();
  // 'finish' fires when the response has been sent, so we know the status code
  res.on('finish', () => {
    const time = new Date().toISOString();
    console.log(`[${time}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start} ms)`);
  });
  next();
};
