/**
 * 用户认证服务
 * 对接后端真实用户系统（SQLite + JWT）
 */

import type { User, LoginCredentials, RegisterData, ApiResponse } from '@/types';
import { STORAGE_KEYS } from '@/config/app.config';

const API_URL = '/api/auth';

export class AuthService {
  private currentUser: User | null = null;
  private token: string | null = null;

  constructor() {
    this.restoreSession();
  }

  // ============================================
  // 用户登录（调用后端 API）
  // ============================================
  async login(credentials: LoginCredentials): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        // 保存 JWT token 和用户信息
        this.token = data.token;
        this.currentUser = data.user;
        localStorage.setItem(STORAGE_KEYS.token, data.token);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
        
        this.logActivity('login', `用户 ${data.user.email} 登录成功`);
        
        return {
          success: true,
          data: data.user,
          message: '登录成功',
        };
      }
      
      return {
        success: false,
        error: data.error || '登录失败',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误，无法连接服务器',
      };
    }
  }

  // ============================================
  // 用户注册（调用后端 API）
  // ============================================
  async register(data: RegisterData): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success && result.token) {
        this.token = result.token;
        this.currentUser = result.user;
        localStorage.setItem(STORAGE_KEYS.token, result.token);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(result.user));
        
        this.logActivity('register', `新用户 ${result.user.email} 注册成功，角色：${result.user.role}`);
        
        return {
          success: true,
          data: result.user,
          message: `注册成功，您是${result.user.role === 'admin' ? '管理员' : '普通用户'}`,
        };
      }
      
      return {
        success: false,
        error: result.error || '注册失败',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误，无法连接服务器',
      };
    }
  }

  // ============================================
  // 用户登出
  // ============================================
  async logout(): Promise<void> {
    if (this.currentUser) {
      this.logActivity('logout', `用户 ${this.currentUser.email} 登出`);
    }
    this.currentUser = null;
    this.token = null;
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.token);
    window.location.href = '/login';
  }

  // ============================================
  // 获取当前用户
  // ============================================
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // ============================================
  // 获取 JWT Token（用于请求后端 API）
  // ============================================
  getToken(): string | null {
    return this.token;
  }

  // ============================================
  // 检查是否已登录
  // ============================================
  isAuthenticated(): boolean {
    return this.token !== null && this.currentUser !== null;
  }

  // ============================================
  // 检查是否为管理员
  // ============================================
  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  // ============================================
  // 更新用户信息（仅本地，后端未提供此接口可暂存本地）
  // ============================================
  async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      if (!this.isAuthenticated()) {
        return { success: false, error: '未登录' };
      }

      // 这里可以扩展调用后端 /api/user/update
      // 目前仅更新本地
      if (this.currentUser?.id === userId) {
        this.currentUser = { ...this.currentUser, ...updates };
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(this.currentUser));
        return { success: true, data: this.currentUser };
      }
      
      return { success: false, error: '无权操作' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新失败',
      };
    }
  }

  // ============================================
  // 修改密码（调用后端 API，需补充后端接口）
  // ============================================
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    // 后端需要补充此接口，目前返回提示
    return {
      success: false,
      error: '密码修改功能请等待后端接口更新，或联系管理员',
    };
  }

  // ============================================
  // 获取所有用户（管理员功能，需调用后端 API）
  // ============================================
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    try {
      if (!this.isAdmin()) {
        return { success: false, error: '无权限访问' };
      }

      // 后端需要补充 /api/admin/users 接口
      // 目前返回空数组
      return { success: true, data: [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取失败',
      };
    }
  }

  // ============================================
  // 删除用户（管理员功能）
  // ============================================
  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return {
      success: false,
      error: '用户管理功能请等待后端接口更新',
    };
  }

  // ============================================
  // 私有方法：恢复会话
  // ============================================
  private restoreSession(): void {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    const userData = localStorage.getItem(STORAGE_KEYS.user);

    if (token && userData) {
      try {
        this.token = token;
        this.currentUser = JSON.parse(userData);
      } catch {
        this.token = null;
        this.currentUser = null;
      }
    }
  }

  // ============================================
  // 私有方法：记录活动日志
  // ============================================
  private logActivity(action: string, message: string): void {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.logs) || '[]');
    logs.push({
      id: `log-${Date.now()}`,
      level: 'info',
      message: `${action}: ${message}`,
      userId: this.currentUser?.id,
      timestamp: new Date().toISOString(),
      module: 'auth',
    });
    if (logs.length > 1000) {
      logs.shift();
    }
    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
  }
}

// 单例实例
export const authService = new AuthService();