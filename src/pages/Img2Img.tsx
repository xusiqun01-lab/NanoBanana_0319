import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, ImageIcon } from 'lucide-react';

export default function Img2Img() {
  const [image, setImage] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">图生图</h1>
      
      <div className="border-2 border-dashed border-zinc-800 rounded-lg p-8 text-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          id="img-upload"
        />
        <label 
          htmlFor="img-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="w-12 h-12 text-zinc-600 mb-4" />
          <span className="text-zinc-400">点击上传图片</span>
        </label>
      </div>

      {image && (
        <div className="mt-6">
          <img 
            src={image} 
            alt="Uploaded" 
            className="rounded-lg border border-zinc-800 max-w-full max-h-[400px] object-contain"
          />
          <Button className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black w-full">
            <ImageIcon className="w-4 h-4 mr-2" />
            开始转换
          </Button>
        </div>
      )}
    </div>
  );
}