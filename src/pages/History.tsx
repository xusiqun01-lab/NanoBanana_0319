import React from 'react';
import { FolderOpen } from 'lucide-react';

export default function History() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">历史记录</h1>
      <div className="text-zinc-400 text-center py-12">
        <FolderOpen className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
        <p>暂无历史记录</p>
        <p className="text-sm mt-2">生成的图片将保存在这里</p>
      </div>
    </div>
  );
}