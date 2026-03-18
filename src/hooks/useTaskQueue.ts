/**
 * 任务队列Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskType, TextToImageParams, ImageToImageParams, VideoGenerationParams } from '@/types';
import { taskQueueService } from '@/services/taskQueue.service';

// Task progress tracking is handled via the taskProgress Map

interface UseTaskQueueReturn {
  tasks: Task[];
  runningTasks: Task[];
  queueStatus: {
    queueLength: number;
    runningCount: number;
    maxConcurrent: number;
  };
  taskProgress: Map<string, number>;
  addTask: (
    type: TaskType,
    params: TextToImageParams | ImageToImageParams | VideoGenerationParams
  ) => Promise<Task>;
  cancelTask: (taskId: string) => boolean;
  getTask: (taskId: string) => Task | undefined;
  refreshTasks: () => void;
}

export function useTaskQueue(): UseTaskQueueReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [runningTasks, setRunningTasks] = useState<Task[]>([]);
  const [queueStatus, setQueueStatus] = useState({
    queueLength: 0,
    runningCount: 0,
    maxConcurrent: 3,
  });
  const [taskProgress, setTaskProgress] = useState<Map<string, number>>(new Map());

  // 刷新任务列表
  const refreshTasks = useCallback(() => {
    const userTasks = taskQueueService.getUserTasks();
    setTasks(userTasks);
    
    const running = userTasks.filter(t => t.status === 'processing');
    setRunningTasks(running);
    
    setQueueStatus(taskQueueService.getQueueStatus());
  }, []);

  // 初始化
  useEffect(() => {
    refreshTasks();

    // 订阅任务进度
    const unsubscribeProgress = taskQueueService.onProgress((taskId, progress) => {
      setTaskProgress(prev => new Map(prev).set(taskId, progress));
    });

    // 订阅任务完成
    const unsubscribeComplete = taskQueueService.onComplete(() => {
      refreshTasks();
    });

    // 订阅任务错误
    const unsubscribeError = taskQueueService.onError(() => {
      refreshTasks();
    });

    // 定时刷新
    const interval = setInterval(refreshTasks, 2000);

    return () => {
      unsubscribeProgress();
      unsubscribeComplete();
      unsubscribeError();
      clearInterval(interval);
    };
  }, [refreshTasks]);

  const addTask = useCallback(async (
    type: TaskType,
    params: TextToImageParams | ImageToImageParams | VideoGenerationParams
  ): Promise<Task> => {
    const task = await taskQueueService.addTask(type, params);
    refreshTasks();
    return task;
  }, [refreshTasks]);

  const cancelTask = useCallback((taskId: string): boolean => {
    const result = taskQueueService.cancelTask(taskId);
    if (result) {
      refreshTasks();
    }
    return result;
  }, [refreshTasks]);

  const getTask = useCallback((taskId: string): Task | undefined => {
    return taskQueueService.getTask(taskId);
  }, []);

  return {
    tasks,
    runningTasks,
    queueStatus,
    taskProgress,
    addTask,
    cancelTask,
    getTask,
    refreshTasks,
  };
}
