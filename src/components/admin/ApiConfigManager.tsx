import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, CheckCircle, ExternalLink, Key, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UserApiConfig, ApiProvider } from '@/types';
import { apiConfigService } from '@/services/apiConfig.service';

interface ApiConfigManagerProps {
  configs: UserApiConfig[];
  providers: ApiProvider[];
  onRefresh: () => void;
}

export const ApiConfigManager = ({ configs, providers, onRefresh }: ApiConfigManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: '',
    providerId: '',
    apiKey: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddConfig = async () => {
    if (!newConfig.name.trim() || !newConfig.providerId || !newConfig.apiKey.trim()) {
      return;
    }

    setIsSubmitting(true);
    const result = await apiConfigService.addConfig({
      name: newConfig.name.trim(),
      providerId: newConfig.providerId,
      apiKey: newConfig.apiKey.trim(),
      isActive: configs.length === 0,
    });
    setIsSubmitting(false);

    if (result.success) {
      setNewConfig({ name: '', providerId: '', apiKey: '' });
      setIsAddDialogOpen(false);
      onRefresh();
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('确定要删除这个API配置吗？')) return;

    const result = await apiConfigService.deleteConfig(configId);
    if (result.success) {
      onRefresh();
    }
  };

  const handleSetActive = async (configId: string) => {
    const result = await apiConfigService.setActiveConfig(configId);
    if (result.success) {
      onRefresh();
    }
  };

  const getProviderName = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    return provider?.name || providerId;
  };

  const getProviderUrl = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    return provider?.tokenUrl || provider?.consoleUrl;
  };

  // 按类型分组
  const imageConfigs = configs.filter(c => {
    const p = providers.find(prov => prov.id === c.providerId);
    return p?.type === 'image';
  });

  const videoConfigs = configs.filter(c => {
    const p = providers.find(prov => prov.id === c.providerId);
    return p?.type === 'video';
  });

  const renderConfigList = (configList: UserApiConfig[], title: string) => (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-400 text-sm">{title}</h3>
      {configList.length === 0 ? (
        <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#1f1f1f] text-center">
          <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">暂无配置</p>
        </div>
      ) : (
        <div className="space-y-2">
          {configList.map((config) => (
            <div
              key={config.id}
              className={`p-3 rounded-lg border transition-all ${
                config.isActive
                  ? 'border-[#F5A623] bg-[rgba(245,166,35,0.05)]'
                  : 'border-[#1f1f1f] bg-[#0a0a0a]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-white text-sm">{config.name}</span>
                  {config.isActive && (
                    <span className="px-1.5 py-0.5 bg-[#F5A623] text-black text-[10px] rounded font-medium">
                      默认
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!config.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetActive(config.id)}
                      className="text-gray-500 hover:text-[#F5A623] h-8 w-8 p-0"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteConfig(config.id)}
                    className="text-gray-500 hover:text-red-400 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {getProviderName(config.providerId)} · 
                {' ****' + config.apiKey.slice(-4)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">API配置管理</h2>
          <p className="text-sm text-gray-500">管理您的图片和视频生成API密钥</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-banana h-9 text-sm">
              <Plus className="h-4 w-4 mr-1.5" />
              添加配置
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-[#111111] border-[#1f1f1f]">
            <DialogHeader>
              <DialogTitle className="text-white text-base">添加API配置</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">配置名称</Label>
                <Input
                  placeholder="例如：我的贞贞API"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 focus:border-[#F5A623] h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">API供应商</Label>
                <Select
                  value={newConfig.providerId}
                  onValueChange={(v) => setNewConfig(prev => ({ ...prev, providerId: v }))}
                >
                  <SelectTrigger className="bg-[#0a0a0a] border-[#1f1f1f] text-white h-9 text-sm">
                    <SelectValue placeholder="选择供应商" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111111] border-[#1f1f1f]">
                    {providers.map((provider) => (
                      <SelectItem 
                        key={provider.id} 
                        value={provider.id}
                        className="text-white hover:bg-[#1f1f1f] text-sm"
                      >
                        {provider.name} ({provider.type === 'image' ? '图片' : '视频'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newConfig.providerId && (
                <div className="text-xs text-gray-500">
                  获取API Key:{' '}
                  <a
                    href={getProviderUrl(newConfig.providerId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#F5A623] hover:underline inline-flex items-center"
                  >
                    点击访问
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">API Key</Label>
                <Input
                  type="password"
                  placeholder="输入您的API密钥"
                  value={newConfig.apiKey}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 focus:border-[#F5A623] h-9 text-sm"
                />
              </div>
              <Button
                onClick={handleAddConfig}
                disabled={isSubmitting || !newConfig.name.trim() || !newConfig.providerId || !newConfig.apiKey.trim()}
                className="w-full btn-banana h-9 text-sm"
              >
                {isSubmitting ? '添加中...' : '添加配置'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="bg-[#111111] border-[#1f1f1f]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">图片生成API</CardTitle>
          </CardHeader>
          <CardContent>
            {renderConfigList(imageConfigs, '图片生成配置')}
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-[#1f1f1f]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">视频生成API</CardTitle>
          </CardHeader>
          <CardContent>
            {renderConfigList(videoConfigs, '视频生成配置')}
          </CardContent>
        </Card>
      </div>

      {/* 可用供应商列表 */}
      <Card className="bg-[#111111] border-[#1f1f1f]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">可用API供应商</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="p-3 bg-[#0a0a0a] rounded-lg border border-[#1f1f1f]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white text-sm">{provider.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    provider.type === 'image'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {provider.type === 'image' ? '图片' : '视频'}
                  </span>
                </div>
                <a
                  href={provider.tokenUrl || provider.consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#F5A623] hover:underline inline-flex items-center"
                >
                  获取API Key
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
