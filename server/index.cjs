const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// API Key
const API_KEY = 'sk-JgRCJUhqOQGWZFqwmy0yKtrLCzndPdOuXvg7dYJaQe9Zqb7B';

// 上游API地址
const TARGET_API = 'https://api.zhenzhen.work';

// 创建代理中间件
const apiProxy = createProxyMiddleware({
  target: TARGET_API,
  changeOrigin: true,
  pathRewrite: {
    '^/v1': '/v1'
  },
  onProxyReq: (proxyReq, req, res) => {
    // 注入API Key
    proxyReq.setHeader('Authorization', `Bearer ${API_KEY}`);
    proxyReq.setHeader('Content-Type', 'application/json');
    
    console.log(`[Proxy] ${req.method} ${req.url} -> ${TARGET_API}${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // 添加CORS头
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    
    console.log(`[Proxy Response] ${proxyRes.statusCode} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// 使用代理中间件 - 必须使用 app.use 而不是 app.all
app.use('/v1', apiProxy);

// 处理OPTIONS预检请求
app.options('/v1/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

// 静态文件服务（生产环境）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // 所有其他路由返回index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Proxy target: ${TARGET_API}`);
  console.log(`🔑 API Key configured: ${API_KEY.substring(0, 10)}...`);
});
