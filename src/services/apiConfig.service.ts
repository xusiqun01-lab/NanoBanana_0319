/**
 * API配置管理服务
 * 管理用户的API密钥配置
 */

import type { UserApiConfig, ApiProvider, ApiResponse } from '@/types';
import { API_PROVIDERS, STORAGE_KEYS } from '@/config/app.config';
import { authService } from './auth.service';

// ============================================
// API配置服务类
// ============================================
export class ApiConfigService {
  
  // ============================================
  // 获取所有可用的API供应商（管理员预设）
  // ============================================
  getAvailableProviders(type?: 'image' | 'video'): ApiProvider[] {
    const providers = [
      ...API_PROVIDERS.imageProviders,
      ...API_PROVIDERS.videoProviders,
    ];

    if (type) {
      return providers.filter(p => p.type === type && p.enabled);
    }

    return providers.filter(p => p.enabled);
  }

  // ============================================
  // 获取图片生成API供应商
  // ============================================
  getImageProviders(): ApiProvider[] {
    return API_PROVIDERS.imageProviders.filter(p => p.enabled);
  }

  // ============================================
  // 获取视频生成API供应商
  // ============================================
  getVideoProviders(): ApiProvider[] {
    return API_PROVIDERS.videoProviders.filter(p => p.enabled);
  }

  // ============================================
  // 获取当前用户的API配置
  // ============================================
  getUserConfigs(): UserApiConfig[] {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return [];
    }

    const allConfigs = this.getAllConfigs();
    return allConfigs[currentUser.id] || [];
  }

  // ============================================
  // 获取当前激活的API配置
  // ============================================
  getActiveConfig(type: 'image' | 'video'): UserApiConfig | null {
    const configs = this.getUserConfigs();
    const activeConfig = configs.find(c => {
      const provider = this.getProviderById(c.providerId);
      return c.isActive && provider?.type === type;
    });
    return activeConfig || null;
  }

  // ============================================
  // 添加API配置
  // ============================================
  async addConfig(config: Omit<UserApiConfig, 'id' | 'createdAt'>): Promise<ApiResponse<UserApiConfig>> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: '用户未登录',
        };
      }

      // 验证provider是否存在
      const provider = this.getProviderById(config.providerId);
      if (!provider) {
        return {
          success: false,
          error: '无效的API供应商',
        };
      }

      // 普通用户只能从预设列表中选择
      if (currentUser.role === 'user') {
        const availableProviders = this.getAvailableProviders();
        if (!availableProviders.find(p => p.id === config.providerId)) {
          return {
            success: false,
            error: '无权使用该API供应商',
          };
        }
      }

      const newConfig: UserApiConfig = {
        ...config,
        id: `config-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      const allConfigs = this.getAllConfigs();
      const userConfigs = allConfigs[currentUser.id] || [];

      // 如果设置为激活，取消其他同类型配置的激活状态
      if (newConfig.isActive) {
        userConfigs.forEach(c => {
          const p = this.getProviderById(c.providerId);
          if (p?.type === provider.type) {
            c.isActive = false;
          }
        });
      }

      userConfigs.push(newConfig);
      allConfigs[currentUser.id] = userConfigs;
      this.saveAllConfigs(allConfigs);

      this.logActivity('add_api_config', `添加API配置: ${newConfig.name}`);

      return {
        success: true,
        data: newConfig,
        message: 'API配置添加成功',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '添加失败',
      };
    }
  }

  // ============================================
  // 更新API配置
  // ============================================
  async updateConfig(configId: string, updates: Partial<UserApiConfig>): Promise<ApiResponse<UserApiConfig>> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: '用户未登录',
        };
      }

      const allConfigs = this.getAllConfigs();
      const userConfigs = allConfigs[currentUser.id] || [];
      const configIndex = userConfigs.findIndex(c => c.id === configId);

      if (configIndex === -1) {
        return {
          success: false,
          error: '配置不存在',
        };
      }

      const config = userConfigs[configIndex];
      const provider = this.getProviderById(config.providerId);

      // 如果设置为激活，取消其他同类型配置的激活状态
      if (updates.isActive) {
        userConfigs.forEach(c => {
          const p = this.getProviderById(c.providerId);
          if (c.id !== configId && p?.type === provider?.type) {
            c.isActive = false;
          }
        });
      }

      userConfigs[configIndex] = { ...config, ...updates };
      allConfigs[currentUser.id] = userConfigs;
      this.saveAllConfigs(allConfigs);

      this.logActivity('update_api_config', `更新API配置: ${config.name}`);

      return {
        success: true,
        data: userConfigs[configIndex],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新失败',
      };
    }
  }

  // ============================================
  // 删除API配置
  // ============================================
  async deleteConfig(configId: string): Promise<ApiResponse<void>> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: '用户未登录',
        };
      }

      const allConfigs = this.getAllConfigs();
      const userConfigs = allConfigs[currentUser.id] || [];
      const filteredConfigs = userConfigs.filter(c => c.id !== configId);

      if (filteredConfigs.length === userConfigs.length) {
        return {
          success: false,
          error: '配置不存在',
        };
      }

      allConfigs[currentUser.id] = filteredConfigs;
      this.saveAllConfigs(allConfigs);

      this.logActivity('delete_api_config', `删除API配置: ${configId}`);

      return {
        success: true,
        message: '删除成功',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除失败',
      };
    }
  }

  // ============================================
  // 设置激活的API配置
  // ============================================
  async setActiveConfig(configId: string): Promise<ApiResponse<void>> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: '用户未登录',
        };
      }

      const allConfigs = this.getAllConfigs();
      const userConfigs = allConfigs[currentUser.id] || [];
      const config = userConfigs.find(c => c.id === configId);

      if (!config) {
        return {
          success: false,
          error: '配置不存在',
        };
      }

      const provider = this.getProviderById(config.providerId);

      // 取消其他同类型配置的激活状态
      userConfigs.forEach(c => {
        const p = this.getProviderById(c.providerId);
        if (c.id !== configId && p?.type === provider?.type) {
          c.isActive = false;
        }
      });

      config.isActive = true;
      allConfigs[currentUser.id] = userConfigs;
      this.saveAllConfigs(allConfigs);

      return {
        success: true,
        message: '设置成功',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '设置失败',
      };
    }
  }

  // ============================================
  // 管理员：添加新的API供应商
  // ============================================
  async addProvider(provider: Omit<ApiProvider, 'id'>): Promise<ApiResponse<ApiProvider>> {
    try {
      if (!authService.isAdmin()) {
        return {
          success: false,
          error: '无权限操作',
        };
      }

      // 注意：这里只是模拟，实际应该保存到后端数据库
      // 由于供应商列表是硬编码在配置中的，这里仅作演示
      const newProvider: ApiProvider = {
        ...provider,
        id: `provider-${Date.now()}`,
      };

      this.logActivity('add_provider', `添加API供应商: ${newProvider.name}`);

      return {
        success: true,
        data: newProvider,
        message: '供应商添加成功（请同时更新配置文件）',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '添加失败',
      };
    }
  }

  // ============================================
  // 辅助方法：根据ID获取供应商
  // ============================================
  getProviderById(providerId: string): ApiProvider | undefined {
    const allProviders = [
      ...API_PROVIDERS.imageProviders,
      ...API_PROVIDERS.videoProviders,
    ];
    return allProviders.find(p => p.id === providerId);
  }

  // ============================================
  // 辅助方法：获取所有配置
  // ============================================
  private getAllConfigs(): Record<string, UserApiConfig[]> {
    const data = localStorage.getItem(STORAGE_KEYS.apiConfigs);
    return data ? JSON.parse(data) : {};
  }

  // ============================================
  // 辅助方法：保存所有配置
  // ============================================
  private saveAllConfigs(configs: Record<string, UserApiConfig[]>): void {
    localStorage.setItem(STORAGE_KEYS.apiConfigs, JSON.stringify(configs));
  }

  // ============================================
  // 辅助方法：记录日志
  // ============================================
  private logActivity(action: string, message: string): void {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.logs) || '[]');
    const currentUser = authService.getCurrentUser();
    logs.push({
      id: `log-${Date.now()}`,
      level: 'info',
      message: `${action}: ${message}`,
      userId: currentUser?.id,
      timestamp: new Date().toISOString(),
      module: 'api_config',
    });
    if (logs.length > 1000) {
      logs.shift();
    }
    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
  }
}

// ============================================
// 单例实例
// ============================================
export const apiConfigService = new ApiConfigService();
