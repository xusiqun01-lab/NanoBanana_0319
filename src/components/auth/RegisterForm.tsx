import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { RegisterData } from '@/types';
import { validateEmail, validatePassword } from '@/utils/helpers';

interface RegisterFormProps {
  onRegister: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  onSwitchToLogin: () => void;
}

export const RegisterForm = ({ onRegister, onSwitchToLogin }: RegisterFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ valid: false, message: '' });

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(validatePassword(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('请输入昵称');
      return;
    }
    if (!email.trim()) {
      setError('请输入邮箱');
      return;
    }
    if (!validateEmail(email)) {
      setError('邮箱格式不正确');
      return;
    }
    if (!passwordStrength.valid) {
      setError(passwordStrength.message);
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    const result = await onRegister({ email, password, name });
    setIsLoading(false);

    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-[#111111] border-[#1f1f1f]">
      <CardHeader className="text-center">
        {/* 香蕉Logo */}
        <div className="w-16 h-16 mx-auto mb-4">
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
        <CardTitle className="text-2xl text-white">创建账号</CardTitle>
        <CardDescription className="text-gray-500">加入香蕉AI，开启创作之旅</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-400 text-sm">昵称</Label>
            <Input
              id="name"
              type="text"
              placeholder="请输入您的昵称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 focus:border-[#F5A623] focus:ring-0 h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-400 text-sm">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 focus:border-[#F5A623] focus:ring-0 h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-400 text-sm">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="至少6位，包含字母和数字"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              disabled={isLoading}
              className="bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 focus:border-[#F5A623] focus:ring-0 h-10"
            />
            {password && (
              <div className="flex items-center gap-1 text-xs">
                {passwordStrength.valid ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">{passwordStrength.message}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                    <span className="text-orange-500">{passwordStrength.message}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-400 text-sm">确认密码</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className="bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 focus:border-[#F5A623] focus:ring-0 h-10"
            />
          </div>

          <Button
            type="submit"
            className="w-full btn-banana h-10 mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                注册中...
              </>
            ) : (
              '注册'
            )}
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-500">已有账号？</span>{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-[#F5A623] hover:underline font-medium"
              disabled={isLoading}
            >
              立即登录
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
