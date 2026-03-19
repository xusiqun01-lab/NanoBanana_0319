import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');

  const handleSave = () => {
    localStorage.setItem('apiKey', apiKey);
    alert('API Key 已保存');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">设置</h1>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <div>
          <Label className="text-zinc-400">API Key</Label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="输入你的 API Key"
            className="bg-zinc-800 border-zinc-700 text-white mt-2"
          />
          <p className="text-xs text-zinc-500 mt-1">
            你的 API Key 将保存在本地浏览器中
          </p>
        </div>

        <Button 
          onClick={handleSave}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          <Save className="w-4 h-4 mr-2" />
          保存设置
        </Button>
      </div>
    </div>
  );
}