import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Download, Trash2, Image as ImageIcon, Video } from 'lucide-react';
import type { GalleryItem } from '@/types';
import { formatRelativeTime, truncateText } from '@/utils/helpers';

interface GalleryGridProps {
  items: GalleryItem[];
  onDelete: (itemId: string) => Promise<void>;
  onDownload: (url: string, filename: string) => Promise<void>;
  isLoading: boolean;
}

export const GalleryGrid = ({ items, onDelete, onDownload, isLoading }: GalleryGridProps) => {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePreview = (item: GalleryItem) => {
    setSelectedItem(item);
    setPreviewOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('确定要删除这个作品吗？')) return;
    await onDelete(itemId);
  };

  const handleDownload = async (item: GalleryItem) => {
    const ext = item.type === 'image' ? 'png' : 'mp4';
    const filename = `ai-${item.type}-${item.id}.${ext}`;
    await onDownload(item.url, filename);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-10 h-10"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <ImageIcon className="h-14 w-14 mb-4 text-gray-700" />
        <p>您的图库还是空的</p>
        <p className="text-sm mt-2 text-gray-600">开始创作，您的作品将保存在这里</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {items.map((item) => (
          <Card
            key={item.id}
            className="group cursor-pointer overflow-hidden bg-[#111111] border-[#1f1f1f] hover:border-[#2a2a2a] transition-all"
            onClick={() => handlePreview(item)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-square">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.prompt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-[#050505] flex items-center justify-center">
                    <Video className="h-10 w-10 text-gray-700" />
                  </div>
                )}
                
                {/* 类型标签 */}
                <div className="absolute top-2 left-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    item.type === 'image'
                      ? 'bg-blue-500/80 text-white'
                      : 'bg-purple-500/80 text-white'
                  }`}>
                    {item.type === 'image' ? '图片' : '视频'}
                  </span>
                </div>

                {/* 悬停操作 */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(item);
                    }}
                    className="bg-[#F5A623] text-black hover:bg-[#E6A020] h-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="h-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-2.5">
                <p className="text-sm text-gray-300 line-clamp-2">
                  {truncateText(item.prompt, 40)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {formatRelativeTime(item.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 预览对话框 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto bg-[#111111] border-[#1f1f1f]">
          {selectedItem && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    selectedItem.type === 'image'
                      ? 'bg-blue-500/80 text-white'
                      : 'bg-purple-500/80 text-white'
                  }`}>
                    {selectedItem.type === 'image' ? '图片' : '视频'}
                  </span>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(selectedItem.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(selectedItem)}
                    className="border-[#F5A623] text-[#F5A623] hover:bg-[#F5A623]/10 h-8"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    下载
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(selectedItem.id)}
                    className="h-8"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    删除
                  </Button>
                </div>
              </div>

              <div className="rounded-lg overflow-hidden border border-[#1f1f1f]">
                {selectedItem.type === 'image' ? (
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.prompt}
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                ) : (
                  <video
                    src={selectedItem.url}
                    controls
                    className="w-full max-h-[400px]"
                  />
                )}
              </div>

              <div className="p-3 bg-[#0a0a0a] rounded-lg border border-[#1f1f1f]">
                <p className="text-xs text-gray-600 mb-1">提示词：</p>
                <p className="text-sm text-gray-300">{selectedItem.prompt}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="tag">
                  {selectedItem.width} × {selectedItem.height}
                </span>
                {selectedItem.metadata?.resolution && (
                  <span className="tag">
                    {selectedItem.metadata.resolution}
                  </span>
                )}
                {selectedItem.metadata?.ratio && (
                  <span className="tag">
                    {selectedItem.metadata.ratio}
                  </span>
                )}
                {selectedItem.metadata?.duration && (
                  <span className="tag">
                    {selectedItem.metadata.duration}秒
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
