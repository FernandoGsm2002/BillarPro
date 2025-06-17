const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      pathRewrite: {
        // NO reescribir las rutas - mantener /api
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxy request:', req.method, req.originalUrl, '-> http://localhost:5000' + req.originalUrl);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err.message);
      }
    })
  );
}; 