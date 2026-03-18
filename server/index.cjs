const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// API Key（优先从环境变量读取，否则使用默认值）
const API_KEY = process.env.API_KEY || 'sk-JgRCJUhqOQGWZFqwmy0yKtrLCzndPdOuXvg7dYJaQe9Zqb7B';

// 上游API地址（注意：不要有多余空格！）
const TARGET_API = 'https://api.zhenzhen.work';

// 全局CORS中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析JSON请求体
app.use(express.json());

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
    console.log(`[Proxy Response] ${proxyRes.statusCode} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// 使用代理中间件 - 关键：使用 app.use 而不是 app.all
app.use('/v1', apiProxy);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 生产环境静态文件服务
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // 所有其他路由返回index.html（支持前端路由）
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Proxy target: ${TARGET_API}`);
  console.log(`🔑 API Key configured: ${API_KEY.substring(0, 10)}...`);
});