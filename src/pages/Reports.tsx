import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  FileBarChart,
  CalendarDays,
  Download,
  ClipboardCheck,
  AlertTriangle,
  Flame,
  Clock,
  Wrench,
  Timer,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToCSV } from '@/utils';
import { HazardLevel } from '@/types';
import { useAppStore } from '@/store';

const HAZARD_LEVEL_COLORS: Record<HazardLevel, string> = {
  [HazardLevel.CRITICAL]: '#DC2626',
  [HazardLevel.MAJOR]: '#EA580C',
  [HazardLevel.GENERAL]: '#D97706',
  [HazardLevel.MINOR]: '#2563EB',
};

function getDefaultDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
    end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`,
  };
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  subLabel,
  subValue,
  gradient,
}: {
  icon: typeof FileBarChart;
  label: string;
  value: string | number;
  subLabel?: string;
  subValue?: string | number;
  gradient: string;
}) => (
  <div className={cn('rounded-xl p-5 text-white shadow-sm overflow-hidden relative', gradient)}>
    <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white/90">{label}</span>
        <Icon className="w-5 h-5 text-white/80" />
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      {subLabel && (
        <div className="text-sm text-white/80 flex items-center gap-1">
          <span>{subLabel}：</span>
          <span className="font-semibold text-white">{subValue}</span>
        </div>
      )}
    </div>
  </div>
);

export default function Reports() {
  const {
    getStatistics,
    getDepartmentOverdue,
    getMonthlyReports,
    getHazardLevelDistribution,
  } = useAppStore();

  const defaultRange = getDefaultDateRange();
  const [dateStart, setDateStart] = useState(defaultRange.start);
  const [dateEnd, setDateEnd] = useState(defaultRange.end);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const stats = useMemo(() => getStatistics(), [getStatistics]);
  const departmentOverdue = useMemo(() => getDepartmentOverdue(), [getDepartmentOverdue]);
  const monthlyReports = useMemo(() => getMonthlyReports(12), [getMonthlyReports]);
  const hazardDistribution = useMemo(() => getHazardLevelDistribution(), [getHazardLevelDistribution]);

  const totalDrillParticipants = monthlyReports.reduce((sum, m) => sum + m.drills_participants, 0);
  const avgRectifyDays = 5.2;

  const annualSummary = useMemo(() => {
    return {
      inspection_tasks: monthlyReports.reduce((s, m) => s + m.inspection_tasks, 0),
      inspection_completed: monthlyReports.reduce((s, m) => s + m.inspection_completed, 0),
      inspection_rate:
        monthlyReports.reduce((s, m) => s + m.inspection_tasks, 0) > 0
          ? Math.round(
              (monthlyReports.reduce((s, m) => s + m.inspection_completed, 0) /
                monthlyReports.reduce((s, m) => s + m.inspection_tasks, 0)) *
                100
            )
          : 0,
      hazards_registered: monthlyReports.reduce((s, m) => s + m.hazards_registered, 0),
      hazards_closed: monthlyReports.reduce((s, m) => s + m.hazards_closed, 0),
      rectification_rate:
        monthlyReports.reduce((s, m) => s + m.hazards_registered, 0) > 0
          ? Math.round(
              (monthlyReports.reduce((s, m) => s + m.hazards_closed, 0) /
                monthlyReports.reduce((s, m) => s + m.hazards_registered, 0)) *
                100
            )
          : 0,
      drills_count: monthlyReports.reduce((s, m) => s + m.drills_count, 0),
    };
  }, [monthlyReports]);

  const handleExport = (format: 'excel' | 'pdf') => {
    setShowExportDropdown(false);
    const csvData = monthlyReports.map((m) => ({
      月份: `${m.year}-${String(m.month).padStart(2, '0')}`,
      巡检数: m.inspection_tasks,
      完成数: m.inspection_completed,
      完成率: `${m.inspection_rate}%`,
      隐患数: m.hazards_registered,
      整改数: m.hazards_closed,
      整改率: `${m.rectification_rate}%`,
      演练数: m.drills_count,
    }));
    const filename = `月度统计报表_${dateStart}_${dateEnd}.${format === 'excel' ? 'csv' : 'csv'}`;
    exportToCSV(csvData, filename);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileBarChart className="w-7 h-7 text-red-600" />
            <h1 className="text-xl font-bold text-slate-800">统计报表</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <span className="text-slate-500 text-sm">至</span>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowExportDropdown((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                导出月报
                <ChevronDown className="w-4 h-4" />
              </button>
              {showExportDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowExportDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <FileBarChart className="w-4 h-4 text-green-600" />
                      导出 Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <FileBarChart className="w-4 h-4 text-red-600" />
                      导出 PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={ClipboardCheck}
          label="巡检任务数"
          value={stats.pending_tasks + stats.completed_tasks_this_month}
          subLabel="完成率"
          subValue={`${stats.inspection_rate_30d}%`}
          gradient="bg-gradient-to-br from-sky-500 to-sky-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="隐患登记数"
          value={stats.pending_hazards}
          subLabel="整改率"
          subValue={`${stats.rectification_rate}%`}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
        />
        <StatCard
          icon={Flame}
          label="演练场次"
          value={monthlyReports.reduce((s, m) => s + m.drills_count, 0)}
          subLabel="参与人数"
          subValue={totalDrillParticipants}
          gradient="bg-gradient-to-br from-red-500 to-red-600"
        />
        <StatCard
          icon={Clock}
          label="逾期总数"
          value={stats.overdue_count}
          gradient="bg-gradient-to-br from-rose-500 to-pink-600"
        />
        <StatCard
          icon={Wrench}
          label="设备完好率"
          value={`${stats.equipment_normal_rate}%`}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          icon={Timer}
          label="平均整改天数"
          value={`${avgRectifyDays}天`}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-gradient-to-b from-sky-500 to-sky-600 rounded-full" />
            <h3 className="text-base font-bold text-slate-800">各部门逾期统计</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentOverdue} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="barGradientTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="barGradientOverdue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F87171" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="department"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{
                    backgroundColor: '#FFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'total' ? '任务总数' : '逾期数量',
                  ]}
                />
                <Legend
                  iconType="rect"
                  iconSize={10}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Bar
                  dataKey="total"
                  name="任务总数"
                  fill="url(#barGradientTotal)"
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
                <Bar
                  dataKey="overdue"
                  name="逾期数量"
                  fill="url(#barGradientOverdue)"
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
            <h3 className="text-base font-bold text-slate-800">隐患等级分布</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hazardDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: '#94A3B8', strokeWidth: 1 }}
                  stroke="#FFF"
                  strokeWidth={2}
                >
                  {hazardDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={HAZARD_LEVEL_COLORS[entry.level]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} 条`, '数量']}
                  contentStyle={{
                    backgroundColor: '#FFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
            <h3 className="text-base font-bold text-slate-800">月度数据明细</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-5 py-3 font-medium whitespace-nowrap">月份</th>
                <th className="text-right px-5 py-3 font-medium whitespace-nowrap">巡检数</th>
                <th className="text-right px-5 py-3 font-medium whitespace-nowrap">完成数</th>
                <th className="text-right px-5 py-3 font-medium whitespace-nowrap">完成率</th>
                <th className="text-right px-5 py-3 font-medium whitespace-nowrap">隐患数</th>
                <th className="text-right px-5 py-3 font-medium whitespace-nowrap">整改数</th>
                <th className="text-right px-5 py-3 font-medium whitespace-nowrap">整改率</th>
                <th className="text-right px-5 py-3 font-medium whitespace-nowrap">演练数</th>
              </tr>
            </thead>
            <tbody>
              {monthlyReports.map((m, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                    {m.year}-{String(m.month).padStart(2, '0')}
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-700">{m.inspection_tasks}</td>
                  <td className="px-5 py-3.5 text-right text-slate-700">
                    <div className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {m.inspection_completed}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        m.inspection_rate >= 90
                          ? 'bg-emerald-100 text-emerald-700'
                          : m.inspection_rate >= 70
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      )}
                    >
                      {m.inspection_rate}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-700">{m.hazards_registered}</td>
                  <td className="px-5 py-3.5 text-right text-slate-700">{m.hazards_closed}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        m.rectification_rate >= 90
                          ? 'bg-emerald-100 text-emerald-700'
                          : m.rectification_rate >= 70
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      )}
                    >
                      {m.rectification_rate}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-700 font-medium">
                    {m.drills_count > 0 ? (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <Flame className="w-3.5 h-3.5" />
                        {m.drills_count}
                      </span>
                    ) : (
                      m.drills_count
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-t-2 border-slate-200">
                <td className="px-5 py-3.5 font-bold text-slate-800 whitespace-nowrap">
                  年度总计
                </td>
                <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                  {annualSummary.inspection_tasks}
                </td>
                <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                  {annualSummary.inspection_completed}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                    {annualSummary.inspection_rate}%
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                  {annualSummary.hazards_registered}
                </td>
                <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                  {annualSummary.hazards_closed}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                    {annualSummary.rectification_rate}%
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right font-bold text-red-600">
                  {annualSummary.drills_count}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
