/**
 * 类型定义文件
 */

// ============================================
// 用户相关类型
// ============================================
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

// ============================================
// API配置相关类型
// ============================================
export interface ApiProvider {
  id: string;
  name: string;
  type: 'image' | 'video';
  baseUrl: string;
  tokenUrl?: string;
  consoleUrl?: string;
  defaultKey?: string;
  enabled: boolean;
  supportsGemini3Pro?: boolean;
}

export interface UserApiConfig {
  id: string;
  providerId: string;
  name: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
}

// ============================================
// 图片生成相关类型
// ============================================
export type ImageResolution = '1K' | '2K' | '4K';
export type ImageRatio = 'original' | '16:9' | '3:2' | '4:3' | '1:1' | '3:4' | '2:3' | '9:16';

export interface TextToImageParams {
  prompt: string;
  negativePrompt?: string;
  resolution: ImageResolution;
  ratio: ImageRatio;
  apiConfigId: string;
}

export interface ImageToImageParams {
  prompt: string;
  negativePrompt?: string;
  resolution: ImageResolution;
  ratio: ImageRatio;
  referenceImages: string[]; // base64编码的图片数组
  apiConfigId: string;
  strength?: number; // 参考图影响强度 0-1
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  resolution: ImageResolution;
  ratio: ImageRatio;
  width: number;
  height: number;
  createdAt: string;
  type: 'text-to-image' | 'image-to-image';
}

// ============================================
// 视频生成相关类型
// ============================================
export type VideoResolution = '720' | '1080';
export type VideoRatio = 'original' | '16:9' | '3:2' | '4:3' | '1:1' | '3:4' | '2:3' | '9:16';

export interface VideoGenerationParams {
  prompt: string;
  referenceImage: string; // base64编码的图片
  resolution: VideoResolution;
  ratio: VideoRatio;
  duration: number; // 秒
  apiConfigId: string;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  resolution: VideoResolution;
  ratio: VideoRatio;
  duration: number;
  width: number;
  height: number;
  createdAt: string;
  status: 'generating' | 'completed' | 'failed';
}

// ============================================
// 任务相关类型
// ============================================
export type TaskType = 'text-to-image' | 'image-to-image' | 'video-generation';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  params: TextToImageParams | ImageToImageParams | VideoGenerationParams;
  result?: GeneratedImage | GeneratedVideo;
  error?: string;
  progress: number; // 0-100
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  userId: string;
}

// ============================================
// 图库相关类型
// ============================================
export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  width: number;
  height: number;
  createdAt: string;
  metadata?: Record<string, any>;
}

// ============================================
// 系统日志相关类型
// ============================================
export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

export interface SystemLog {
  id: string;
  level: LogLevel;
  message: string;
  details?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  module: string;
}

// ============================================
// 组件Props类型
// ============================================
export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  path: string;
  roles: ('admin' | 'user')[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// ============================================
// API响应类型
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Gemini API 特定类型
export interface GeminiImageRequest {
  prompt: string;
  width: number;
  height: number;
  seed?: number;
  referenceImages?: string[];
  strength?: number;
}

export interface GeminiImageResponse {
  imageUrl: string;
  width: number;
  height: number;
  seed: number;
}
