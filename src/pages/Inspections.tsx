import { useState, useMemo } from 'react';
import {
  LayoutGrid,
  List,
  Filter,
  Plus,
  Building2,
  User,
  Calendar,
  MapPin,
  ChevronDown,
  X,
  Check,
} from 'lucide-react';
import { inspectionTasks } from '@/data/inspections';
import { buildings, inspectionPoints } from '@/data/buildings';
import { users } from '@/data/users';
import type { InspectionTask } from '@/types';
import { TaskStatus, TaskStatusLabels, CheckCycle, CheckCycleLabels, UserRole } from '@/types';
import {
  cn,
  formatDate,
  isOverdue,
  getAvatarColor,
  getInitials,
  getStatusColor,
} from '@/utils';

type ViewMode = 'kanban' | 'list';

const kanbanColumns: { key: TaskStatus; label: string; color: string; headerBg: string }[] = [
  { key: TaskStatus.PENDING, label: '待执行', color: 'border-sky-400', headerBg: 'bg-sky-500' },
  { key: TaskStatus.IN_PROGRESS, label: '执行中', color: 'border-amber-400', headerBg: 'bg-amber-500' },
  { key: TaskStatus.COMPLETED, label: '已完成', color: 'border-emerald-400', headerBg: 'bg-emerald-500' },
  { key: TaskStatus.OVERDUE, label: '已逾期', color: 'border-red-400', headerBg: 'bg-red-500' },
];

function TaskCard({ task, onClick }: { task: InspectionTask; onClick?: () => void }) {
  const overdue = isOverdue(task.end_date);
  const showOverdueBorder = task.status !== TaskStatus.COMPLETED && overdue;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border p-4 shadow-sm cursor-pointer hover:shadow-md transition-all',
        'border-slate-200',
        showOverdueBorder && 'border-red-400 ring-1 ring-red-200'
      )}
    >
      <h4 className="font-semibold text-slate-800 text-base mb-3 line-clamp-2">{task.title}</h4>

      <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-2">
        <Building2 size={14} className="shrink-0 text-slate-400" />
        <span className="truncate">{task.building_name}</span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-3">
        <MapPin size={14} className="shrink-0 text-slate-400" />
        <span>{task.point_ids.length} 个点位</span>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-500">进度</span>
          <span className="font-medium text-slate-700">{task.progress}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              task.progress === 100
                ? 'bg-emerald-500'
                : task.status === TaskStatus.OVERDUE
                ? 'bg-red-500'
                : 'bg-sky-500'
            )}
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium',
              getAvatarColor(task.assignee_name)
            )}
          >
            {getInitials(task.assignee_name)}
          </div>
          <span className="text-sm text-slate-700">{task.assignee_name}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Calendar size={12} className={cn(showOverdueBorder ? 'text-red-500' : 'text-slate-400')} />
          <span className={cn(showOverdueBorder ? 'text-red-600 font-medium' : 'text-slate-500')}>
            {formatDate(task.end_date)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CreateTaskModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [cycle, setCycle] = useState<CheckCycle>(CheckCycle.MONTHLY);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const buildingPoints = useMemo(
    () => inspectionPoints.filter((p) => p.building_id === buildingId),
    [buildingId]
  );

  const inspectors = users.filter((u) => u.role === UserRole.INSPECTOR);

  const handleTogglePoint = (pointId: string) => {
    setSelectedPoints((prev) =>
      prev.includes(pointId) ? prev.filter((id) => id !== pointId) : [...prev, pointId]
    );
  };

  const handleSelectAllPoints = () => {
    if (selectedPoints.length === buildingPoints.length) {
      setSelectedPoints([]);
    } else {
      setSelectedPoints(buildingPoints.map((p) => p.id));
    }
  };

  const handleSubmit = () => {
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">创建巡检任务</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">任务名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入任务名称"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">选择楼栋</label>
            <div className="relative">
              <select
                value={buildingId}
                onChange={(e) => {
                  setBuildingId(e.target.value);
                  setSelectedPoints([]);
                }}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all pr-10 bg-white"
              >
                <option value="">请选择楼栋</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700">选择点位</label>
              {buildingPoints.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllPoints}
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                >
                  {selectedPoints.length === buildingPoints.length ? '取消全选' : '全选'}
                </button>
              )}
            </div>
            <div className="border border-slate-200 rounded-lg p-3 max-h-44 overflow-y-auto space-y-2 bg-slate-50/50">
              {buildingId ? (
                buildingPoints.length > 0 ? (
                  buildingPoints.map((point) => (
                    <label
                      key={point.id}
                      className="flex items-center gap-2.5 p-2 rounded-md hover:bg-white cursor-pointer transition-colors"
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                          selectedPoints.includes(point.id)
                            ? 'bg-sky-500 border-sky-500'
                            : 'border-slate-300 bg-white'
                        )}
                      >
                        {selectedPoints.includes(point.id) && (
                          <Check size={10} className="text-white" strokeWidth={3} />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedPoints.includes(point.id)}
                        onChange={() => handleTogglePoint(point.id)}
                        className="sr-only"
                      />
                      <span className="text-sm text-slate-700">{point.name}</span>
                      <span className="text-xs text-slate-400 ml-auto">{point.floor}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">该楼栋暂无巡检点位</p>
                )
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">请先选择楼栋</p>
              )}
            </div>
            {selectedPoints.length > 0 && (
              <p className="text-xs text-slate-500 mt-1.5">已选择 {selectedPoints.length} 个点位</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">巡检人员</label>
            <div className="relative">
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all pr-10 bg-white"
              >
                <option value="">请选择巡检人员</option>
                {inspectors.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} - {u.department}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">任务周期</label>
              <div className="relative">
                <select
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value as CheckCycle)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all pr-10 bg-white"
                >
                  {Object.entries(CheckCycleLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors"
          >
            确认创建
          </button>
        </div>
      </div>
    </div>
  );
}

function KanbanView({
  filteredTasks,
  onTaskClick,
}: {
  filteredTasks: InspectionTask[];
  onTaskClick: (task: InspectionTask) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-5 min-w-max">
      {kanbanColumns.map((col) => {
        const tasks = filteredTasks.filter((t) => t.status === col.key);
        return (
          <div key={col.key} className="flex flex-col w-80">
            <div
              className={cn(
                'px-4 py-3 rounded-t-lg flex items-center justify-between',
                col.headerBg
              )}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white" />
                <span className="font-semibold text-white text-sm">{col.label}</span>
              </div>
              <span className="bg-white/25 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {tasks.length}
              </span>
            </div>
            <div
              className={cn(
                'flex-1 bg-slate-50 rounded-b-lg p-3 border-t-0 border rounded-t-none space-y-3 min-h-96',
                col.color
              )}
            >
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-200/60 flex items-center justify-center mb-2">
                    <List size={20} />
                  </div>
                  <p className="text-sm">暂无任务</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({
  filteredTasks,
  onTaskClick,
}: {
  filteredTasks: InspectionTask[];
  onTaskClick: (task: InspectionTask) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              任务名称
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              楼栋
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              点位
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              执行人
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              状态
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              进度
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              截止日期
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredTasks.map((task) => {
            const overdue = isOverdue(task.end_date);
            const showOverdue = task.status !== 'completed' && overdue;
            return (
              <tr
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="px-5 py-4">
                  <span className="font-medium text-slate-800 text-sm">{task.title}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-slate-600">{task.building_name}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-slate-600">{task.point_ids.length} 个</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium',
                        getAvatarColor(task.assignee_name)
                      )}
                    >
                      {getInitials(task.assignee_name)}
                    </div>
                    <span className="text-sm text-slate-700">{task.assignee_name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getStatusColor(task.status, 'bg'),
                      getStatusColor(task.status, 'text')
                    )}
                  >
                    {TaskStatusLabels[task.status]}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 w-32">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          task.progress === 100
                            ? 'bg-emerald-500'
                            : showOverdue
                            ? 'bg-red-500'
                            : 'bg-sky-500'
                        )}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 font-medium w-8">{task.progress}%</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={cn('text-sm', showOverdue ? 'text-red-600 font-medium' : 'text-slate-600')}>
                    {formatDate(task.end_date)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Inspections() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredTasks = useMemo(() => {
    return inspectionTasks.filter((task) => {
      if (filterBuilding && task.building_id !== filterBuilding) return false;
      if (filterAssignee && task.assignee_id !== filterAssignee) return false;
      return true;
    });
  }, [filterBuilding, filterAssignee]);

  const inspectors = users.filter((u) => u.role === UserRole.INSPECTOR);

  const handleTaskClick = (task: InspectionTask) => {
    console.log('Task clicked:', task);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">巡检任务</h1>
          <p className="text-sm text-slate-500 mt-1">管理和跟踪所有巡检任务的执行情况</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                viewMode === 'kanban'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <LayoutGrid size={16} />
              看板
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                viewMode === 'list'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <List size={16} />
              列表
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={filterBuilding}
                onChange={(e) => setFilterBuilding(e.target.value)}
                className="pl-9 pr-9 py-2 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-white"
              >
                <option value="">全部楼栋</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            <div className="relative">
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="pl-9 pr-9 py-2 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-white"
              >
                <option value="">全部人员</option>
                {inspectors.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors shadow-sm"
          >
            <Plus size={16} />
            创建任务
          </button>
        </div>
      </div>

      <div className={cn('flex-1 overflow-auto', viewMode === 'kanban' ? 'overflow-x-auto' : '')}>
        {viewMode === 'kanban' ? (
          <KanbanView filteredTasks={filteredTasks} onTaskClick={handleTaskClick} />
        ) : (
          <ListView filteredTasks={filteredTasks} onTaskClick={handleTaskClick} />
        )}
      </div>

      <CreateTaskModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
