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
  ApiResponse 
} from '@/types';
import { getResolutionDimensions } from '@/config/app.config';
import { apiConfigService } from '@/services/apiConfig.service'; // 引入配置服务

// ============================================
// Gemini API 客户端类
// ============================================
export class GeminiApiClient {
  private client: AxiosInstance;
  private provider: string;

  constructor(_apiKey: string, provider: string = 'zhenzhen', baseUrl: string = '/v1') {
    this.provider = provider;
    
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Provider': provider, // ← 关键：传递选择的平台给后端
      },
      timeout: 300000,
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
      
      console.log(`[${this.provider}] Sending text-to-image request:`, {
        prompt: params.prompt.substring(0, 50) + '...',
        provider: this.provider,
      });

      // 调用 Gemini 3 Pro API
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
      
      const requestBody: any = {
        model: 'gemini-3-pro',
        prompt: params.prompt,
        size: `${dimensions.width}x${dimensions.height}`,
        n: 1,
        response_format: 'url',
        quality: params.resolution === '4K' ? 'hd' : 'standard',
      };

      if (params.referenceImages && params.referenceImages.length > 0) {
        requestBody.images = params.referenceImages;
        requestBody.strength = params.strength || 0.7;
      }

      console.log(`[${this.provider}] Sending image-to-image request`);

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
  // 验证API密钥
  // ============================================
  async validateApiKey(): Promise<ApiResponse<boolean>> {
    try {
      await this.client.get('/models');
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: 'Invalid API key', data: false };
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
          return new Error('API密钥无效或已过期');
        case 429:
          return new Error('请求过于频繁');
        case 504:
          return new Error('API服务器连接超时，请检查网络或切换API供应商');
        default:
          return new Error(data?.error?.message || `请求失败 (${status})`);
      }
    }
    
    if (error.code === 'ECONNABORTED') {
      return new Error('请求超时');
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
// 创建客户端实例的工厂函数（关键修复）
// ============================================
export function createGeminiClient(): GeminiApiClient {
  // 从配置服务获取当前激活的配置
  const activeConfig = apiConfigService.getActiveConfig('image');
  
  // 如果有激活配置，使用对应的provider，否则默认贞贞
  const provider = activeConfig?.providerId || 'zhenzhen';
  const apiKey = activeConfig?.apiKey || '';
  
  console.log(`Creating Gemini client for provider: ${provider}`);
  
  return new GeminiApiClient(apiKey, provider, '/v1');
}