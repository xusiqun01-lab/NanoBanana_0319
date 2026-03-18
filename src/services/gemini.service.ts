/**
 * Gemini 3 Pro API 服务
 * 处理图片生成相关的API调用
 * 注意：所有API请求通过相对路径，由后端代理转发
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { 
  TextToImageParams, 
  ImageToImageParams, 
  GeneratedImage,
  GeminiImageRequest,
  ApiResponse 
} from '@/types';
import { getResolutionDimensions } from '@/config/app.config';

// ============================================
// Gemini API 客户端类
// ============================================
export class GeminiApiClient {
  private client: AxiosInstance;

  constructor(_apiKey: string, baseUrl: string = '/v1') {
    this.client = axios.create({
      baseURL: baseUrl, // 使用相对路径，由后端代理转发
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 300000, // 5分钟超时（生图可能需要较长时间）
    });

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Gemini API Error:', error.response?.data || error.message);
        throw this.handleError(error);
      }
    );
  }

  // ============================================
  // 文生图
  // ============================================
  async generateTextToImage(params: TextToImageParams): Promise<ApiResponse<GeneratedImage>> {
    try {
      const dimensions = getResolutionDimensions(params.resolution, params.ratio);
      
      const requestBody: GeminiImageRequest = {
        prompt: params.prompt,
        width: dimensions.width,
        height: dimensions.height,
        seed: Math.floor(Math.random() * 1000000),
      };

      console.log('Sending text-to-image request:', {
        ...requestBody,
        prompt: requestBody.prompt.substring(0, 50) + '...',
      });

      // 调用 Gemini 3 Pro API - 使用相对路径
      const response = await this.client.post('/images/generations', {
        model: 'gemini-3-pro',
        prompt: params.prompt,
        size: `${dimensions.width}x${dimensions.height}`,
        n: 1,
        response_format: 'url',
        quality: params.resolution === '4K' ? 'hd' : 'standard',
      });

      const result = response.data;
      
      if (result.data && result.data[0]) {
        const imageData = result.data[0];
        
        return {
          success: true,
          data: {
            id: this.generateId(),
            url: imageData.url,
            prompt: params.prompt,
            resolution: params.resolution,
            ratio: params.ratio,
            width: dimensions.width,
            height: dimensions.height,
            createdAt: new Date().toISOString(),
            type: 'text-to-image',
          },
        };
      }

      throw new Error('Invalid response format from API');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================
  // 图生图
  // ============================================
  async generateImageToImage(params: ImageToImageParams): Promise<ApiResponse<GeneratedImage>> {
    try {
      const dimensions = getResolutionDimensions(params.resolution, params.ratio);
      
      // 构建请求体
      const requestBody: any = {
        model: 'gemini-3-pro',
        prompt: params.prompt,
        size: `${dimensions.width}x${dimensions.height}`,
        n: 1,
        response_format: 'url',
        quality: params.resolution === '4K' ? 'hd' : 'standard',
      };

      // 如果有参考图片，添加到请求中
      if (params.referenceImages && params.referenceImages.length > 0) {
        requestBody.images = params.referenceImages;
        requestBody.strength = params.strength || 0.7;
      }

      console.log('Sending image-to-image request:', {
        ...requestBody,
        prompt: requestBody.prompt.substring(0, 50) + '...',
        images: requestBody.images ? `${requestBody.images.length} images` : 'none',
      });

      const response = await this.client.post('/images/edits', requestBody);

      const result = response.data;
      
      if (result.data && result.data[0]) {
        const imageData = result.data[0];
        
        return {
          success: true,
          data: {
            id: this.generateId(),
            url: imageData.url,
            prompt: params.prompt,
            resolution: params.resolution,
            ratio: params.ratio,
            width: dimensions.width,
            height: dimensions.height,
            createdAt: new Date().toISOString(),
            type: 'image-to-image',
          },
        };
      }

      throw new Error('Invalid response format from API');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================
  // 验证API密钥是否有效
  // ============================================
  async validateApiKey(): Promise<ApiResponse<boolean>> {
    try {
      // 发送一个简单的请求来验证API密钥
      await this.client.get('/models');
      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid API key',
        data: false,
      };
    }
  }

  // ============================================
  // 错误处理
  // ============================================
  private handleError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 401:
          return new Error('API密钥无效或已过期，请检查您的API配置');
        case 429:
          return new Error('请求过于频繁，请稍后再试');
        case 500:
          return new Error('服务器错误，请稍后再试');
        default:
          return new Error(data?.error?.message || `请求失败 (${status})`);
      }
    }
    
    if (error.code === 'ECONNABORTED') {
      return new Error('请求超时，请检查网络连接或稍后重试');
    }
    
    return new Error(error.message || '网络错误');
  }

  // ============================================
  // 生成唯一ID
  // ============================================
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================
// 视频生成服务（即梦/可灵）
// ============================================
export class VideoApiClient {
  private client: AxiosInstance;
  private provider: 'jimeng' | 'kling';

  constructor(_apiKey: string, provider: 'jimeng' | 'kling', baseUrl?: string) {
    this.provider = provider;
    
    // 使用相对路径，由后端代理转发
    const finalBaseUrl = baseUrl || '/v1';

    this.client = axios.create({
      baseURL: finalBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 300000,
    });
  }

  async generateVideo(params: {
    prompt: string;
    referenceImage: string;
    width: number;
    height: number;
    duration: number;
  }): Promise<ApiResponse<any>> {
    try {
      const endpoint = this.provider === 'jimeng' 
        ? '/videos/generations' 
        : '/videos';

      const response = await this.client.post(endpoint, {
        prompt: params.prompt,
        image: params.referenceImage,
        width: params.width,
        height: params.height,
        duration: params.duration,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// ============================================
// 创建客户端实例的工厂函数
// ============================================
export function createGeminiClient(apiKey: string, baseUrl?: string): GeminiApiClient {
  return new GeminiApiClient(apiKey, baseUrl);
}

export function createVideoClient(
  apiKey: string, 
  provider: 'jimeng' | 'kling',
  baseUrl?: string
): VideoApiClient {
  return new VideoApiClient(apiKey, provider, baseUrl);
}
