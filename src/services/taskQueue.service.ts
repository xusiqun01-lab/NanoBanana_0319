/**
 * 任务队列服务
 * 管理多任务并发执行
 */

import type { Task, TaskType, TextToImageParams, ImageToImageParams, VideoGenerationParams } from '@/types';
import { SYSTEM_CONFIG, STORAGE_KEYS, getVideoResolutionDimensions } from '@/config/app.config';
import { authService } from './auth.service';
import { createGeminiClient, createVideoClient } from './gemini.service';
import { apiConfigService } from './apiConfig.service';
import { galleryService } from './gallery.service';

// ============================================
// 任务处理器类型
// ============================================
type TaskHandler = (task: Task) => Promise<void>;
type TaskProgressCallback = (taskId: string, progress: number) => void;
type TaskCompleteCallback = (task: Task) => void;
type TaskErrorCallback = (taskId: string, error: string) => void;

// ============================================
// 任务队列服务类
// ============================================
export class TaskQueueService {
  private queue: Task[] = [];
  private runningTasks: Map<string, Task> = new Map();
  private maxConcurrent: number;
  private handlers: Map<TaskType, TaskHandler> = new Map();
  private progressCallbacks: TaskProgressCallback[] = [];
  private completeCallbacks: TaskCompleteCallback[] = [];
  private errorCallbacks: TaskErrorCallback[] = [];

  constructor() {
    this.maxConcurrent = SYSTEM_CONFIG.concurrency.maxConcurrentTasks;
    this.registerHandlers();
    this.loadPersistedTasks();
  }

  // ============================================
  // 注册任务处理器
  // ============================================
  private registerHandlers(): void {
    this.handlers.set('text-to-image', this.handleTextToImage.bind(this));
    this.handlers.set('image-to-image', this.handleImageToImage.bind(this));
    this.handlers.set('video-generation', this.handleVideoGeneration.bind(this));
  }

  // ============================================
  // 添加任务到队列
  // ============================================
  async addTask(
    type: TaskType,
    params: TextToImageParams | ImageToImageParams | VideoGenerationParams
  ): Promise<Task> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      status: 'pending',
      params,
      progress: 0,
      createdAt: new Date().toISOString(),
      userId: currentUser.id,
    };

    // 检查队列是否已满
    if (this.queue.length >= SYSTEM_CONFIG.concurrency.maxQueueSize) {
      throw new Error('任务队列已满，请等待部分任务完成后再添加');
    }

    // 检查用户当前运行中的任务数
    const userRunningTasks = this.getUserRunningTasks(currentUser.id);
    if (userRunningTasks.length >= this.maxConcurrent) {
      task.status = 'pending';
      this.queue.push(task);
      this.persistTasks();
      this.notifyProgress(task.id, 0);
      return task;
    }

    // 立即开始任务
    this.startTask(task);
    return task;
  }

  // ============================================
  // 取消任务
  // ============================================
  cancelTask(taskId: string): boolean {
    // 从队列中移除
    const queueIndex = this.queue.findIndex(t => t.id === taskId);
    if (queueIndex !== -1) {
      const task = this.queue[queueIndex];
      task.status = 'cancelled';
      this.queue.splice(queueIndex, 1);
      this.persistTasks();
      return true;
    }

    // 无法取消运行中的任务（需要abort controller支持）
    return false;
  }

  // ============================================
  // 获取任务状态
  // ============================================
  getTask(taskId: string): Task | undefined {
    const queued = this.queue.find(t => t.id === taskId);
    if (queued) return queued;
    
    const running = this.runningTasks.get(taskId);
    if (running) return running;
    
    // 从持久化存储中查找
    const allTasks = this.getAllTasks();
    return allTasks.find(t => t.id === taskId);
  }

  // ============================================
  // 获取用户的所有任务
  // ============================================
  getUserTasks(userId?: string): Task[] {
    const targetUserId = userId || authService.getCurrentUser()?.id;
    if (!targetUserId) return [];

    const allTasks = this.getAllTasks();
    return allTasks
      .filter(t => t.userId === targetUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ============================================
  // 获取用户运行中的任务
  // ============================================
  getUserRunningTasks(userId: string): Task[] {
    return Array.from(this.runningTasks.values()).filter(t => t.userId === userId);
  }

  // ============================================
  // 获取队列状态
  // ============================================
  getQueueStatus(): {
    queueLength: number;
    runningCount: number;
    maxConcurrent: number;
  } {
    return {
      queueLength: this.queue.length,
      runningCount: this.runningTasks.size,
      maxConcurrent: this.maxConcurrent,
    };
  }

  // ============================================
  // 订阅任务进度
  // ============================================
  onProgress(callback: TaskProgressCallback): () => void {
    this.progressCallbacks.push(callback);
    return () => {
      const index = this.progressCallbacks.indexOf(callback);
      if (index !== -1) {
        this.progressCallbacks.splice(index, 1);
      }
    };
  }

  // ============================================
  // 订阅任务完成
  // ============================================
  onComplete(callback: TaskCompleteCallback): () => void {
    this.completeCallbacks.push(callback);
    return () => {
      const index = this.completeCallbacks.indexOf(callback);
      if (index !== -1) {
        this.completeCallbacks.splice(index, 1);
      }
    };
  }

  // ============================================
  // 订阅任务错误
  // ============================================
  onError(callback: TaskErrorCallback): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index !== -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  // ============================================
  // 私有方法：开始执行任务
  // ============================================
  private async startTask(task: Task): Promise<void> {
    task.status = 'processing';
    task.startedAt = new Date().toISOString();
    this.runningTasks.set(task.id, task);
    this.persistTasks();

    const handler = this.handlers.get(task.type);
    if (!handler) {
      this.handleError(task, '未知的任务类型');
      return;
    }

    try {
      await handler(task);
    } catch (error) {
      this.handleError(task, error instanceof Error ? error.message : '任务执行失败');
    }
  }

  // ============================================
  // 私有方法：处理文生图任务
  // ============================================
  private async handleTextToImage(task: Task): Promise<void> {
    const params = task.params as TextToImageParams;
    
    this.notifyProgress(task.id, 10);

    // 获取API配置
    const apiConfig = apiConfigService.getActiveConfig('image');
    if (!apiConfig) {
      throw new Error('未配置图片生成API，请先配置API');
    }

    this.notifyProgress(task.id, 30);

    // 创建Gemini客户端
    const client = createGeminiClient(apiConfig.apiKey);

    this.notifyProgress(task.id, 50);

    // 调用API生成图片
    const result = await client.generateTextToImage(params);

    if (!result.success || !result.data) {
      throw new Error(result.error || '生成失败');
    }

    this.notifyProgress(task.id, 90);

    // 保存到图库
    galleryService.addImage(result.data);

    task.result = result.data;
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.progress = 100;

    this.runningTasks.delete(task.id);
    this.persistTasks();
    this.notifyComplete(task);

    // 处理队列中的下一个任务
    this.processNextTask();
  }

  // ============================================
  // 私有方法：处理图生图任务
  // ============================================
  private async handleImageToImage(task: Task): Promise<void> {
    const params = task.params as ImageToImageParams;
    
    this.notifyProgress(task.id, 10);

    const apiConfig = apiConfigService.getActiveConfig('image');
    if (!apiConfig) {
      throw new Error('未配置图片生成API，请先配置API');
    }

    this.notifyProgress(task.id, 30);

    const client = createGeminiClient(apiConfig.apiKey);

    this.notifyProgress(task.id, 50);

    const result = await client.generateImageToImage(params);

    if (!result.success || !result.data) {
      throw new Error(result.error || '生成失败');
    }

    this.notifyProgress(task.id, 90);

    galleryService.addImage(result.data);

    task.result = result.data;
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.progress = 100;

    this.runningTasks.delete(task.id);
    this.persistTasks();
    this.notifyComplete(task);

    this.processNextTask();
  }

  // ============================================
  // 私有方法：处理视频生成任务
  // ============================================
  private async handleVideoGeneration(task: Task): Promise<void> {
    const params = task.params as VideoGenerationParams;
    
    this.notifyProgress(task.id, 10);

    const apiConfig = apiConfigService.getActiveConfig('video');
    if (!apiConfig) {
      throw new Error('未配置视频生成API，请先配置API');
    }

    this.notifyProgress(task.id, 30);

    const provider = apiConfig.providerId as 'jimeng' | 'kling';
    const client = createVideoClient(apiConfig.apiKey, provider);

    this.notifyProgress(task.id, 50);

    const dimensions = getVideoResolutionDimensions(params.resolution, params.ratio);

    const result = await client.generateVideo({
      prompt: params.prompt,
      referenceImage: params.referenceImage,
      width: dimensions.width,
      height: dimensions.height,
      duration: params.duration,
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || '生成失败');
    }

    this.notifyProgress(task.id, 90);

    // 视频生成通常是异步的，这里简化处理
    // 实际应该轮询状态或接收webhook

    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.progress = 100;

    this.runningTasks.delete(task.id);
    this.persistTasks();
    this.notifyComplete(task);

    this.processNextTask();
  }

  // ============================================
  // 私有方法：处理错误
  // ============================================
  private handleError(task: Task, error: string): void {
    task.status = 'failed';
    task.error = error;
    task.completedAt = new Date().toISOString();
    
    this.runningTasks.delete(task.id);
    this.persistTasks();
    this.notifyError(task.id, error);

    this.processNextTask();
  }

  // ============================================
  // 私有方法：处理队列中的下一个任务
  // ============================================
  private processNextTask(): void {
    if (this.queue.length === 0) return;

    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    const userRunningTasks = this.getUserRunningTasks(currentUser.id);
    if (userRunningTasks.length >= this.maxConcurrent) return;

    // 找到当前用户的下一个待处理任务
    const nextTaskIndex = this.queue.findIndex(
      t => t.userId === currentUser.id && t.status === 'pending'
    );

    if (nextTaskIndex !== -1) {
      const task = this.queue.splice(nextTaskIndex, 1)[0];
      this.startTask(task);
    }
  }

  // ============================================
  // 私有方法：通知进度
  // ============================================
  private notifyProgress(taskId: string, progress: number): void {
    this.progressCallbacks.forEach(cb => cb(taskId, progress));
  }

  // ============================================
  // 私有方法：通知完成
  // ============================================
  private notifyComplete(task: Task): void {
    this.completeCallbacks.forEach(cb => cb(task));
  }

  // ============================================
  // 私有方法：通知错误
  // ============================================
  private notifyError(taskId: string, error: string): void {
    this.errorCallbacks.forEach(cb => cb(taskId, error));
  }

  // ============================================
  // 私有方法：持久化任务
  // ============================================
  private persistTasks(): void {
    const allTasks = this.getAllTasks();
    const currentTasks = [...this.queue, ...Array.from(this.runningTasks.values())];
    
    // 合并并去重
    const taskMap = new Map(allTasks.map(t => [t.id, t]));
    currentTasks.forEach(t => taskMap.set(t.id, t));
    
    // 只保留最近100个任务
    const tasksToSave = Array.from(taskMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100);
    
    localStorage.setItem(STORAGE_KEYS.token + '_tasks', JSON.stringify(tasksToSave));
  }

  // ============================================
  // 私有方法：加载持久化的任务
  // ============================================
  private loadPersistedTasks(): void {
    const data = localStorage.getItem(STORAGE_KEYS.token + '_tasks');
    if (data) {
      const tasks: Task[] = JSON.parse(data);
      // 恢复pending状态的任务到队列
      tasks.filter(t => t.status === 'pending').forEach(t => {
        this.queue.push(t);
      });
    }
  }

  // ============================================
  // 私有方法：获取所有任务
  // ============================================
  private getAllTasks(): Task[] {
    const data = localStorage.getItem(STORAGE_KEYS.token + '_tasks');
    return data ? JSON.parse(data) : [];
  }
}

// ============================================
// 单例实例
// ============================================
export const taskQueueService = new TaskQueueService();
