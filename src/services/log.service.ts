/**
 * 系统日志服务
 * 记录和管理系统运行日志
 */

import type { SystemLog, LogLevel } from '@/types';
import { STORAGE_KEYS } from '@/config/app.config';
import { authService } from './auth.service';

// ============================================
// 日志服务类
// ============================================
export class LogService {
  private maxLogs: number = 1000;

  // ============================================
  // 添加日志
  // ============================================
  addLog(
    level: LogLevel,
    message: string,
    details?: string,
    module: string = 'system'
  ): SystemLog {
    const logs = this.getAllLogs();
    
    const log: SystemLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      details,
      userId: authService.getCurrentUser()?.id,
      timestamp: new Date().toISOString(),
      module,
    };

    logs.push(log);

    // 限制日志数量
    if (logs.length > this.maxLogs) {
      logs.shift();
    }

    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));

    // 同时在控制台输出
    this.consoleOutput(log);

    return log;
  }

  // ============================================
  // 快捷方法：信息日志
  // ============================================
  info(message: string, details?: string, module?: string): SystemLog {
    return this.addLog('info', message, details, module);
  }

  // ============================================
  // 快捷方法：警告日志
  // ============================================
  warning(message: string, details?: string, module?: string): SystemLog {
    return this.addLog('warning', message, details, module);
  }

  // ============================================
  // 快捷方法：错误日志
  // ============================================
  error(message: string, details?: string, module?: string): SystemLog {
    return this.addLog('error', message, details, module);
  }

  // ============================================
  // 快捷方法：调试日志
  // ============================================
  debug(message: string, details?: string, module?: string): SystemLog {
    return this.addLog('debug', message, details, module);
  }

  // ============================================
  // 获取所有日志（管理员权限）
  // ============================================
  getAllLogs(): SystemLog[] {
    if (!authService.isAdmin()) {
      return [];
    }

    const data = localStorage.getItem(STORAGE_KEYS.logs);
    return data ? JSON.parse(data) : [];
  }

  // ============================================
  // 获取过滤后的日志
  // ============================================
  getFilteredLogs(options: {
    level?: LogLevel;
    module?: string;
    startTime?: string;
    endTime?: string;
    search?: string;
  }): SystemLog[] {
    if (!authService.isAdmin()) {
      return [];
    }

    let logs = this.getAllLogs();

    if (options.level) {
      logs = logs.filter(l => l.level === options.level);
    }

    if (options.module) {
      logs = logs.filter(l => l.module === options.module);
    }

    if (options.startTime) {
      logs = logs.filter(l => l.timestamp >= options.startTime!);
    }

    if (options.endTime) {
      logs = logs.filter(l => l.timestamp <= options.endTime!);
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      logs = logs.filter(l => 
        l.message.toLowerCase().includes(searchLower) ||
        l.details?.toLowerCase().includes(searchLower)
      );
    }

    // 按时间倒序
    return logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // ============================================
  // 获取日志统计
  // ============================================
  getStats(): {
    total: number;
    info: number;
    warning: number;
    error: number;
    debug: number;
  } {
    const logs = this.getAllLogs();
    return {
      total: logs.length,
      info: logs.filter(l => l.level === 'info').length,
      warning: logs.filter(l => l.level === 'warning').length,
      error: logs.filter(l => l.level === 'error').length,
      debug: logs.filter(l => l.level === 'debug').length,
    };
  }

  // ============================================
  // 清空日志
  // ============================================
  clearLogs(): boolean {
    if (!authService.isAdmin()) {
      return false;
    }

    localStorage.removeItem(STORAGE_KEYS.logs);
    this.info('日志已清空', undefined, 'log');
    return true;
  }

  // ============================================
  // 导出日志
  // ============================================
  exportLogs(): string {
    if (!authService.isAdmin()) {
      return '';
    }

    const logs = this.getAllLogs();
    return JSON.stringify(logs, null, 2);
  }

  // ============================================
  // 获取模块列表
  // ============================================
  getModules(): string[] {
    const logs = this.getAllLogs();
    const modules = new Set(logs.map(l => l.module));
    return Array.from(modules).sort();
  }

  // ============================================
  // 私有方法：控制台输出
  // ============================================
  private consoleOutput(log: SystemLog): void {
    const timestamp = new Date(log.timestamp).toLocaleString();
    const prefix = `[${timestamp}] [${log.level.toUpperCase()}] [${log.module}]`;
    
    switch (log.level) {
      case 'info':
        console.log(prefix, log.message, log.details || '');
        break;
      case 'warning':
        console.warn(prefix, log.message, log.details || '');
        break;
      case 'error':
        console.error(prefix, log.message, log.details || '');
        break;
      case 'debug':
        console.debug(prefix, log.message, log.details || '');
        break;
    }
  }
}

// ============================================
// 单例实例
// ============================================
export const logService = new LogService();
