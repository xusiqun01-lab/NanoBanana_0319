/**
 * 图库管理服务
 * 管理用户生成的图片和视频历史
 */

import type { GalleryItem, GeneratedImage, GeneratedVideo, ApiResponse } from '@/types';
import { SYSTEM_CONFIG, STORAGE_KEYS } from '@/config/app.config';
import { authService } from './auth.service';

// ============================================
// 图库服务类
// ============================================
export class GalleryService {

  // ============================================
  // 获取用户的图库列表
  // ============================================
  getGallery(): GalleryItem[] {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return [];
    }

    const allGalleries = this.getAllGalleries();
    const userGallery = allGalleries[currentUser.id] || [];
    
    // 按时间倒序排列
    return userGallery.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ============================================
  // 添加图片到图库
  // ============================================
  addImage(image: GeneratedImage): ApiResponse<GalleryItem> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: '用户未登录',
        };
      }

      const galleryItem: GalleryItem = {
        id: image.id,
        type: 'image',
        url: image.url,
        prompt: image.prompt,
        width: image.width,
        height: image.height,
        createdAt: image.createdAt,
        metadata: {
          resolution: image.resolution,
          ratio: image.ratio,
          imageType: image.type,
        },
      };

      this.addToGallery(currentUser.id, galleryItem);

      return {
        success: true,
        data: galleryItem,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '添加失败',
      };
    }
  }

  // ============================================
  // 添加视频到图库
  // ============================================
  addVideo(video: GeneratedVideo): ApiResponse<GalleryItem> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: '用户未登录',
        };
      }

      const galleryItem: GalleryItem = {
        id: video.id,
        type: 'video',
        url: video.url,
        prompt: video.prompt,
        width: video.width,
        height: video.height,
        createdAt: video.createdAt,
        metadata: {
          resolution: video.resolution,
          ratio: video.ratio,
          duration: video.duration,
          status: video.status,
        },
      };

      this.addToGallery(currentUser.id, galleryItem);

      return {
        success: true,
        data: galleryItem,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '添加失败',
      };
    }
  }

  // ============================================
  // 从图库删除项目
  // ============================================
  deleteItem(itemId: string): ApiResponse<void> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: '用户未登录',
        };
      }

      const allGalleries = this.getAllGalleries();
      const userGallery = allGalleries[currentUser.id] || [];
      
      const filteredGallery = userGallery.filter(item => item.id !== itemId);
      
      if (filteredGallery.length === userGallery.length) {
        return {
          success: false,
          error: '项目不存在',
        };
      }

      allGalleries[currentUser.id] = filteredGallery;
      localStorage.setItem(STORAGE_KEYS.gallery, JSON.stringify(allGalleries));

      this.logActivity('delete_gallery_item', `删除图库项目: ${itemId}`);

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
  // 清空图库
  // ============================================
  clearGallery(): ApiResponse<void> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: '用户未登录',
        };
      }

      const allGalleries = this.getAllGalleries();
      delete allGalleries[currentUser.id];
      localStorage.setItem(STORAGE_KEYS.gallery, JSON.stringify(allGalleries));

      this.logActivity('clear_gallery', '清空图库');

      return {
        success: true,
        message: '图库已清空',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '清空失败',
      };
    }
  }

  // ============================================
  // 获取图库统计
  // ============================================
  getStats(): { total: number; images: number; videos: number } {
    const gallery = this.getGallery();
    return {
      total: gallery.length,
      images: gallery.filter(item => item.type === 'image').length,
      videos: gallery.filter(item => item.type === 'video').length,
    };
  }

  // ============================================
  // 下载图片（不跳转页面）
  // ============================================
  async downloadImage(url: string, filename?: string): Promise<ApiResponse<void>> {
    try {
      // 使用fetch获取图片blob
      const response = await fetch(url);
      const blob = await response.blob();
      
      // 创建临时下载链接
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || `ai-generated-${Date.now()}.png`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理blob URL
      window.URL.revokeObjectURL(blobUrl);

      return {
        success: true,
        message: '下载已开始',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '下载失败',
      };
    }
  }

  // ============================================
  // 私有方法：添加到图库（自动限制数量）
  // ============================================
  private addToGallery(userId: string, item: GalleryItem): void {
    const allGalleries = this.getAllGalleries();
    let userGallery = allGalleries[userId] || [];

    // 添加新项目到开头
    userGallery.unshift(item);

    // 限制数量，删除最老的
    if (userGallery.length > SYSTEM_CONFIG.gallery.maxHistoryImages) {
      userGallery = userGallery.slice(0, SYSTEM_CONFIG.gallery.maxHistoryImages);
    }

    allGalleries[userId] = userGallery;
    localStorage.setItem(STORAGE_KEYS.gallery, JSON.stringify(allGalleries));

    this.logActivity('add_to_gallery', `添加项目到图库: ${item.id}`);
  }

  // ============================================
  // 私有方法：获取所有图库数据
  // ============================================
  private getAllGalleries(): Record<string, GalleryItem[]> {
    const data = localStorage.getItem(STORAGE_KEYS.gallery);
    return data ? JSON.parse(data) : {};
  }

  // ============================================
  // 私有方法：记录日志
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
      module: 'gallery',
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
export const galleryService = new GalleryService();
