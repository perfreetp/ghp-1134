import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  ChevronRight,
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbMap: Record<string, string> = {
  '/': '总览',
  '/buildings': '建筑档案',
  '/equipment': '设备台账',
  '/inspections': '巡检任务',
  '/hazards': '隐患整改',
  '/drills': '演练记录',
  '/reports': '统计报表',
};

const currentUser = {
  name: '张建国',
  role: '安全管理员',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangjianguo',
};

export default function Header() {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentTitle = breadcrumbMap[location.pathname] || '页面';

  return (
    <header className="h-16 bg-white border-b border-steel-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-2 text-sm">
        <Home className="w-4 h-4 text-steel-500" />
        <ChevronRight className="w-4 h-4 text-steel-300" />
        {location.pathname !== '/' && (
          <>
            <span className="text-steel-600 hover:text-steel-900 cursor-pointer transition-colors">首页</span>
            <ChevronRight className="w-4 h-4 text-steel-300" />
          </>
        )}
        <span className="text-steel-900 font-medium">{currentTitle}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 text-steel-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索..."
            className={cn(
              'h-9 w-64 pl-10 pr-4 rounded-lg',
              'bg-steel-50 border border-steel-200',
              'text-sm text-steel-900 placeholder:text-steel-400',
              'focus:outline-none focus:ring-2 focus:ring-fire-500/20 focus:border-fire-500',
              'transition-all duration-200'
            )}
          />
        </div>

        <button className="relative w-9 h-9 rounded-lg hover:bg-steel-100 flex items-center justify-center transition-colors group">
          <Bell className="w-5 h-5 text-steel-600 group-hover:text-steel-900" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-fire-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 pr-3 h-9 rounded-lg hover:bg-steel-100 transition-colors"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full bg-steel-200"
            />
            <span className="text-sm font-medium text-steel-700">{currentUser.name}</span>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className={cn(
                'absolute right-0 top-full mt-2 w-56 z-20',
                'bg-white rounded-xl shadow-elevated border border-steel-200',
                'overflow-hidden animate-fade-in'
              )}>
                <div className="px-4 py-3 border-b border-steel-100">
                  <p className="text-sm font-semibold text-steel-900">{currentUser.name}</p>
                  <p className="text-xs text-steel-500">{currentUser.role}</p>
                </div>
                <div className="py-1">
                  <button className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-steel-700 hover:bg-steel-50 transition-colors">
                    <User className="w-4 h-4" />
                    个人中心
                  </button>
                  <button className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-steel-700 hover:bg-steel-50 transition-colors">
                    <Settings className="w-4 h-4" />
                    系统设置
                  </button>
                </div>
                <div className="border-t border-steel-100 py-1">
                  <button className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-fire-600 hover:bg-fire-50 transition-colors">
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
