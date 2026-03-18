import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Shield, User as UserIcon, RefreshCw } from 'lucide-react';
import type { User } from '@/types';
import { authService } from '@/services/auth.service';
import { formatDateTime } from '@/utils/helpers';

interface UserManagerProps {
  isAdmin: boolean;
}

export const UserManager = ({ isAdmin }: UserManagerProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setIsLoading(true);
    const result = await authService.getAllUsers();
    if (result.success && result.data) {
      setUsers(result.data);
    }
    setIsLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除这个用户吗？此操作不可恢复。')) return;

    const result = await authService.deleteUser(userId);
    if (result.success) {
      loadUsers();
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">您没有权限访问用户管理</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">用户管理</h2>
          <p className="text-sm text-gray-500">管理系统所有用户</p>
        </div>
        <Button variant="outline" onClick={loadUsers} className="border-[#1f1f1f] text-gray-400 hover:bg-[#1a1a1a] hover:text-white h-9 text-sm">
          <RefreshCw className="h-4 w-4 mr-1.5" />
          刷新
        </Button>
      </div>

      <Card className="bg-[#111111] border-[#1f1f1f]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <Input
              placeholder="搜索用户..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 h-9 text-sm"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="loading-spinner w-8 h-8"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#1f1f1f]">
                    <TableHead className="text-gray-500 text-xs">用户</TableHead>
                    <TableHead className="text-gray-500 text-xs">角色</TableHead>
                    <TableHead className="text-gray-500 text-xs">注册时间</TableHead>
                    <TableHead className="text-gray-500 text-xs">最后登录</TableHead>
                    <TableHead className="text-gray-500 text-xs">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow className="border-[#1f1f1f]">
                      <TableCell colSpan={5} className="text-center text-gray-600">
                        暂无用户
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-[#1f1f1f]">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-black font-bold text-xs ${
                              user.role === 'admin' ? 'bg-[#F5A623]' : 'bg-gray-600'
                            }`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F5A623]/20 text-[#F5A623] rounded-full text-[10px] font-medium">
                              <Shield className="h-3 w-3" />
                              管理员
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-600/20 text-gray-400 rounded-full text-[10px] font-medium">
                              <UserIcon className="h-3 w-3" />
                              普通用户
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">{formatDateTime(user.createdAt)}</TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '-'}
                        </TableCell>
                        <TableCell>
                          {user.role !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-gray-500 hover:text-red-400 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-[#111111] border-[#1f1f1f]">
          <CardContent className="pt-3">
            <p className="text-xs text-gray-500">总用户数</p>
            <p className="text-xl font-bold text-white">{users.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-[#1f1f1f]">
          <CardContent className="pt-3">
            <p className="text-xs text-gray-500">管理员</p>
            <p className="text-xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-[#1f1f1f]">
          <CardContent className="pt-3">
            <p className="text-xs text-gray-500">普通用户</p>
            <p className="text-xl font-bold text-white">{users.filter(u => u.role === 'user').length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
