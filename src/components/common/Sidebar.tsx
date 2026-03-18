import { useState } from 'react';
import { 
  Home,
  Image, 
  Images, 
  Video, 
  FolderOpen, 
  Settings, 
  Users, 
  FileText, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import type { User } from '@/types';

interface SidebarProps {
  user: User | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: ('admin' | 'user')[];
}

const navItems: NavItem[] = [
  { id: 'home', label: '首页', icon: Home, roles: ['admin', 'user'] },
  { id: 'text-to-image', label: '文生图', icon: Image, roles: ['admin', 'user'] },
  { id: 'image-to-image', label: '图生图', icon: Images, roles: ['admin', 'user'] },
  { id: 'video-generation', label: '视频生成', icon: Video, roles: ['admin', 'user'] },
  { id: 'gallery', label: '图库', icon: FolderOpen, roles: ['admin', 'user'] },
  { id: 'api-config', label: 'API配置', icon: Settings, roles: ['admin', 'user'] },
  { id: 'users', label: '用户管理', icon: Users, roles: ['admin'] },
  { id: 'logs', label: '系统日志', icon: FileText, roles: ['admin'] },
];

export const Sidebar = ({ user, activeTab, onTabChange, onLogout }: SidebarProps) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const filteredNavItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  return (
    <aside className="w-56 bg-[#0a0a0a] border-r border-[#1f1f1f] flex flex-col h-full shrink-0">
      {/* Logo区域 */}
      <div className="p-4 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-3">
          {/* 香蕉Logo - CSS绘制 */}
          <div className="w-9 h-9 rounded-xl bg-[#F5A623] flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
              {/* 剥皮香蕉 - 香蕉皮 */}
              <path 
                d="M12 36C12 36 16 40 24 40C32 40 36 32 36 24C36 18 33 12 30 10C28 9 27 10 27 12C27 14 28 16 28 20C28 28 22 34 16 36C14 37 12 36 12 36Z" 
                fill="#D48A0F"
              />
              {/* 剥皮香蕉 - 果肉 */}
              <ellipse cx="24" cy="22" rx="8" ry="14" fill="#FFF8DC" transform="rotate(-15 24 22)"/>
              {/* 香蕉皮翻开部分 */}
              <path d="M18 32C18 32 14 28 16 22C18 16 22 12 22 12" stroke="#F5A623" strokeWidth="3" strokeLinecap="round"/>
              <path d="M30 32C30 32 34 28 32 22C30 16 26 12 26 12" stroke="#F5A623" strokeWidth="3" strokeLinecap="round"/>
              {/* 香蕉顶部 */}
              <ellipse cx="30" cy="11" rx="2" ry="3" fill="#8B6914"/>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-white">香蕉 AI</h1>
            <p className="text-[10px] text-gray-500">专业图像生成</p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        <div className="mb-2 px-2">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">创作</span>
        </div>
        
        {filteredNavItems.filter(item => 
          ['home', 'text-to-image', 'image-to-image', 'video-generation'].includes(item.id)
        ).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHovered = hoveredItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5
                text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'active text-[#F5A623] bg-gradient-to-r from-[rgba(245,166,35,0.1)] to-transparent' 
                  : 'text-gray-400 hover:text-white'
                }
              `}
            >
              <Icon className={`w-4 h-4 transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`} />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight 
                className={`w-3.5 h-3.5 transition-all duration-200 ${
                  isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'
                }`} 
              />
            </button>
          );
        })}

        <div className="mt-4 mb-2 px-2">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">管理</span>
        </div>

        {filteredNavItems.filter(item => 
          ['gallery', 'api-config', 'users', 'logs'].includes(item.id)
        ).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHovered = hoveredItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5
                text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'active text-[#F5A623] bg-gradient-to-r from-[rgba(245,166,35,0.1)] to-transparent' 
                  : 'text-gray-400 hover:text-white'
                }
              `}
            >
              <Icon className={`w-4 h-4 transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`} />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight 
                className={`w-3.5 h-3.5 transition-all duration-200 ${
                  isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'
                }`} 
              />
            </button>
          );
        })}
      </nav>

      {/* 用户信息 */}
      <div className="p-3 border-t border-[#1f1f1f]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#F5A623] to-[#D48A0F] flex items-center justify-center text-black font-bold text-xs">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md
            text-xs text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
};
