import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { TextToImageForm } from '@/components/create/TextToImageForm';
import { ImageToImageForm } from '@/components/create/ImageToImageForm';
import { VideoGenerationForm } from '@/components/create/VideoGenerationForm';
import { ResultDisplay } from '@/components/create/ResultDisplay';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { ApiConfigManager } from '@/components/admin/ApiConfigManager';
import { UserManager } from '@/components/admin/UserManager';
import { SystemLogs } from '@/components/admin/SystemLogs';
import { ToastContainer } from '@/components/common/ToastContainer';
import { Sidebar } from '@/components/common/Sidebar';
import { HomePage } from '@/components/home/HomePage';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useTaskQueue } from '@/hooks/useTaskQueue';
import { useGallery } from '@/hooks/useGallery';
import { apiConfigService } from '@/services/apiConfig.service';
import { galleryService } from '@/services/gallery.service';
import type { TextToImageParams, ImageToImageParams, VideoGenerationParams, UserApiConfig, ApiProvider } from '@/types';
import { API_PROVIDERS } from '@/config/app.config';
import './App.css';

function App() {
  // 认证状态
  const { user, isAuthenticated, isAdmin, login, register, logout } = useAuth();
  
  // Toast通知
  const { toasts, showSuccess, showError, removeToast } = useToast();
  
  // 任务队列
  const { tasks, addTask } = useTaskQueue();
  
  // 图库
  const { items: galleryItems, refresh: refreshGallery, deleteItem } = useGallery();
  
  // 本地状态
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState('home');
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiConfigs, setApiConfigs] = useState<UserApiConfig[]>([]);
  const [providers, setProviders] = useState<ApiProvider[]>([]);

  // 加载API配置
  useEffect(() => {
    if (isAuthenticated) {
      refreshApiConfigs();
    }
  }, [isAuthenticated]);

  const refreshApiConfigs = () => {
    const configs = apiConfigService.getUserConfigs();
    setApiConfigs(configs);
    setProviders([
      ...API_PROVIDERS.imageProviders,
      ...API_PROVIDERS.videoProviders,
    ] as ApiProvider[]);
  };

  // 检查是否有有效的API配置
  const hasImageApiConfig = apiConfigs.some(c => {
    const p = providers.find(prov => prov.id === c.providerId);
    return p?.type === 'image' && c.isActive;
  });

  // 处理登录
  const handleLogin = async (credentials: any) => {
    const result = await login(credentials);
    if (result.success) {
      showSuccess('登录成功');
    } else {
      showError(result.error || '登录失败');
    }
    return result;
  };

  // 处理注册
  const handleRegister = async (data: any) => {
    const result = await register(data);
    if (result.success) {
      showSuccess('注册成功');
    } else {
      showError(result.error || '注册失败');
    }
    return result;
  };

  // 处理退出
  const handleLogout = async () => {
    await logout();
    showSuccess('已退出登录');
    setActiveTab('home');
  };

  // 处理文生图
  const handleTextToImage = async (params: TextToImageParams) => {
    setIsGenerating(true);
    try {
      const task = await addTask('text-to-image', params);
      setCurrentTask(task);
      showSuccess('任务已添加到队列');
    } catch (error: any) {
      showError(error.message || '创建任务失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 处理图生图
  const handleImageToImage = async (params: ImageToImageParams) => {
    setIsGenerating(true);
    try {
      const task = await addTask('image-to-image', params);
      setCurrentTask(task);
      showSuccess('任务已添加到队列');
    } catch (error: any) {
      showError(error.message || '创建任务失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 处理视频生成
  const handleVideoGeneration = async (params: VideoGenerationParams) => {
    setIsGenerating(true);
    try {
      const task = await addTask('video-generation', params);
      setCurrentTask(task);
      showSuccess('任务已添加到队列');
    } catch (error: any) {
      showError(error.message || '创建任务失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 处理下载
  const handleDownload = async (url: string, filename: string) => {
    const result = await galleryService.downloadImage(url, filename);
    if (result.success) {
      showSuccess('下载已开始');
    } else {
      showError(result.error || '下载失败');
    }
  };

  // 更新当前任务进度
  useEffect(() => {
    if (currentTask) {
      const updatedTask = tasks.find(t => t.id === currentTask.id);
      if (updatedTask) {
        setCurrentTask(updatedTask);
        if (updatedTask.status === 'completed') {
          refreshGallery();
        }
      }
    }
  }, [tasks, currentTask?.id]);

  // 未登录状态
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        {authView === 'login' ? (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthView('register')}
          />
        ) : (
          <RegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={() => setAuthView('login')}
          />
        )}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  // 已登录状态 - 左侧边栏布局
  return (
    <div className="h-screen bg-[#050505] flex overflow-hidden">
      {/* 左侧边栏 */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden">
        {/* 主页 */}
        {activeTab === 'home' && (
          <HomePage onNavigate={setActiveTab} />
        )}

        {/* 创作模块 - 文生图 */}
        {activeTab === 'text-to-image' && (
          <div className="h-full p-5 flex flex-col">
            <div className="mb-4 shrink-0">
              <h1 className="text-xl font-bold text-white">文生图</h1>
              <p className="text-sm text-gray-400">输入文字描述，AI为您生成精美图片</p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-5 min-h-0">
              <div className="overflow-auto">
                <TextToImageForm
                  onSubmit={handleTextToImage}
                  isLoading={isGenerating}
                  hasApiConfig={hasImageApiConfig}
                />
              </div>
              <div className="overflow-auto">
                <ResultDisplay
                  task={currentTask}
                  onDownload={handleDownload}
                  onRetry={() => setCurrentTask(null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* 创作模块 - 图生图 */}
        {activeTab === 'image-to-image' && (
          <div className="h-full p-5 flex flex-col">
            <div className="mb-4 shrink-0">
              <h1 className="text-xl font-bold text-white">图生图</h1>
              <p className="text-sm text-gray-400">上传图片并添加描述，AI基于原图创作新作品</p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-5 min-h-0">
              <div className="overflow-auto">
                <ImageToImageForm
                  onSubmit={handleImageToImage}
                  isLoading={isGenerating}
                  hasApiConfig={hasImageApiConfig}
                />
              </div>
              <div className="overflow-auto">
                <ResultDisplay
                  task={currentTask}
                  onDownload={handleDownload}
                  onRetry={() => setCurrentTask(null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* 创作模块 - 视频生成 */}
        {activeTab === 'video-generation' && (
          <div className="h-full p-5 flex flex-col">
            <div className="mb-4 shrink-0">
              <h1 className="text-xl font-bold text-white">视频生成</h1>
              <p className="text-sm text-gray-400">上传参考图片，AI生成动态视频</p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-5 min-h-0">
              <div className="overflow-auto">
                <VideoGenerationForm
                  onSubmit={handleVideoGeneration}
                  isLoading={isGenerating}
                  hasApiConfig={hasImageApiConfig}
                />
              </div>
              <div className="overflow-auto">
                <ResultDisplay
                  task={currentTask}
                  onDownload={handleDownload}
                  onRetry={() => setCurrentTask(null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* 图库模块 */}
        {activeTab === 'gallery' && (
          <div className="h-full p-5 flex flex-col">
            <div className="mb-4 shrink-0">
              <h1 className="text-xl font-bold text-white">我的图库</h1>
              <p className="text-sm text-gray-400">管理您的创作历史（最多保存30张）</p>
            </div>
            <div className="flex-1 overflow-auto">
              <GalleryGrid
                items={galleryItems}
                onDelete={async (itemId) => { await deleteItem(itemId); }}
                onDownload={handleDownload}
                isLoading={false}
              />
            </div>
          </div>
        )}

        {/* API配置模块 */}
        {activeTab === 'api-config' && (
          <div className="h-full p-5 overflow-auto">
            <ApiConfigManager
              configs={apiConfigs}
              providers={providers}
              onRefresh={refreshApiConfigs}
            />
          </div>
        )}

        {/* 用户管理模块 */}
        {activeTab === 'users' && (
          <div className="h-full p-5 overflow-auto">
            <UserManager isAdmin={isAdmin} />
          </div>
        )}

        {/* 系统日志模块 */}
        {activeTab === 'logs' && (
          <div className="h-full p-5 overflow-auto">
            <SystemLogs isAdmin={isAdmin} />
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
