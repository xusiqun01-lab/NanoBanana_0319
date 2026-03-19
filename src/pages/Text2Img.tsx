import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageIcon, Loader2 } from 'lucide-react';

export default function Text2Img() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    // TODO: 调用 API 生成图片
    setTimeout(() => {
      setResult('https://via.placeholder.com/512x512/3f3f46/ffffff?text=Generated+Image');
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">文生图</h1>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">提示词</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述你想要生成的图片..."
            className="bg-zinc-900 border-zinc-800 text-white min-h-[120px]"
          />
        </div>

        <Button 
          onClick={handleGenerate}
          disabled={loading || !prompt}
          className="bg-yellow-500 hover:bg-yellow-600 text-black w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              生成图片
            </>
          )}
        </Button>

        {result && (
          <div className="mt-6">
            <label className="text-sm text-zinc-400 mb-2 block">生成结果</label>
            <img 
              src={result} 
              alt="Generated" 
              className="rounded-lg border border-zinc-800 max-w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}