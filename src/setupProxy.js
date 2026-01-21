// setupProxy.js só funciona em desenvolvimento (react-scripts)
// Em produção no Vercel, use a variável de ambiente REACT_APP_API_URL
// Este arquivo não é executado durante o build, apenas no servidor de desenvolvimento
module.exports = function(app) {
  // Só configurar proxy em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    try {
      const { createProxyMiddleware } = require('http-proxy-middleware');
      
      app.use(
        '/api',
        createProxyMiddleware({
          target: process.env.REACT_APP_PROXY_TARGET || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          logLevel: 'error',
        })
      );
    } catch (error) {
      // Ignorar erros se http-proxy-middleware não estiver disponível
      console.warn('Proxy middleware não disponível:', error.message);
    }
  }
};

