import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PenTool, Image, Video, Settings } from 'lucide-react';
import { apiConfigService } from '@/services/apiConfig.service';

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

export const HomePage = ({ onNavigate }: HomePageProps) => {
  const [hasApiConfig, setHasApiConfig] = useState(false);

  useEffect(() => {
    const configs = apiConfigService.getUserConfigs();
    setHasApiConfig(configs.length > 0);
  }, []);

  const features = [
    {
      id: 'text-to-image',
      title: '文生图',
      description: '输入文字描述，AI为您生成精美图片，支持1K/2K/4K分辨率',
      icon: PenTool,
    },
    {
      id: 'image-to-image',
      title: '图生图',
      description: '上传参考图片并添加描述，AI基于原图创作新作品',
      icon: Image,
    },
    {
      id: 'video-generation',
      title: '视频生成',
      description: '上传参考图片，结合描述生成动态视频内容',
      icon: Video,
    },
  ];

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* 渐变背景效果 - 淡暖色退晕 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 中心暖色光晕 */}
        <div 
          className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '600px',
            height: '400px',
            background: 'radial-gradient(ellipse at center, rgba(245, 166, 35, 0.18) 0%, rgba(245, 166, 35, 0.08) 30%, rgba(245, 166, 35, 0.02) 60%, transparent 80%)',
            filter: 'blur(40px)',
          }}
        />
        {/* 顶部微光 */}
        <div 
          className="absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: '800px',
            height: '300px',
            background: 'radial-gradient(ellipse at center, rgba(245, 166, 35, 0.06) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* 主内容区域 - 紧凑布局 */}
      <div className="flex-1 flex flex-col items-center pt-10 relative z-10">
        {/* 大Logo */}
        <div className="w-16 h-16 mb-4 home-logo-glow">
          <img 
            src="/banana-logo.png" 
            alt="香蕉AI Logo" 
            className="w-full h-full object-contain rounded-xl"
          />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">开始使用香蕉 AI</h1>
        <p className="text-gray-400 mb-5 text-center text-sm max-w-md">
          配置您自己的 API Key，开始专业的 AI 图像创作之旅
        </p>

        {/* 按钮组 */}
        <div className="flex gap-3 mb-8">
          <Button 
            onClick={() => onNavigate(hasApiConfig ? 'text-to-image' : 'api-config')}
            className="btn-banana px-6 py-2.5 h-auto text-sm"
          >
            <PenTool className="w-4 h-4 mr-2" />
            开始创作
          </Button>
          <Button 
            onClick={() => onNavigate('api-config')}
            className="btn-banana-outline px-6 py-2.5 h-auto text-sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            配置API
          </Button>
        </div>

        {/* 功能卡片区域 - 上移紧跟按钮 */}
        <div className="w-full px-8">
          <div className="grid grid-cols-3 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.id}
                  className="home-card cursor-pointer bg-[#111111] border-[#1f1f1f] hover:border-[#F5A623]/50"
                  onClick={() => onNavigate(feature.id)}
                >
                  <CardContent className="p-4">
                    <div className="w-9 h-9 rounded-lg bg-[#F5A623]/10 flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-[#F5A623]" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1.5">{feature.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
