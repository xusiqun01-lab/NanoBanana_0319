import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Wand2, AlertCircle } from 'lucide-react';
import type { TextToImageParams, ImageResolution, ImageRatio } from '@/types';
import { IMAGE_CONFIG } from '@/config/app.config';
import { apiConfigService } from '@/services/apiConfig.service'; // ← 添加导入

interface TextToImageFormProps {
  onSubmit: (params: TextToImageParams & { provider?: string }) => Promise<void>; // ← 修改类型，支持provider
  isLoading: boolean;
  hasApiConfig: boolean;
}

export const TextToImageForm = ({ onSubmit, isLoading, hasApiConfig }: TextToImageFormProps) => {
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<ImageResolution>('1K');
  const [ratio, setRatio] = useState<ImageRatio>('original');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // 获取当前激活的API配置（关键修复）
    const activeConfig = apiConfigService.getActiveConfig('image');
    console.log('TextToImage using provider:', activeConfig?.providerId); // 调试日志

    await onSubmit({
      prompt: prompt.trim(),
      resolution,
      ratio,
      apiConfigId: activeConfig?.id || 'default',
      provider: activeConfig?.providerId || 'zhenzhen', // ← 关键：传递provider
    });
  };

  const resolutions = Object.entries(IMAGE_CONFIG.resolutions).map(([key, value]) => ({
    value: key as ImageResolution,
    label: value.label,
  }));

  const ratios = Object.entries(IMAGE_CONFIG.ratios).map(([key, value]) => ({
    value: key as ImageRatio,
    label: value.label,
  }));

  if (!hasApiConfig) {
    return (
      <Card className="bg-[#111111] border-[#1f1f1f] h-full">
        <CardContent className="pt-6 h-full flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-[#F5A623] mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">请先配置API</h3>
          <p className="text-gray-400 mb-4 text-sm">您需要先在API配置页面添加图片生成API</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 h-full flex flex-col">
      <Card className="bg-[#111111] border-[#1f1f1f] flex-1 flex flex-col">
        <CardContent className="pt-4 space-y-4 flex-1 flex flex-col">
          {/* 提示词输入 */}
          <div className="space-y-2 flex-1 flex flex-col">
            <Label className="text-white text-sm flex items-center gap-1">
              提示词 <span className="text-[#F5A623]">*</span>
            </Label>
            <Textarea
              placeholder="描述您想要生成的图片内容，例如：一只可爱的橘猫在阳光明媚的草地上玩耍..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 min-h-[100px] bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 resize-none focus:border-[#F5A623] focus:ring-0 text-sm"
            />
            <p className="text-xs text-gray-600 text-right">
              {prompt.length} / {IMAGE_CONFIG.model.maxPromptLength}
            </p>
          </div>

          {/* 分辨率选择 */}
          <div className="space-y-2">
            <Label className="text-white text-sm">分辨率</Label>
            <div className="grid grid-cols-3 gap-2">
              {resolutions.map((res) => (
                <button
                  key={res.value}
                  type="button"
                  onClick={() => setResolution(res.value)}
                  disabled={isLoading}
                  className={`
                    ratio-btn px-3 py-2 rounded-lg text-xs font-medium transition-all
                    ${resolution === res.value 
                      ? 'bg-[#F5A623] text-black border-[#F5A623]' 
                      : 'bg-[#0a0a0a] border-[#1f1f1f] text-gray-400 hover:border-[#F5A623] hover:text-white'
                    }
                  `}
                >
                  {res.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* 画面比例选择 */}
          <div className="space-y-2">
            <Label className="text-white text-sm">画面比例</Label>
            <div className="grid grid-cols-4 gap-2">
              {ratios.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRatio(r.value)}
                  disabled={isLoading}
                  className={`
                    ratio-btn px-2 py-2 rounded-lg text-xs font-medium transition-all
                    ${ratio === r.value 
                      ? 'bg-[#F5A623] text-black border-[#F5A623]' 
                      : 'bg-[#0a0a0a] border-[#1f1f1f] text-gray-400 hover:border-[#F5A623] hover:text-white'
                    }
                  `}
                >
                  {r.value === 'original' ? '原始' : r.value}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 提交按钮 */}
      <Button
        type="submit"
        disabled={isLoading || !prompt.trim()}
        className="w-full btn-banana h-11 text-sm shrink-0"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            生成中...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            开始创作
          </>
        )}
      </Button>
    </form>
  );
};