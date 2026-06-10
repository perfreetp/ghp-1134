import { NavLink, useLocation } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Building,
  Package,
  ClipboardList,
  AlertTriangle,
  Users,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '总览', icon: LayoutDashboard },
  { path: '/buildings', label: '建筑档案', icon: Building },
  { path: '/equipment', label: '设备台账', icon: Package },
  { path: '/inspections', label: '巡检任务', icon: ClipboardList },
  { path: '/hazards', label: '隐患整改', icon: AlertTriangle },
  { path: '/drills', label: '演练记录', icon: Users },
  { path: '/reports', label: '统计报表', icon: BarChart3 },
];

const currentUser = {
  name: '张建国',
  role: '安全管理员',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangjianguo',
};

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-steel-900 text-white flex flex-col flex-shrink-0">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10 flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-gradient-fire flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wide">消防巡检平台</h1>
          <p className="text-xs text-steel-400">Fire Inspection System</p>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-fire text-white shadow-lg shadow-fire-500/20'
                  : 'text-steel-300 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 flex-shrink-0',
                isActive ? 'text-white' : 'text-steel-400 group-hover:text-white'
              )} />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 flex-shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full bg-steel-800 ring-2 ring-white/10"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
            <p className="text-xs text-steel-400 truncate">{currentUser.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
