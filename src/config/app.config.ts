/**
 * AI创作工坊 - 软代码配置文件
 * 所有可配置项集中在此，方便后续修改调整
 */

import type { ApiProvider } from '@/types';

// ============================================
// 系统基础配置
// ============================================
export const SYSTEM_CONFIG = {
  // 网站基本信息
  siteName: '香蕉 AI',
  siteDescription: '专业图像生成',
  version: '1.0.0',
  
  // 管理员配置（全网只有一个管理员）
  admin: {
    email: 'admin@aistudio.com',
  },
  
  // 图库配置
  gallery: {
    maxHistoryImages: 30,
  },
  
  // 并发配置
  concurrency: {
    maxConcurrentTasks: 3,
    maxQueueSize: 10,
  }
};

// ============================================
// 图片生成配置
// ============================================
export const IMAGE_CONFIG = {
  // 分辨率配置（真实像素尺寸）
  resolutions: {
    '1K': { width: 1920, height: 1080, label: '1K (1920×1080)' },
    '2K': { width: 2560, height: 1440, label: '2K (2560×1440)' },
    '4K': { width: 3840, height: 2160, label: '4K (3840×2160)' },
  },
  
  // 比例配置
  ratios: {
    'original': { width: 1, height: 1, label: '原始比例' },
    '16:9': { width: 16, height: 9, label: '16:9 宽屏' },
    '3:2': { width: 3, height: 2, label: '3:2 相机' },
    '4:3': { width: 4, height: 3, label: '4:3 标准' },
    '1:1': { width: 1, height: 1, label: '1:1 正方形' },
    '3:4': { width: 3, height: 4, label: '3:4 竖版' },
    '2:3': { width: 2, height: 3, label: '2:3 竖相机' },
    '9:16': { width: 9, height: 16, label: '9:16 竖屏' },
  },
  
  // 图生图配置
  imageToImage: {
    maxReferenceImages: 4,
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 10 * 1024 * 1024,
  },
  
  // Gemini 3 Pro 模型配置
  model: {
    name: 'gemini-3-pro',
    version: 'latest',
    maxPromptLength: 4000,
  }
};

// ============================================
// 视频生成配置
// ============================================
export const VIDEO_CONFIG = {
  // 分辨率配置
  resolutions: {
    '720': { width: 1280, height: 720, label: '720P (1280×720)' },
    '1080': { width: 1920, height: 1080, label: '1080P (1920×1080)' },
  },
  
  // 比例配置
  ratios: {
    'original': { width: 1, height: 1, label: '原始比例' },
    '16:9': { width: 16, height: 9, label: '16:9 宽屏' },
    '3:2': { width: 3, height: 2, label: '3:2 相机' },
    '4:3': { width: 4, height: 3, label: '4:3 标准' },
    '1:1': { width: 1, height: 1, label: '1:1 正方形' },
    '3:4': { width: 3, height: 4, label: '3:4 竖版' },
    '2:3': { width: 2, height: 3, label: '2:3 竖相机' },
    '9:16': { width: 9, height: 16, label: '9:16 竖屏' },
  },
  
  // 上传配置
  upload: {
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 20 * 1024 * 1024,
  },
  
  // 视频时长配置
  duration: {
    min: 5,
    max: 30,
    default: 10,
  }
};

// ============================================
// API供应商配置（软代码，管理员可动态添加）
// ============================================
export const API_PROVIDERS: { imageProviders: ApiProvider[]; videoProviders: ApiProvider[] } = {
  // 图片生成API供应商
  imageProviders: [
    {
      id: 'zhenzhen',
      name: '贞贞的AI工坊',
      type: 'image',
      baseUrl: 'https://ai.t8star.cn/v1',
      tokenUrl: 'https://ai.t8star.cn/token',
      defaultKey: '',
      enabled: true,
      supportsGemini3Pro: true,
    },
    {
      id: 'sillydream',
      name: 'SillyDream',
      type: 'image',
      baseUrl: 'https://wish.sillydream.top/v1',
      tokenUrl: 'https://wish.sillydream.top/console/token',
      defaultKey: '',
      enabled: true,
      supportsGemini3Pro: true,
    },
  ],
  
  // 视频生成API供应商
  videoProviders: [
    {
      id: 'jimeng',
      name: '即梦',
      type: 'video',
      baseUrl: 'https://api.volcengine.com/jimeng',
      consoleUrl: 'https://console.volcengine.com/auth/login?redirectURI=%2Fai%2Fability%2Fdetail%2F10%3F_vtm_%3D0.0.c854860.d562002.0',
      defaultKey: '',
      enabled: true,
    },
    {
      id: 'kling',
      name: '可灵',
      type: 'video',
      baseUrl: 'https://api.klingai.com/v1',
      consoleUrl: 'https://klingai.com/cn/dev',
      defaultKey: '',
      enabled: true,
    },
  ],
};

// ============================================
// UI主题配置 - 参考图配色
// ============================================
export const THEME_CONFIG = {
  // 配色方案（参考图金黄色）
  colors: {
    // 主色 - 金黄色
    primary: '#F5A623',
    primaryDark: '#D48A0F',
    primaryLight: '#FFB84D',
    
    // 背景色
    bgPrimary: '#050505',
    bgSecondary: '#0a0a0a',
    bgCard: '#111111',
    bgHover: '#1a1a1a',
    
    // 文字色
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    textMuted: '#666666',
    
    // 边框色
    border: '#1f1f1f',
    borderHover: '#2a2a2a',
    
    // 功能色
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // Logo配置
  logo: {
    emoji: '🍌',
    text: '香蕉 AI',
  },
  
  // 圆角配置
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  
  // 阴影配置
  shadows: {
    sm: '0 2px 8px rgba(0,0,0,0.3)',
    md: '0 4px 16px rgba(0,0,0,0.4)',
    lg: '0 8px 32px rgba(0,0,0,0.5)',
    glow: '0 0 30px rgba(245, 166, 35, 0.3)',
  }
};

// ============================================
// 功能开关配置
// ============================================
export const FEATURE_FLAGS = {
  enableTextToImage: true,
  enableImageToImage: true,
  enableMultiImage: true,
  enableVideoGeneration: true,
  enableUserRegistration: true,
  enableGallery: true,
  enableApiManagement: true,
  enableSystemLogs: true,
  enableConcurrentTasks: true,
};

// ============================================
// 本地存储键名配置
// ============================================
export const STORAGE_KEYS = {
  user: 'ai_studio_user',
  token: 'ai_studio_token',
  apiConfigs: 'ai_studio_api_configs',
  gallery: 'ai_studio_gallery',
  logs: 'ai_studio_logs',
  settings: 'ai_studio_settings',
  adminConfig: 'ai_studio_admin_config',
};

// ============================================
// 辅助函数：获取计算后的分辨率尺寸
// ============================================
export function getResolutionDimensions(
  resolution: '1K' | '2K' | '4K',
  ratio: string
): { width: number; height: number } {
  const res = IMAGE_CONFIG.resolutions[resolution];
  
  // 原始比例直接使用分辨率尺寸
  if (ratio === 'original') {
    return { width: res.width, height: res.height };
  }
  
  const rat = IMAGE_CONFIG.ratios[ratio as keyof typeof IMAGE_CONFIG.ratios];
  
  if (!rat || ratio === 'original') {
    return { width: res.width, height: res.height };
  }
  
  // 根据比例调整尺寸
  const targetRatio = rat.width / rat.height;
  const totalPixels = res.width * res.height;
  
  let height = Math.sqrt(totalPixels / targetRatio);
  let width = height * targetRatio;
  
  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

// ============================================
// 辅助函数：获取视频分辨率尺寸
// ============================================
export function getVideoResolutionDimensions(
  resolution: '720' | '1080',
  ratio: string
): { width: number; height: number } {
  const res = VIDEO_CONFIG.resolutions[resolution];
  
  // 原始比例直接使用分辨率尺寸
  if (ratio === 'original') {
    return { width: res.width, height: res.height };
  }
  
  const rat = VIDEO_CONFIG.ratios[ratio as keyof typeof VIDEO_CONFIG.ratios];
  
  if (!rat) {
    return { width: res.width, height: res.height };
  }
  
  const targetRatio = rat.width / rat.height;
  const totalPixels = res.width * res.height;
  
  let height = Math.sqrt(totalPixels / targetRatio);
  let width = height * targetRatio;
  
  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}
