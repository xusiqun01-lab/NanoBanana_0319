import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Image, Video, FolderOpen, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/text2img', icon: Image, label: '文生图' },
    { path: '/img2img', icon: Image, label: '图生图' },
    { path: '/multiimg', icon: Image, label: '多图生图' },
    { path: '/video', icon: Video, label: '视频生成' },
    { path: '/history', icon: FolderOpen, label: '历史记录' },
    { path: '/settings', icon: Settings, label: '设置' },
  ];

  return (
    <>
      {/* 移动端遮罩 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar 主体 */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-zinc-900 border-r border-zinc-800 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        !isOpen && "-translate-x-full"
      )}>
        {/* Logo 区域 */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-lg">B</span>
          </div>
          <span className="text-white font-semibold text-lg">香蕉AI</span>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* 底部退出按钮 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
          <button 
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;