/**
 * 用户认证Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { User, LoginCredentials, RegisterData, ApiResponse } from '@/types';
import { authService } from '@/services/auth.service';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<ApiResponse<User>>;
  register: (data: RegisterData) => Promise<ApiResponse<User>>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 初始化时检查登录状态
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
    setIsLoading(true);
    const result = await authService.login(credentials);
    if (result.success && result.data) {
      setUser(result.data);
    }
    setIsLoading(false);
    return result;
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<ApiResponse<User>> => {
    setIsLoading(true);
    const result = await authService.register(data);
    if (result.success && result.data) {
      setUser(result.data);
    }
    setIsLoading(false);
    return result;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback((): void => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };
}
