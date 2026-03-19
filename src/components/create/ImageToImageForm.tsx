import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Wand2, Upload, X, AlertCircle } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { ImageToImageParams, ImageResolution, ImageRatio } from '@/types';
import { IMAGE_CONFIG } from '@/config/app.config';
import { apiConfigService } from '@/services/apiConfig.service'; // ← 添加导入
import { fileToBase64, validateFileType, validateFileSize } from '@/utils/helpers';

interface ImageToImageFormProps {
  onSubmit: (params: ImageToImageParams & { provider?: string }) => Promise<void>; // ← 修改类型
  isLoading: boolean;
  hasApiConfig: boolean;
  isMultiImage?: boolean;
}

export const ImageToImageForm = ({ onSubmit, isLoading, hasApiConfig }: ImageToImageFormProps) => {
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<ImageResolution>('1K');
  const [ratio, setRatio] = useState<ImageRatio>('original');
  const [strength, setStrength] = useState(0.7);
  const [referenceImages, setReferenceImages] = useState<(string | null)[]>([null, null, null, null]);
  const [uploadError, setUploadError] = useState('');
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggingIndex(index);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggingIndex(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggingIndex(null);
    setUploadError('');

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0], index);
    }
  }, []);

  const processFile = async (file: File, index: number) => {
    if (!validateFileType(file, IMAGE_CONFIG.imageToImage.allowedFormats)) {
      setUploadError(`不支持的文件格式: ${file.name}`);
      return;
    }

    if (!validateFileSize(file, IMAGE_CONFIG.imageToImage.maxFileSize)) {
      setUploadError(`文件过大: ${file.name}`);
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setReferenceImages(prev => {
        const newImages = [...prev];
        newImages[index] = base64;
        return newImages;
      });
    } catch {
      setUploadError(`读取文件失败: ${file.name}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError('');
    await processFile(files[0], index);

    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  const removeImage = (index: number) => {
    setReferenceImages(prev => {
      const newImages = [...prev];
      newImages[index] = null;
      return newImages;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validImages = referenceImages.filter((img): img is string => img !== null);
    if (!prompt.trim() || validImages.length === 0) return;

    // 获取当前激活的API配置（关键修复）
    const activeConfig = apiConfigService.getActiveConfig('image');
    console.log('ImageToImage using provider:', activeConfig?.providerId); // 调试日志

    await onSubmit({
      prompt: prompt.trim(),
      resolution,
      ratio,
      referenceImages: validImages,
      apiConfigId: activeConfig?.id || 'default',
      provider: activeConfig?.providerId || 'zhenzhen', // ← 关键：传递provider
      strength,
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

  const imageLabels = ['图1', '图2', '图3', '图4'];
  const validImagesCount = referenceImages.filter(img => img !== null).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 h-full flex flex-col">
      <Card className="bg-[#111111] border-[#1f1f1f] flex-1 flex flex-col overflow-hidden">
        <CardContent className="pt-4 space-y-4 flex-1 flex flex-col overflow-auto">
          {/* 参考图片上传区 - 4个独立上传区域 */}
          <div className="space-y-2 shrink-0">
            <Label className="text-white text-sm flex items-center gap-1">
              参考图片 <span className="text-[#F5A623]">*</span>
              <span className="text-gray-500 text-xs ml-2">
                (已上传 {validImagesCount}/4 张)
              </span>
            </Label>
            
            {/* 4个独立上传区域 */}
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-gray-500 text-xs">{imageLabels[index]}</Label>
                  {referenceImages[index] ? (
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-[#1f1f1f] group bg-[#0a0a0a]">
                      <img
                        src={referenceImages[index]!}
                        alt={imageLabels[index]}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-1 left-1 bg-[#F5A623] text-black text-[10px] px-1.5 py-0.5 rounded font-medium">
                        {imageLabels[index]}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRefs.current[index]?.click()}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`
                        drag-drop-zone aspect-square rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer
                        ${draggingIndex === index ? 'drag-over border-[#F5A623] bg-[rgba(245,166,35,0.08)]' : 'border-[#1f1f1f] bg-[#0a0a0a]'}
                      `}
                    >
                      <Upload className="h-5 w-5 text-[#F5A623]" />
                      <p className="text-[#F5A623] text-[10px] font-medium text-center">点击或拖拽</p>
                    </div>
                  )}
                  <input
                    ref={(el) => { fileInputRefs.current[index] = el; }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileChange(e, index)}
                    className="hidden"
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>
            
            {uploadError && (
              <p className="text-xs text-red-400">{uploadError}</p>
            )}
          </div>

          {/* 提示词输入 */}
          <div className="space-y-2 flex-1 flex flex-col min-h-0">
            <Label className="text-white text-sm flex items-center gap-1">
              提示词 <span className="text-[#F5A623]">*</span>
            </Label>
            <Textarea
              placeholder="描述您想要生成的图片内容..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 min-h-[80px] bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 resize-none focus:border-[#F5A623] focus:ring-0 text-sm"
            />
          </div>

          {/* 参考图强度 */}
          <div className="space-y-2 shrink-0">
            <div className="flex justify-between items-center">
              <Label className="text-white text-sm">参考图影响强度</Label>
              <span className="text-[#F5A623] text-sm font-medium">{Math.round(strength * 100)}%</span>
            </div>
            <Slider
              value={[strength * 100]}
              onValueChange={(v) => setStrength(v[0] / 100)}
              min={0}
              max={100}
              step={5}
              disabled={isLoading}
              className="[&_[role=slider]]:bg-[#F5A623] [&_[role=slider]]:border-[#F5A623] [&_.bg-primary]:bg-[#F5A623]"
            />
            <p className="text-xs text-gray-600">
              数值越高，生成结果与参考图越相似
            </p>
          </div>

          {/* 分辨率选择 */}
          <div className="space-y-2 shrink-0">
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
          <div className="space-y-2 shrink-0">
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
        disabled={isLoading || !prompt.trim() || referenceImages.length === 0}
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