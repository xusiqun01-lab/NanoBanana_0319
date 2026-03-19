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
import { apiConfigService } from '@/services/apiConfig.service';

// ============================================
// Gemini API 客户端类
// ============================================
export class GeminiApiClient {
  private client: AxiosInstance;
  private provider: string;
  private apiKey: string;

  constructor(apiKey: string, provider: string = 'zhenzhen', baseUrl: string = '/v1') {
    this.provider = provider;
    this.apiKey = apiKey;
    
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Provider': provider,
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 300000,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Gemini API Error:', error.response?.data || error.message);
        throw this.handleError(error);
      }
    );
  }

  async generateTextToImage(params: TextToImageParams): Promise<ApiResponse<GeneratedImage>> {
    try {
      const dimensions = getResolutionDimensions(params.resolution, params.ratio);
      
      console.log(`[${this.provider}] Sending text-to-image request:`, {
        prompt: params.prompt.substring(0, 50) + '...',
        provider: this.provider,
      });

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

  async validateApiKey(): Promise<ApiResponse<boolean>> {
    try {
      await this.client.get('/models');
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: 'Invalid API key', data: false };
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 401:
          return new Error('API密钥无效或已过期，请检查设置中的API配置');
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

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================
// 创建图片生成客户端（工厂函数）
// ============================================
export function createGeminiClient(): GeminiApiClient {
  const activeConfig = apiConfigService.getActiveConfig('image');
  
  if (!activeConfig || !activeConfig.apiKey) {
    throw new Error('未配置API密钥，请先在"设置 > API配置"中添加您的API密钥');
  }
  
  const provider = activeConfig.providerId || 'zhenzhen';
  const apiKey = activeConfig.apiKey;
  
  console.log(`Creating Gemini client for provider: ${provider}, API Key: ${apiKey.substring(0, 10)}...`);
  
  return new GeminiApiClient(apiKey, provider, '/v1');
}

// ============================================
// 创建视频生成客户端（工厂函数）
// ============================================
export function createVideoClient(): GeminiApiClient {
  const activeConfig = apiConfigService.getActiveConfig('video');
  
  if (!activeConfig || !activeConfig.apiKey) {
    const imageConfig = apiConfigService.getActiveConfig('image');
    if (imageConfig?.apiKey) {
      console.log('Video: fallback to image config');
      return new GeminiApiClient(imageConfig.apiKey, imageConfig.providerId || 'zhenzhen', '/v1');
    }
    throw new Error('未配置视频生成API密钥，请先在"设置 > API配置"中添加');
  }
  
  const provider = activeConfig.providerId || 'zhenzhen';
  const apiKey = activeConfig.apiKey;
  
  console.log(`Creating Video client for provider: ${provider}`);
  
  return new GeminiApiClient(apiKey, provider, '/v1');
}