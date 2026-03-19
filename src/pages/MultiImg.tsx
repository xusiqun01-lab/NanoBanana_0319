import React from 'react';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';

export default function MultiImg() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">多图生图</h1>
      <div className="text-zinc-400 text-center py-12">
        <Layers className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
        <p>多图生图功能开发中...</p>
        <p className="text-sm mt-2">支持上传多张参考图生成新图片</p>
      </div>
    </div>
  );
}