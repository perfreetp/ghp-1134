import { useState, useMemo } from 'react';
import {
  CalendarDays,
  Plus,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
  Clock,
  Users,
  X,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Download,
  FileText,
  Image,
  UserCheck,
  ClipboardList,
  Folder,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatDateTime, generateId } from '@/utils';
import { DrillType, DrillTypeLabels } from '@/types';
import type { Drill, DrillAttendance } from '@/types';
import { useAppStore } from '@/store';

type DrillStatus = 'planned' | 'in_progress' | 'completed';

const DRILL_STATUS_MAP: Record<DrillStatus, { label: string; className: string; icon: typeof PlayCircle }> = {
  planned: { label: '计划中', className: 'bg-sky-100 text-sky-700 border-sky-300', icon: Clock },
  in_progress: { label: '进行中', className: 'bg-amber-100 text-amber-700 border-amber-300', icon: PlayCircle },
  completed: { label: '已完成', className: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: CheckCircle2 },
};

const DRILL_TYPE_COLORS: Record<DrillType, string> = {
  [DrillType.FIRE_EVACUATION]: 'bg-red-500',
  [DrillType.FIRE_EXTINGUISHER]: 'bg-orange-500',
  [DrillType.EMERGENCY_RESPONSE]: 'bg-amber-500',
  [DrillType.COMBINED]: 'bg-violet-500',
};

function getDrillStatus(drill: Drill): DrillStatus {
  if (drill.actual_time) return 'completed';
  const now = new Date();
  const planTime = new Date(drill.plan_time);
  const planEnd = new Date(planTime.getTime() + 2 * 60 * 60 * 1000);
  if (now >= planTime && now <= planEnd) return 'in_progress';
  return 'planned';
}

const ATTENDANCE_STATUS_LABEL: Record<DrillAttendance['status'], { label: string; className: string }> = {
  present: { label: '已签到', className: 'bg-emerald-100 text-emerald-700' },
  absent: { label: '缺席', className: 'bg-red-100 text-red-700' },
  late: { label: '迟到', className: 'bg-amber-100 text-amber-700' },
};

const FILE_LIST = [
  { name: '演练方案V2.docx', size: '256 KB' },
  { name: '签到表.xlsx', size: '48 KB' },
  { name: '现场照片.zip', size: '8.2 MB' },
  { name: '演练总结报告.pdf', size: '1.5 MB' },
];

export default function Drills() {
  const { drills, departments, getDrillAttendances, addDrill } = useAppStore();
  const [typeFilter, setTypeFilter] = useState<DrillType | 'all'>('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'attendance' | 'comment' | 'archive'>('attendance');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newDrill, setNewDrill] = useState({
    title: '',
    type: DrillType.FIRE_EVACUATION,
    location: '',
    participantDepts: [] as string[],
    planTime: '',
    content: '',
    expectedCount: 50,
  });

  const filteredDrills = useMemo(() => {
    return drills.filter((d) => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false;
      const planTime = new Date(d.plan_time);
      if (dateStart && planTime < new Date(dateStart)) return false;
      if (dateEnd && planTime > new Date(dateEnd + ' 23:59:59')) return false;
      return true;
    });
  }, [drills, typeFilter, dateStart, dateEnd]);

  const toggleDept = (deptName: string) => {
    setNewDrill((prev) => ({
      ...prev,
      participantDepts: prev.participantDepts.includes(deptName)
        ? prev.participantDepts.filter((d) => d !== deptName)
        : [...prev.participantDepts, deptName],
    }));
  };

  const handleCreateDrill = () => {
    if (!newDrill.title.trim() || !newDrill.location.trim() || !newDrill.planTime) return;
    addDrill({
      title: newDrill.title,
      type: newDrill.type,
      location: newDrill.location,
      plan_time: newDrill.planTime.replace('T', ' ') + ':00',
      content: newDrill.content,
      organizer: '张建国',
      participant_depts: newDrill.participantDepts,
      expected_count: newDrill.expectedCount,
      photos: [],
    });
    setShowCreateModal(false);
    setNewDrill({
      title: '',
      type: DrillType.FIRE_EVACUATION,
      location: '',
      participantDepts: [],
      planTime: '',
      content: '',
      expectedCount: 50,
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setDetailTab('attendance');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-red-600" />
            <h1 className="text-xl font-bold text-slate-800">消防演练记录</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setTypeFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  typeFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                )}
              >
                全部
              </button>
              {(Object.keys(DrillTypeLabels) as DrillType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    typeFilter === type ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  )}
                >
                  {DrillTypeLabels[type]}
                </button>
              ))}
            </div>

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

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              新建演练
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200" />
        <div className="space-y-6">
          {filteredDrills.map((drill) => {
            const status = getDrillStatus(drill);
            const statusInfo = DRILL_STATUS_MAP[status];
            const StatusIcon = statusInfo.icon;
            const attendanceRate = drill.actual_count
              ? Math.round((drill.actual_count / drill.expected_count) * 100)
              : 0;
            const isExpanded = expandedId === drill.id;
            const attendances = getDrillAttendances(drill.id);

            return (
              <div key={drill.id} className="relative pl-20">
                <div className="absolute left-4 top-6 z-10">
                  <div className="relative">
                    <div className={cn('w-8 h-8 rounded-full border-4 border-white shadow-md', DRILL_TYPE_COLORS[drill.type])} />
                  </div>
                </div>
                <div className="absolute left-16 top-6 text-sm font-medium text-slate-600 whitespace-nowrap">
                  {formatDate(drill.plan_time, 'MM-DD')}
                  <div className="text-xs text-slate-400 font-normal">{formatDate(drill.plan_time, 'HH:mm')}</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <h3 className="text-lg font-bold text-slate-800 truncate">{drill.title}</h3>
                        <span
                          className={cn(
                            'shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
                            statusInfo.className
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleExpand(drill.id)}
                        className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            收起 <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            展开详情 <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{drill.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>组织：{drill.organizer}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>计划：{formatDateTime(drill.plan_time)}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">签到进度</span>
                        </div>
                        <span className="text-sm text-slate-600">
                          应到 <span className="font-semibold text-slate-800">{drill.expected_count}</span> 人 / 实到{' '}
                          <span className="font-semibold text-emerald-600">{drill.actual_count ?? 0}</span> 人
                          <span className="ml-2 text-xs text-slate-400">({attendanceRate}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${attendanceRate}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Image className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">现场照片</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 4 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center border border-slate-200"
                          >
                            <Image className="w-6 h-6 text-slate-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200">
                      <div className="flex items-center gap-1 px-5 pt-4 border-b border-slate-200">
                        {[
                          { key: 'attendance' as const, label: '签到列表', icon: UserCheck },
                          { key: 'comment' as const, label: '演练评语', icon: FileText },
                          { key: 'archive' as const, label: '资料归档', icon: Folder },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => setDetailTab(tab.key)}
                            className={cn(
                              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                              detailTab === tab.key
                                ? 'border-red-500 text-red-600'
                                : 'border-transparent text-slate-600 hover:text-slate-800'
                            )}
                          >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="p-5">
                        {detailTab === 'attendance' && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-50 text-slate-600">
                                  <th className="text-left px-4 py-3 font-medium rounded-l-lg">姓名</th>
                                  <th className="text-left px-4 py-3 font-medium">部门</th>
                                  <th className="text-left px-4 py-3 font-medium">签到时间</th>
                                  <th className="text-left px-4 py-3 font-medium rounded-r-lg">状态</th>
                                </tr>
                              </thead>
                              <tbody>
                                {attendances.length > 0 ? (
                                  attendances.map((att) => {
                                    const attStatus = ATTENDANCE_STATUS_LABEL[att.status];
                                    return (
                                      <tr key={att.id} className="border-b border-slate-100 last:border-0">
                                        <td className="px-4 py-3 text-slate-800 font-medium">{att.user_name}</td>
                                        <td className="px-4 py-3 text-slate-600">{att.department}</td>
                                        <td className="px-4 py-3 text-slate-600 font-mono">
                                          {att.sign_time ? formatDateTime(att.sign_time) : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                          <span
                                            className={cn(
                                              'inline-block px-2.5 py-0.5 rounded-full text-xs font-medium',
                                              attStatus.className
                                            )}
                                          >
                                            {attStatus.label}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                      暂无签到记录
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {detailTab === 'comment' && (
                          <div className="space-y-5">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">演练总结</label>
                              <textarea
                                readOnly
                                value={drill.summary ?? ''}
                                rows={4}
                                placeholder="暂无总结内容"
                                className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg resize-none bg-slate-50 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">问题记录</label>
                              <textarea
                                readOnly
                                value={drill.comment ?? ''}
                                rows={3}
                                placeholder="暂无问题记录"
                                className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg resize-none bg-slate-50 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">改进建议</label>
                              <textarea
                                readOnly
                                rows={3}
                                placeholder="暂无改进建议"
                                className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg resize-none bg-slate-50 focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {detailTab === 'archive' && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-50 text-slate-600">
                                  <th className="text-left px-4 py-3 font-medium rounded-l-lg">文件名称</th>
                                  <th className="text-left px-4 py-3 font-medium">大小</th>
                                  <th className="text-left px-4 py-3 font-medium rounded-r-lg">操作</th>
                                </tr>
                              </thead>
                              <tbody>
                                {FILE_LIST.map((file, idx) => (
                                  <tr key={idx} className="border-b border-slate-100 last:border-0">
                                    <td className="px-4 py-3 text-slate-800">
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        {file.name}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{file.size}</td>
                                    <td className="px-4 py-3">
                                      <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
                                        <Download className="w-3.5 h-3.5" />
                                        下载
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">新建演练</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  演练标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDrill.title}
                  onChange={(e) => setNewDrill({ ...newDrill, title: e.target.value })}
                  placeholder="请输入演练标题"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">演练类型</label>
                  <select
                    value={newDrill.type}
                    onChange={(e) => setNewDrill({ ...newDrill, type: e.target.value as DrillType })}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                  >
                    {(Object.keys(DrillTypeLabels) as DrillType[]).map((type) => (
                      <option key={type} value={type}>
                        {DrillTypeLabels[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    计划时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={newDrill.planTime}
                    onChange={(e) => setNewDrill({ ...newDrill, planTime: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  演练地点 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDrill.location}
                  onChange={(e) => setNewDrill({ ...newDrill, location: e.target.value })}
                  placeholder="请输入演练地点"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">参与部门</label>
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => toggleDept(dept.name)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                        newDrill.participantDepts.includes(dept.name)
                          ? 'bg-red-50 text-red-600 border-red-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                      )}
                    >
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">预期参与人数</label>
                <input
                  type="number"
                  min={1}
                  value={newDrill.expectedCount}
                  onChange={(e) => setNewDrill({ ...newDrill, expectedCount: Number(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">演练内容</label>
                <textarea
                  rows={4}
                  value={newDrill.content}
                  onChange={(e) => setNewDrill({ ...newDrill, content: e.target.value })}
                  placeholder="请描述演练的具体内容和流程"
                  className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white border border-slate-300 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateDrill}
                className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
              >
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
