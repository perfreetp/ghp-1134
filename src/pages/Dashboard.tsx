import { useState, useMemo } from 'react';
import {
  Building,
  Package,
  AlertTriangle,
  ClipboardList,
  RefreshCw,
  Download,
  ChevronRight,
  Search,
  Clock,
  CalendarDays,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import { useCountUp } from '@/hooks/useCountUp';
import { useAppStore } from '@/store';
import {
  RiskLevelLabels,
  EquipmentStatusLabels,
} from '@/types';
import { cn, formatDate, getStatusColor, isOverdue, exportToCSV } from '@/utils';

type TodoTab = 'inspection' | 'hazard' | 'review';

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  subTitle: string;
  subValue: string;
  trend?: 'up' | 'down';
  delay?: number;
}

function StatCard({
  title,
  value,
  suffix = '',
  icon: Icon,
  gradient,
  subTitle,
  subValue,
  trend,
  delay = 0,
}: StatCardProps) {
  const displayValue = useCountUp(value, 1200, delay);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 shadow-card text-white transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5'
      )}
      style={{ backgroundImage: gradient }}
    >
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/5 blur-xl" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="mt-2 text-4xl font-bold tracking-tight">
            {displayValue.toLocaleString()}
            {suffix && <span className="text-2xl font-medium">{suffix}</span>}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-2 text-sm text-white/75">
        <span>{subTitle}</span>
        <span className="font-semibold text-white">{subValue}</span>
        {trend === 'up' && (
          <ArrowUpRight className="h-4 w-4 text-emerald-200" />
        )}
        {trend === 'down' && (
          <ArrowDownRight className="h-4 w-4 text-red-200" />
        )}
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colorClass = getStatusColor(level, 'bg');
  const textClass = getStatusColor(level, 'text');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        textClass
      )}
    >
      {RiskLevelLabels[level as keyof typeof RiskLevelLabels]}
    </span>
  );
}

function PriorityDot({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const colorMap = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-blue-500',
  };
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        colorMap[priority]
      )}
    />
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TodoTab>('inspection');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    getStatistics,
    getTrendData,
    getTopRiskBuildings,
    getEquipmentStatusDistribution,
    getTodoItems,
    refreshData,
  } = useAppStore();

  const statistics = useMemo(() => getStatistics(), [getStatistics]);
  const trendData = useMemo(() => getTrendData(), [getTrendData]);
  const topRiskBuildings = useMemo(() => getTopRiskBuildings(), [getTopRiskBuildings]);
  const equipmentDistribution = useMemo(
    () => getEquipmentStatusDistribution(),
    [getEquipmentStatusDistribution]
  );
  const todoItems = useMemo(() => getTodoItems(), [getTodoItems]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshData();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleExport = () => {
    const stats = getStatistics();
    const csvData = [
      { 指标: '楼栋总数', 数值: stats.total_buildings },
      { 指标: '设备总数', 数值: stats.total_equipment },
      { 指标: '待处理隐患', 数值: stats.pending_hazards },
      { 指标: '逾期隐患', 数值: stats.overdue_count },
      { 指标: '本月完成巡检', 数值: stats.completed_tasks_this_month },
      { 指标: '巡检完成率(30天)', 数值: `${stats.inspection_rate_30d}%` },
      { 指标: '隐患整改率', 数值: `${stats.rectification_rate}%` },
      { 指标: '设备完好率', 数值: `${stats.equipment_normal_rate}%` },
    ];
    exportToCSV(csvData, `风险总览简报_${formatDate(new Date())}.csv`);
  };

  const currentTodos =
    activeTab === 'inspection'
      ? todoItems.inspections
      : activeTab === 'hazard'
      ? todoItems.hazards
      : todoItems.reviews;

  const todoTabConfig = [
    { key: 'inspection' as TodoTab, label: '待巡检', count: todoItems.inspections.length },
    { key: 'hazard' as TodoTab, label: '待整改', count: todoItems.hazards.length },
    { key: 'review' as TodoTab, label: '待复查', count: todoItems.reviews.length },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题区域 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">风险总览</h1>
          <p className="mt-1 text-sm text-slate-500">实时监测园区消防安全态势</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
          >
            <RefreshCw
              className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
            />
            刷新
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-fire px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md"
          >
            <Download className="h-4 w-4" />
            导出简报
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="楼栋总数"
          value={statistics.total_buildings}
          icon={Building}
          gradient="linear-gradient(135deg, #1E3A5F 0%, #39546E 100%)"
          subTitle="较上月"
          subValue="+1"
          trend="up"
          delay={0}
        />
        <StatCard
          title="设备总数"
          value={statistics.total_equipment}
          icon={Package}
          gradient="linear-gradient(135deg, #059669 0%, #047857 100%)"
          subTitle="完好率"
          subValue={`${statistics.equipment_normal_rate}%`}
          trend="up"
          delay={100}
        />
        <StatCard
          title="待处理隐患"
          value={statistics.pending_hazards}
          icon={AlertTriangle}
          gradient="linear-gradient(135deg, #EA580C 0%, #DC2626 100%)"
          subTitle="逾期"
          subValue={`${statistics.overdue_count} 项`}
          trend="down"
          delay={200}
        />
        <StatCard
          title="本月巡检"
          value={statistics.completed_tasks_this_month}
          suffix="项"
          icon={ClipboardList}
          gradient="linear-gradient(135deg, #DC2626 0%, #991B1B 100%)"
          subTitle="完成率"
          subValue={`${statistics.inspection_rate_30d}%`}
          trend="up"
          delay={300}
        />
      </div>

      {/* 中间区域 - 趋势图 + 风险楼栋 */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* 趋势图表 */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">近30天趋势</h3>
              <p className="mt-0.5 text-xs text-slate-500">巡检完成率与隐患整改率对比</p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInspection" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5A81A2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#5A81A2" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRectification" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#94A3B8"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#94A3B8"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.08)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value}%`]}
                  labelStyle={{ color: '#475569', fontWeight: 600 }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '8px' }}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-slate-600">{value}</span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="inspection_rate"
                  name="巡检完成率"
                  stroke="#5A81A2"
                  strokeWidth={2.5}
                  fill="url(#colorInspection)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="rectification_rate"
                  name="隐患整改率"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  fill="url(#colorRectification)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 风险楼栋 Top5 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">风险楼栋 Top5</h3>
              <p className="mt-0.5 text-xs text-slate-500">按风险等级排序</p>
            </div>
            <a className="inline-flex items-center gap-1 text-xs font-medium text-fire-600 hover:text-fire-700 cursor-pointer">
              查看全部
              <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="space-y-3">
            {topRiskBuildings.map((building, index) => (
              <div
                key={building.id}
                className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                    index === 0
                      ? 'bg-red-100 text-red-700'
                      : index === 1
                      ? 'bg-orange-100 text-orange-700'
                      : index === 2
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-900 group-hover:text-fire-600">
                      {building.name}
                    </p>
                    <RiskBadge level={building.risk_level} />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                      {building.hazard_count} 隐患
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3 text-steel-500" />
                      {building.equipment_count} 设备
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部区域 - 待办提醒 + 设备状态 */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* 待办提醒 */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">待办提醒</h3>
              <p className="mt-0.5 text-xs text-slate-500">近期需要关注的事项</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 px-2">
            {todoTabConfig.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative flex-1 px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'text-fire-600'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  {tab.label}
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                      activeTab === tab.key
                        ? 'bg-fire-100 text-fire-700'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {tab.count}
                  </span>
                </span>
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-fire-500" />
                )}
              </button>
            ))}
          </div>

          {/* Todo 列表 */}
          <div className="divide-y divide-slate-100 p-2">
            {currentTodos.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                <p className="mt-2 text-sm text-slate-500">暂无待办事项</p>
              </div>
            ) : (
              currentTodos.map((todo) => {
                const overdue = isOverdue(todo.due_date);
                const Icon =
                  todo.type === 'inspection'
                    ? ClipboardList
                    : todo.type === 'hazard'
                    ? AlertTriangle
                    : Search;
                const iconBg =
                  todo.type === 'inspection'
                    ? 'bg-sky-100 text-sky-600'
                    : todo.type === 'hazard'
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-violet-100 text-violet-600';

                return (
                  <div
                    key={todo.id}
                    className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50"
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                        iconBg
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <PriorityDot priority={todo.priority} />
                          <p className="truncate text-sm font-medium text-slate-900">
                            {todo.title}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-fire-300 hover:bg-fire-50 hover:text-fire-600">
                            处理
                          </button>
                        </div>
                      </div>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {todo.description}
                      </p>

                      <div
                        className={cn(
                          'mt-2 flex items-center gap-1 text-xs',
                          overdue ? 'text-red-600' : 'text-slate-400'
                        )}
                      >
                        <CalendarDays className="h-3 w-3" />
                        <span>
                          {overdue ? '截止于 ' : '截止 '}
                          {formatDate(todo.due_date)}
                        </span>
                        {overdue && (
                          <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-red-100 px-1.5 py-0.5 text-red-700">
                            <Clock className="h-2.5 w-2.5" />
                            已逾期
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 设备状态分布 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">设备状态分布</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                共 {statistics.total_equipment} 台设备
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 饼图 */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={equipmentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                    label={({ value }) => value}
                    labelLine={false}
                  >
                    {equipmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.08)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} 台 (${Math.round(
                        (value / statistics.total_equipment) * 100
                      )}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 图例列表 */}
            <div className="flex flex-col justify-center space-y-3 pl-2">
              {equipmentDistribution.map((item) => {
                const percentage =
                  statistics.total_equipment > 0
                    ? Math.round((item.value / statistics.total_equipment) * 100)
                    : 0;

                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium text-slate-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-slate-900">{item.value}</span>
                        <span className="ml-1 text-xs text-slate-500">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
