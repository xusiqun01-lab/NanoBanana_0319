/**
 * 用户认证服务
 * 处理用户登录、注册、权限管理等
 */

import type { User, LoginCredentials, RegisterData, ApiResponse } from '@/types';
import { SYSTEM_CONFIG, STORAGE_KEYS } from '@/config/app.config';

// ============================================
// 模拟用户数据库（实际项目中应使用后端数据库）
// ============================================
interface StoredUser extends User {
  password: string;
}

// 初始化管理员账户
function initAdminUser(): void {
  const users = getStoredUsers();
  const adminExists = users.some(u => u.role === 'admin');
  
  if (!adminExists) {
    const adminUser: StoredUser = {
      id: 'admin-001',
      email: SYSTEM_CONFIG.admin.email,
      name: '管理员',
      role: 'admin',
      password: 'admin123', // 首次登录后应修改
      createdAt: new Date().toISOString(),
      lastLoginAt: undefined,
    };
    users.push(adminUser);
    localStorage.setItem(STORAGE_KEYS.user + '_db', JSON.stringify(users));
    console.log('Admin user initialized');
  }
}

// 获取存储的用户列表
function getStoredUsers(): StoredUser[] {
  const data = localStorage.getItem(STORAGE_KEYS.user + '_db');
  return data ? JSON.parse(data) : [];
}

// 保存用户列表
function saveStoredUsers(users: StoredUser[]): void {
  localStorage.setItem(STORAGE_KEYS.user + '_db', JSON.stringify(users));
}

// ============================================
// 认证服务类
// ============================================
export class AuthService {
  private currentUser: User | null = null;

  constructor() {
    // 初始化时尝试恢复会话
    this.restoreSession();
    // 初始化管理员账户
    initAdminUser();
  }

  // ============================================
  // 用户登录
  // ============================================
  async login(credentials: LoginCredentials): Promise<ApiResponse<User>> {
    try {
      // 模拟网络延迟
      await this.simulateDelay(500);

      const users = getStoredUsers();
      const user = users.find(u => u.email === credentials.email);

      if (!user) {
        return {
          success: false,
          error: '用户不存在',
        };
      }

      if (user.password !== credentials.password) {
        return {
          success: false,
          error: '密码错误',
        };
      }

      // 更新最后登录时间
      user.lastLoginAt = new Date().toISOString();
      saveStoredUsers(users);

      // 创建会话（不包含密码）
      const { password, ...userWithoutPassword } = user;
      this.currentUser = userWithoutPassword;
      this.saveSession(userWithoutPassword);

      // 记录日志
      this.logActivity('login', `用户 ${user.email} 登录成功`);

      return {
        success: true,
        data: userWithoutPassword,
        message: '登录成功',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '登录失败',
      };
    }
  }

  // ============================================
  // 用户注册
  // ============================================
  async register(data: RegisterData): Promise<ApiResponse<User>> {
    try {
      await this.simulateDelay(500);

      const users = getStoredUsers();

      // 检查邮箱是否已存在
      if (users.some(u => u.email === data.email)) {
        return {
          success: false,
          error: '该邮箱已被注册',
        };
      }

      // 检查是否已存在管理员（防止普通用户注册为管理员）
      const isFirstUser = users.length === 0;

      // 创建新用户
      const newUser: StoredUser = {
        id: `user-${Date.now()}`,
        email: data.email,
        name: data.name,
        role: isFirstUser ? 'admin' : 'user', // 第一个用户为管理员
        password: data.password,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveStoredUsers(users);

      // 创建会话
      const { password, ...userWithoutPassword } = newUser;
      this.currentUser = userWithoutPassword;
      this.saveSession(userWithoutPassword);

      this.logActivity('register', `新用户 ${newUser.email} 注册成功`);

      return {
        success: true,
        data: userWithoutPassword,
        message: '注册成功',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '注册失败',
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
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.token);
  }

  // ============================================
  // 获取当前用户
  // ============================================
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // ============================================
  // 检查是否已登录
  // ============================================
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // ============================================
  // 检查是否为管理员
  // ============================================
  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  // ============================================
  // 更新用户信息
  // ============================================
  async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      await this.simulateDelay(300);

      const users = getStoredUsers();
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        return {
          success: false,
          error: '用户不存在',
        };
      }

      // 不允许通过此方法修改密码和角色
      const { password, role, ...safeUpdates } = updates as any;

      users[userIndex] = { ...users[userIndex], ...safeUpdates };
      saveStoredUsers(users);

      // 如果更新的是当前用户，更新会话
      if (this.currentUser?.id === userId) {
        const { password, ...updatedUser } = users[userIndex];
        this.currentUser = updatedUser;
        this.saveSession(updatedUser);
      }

      this.logActivity('update_user', `更新用户 ${userId} 信息`);

      return {
        success: true,
        data: users[userIndex],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新失败',
      };
    }
  }

  // ============================================
  // 修改密码
  // ============================================
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      await this.simulateDelay(300);

      const users = getStoredUsers();
      const user = users.find(u => u.id === userId);

      if (!user) {
        return {
          success: false,
          error: '用户不存在',
        };
      }

      if (user.password !== oldPassword) {
        return {
          success: false,
          error: '原密码错误',
        };
      }

      user.password = newPassword;
      saveStoredUsers(users);

      this.logActivity('change_password', `用户 ${userId} 修改密码`);

      return {
        success: true,
        message: '密码修改成功',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '修改失败',
      };
    }
  }

  // ============================================
  // 获取所有用户（管理员功能）
  // ============================================
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    try {
      if (!this.isAdmin()) {
        return {
          success: false,
          error: '无权限访问',
        };
      }

      await this.simulateDelay(300);

      const users = getStoredUsers();
      const usersWithoutPassword = users.map(({ password, ...user }) => user);

      return {
        success: true,
        data: usersWithoutPassword,
      };
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
    try {
      if (!this.isAdmin()) {
        return {
          success: false,
          error: '无权限操作',
        };
      }

      await this.simulateDelay(300);

      const users = getStoredUsers();
      const filteredUsers = users.filter(u => u.id !== userId);

      if (filteredUsers.length === users.length) {
        return {
          success: false,
          error: '用户不存在',
        };
      }

      saveStoredUsers(filteredUsers);

      this.logActivity('delete_user', `删除用户 ${userId}`);

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
  // 私有方法：保存会话
  // ============================================
  private saveSession(user: User): void {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    // 生成简单的token（实际项目应使用JWT）
    const token = `token-${user.id}-${Date.now()}`;
    localStorage.setItem(STORAGE_KEYS.token, token);
  }

  // ============================================
  // 私有方法：恢复会话
  // ============================================
  private restoreSession(): void {
    const userData = localStorage.getItem(STORAGE_KEYS.user);
    const token = localStorage.getItem(STORAGE_KEYS.token);

    if (userData && token) {
      try {
        this.currentUser = JSON.parse(userData);
      } catch {
        this.currentUser = null;
      }
    }
  }

  // ============================================
  // 私有方法：模拟延迟
  // ============================================
  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    // 限制日志数量
    if (logs.length > 1000) {
      logs.shift();
    }
    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
  }
}

// ============================================
// 单例实例
// ============================================
export const authService = new AuthService();
