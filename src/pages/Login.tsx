import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // 临时登录逻辑
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('user', JSON.stringify({ email: email || 'guest@banana.ai' }));
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-xl">B</span>
          </div>
          <h1 className="text-2xl font-bold text-white">香蕉AI</h1>
          <p className="text-zinc-400 mt-2">登录你的账户</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400">邮箱</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400">密码</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
            />
          </div>

          <Button 
            onClick={handleLogin}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black mt-6"
          >
            登录
          </Button>

          <Button 
            variant="outline"
            onClick={handleLogin}
            className="w-full border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            游客访问
          </Button>
        </div>
      </div>
    </div>
  );
}