import React from 'react';
import { VideoIcon } from 'lucide-react';

export default function Video() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">视频生成</h1>
      <div className="text-zinc-400 text-center py-12">
        <VideoIcon className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
        <p>视频生成功能开发中...</p>
        <p className="text-sm mt-2">支持文生视频、图生视频</p>
      </div>
    </div>
  );
}