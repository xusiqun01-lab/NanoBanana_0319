import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Download, RefreshCw, AlertCircle, Info, AlertTriangle, Bug } from 'lucide-react';
import type { SystemLog, LogLevel } from '@/types';
import { logService } from '@/services/log.service';
import { formatDateTime } from '@/utils/helpers';

interface SystemLogsProps {
  isAdmin: boolean;
}

export const SystemLogs = ({ isAdmin }: SystemLogsProps) => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
  const [filter, setFilter] = useState<{
    level?: LogLevel;
    search: string;
  }>({ search: '' });
  const [stats, setStats] = useState({
    total: 0,
    info: 0,
    warning: 0,
    error: 0,
    debug: 0,
  });

  useEffect(() => {
    if (isAdmin) {
      refreshLogs();
    }
  }, [isAdmin]);

  useEffect(() => {
    applyFilter();
  }, [logs, filter]);

  const refreshLogs = () => {
    const allLogs = logService.getAllLogs();
    setLogs(allLogs);
    setStats(logService.getStats());
  };

  const applyFilter = () => {
    let filtered = [...logs];

    if (filter.level) {
      filtered = filtered.filter(l => l.level === filter.level);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(l =>
        l.message.toLowerCase().includes(searchLower) ||
        l.details?.toLowerCase().includes(searchLower) ||
        l.module.toLowerCase().includes(searchLower)
      );
    }

    setFilteredLogs(filtered);
  };

  const handleClearLogs = () => {
    if (!confirm('确定要清空所有日志吗？')) return;
    logService.clearLogs();
    refreshLogs();
  };

  const handleExportLogs = () => {
    const data = logService.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-gray-400" />;
    }
  };

  const getLevelClass = (level: LogLevel) => {
    switch (level) {
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/10 border-red-500/30';
      case 'debug':
        return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">您没有权限查看系统日志</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-[#111111] border-[#1f1f1f]">
          <CardContent className="pt-3">
            <p className="text-xs text-gray-500">总日志数</p>
            <p className="text-xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-[#1f1f1f]">
          <CardContent className="pt-3">
            <p className="text-xs text-blue-400">信息</p>
            <p className="text-xl font-bold text-blue-400">{stats.info}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-[#1f1f1f]">
          <CardContent className="pt-3">
            <p className="text-xs text-yellow-400">警告</p>
            <p className="text-xl font-bold text-yellow-400">{stats.warning}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-[#1f1f1f]">
          <CardContent className="pt-3">
            <p className="text-xs text-red-400">错误</p>
            <p className="text-xl font-bold text-red-400">{stats.error}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-[#1f1f1f]">
          <CardContent className="pt-3">
            <p className="text-xs text-gray-500">调试</p>
            <p className="text-xl font-bold text-gray-400">{stats.debug}</p>
          </CardContent>
        </Card>
      </div>

      {/* 过滤器 */}
      <Card className="bg-[#111111] border-[#1f1f1f]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">日志筛选</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="w-40">
              <Label className="text-gray-400 text-xs">日志级别</Label>
              <Select
                value={filter.level || 'all'}
                onValueChange={(v) => setFilter(prev => ({ ...prev, level: v === 'all' ? undefined : v as LogLevel }))}
              >
                <SelectTrigger className="bg-[#0a0a0a] border-[#1f1f1f] text-white h-9 text-sm">
                  <SelectValue placeholder="全部级别" />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border-[#1f1f1f]">
                  <SelectItem value="all" className="text-white text-sm">全部级别</SelectItem>
                  <SelectItem value="info" className="text-white text-sm">信息</SelectItem>
                  <SelectItem value="warning" className="text-white text-sm">警告</SelectItem>
                  <SelectItem value="error" className="text-white text-sm">错误</SelectItem>
                  <SelectItem value="debug" className="text-white text-sm">调试</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-gray-400 text-xs">搜索</Label>
              <Input
                placeholder="搜索日志内容..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 h-9 text-sm"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={refreshLogs} className="border-[#1f1f1f] text-gray-400 hover:bg-[#1a1a1a] hover:text-white h-9 text-sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                刷新
              </Button>
              <Button variant="outline" onClick={handleExportLogs} className="border-[#1f1f1f] text-gray-400 hover:bg-[#1a1a1a] hover:text-white h-9 text-sm">
                <Download className="h-4 w-4 mr-1" />
                导出
              </Button>
              <Button variant="destructive" onClick={handleClearLogs} className="h-9 text-sm">
                <Trash2 className="h-4 w-4 mr-1" />
                清空
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 日志列表 */}
      <Card className="bg-[#111111] border-[#1f1f1f]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            日志列表 ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-gray-600 py-8">暂无日志</p>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-lg border ${getLevelClass(log.level)}`}
                >
                  <div className="flex items-start gap-2">
                    {getLevelIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-200">{log.message}</span>
                        <span className="text-xs text-gray-600">
                          [{log.module}]
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-sm text-gray-500 mt-1">{log.details}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                        <span>{formatDateTime(log.timestamp)}</span>
                        {log.userId && <span>用户: {log.userId}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
