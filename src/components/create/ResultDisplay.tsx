import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { Task, GeneratedImage, GeneratedVideo } from '@/types';
import { formatDateTime } from '@/utils/helpers';

interface ResultDisplayProps {
  task: Task | null;
  onDownload?: (url: string, filename: string) => void;
  onRetry?: () => void;
}

export const ResultDisplay = ({ task, onDownload, onRetry }: ResultDisplayProps) => {
  if (!task) {
    return (
      <Card className="bg-[#111111] border-[#1f1f1f] h-full flex items-center justify-center">
        <div className="text-center">
          {/* 香蕉Logo */}
          <div className="w-20 h-20 mx-auto mb-6">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect x="4" y="4" width="40" height="40" rx="10" fill="#F5A623"/>
              <path 
                d="M14 32C14 32 18 30 22 26C26 22 28 18 28 14" 
                stroke="#FFE4B5"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path 
                d="M12 34C12 34 16 38 24 38C32 38 36 30 36 22C36 16 33 10 30 8C28 7 27 8 27 10C27 12 28 14 28 18C28 26 22 32 16 34C14 35 12 34 12 34Z" 
                fill="#D48A0F"
              />
              <ellipse cx="30" cy="9" rx="2.5" ry="3.5" fill="#8B6914"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">开始使用香蕉 AI</h3>
          <p className="text-gray-500 text-sm">填写左侧表单开始创作</p>
          <p className="text-xs text-gray-600 mt-1">您的作品将在这里展示</p>
        </div>
      </Card>
    );
  }

  const isProcessing = task.status === 'processing' || task.status === 'pending';
  const isCompleted = task.status === 'completed';
  const isFailed = task.status === 'failed';

  const result = task.result as GeneratedImage | GeneratedVideo | undefined;

  return (
    <Card className="bg-[#111111] border-[#1f1f1f] h-full flex flex-col">
      <CardContent className="p-4 flex flex-col h-full">
        {/* 状态显示 */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2">
            {isProcessing && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#F5A623]" />
                <span className="text-[#F5A623] text-sm font-medium">生成中...</span>
              </>
            )}
            {isCompleted && (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-500 text-sm font-medium">生成完成</span>
              </>
            )}
            {isFailed && (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-500 text-sm font-medium">生成失败</span>
              </>
            )}
          </div>
          <span className="text-xs text-gray-600">
            {formatDateTime(task.createdAt)}
          </span>
        </div>

        {/* 进度条 */}
        {isProcessing && (
          <div className="mb-3 shrink-0">
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1 text-center">
              {task.progress}%
            </p>
          </div>
        )}

        {/* 错误信息 */}
        {isFailed && task.error && (
          <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg shrink-0">
            <p className="text-sm text-red-400">{task.error}</p>
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="mt-2 border-red-500/50 text-red-400 hover:bg-red-500/10 h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                重试
              </Button>
            )}
          </div>
        )}

        {/* 结果展示 */}
        {isCompleted && result && (
          <div className="flex-1 flex flex-col min-h-0 overflow-auto">
            {/* 图片结果 */}
            {'width' in result && 'height' in result && !('duration' in result) && (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-[#1f1f1f] bg-[#0a0a0a] flex items-center justify-center" style={{ minHeight: '200px', maxHeight: '450px' }}>
                  <img
                    src={result.url}
                    alt="生成的图片"
                    className="max-w-full max-h-[450px] object-contain"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <span className="tag">
                    {result.width} × {result.height}
                  </span>
                  {'resolution' in result && (
                    <span className="tag">
                      {result.resolution}
                    </span>
                  )}
                  {'ratio' in result && (
                    <span className="tag">
                      {result.ratio}
                    </span>
                  )}
                </div>

                {onDownload && (
                  <Button
                    onClick={() => onDownload(result.url, `ai-generated-${Date.now()}.png`)}
                    className="w-full btn-banana h-9 text-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    下载图片
                  </Button>
                )}
              </div>
            )}

            {/* 视频结果 */}
            {'duration' in result && (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-[#1f1f1f]">
                  <video
                    src={result.url}
                    controls
                    className="w-full max-h-[300px]"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <span className="tag">
                    {result.width} × {result.height}
                  </span>
                  {'resolution' in result && (
                    <span className="tag">
                      {result.resolution}
                    </span>
                  )}
                  {'duration' in result && (
                    <span className="tag">
                      {result.duration}秒
                    </span>
                  )}
                </div>

                {onDownload && (
                  <Button
                    onClick={() => onDownload(result.url, `ai-video-${Date.now()}.mp4`)}
                    className="w-full btn-banana h-9 text-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    下载视频
                  </Button>
                )}
              </div>
            )}

            {/* 提示词展示 */}
            <div className="mt-3 p-3 bg-[#0a0a0a] rounded-lg border border-[#1f1f1f]">
              <p className="text-xs text-gray-600 mb-1">提示词：</p>
              <p className="text-sm text-gray-300">{result.prompt}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
