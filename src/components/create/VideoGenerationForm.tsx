import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Video, Upload, X, AlertCircle } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { VideoGenerationParams, VideoResolution, VideoRatio } from '@/types';
import { VIDEO_CONFIG } from '@/config/app.config';
import { fileToBase64, validateFileType, validateFileSize } from '@/utils/helpers';

interface VideoGenerationFormProps {
  onSubmit: (params: VideoGenerationParams) => Promise<void>;
  isLoading: boolean;
  hasApiConfig: boolean;
}

export const VideoGenerationForm = ({ onSubmit, isLoading, hasApiConfig }: VideoGenerationFormProps) => {
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<VideoResolution>('720');
  const [ratio, setRatio] = useState<VideoRatio>('original');
  const [duration, setDuration] = useState(VIDEO_CONFIG.duration.default);
  const [referenceImage, setReferenceImage] = useState<string>('');
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError('');

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const processFile = async (file: File) => {
    if (!validateFileType(file, VIDEO_CONFIG.upload.allowedFormats)) {
      setUploadError('不支持的文件格式');
      return;
    }

    if (!validateFileSize(file, VIDEO_CONFIG.upload.maxFileSize)) {
      setUploadError('文件过大，最大支持20MB');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setReferenceImage(base64);
    } catch {
      setUploadError('读取文件失败');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError('');
    await processFile(files[0]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setReferenceImage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !referenceImage) return;

    await onSubmit({
      prompt: prompt.trim(),
      referenceImage,
      resolution,
      ratio,
      duration,
      apiConfigId: 'default',
    });
  };

  const resolutions = Object.entries(VIDEO_CONFIG.resolutions).map(([key, value]) => ({
    value: key as VideoResolution,
    label: value.label,
  }));

  const ratios = Object.entries(VIDEO_CONFIG.ratios).map(([key, value]) => ({
    value: key as VideoRatio,
    label: value.label,
  }));

  if (!hasApiConfig) {
    return (
      <Card className="bg-[#111111] border-[#1f1f1f] h-full">
        <CardContent className="pt-6 h-full flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-[#F5A623] mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">请先配置API</h3>
          <p className="text-gray-400 mb-4 text-sm">您需要先在API配置页面添加视频生成API</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 h-full flex flex-col">
      <Card className="bg-[#111111] border-[#1f1f1f] flex-1 flex flex-col overflow-hidden">
        <CardContent className="pt-3 space-y-3 flex-1 flex flex-col overflow-auto">
          {/* 参考图片上传区 - 支持拖拽 */}
          <div className="space-y-1 shrink-0">
            <Label className="text-white text-sm flex items-center gap-1">
              参考图片 <span className="text-[#F5A623]">*</span>
            </Label>
            
            {referenceImage ? (
              <div className="relative aspect-[16/9] rounded-lg overflow-hidden border border-[#1f1f1f] group max-h-[140px]">
                <img
                  src={referenceImage}
                  alt="参考图"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  drag-drop-zone aspect-[16/9] rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer max-h-[140px]
                  ${isDragging ? 'drag-over border-[#F5A623] bg-[rgba(245,166,35,0.08)]' : 'border-[#1f1f1f] bg-[#0a0a0a]'}
                `}
              >
                <Upload className="h-6 w-6 text-[#F5A623]" />
                <div className="text-center">
                  <p className="text-[#F5A623] text-sm font-medium">点击或拖拽上传参考图片</p>
                  <p className="text-gray-600 text-xs">支持 JPG、PNG、WebP，最大20MB</p>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
            
            {uploadError && (
              <p className="text-xs text-red-400 text-center">{uploadError}</p>
            )}
          </div>

          {/* 视频描述 */}
          <div className="space-y-1 flex-1 flex flex-col min-h-[80px]">
            <Label className="text-white text-sm flex items-center gap-1">
              视频描述 <span className="text-[#F5A623]">*</span>
            </Label>
            <Textarea
              placeholder="描述您想要生成的视频内容，例如：画面中的人物缓缓转身，背景是夕阳下的海滩..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 min-h-[60px] bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 resize-none focus:border-[#F5A623] focus:ring-0 text-sm"
            />
          </div>

          {/* 视频时长 */}
          <div className="space-y-1 shrink-0">
            <div className="flex justify-between items-center">
              <Label className="text-white text-sm">视频时长</Label>
              <span className="text-[#F5A623] text-sm font-medium">{duration}秒</span>
            </div>
            <Slider
              value={[duration]}
              onValueChange={(v) => setDuration(v[0])}
              min={VIDEO_CONFIG.duration.min}
              max={VIDEO_CONFIG.duration.max}
              step={5}
              disabled={isLoading}
              className="[&_[role=slider]]:bg-[#F5A623] [&_[role=slider]]:border-[#F5A623] [&_.bg-primary]:bg-[#F5A623]"
            />
            <p className="text-xs text-gray-600">
              时长范围：{VIDEO_CONFIG.duration.min}-{VIDEO_CONFIG.duration.max}秒
            </p>
          </div>

          {/* 分辨率和画面比例 - 并排显示 */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {/* 分辨率选择 */}
            <div className="space-y-1">
              <Label className="text-white text-sm">分辨率</Label>
              <div className="grid grid-cols-2 gap-2">
                {resolutions.map((res) => (
                  <button
                    key={res.value}
                    type="button"
                    onClick={() => setResolution(res.value)}
                    disabled={isLoading}
                    className={`
                      ratio-btn px-2 py-2 rounded-lg text-xs font-medium transition-all
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
            <div className="space-y-1">
              <Label className="text-white text-sm">画面比例</Label>
              <div className="grid grid-cols-2 gap-2">
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
          </div>
        </CardContent>
      </Card>

      {/* 提交按钮 */}
      <Button
        type="submit"
        disabled={isLoading || !prompt.trim() || !referenceImage}
        className="w-full btn-banana h-11 text-sm shrink-0"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            生成中...
          </>
        ) : (
          <>
            <Video className="mr-2 h-4 w-4" />
            生成视频
          </>
        )}
      </Button>
    </form>
  );
};
