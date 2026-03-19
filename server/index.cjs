const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET 环境变量未设置！');
  process.exit(1);
}

// ============================================
// PostgreSQL 数据库连接（Render 免费 PostgreSQL）
// ============================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Render 免费 PostgreSQL 需要此设置
  }
});

// 初始化数据库表
async function initDB() {
  try {
    // 用户表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 图库记录表（30张限制由应用层控制）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gallery (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        prompt TEXT,
        type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ PostgreSQL 数据库表初始化成功');
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err);
    process.exit(1);
  }
}

// ============================================
// API 平台配置（不含密钥）
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
// 用户注册 API（使用 PostgreSQL）
// ============================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    // 检查用户数量，第一个注册的是管理员
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const count = parseInt(countResult.rows[0].count);
    const role = count === 0 ? 'admin' : 'user';
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
      [email, hashedPassword, role]
    );
    
    const user = result.rows[0];
    
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
  } catch (error) {
    console.error('注册错误:', error);
    if (error.code === '23505') { // PostgreSQL 唯一约束违反
      return res.status(400).json({ error: '邮箱已注册' });
    }
    res.status(500).json({ error: '注册失败' });
  }
});

// ============================================
// 用户登录 API（使用 PostgreSQL）
// ============================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const user = result.rows[0];
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
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// ============================================
// 图库保存 API（30张限制 + PostgreSQL）
// ============================================
app.post('/api/gallery/save', authenticateToken, async (req, res) => {
  try {
    const { imageUrl, prompt, type } = req.body;
    const userId = req.user.userId;

    // 检查当前图库数量
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM gallery WHERE user_id = $1',
      [userId]
    );
    const count = parseInt(countResult.rows[0].count);

    // 如果超过30张，删除最老的记录
    if (count >= 30) {
      await pool.query(`
        DELETE FROM gallery 
        WHERE id = (
          SELECT id FROM gallery 
          WHERE user_id = $1 
          ORDER BY created_at ASC 
          LIMIT 1
        )
      `, [userId]);
    }

    // 插入新记录
    const result = await pool.query(
      'INSERT INTO gallery (user_id, image_url, prompt, type) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, imageUrl, prompt, type]
    );

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('保存图库失败:', error);
    res.status(500).json({ error: '保存失败' });
  }
});

// ============================================
// 获取图库 API（使用 PostgreSQL）
// ============================================
app.get('/api/gallery', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(
      'SELECT * FROM gallery WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
      [userId]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('获取图库失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// ============================================
// 动态代理（透传用户密钥）
// ============================================
app.use('/v1', (req, res, next) => {
  const provider = req.headers['x-provider'] || 'zhenzhen';
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
  
  const proxy = createProxyMiddleware({
    target: config.baseURL,
    changeOrigin: true,
    pathRewrite: { '^/v1': '/v1' },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('Authorization', authHeader);
      proxyReq.setHeader('Content-Type', 'application/json');
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

// 启动服务器（先初始化数据库）
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🐘 PostgreSQL 数据库已连接`);
    console.log(`📡 贞贞 AI: ${API_PROVIDERS.zhenzhen.baseURL}`);
    console.log(`📡 SillyDream: ${API_PROVIDERS.sillydream.baseURL}`);
  });
}).catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});