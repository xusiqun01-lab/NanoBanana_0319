# 🍌 AI创作工坊

基于 Gemini 3 Pro 的智能创作平台，支持文生图、图生图和视频生成功能。

## 功能特性

### 创作模块
- **文生图**：根据文本提示词生成高清图片
  - 支持 1K (1920×1080)、2K (2560×1440)、4K (3840×2160) 真实分辨率
  - 支持 16:9、9:16、4:3、3:4 等多种画面比例
  
- **图生图**：上传最多4张参考图，结合文本生成新图片
  - 同样支持 1K/2K/4K 分辨率和多种比例
  - 可调节参考图影响强度

- **视频生成**：上传参考图片，结合文本描述生成视频
  - 支持 720P 和 1080P 分辨率
  - 支持多种画面比例
  - 可设置视频时长 (5-30秒)

### 管理模块
- **用户管理**：支持管理员和普通用户两种角色
- **API配置**：管理员预设API供应商，用户选择配置
  - 图片生成：贞贞的AI工坊、SillyDream
  - 视频生成：即梦、可灵
- **图库管理**：自动保存历史作品，最多30张
- **系统日志**：管理员可查看系统运行日志

### 技术特性
- **多任务并发**：支持同时运行多个生成任务
- **软代码架构**：所有配置集中管理，便于调整
- **响应式设计**：适配桌面和移动设备

## 技术栈

- React 18 + TypeScript
- Vite 构建工具
- Tailwind CSS + shadcn/ui
- 本地存储 (localStorage)

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 部署指南

### 部署到 Render

1. 将代码推送到 GitHub 仓库
2. 在 Render 创建新的 Static Site
3. 连接 GitHub 仓库
4. 构建设置：
   - Build Command: `npm run build`
   - Publish Directory: `dist`
5. 点击部署

### 默认账号

- 管理员账号：`admin@aistudio.com`
- 管理员密码：`admin123`

## 配置文件

主要配置位于 `src/config/app.config.ts`：

```typescript
// 系统基础配置
export const SYSTEM_CONFIG = { ... };

// 图片生成配置
export const IMAGE_CONFIG = { ... };

// 视频生成配置
export const VIDEO_CONFIG = { ... };

// API供应商配置
export const API_PROVIDERS = { ... };

// UI主题配置
export const THEME_CONFIG = { ... };
```

## API供应商

### 图片生成
1. **贞贞的AI工坊**
   - 网址：https://ai.t8star.cn/token
   - 支持 Gemini 3 Pro

2. **SillyDream**
   - 网址：https://wish.sillydream.top/console/token
   - 支持 Gemini 3 Pro

### 视频生成
1. **即梦**
   - 网址：https://console.volcengine.com

2. **可灵**
   - 网址：https://klingai.com/cn/dev

## 注意事项

1. 首次使用需要在 API配置 页面添加您的 API Key
2. 图片下载不会跳转页面，直接在原页面下载
3. 图库最多保存30张历史图片，超过会自动删除最老的
4. 每个用户最多同时运行3个任务

## 许可证

MIT License
