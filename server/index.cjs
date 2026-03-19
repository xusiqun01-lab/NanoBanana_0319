const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET 环境变量未设置！');
  process.exit(1);
}

// ============================================
// 数据库初始化
// ============================================
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // 图库记录表（30张限制）
  db.run(`CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    prompt TEXT,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
});

// ============================================
// 两个 API 平台的配置（仅 baseURL，不含密钥）
// ============================================
const API_PROVIDERS = {
  zhenzhen: {
    baseURL: 'https://ai.t8star.cn',
    name: '贞贞的AI工坊'
  },
  sillydream: {
    baseURL: 'https://gossamer.sillydream.top',
    name: 'SillyDream'
  }
};

// 全局 CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Provider']
}));

app.use(express.json());

// ============================================
// JWT 验证中间件
// ============================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供访问令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
};

// ============================================
// 用户注册 API
// ============================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    // 检查用户数量，第一个注册的是管理员
    const count = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    const role = count === 0 ? 'admin' : 'user';
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, role],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: '邮箱已注册' });
          }
          throw err;
        }
        
        const token = jwt.sign(
          { userId: this.lastID, email, role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        res.json({
          success: true,
          token,
          user: { id: this.lastID, email, role }
        });
      }
    );
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// ============================================
// 用户登录 API
// ============================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: '服务器错误' });
      }
      
      if (!user) {
        return res.status(401).json({ error: '邮箱或密码错误' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: '邮箱或密码错误' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: { id: user.id, email: user.email, role: user.role }
      });
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// ============================================
// 图库保存 API（30张限制）
// ============================================
app.post('/api/gallery/save', authenticateToken, (req, res) => {
  const { imageUrl, prompt, type } = req.body;
  const userId = req.user.userId;

  // 先删除该用户最老的记录（如果超过30张）
  db.run(
    `DELETE FROM gallery WHERE id IN (
      SELECT id FROM gallery 
      WHERE user_id = ? 
      ORDER BY created_at ASC 
      LIMIT (SELECT MAX(0, COUNT(*) - 29) FROM gallery WHERE user_id = ?)
    )`,
    [userId, userId],
    (err) => {
      if (err) {
        console.error('清理图库失败:', err);
      }
      
      // 插入新记录
      db.run(
        'INSERT INTO gallery (user_id, image_url, prompt, type) VALUES (?, ?, ?, ?)',
        [userId, imageUrl, prompt, type],
        function(err) {
          if (err) {
            return res.status(500).json({ error: '保存失败' });
          }
          res.json({ success: true, id: this.lastID });
        }
      );
    }
  );
});

// ============================================
// 获取图库 API
// ============================================
app.get('/api/gallery', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.all(
    'SELECT * FROM gallery WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: '获取失败' });
      }
      res.json({ success: true, data: rows });
    }
  );
});

// ============================================
// 动态代理 - 透传用户密钥（关键修复）
// ============================================
app.use('/v1', (req, res, next) => {
  // 从请求头获取平台选择
  const provider = req.headers['x-provider'] || 'zhenzhen';
  
  // 从请求头获取用户的 API Key（关键！）
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: '未提供 API Key，请先在设置中配置您的 API 密钥' 
    });
  }

  const config = API_PROVIDERS[provider];
  if (!config) {
    return res.status(400).json({ error: '无效的 API 供应商' });
  }
  
  console.log(`[${config.name}] ${req.method} ${req.url}`);
  console.log(`[Auth] 使用用户提供的 API Key: ${authHeader.substring(0, 20)}...`);
  
  const proxy = createProxyMiddleware({
    target: config.baseURL,
    changeOrigin: true,
    pathRewrite: { '^/v1': '/v1' },
    onProxyReq: (proxyReq, req, res) => {
      // ✅ 关键修复：透传用户的 Authorization，不使用服务器硬编码密钥
      proxyReq.setHeader('Authorization', authHeader);
      proxyReq.setHeader('Content-Type', 'application/json');
      
      // 如果用户传了 X-Provider，也透传
      if (req.headers['x-provider']) {
        proxyReq.setHeader('X-Provider', req.headers['x-provider']);
      }
    },
    onError: (err, req, res) => {
      console.error(`[${config.name} Error]`, err.message);
      res.status(500).json({ 
        error: 'Proxy error', 
        provider: config.name, 
        message: err.message 
      });
    }
  });
  
  proxy(req, res, next);
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    providers: Object.keys(API_PROVIDERS)
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
  console.log(`📡 贞贞 AI: ${API_PROVIDERS.zhenzhen.baseURL}`);
  console.log(`📡 SillyDream: ${API_PROVIDERS.sillydream.baseURL}`);
  console.log(`⚠️  注意：服务器不再使用硬编码 API Key，每个用户必须使用自己的密钥`);
});