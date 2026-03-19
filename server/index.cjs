const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// 两个 API 平台的配置
// ============================================

// 平台1：贞贞的 AI 工坊
const ZHENZHEN_CONFIG = {
  baseURL: 'https://ai.t8star.cn',
  key: process.env.ZHENZHEN_API_KEY || 'sk-JgRCJUhqOQGWZFqwmy0yKtrLCzndPdOuXvg7dYJaQe9Zqb7B',
  name: '贞贞的AI工坊'
};

// 平台2：SillyDream（海外用户推荐路线）
const SILLYDREAM_CONFIG = {
  baseURL: 'https://gossamer.sillydream.top',
  key: process.env.SILLYDREAM_API_KEY || 'sk-FVio...你的完整Key...',
  name: 'SillyDream'
};

// 全局 CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Provider']
}));

// ============================================
// 动态代理 - 根据请求参数选择平台
// ============================================
app.use('/v1', (req, res, next) => {
  // 从请求头或查询参数获取选择的平台
  // 前端可以通过 header: 'X-Provider: sillydream' 传递
  const provider = req.headers['x-provider'] || req.query.provider || 'zhenzhen';
  
  let config;
  if (provider === 'sillydream') {
    config = SILLYDREAM_CONFIG;
  } else {
    config = ZHENZHEN_CONFIG;
  }
  
  console.log(`[${config.name}] ${req.method} ${req.url}`);
  
  const proxy = createProxyMiddleware({
    target: config.baseURL,
    changeOrigin: true,
    pathRewrite: { '^/v1': '/v1' },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('Authorization', `Bearer ${config.key}`);
      proxyReq.setHeader('Content-Type', 'application/json');
    },
    onError: (err, req, res) => {
      console.error(`[${config.name} Error]`, err.message);
      res.status(500).json({ error: 'Proxy error', provider: config.name, message: err.message });
    }
  });
  
  proxy(req, res, next);
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    providers: ['zhenzhen', 'sillydream']
  });
});

// 生产环境静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 贞贞 AI: ${ZHENZHEN_CONFIG.baseURL}`);
  console.log(`📡 SillyDream: ${SILLYDREAM_CONFIG.baseURL}`);
});