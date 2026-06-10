import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  List,
  Plus,
  Building2,
  User,
  Calendar,
  MapPin,
  ChevronDown,
  X,
  Check,
  ImagePlus,
  Save,
  Clock,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Camera,
  FileText,
  UserCheck,
  Hash,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { InspectionTask, InspectionPoint, InspectionRecord } from '@/types';
import {
  TaskStatus,
  TaskStatusLabels,
  CheckCycle,
  CheckCycleLabels,
  UserRole,
  HazardLevel,
  HazardLevelLabels,
  HazardStatus,
  HazardStatusLabels,
  type Hazard,
} from '@/types';
import {
  cn,
  formatDate,
  formatDateTime,
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

const MOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=200&h=200&fit=crop',
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

      <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-2">
        <MapPin size={14} className="shrink-0 text-slate-400" />
        <span>{task.point_ids.length} 个点位</span>
      </div>

      <div className="mb-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
          {CheckCycleLabels[task.cycle]}巡检
        </span>
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
            {formatDate(task.start_date, 'MM-DD')} ~ {formatDate(task.end_date, 'MM-DD')}
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
  const {
    buildings,
    users,
    createInspectionTask,
    getPointsByBuildingId,
  } = useAppStore();

  const today = new Date();
  const defaultStart = today.toISOString().slice(0, 10);
  const defaultEnd = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [title, setTitle] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [cycle, setCycle] = useState<CheckCycle>(CheckCycle.MONTHLY);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const buildingPoints = useMemo(
    () => (buildingId ? getPointsByBuildingId(buildingId) : []),
    [buildingId, getPointsByBuildingId]
  );

  const inspectors = useMemo(
    () => users.filter((u) => u.role === UserRole.INSPECTOR),
    [users]
  );

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

  const resetForm = () => {
    const t = new Date();
    setTitle('');
    setBuildingId('');
    setSelectedPoints([]);
    setAssigneeId('');
    setCycle(CheckCycle.MONTHLY);
    setStartDate(t.toISOString().slice(0, 10));
    setEndDate(new Date(t.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (!buildingId) return;
    if (selectedPoints.length === 0) return;
    if (!assigneeId) return;
    const finalStart = startDate || defaultStart;
    const finalEnd = endDate || defaultEnd;

    const safetyManager = users.find((u) => u.role === UserRole.SAFETY_MANAGER);
    const creatorId = safetyManager?.id || users[0]?.id || '';
    const creatorName = safetyManager?.name || users[0]?.name || '';
    const building = buildings.find((b) => b.id === buildingId);
    const assignee = users.find((u) => u.id === assigneeId);

    createInspectionTask({
      title: title.trim(),
      type: 'routine',
      assignee_id: assigneeId,
      assignee_name: assignee?.name || '',
      building_id: buildingId,
      building_name: building?.name || '',
      point_ids: selectedPoints,
      cycle,
      start_date: finalStart,
      end_date: finalEnd,
      creator_id: creatorId,
      creator_name: creatorName,
    });

    resetForm();
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

interface PointEditState {
  remark: string;
  photos: string[];
  status: 'normal' | 'abnormal';
}

interface RegisterHazardData {
  point: InspectionPoint;
  record: Omit<InspectionRecord, 'id'>;
}

function RegisterHazardModal({
  open,
  data,
  task,
  departments,
  onClose,
  onConfirm,
}: {
  open: boolean;
  data: RegisterHazardData | null;
  task: InspectionTask | null;
  departments: { id: string; name: string }[];
  onClose: () => void;
  onConfirm: (level: HazardLevel, title: string, deadline?: string, responsibleDept?: string) => void;
}) {
  const [hazardTitle, setHazardTitle] = useState('');
  const [hazardLevel, setHazardLevel] = useState<HazardLevel>(HazardLevel.GENERAL);
  const [deadline, setDeadline] = useState('');
  const [responsibleDept, setResponsibleDept] = useState('');

  if (!open || !data || !task) return null;

  const defaultTitle = `巡检发现：${data.point.name} 异常`;

  useEffect(() => {
    if (open) {
      setHazardTitle(defaultTitle);
      setHazardLevel(HazardLevel.GENERAL);
      setDeadline('');
      setResponsibleDept('');
    }
  }, [open, defaultTitle]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-800">登记隐患</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              隐患标题
            </label>
            <input
              type="text"
              value={hazardTitle || defaultTitle}
              onChange={(e) => setHazardTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              隐患等级
            </label>
            <div className="flex gap-2">
              {([
                { value: HazardLevel.MINOR, label: '轻微', color: 'bg-blue-100 text-blue-700 border-blue-300' },
                { value: HazardLevel.GENERAL, label: '一般', color: 'bg-amber-100 text-amber-700 border-amber-300' },
                { value: HazardLevel.MAJOR, label: '较大', color: 'bg-orange-100 text-orange-700 border-orange-300' },
                { value: HazardLevel.CRITICAL, label: '重大', color: 'bg-red-100 text-red-700 border-red-300' },
              ] as const).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setHazardLevel(item.value)}
                  className={cn(
                    'flex-1 py-2 text-xs font-medium rounded-lg border transition-all',
                    hazardLevel === item.value
                      ? item.color + ' border-2'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              整改期限 <span className="text-slate-400 font-normal">(可选)</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              责任部门 <span className="text-slate-400 font-normal">(可选)</span>
            </label>
            <div className="relative">
              <select
                value={responsibleDept}
                onChange={(e) => setResponsibleDept(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all pr-10 bg-white"
              >
                <option value="">请选择责任部门</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
            <p className="text-xs text-sky-700 font-medium mb-2">
              自动带入：楼栋、点位、巡检备注、现场照片
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <Building2 size={14} className="text-slate-400" />
                <span className="text-slate-600">{task.building_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} className="text-slate-400" />
                <span className="text-slate-600">{data.point.name}</span>
              </div>
              {data.record.remark && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText size={14} className="text-slate-400 mt-0.5" />
                  <span className="text-slate-600 line-clamp-2">{data.record.remark}</span>
                </div>
              )}
              {data.record.photos && data.record.photos.length > 0 && (
                <div className="flex gap-1.5 pt-1">
                  {data.record.photos.slice(0, 4).map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`照片 ${idx + 1}`}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            <AlertTriangle size={12} className="inline mr-1 text-amber-500" />
            登记后可在隐患整改模块查看和处理
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => {
              onConfirm(
                hazardLevel,
                hazardTitle || defaultTitle,
                deadline || undefined,
                responsibleDept || undefined
              );
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            确认登记
          </button>
        </div>
      </div>
    </div>
  );
}

function ExecuteModal({
  open,
  task,
  onClose,
}: {
  open: boolean;
  task: InspectionTask | null;
  onClose: () => void;
}) {
  const {
    inspectionPoints,
    buildings,
    users,
    departments,
    inspectionRecords,
    addInspectionRecord,
    registerHazardFromInspection,
  } = useAppStore();

  const [expandedPointId, setExpandedPointId] = useState<string | null>(null);
  const [editStates, setEditStates] = useState<Record<string, PointEditState>>({});
  const [registerHazardOpen, setRegisterHazardOpen] = useState(false);
  const [registerHazardData, setRegisterHazardData] = useState<RegisterHazardData | null>(null);

  const taskRecords: InspectionRecord[] = useMemo(() => {
    if (!task) return [];
    return inspectionRecords.filter((r) => r.task_id === task.id);
  }, [task, inspectionRecords]);

  const taskPoints: InspectionPoint[] = useMemo(() => {
    if (!task) return [];
    return task.point_ids
      .map((pid) => inspectionPoints.find((p) => p.id === pid))
      .filter(Boolean) as InspectionPoint[];
  }, [task, inspectionPoints]);

  const completedPointIds = useMemo(() => {
    return new Set(taskRecords.map((r) => r.point_id));
  }, [taskRecords]);

  const completedCount = completedPointIds.size;
  const totalCount = taskPoints.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getEditState = (pointId: string): PointEditState => {
    return editStates[pointId] || { remark: '', photos: [], status: 'normal' };
  };

  const setEditState = (pointId: string, updates: Partial<PointEditState>) => {
    setEditStates((prev) => ({
      ...prev,
      [pointId]: { ...getEditState(pointId), ...updates },
    }));
  };

  const handleAddPhoto = (pointId: string) => {
    const current = getEditState(pointId);
    const randomPhoto = MOCK_PHOTOS[Math.floor(Math.random() * MOCK_PHOTOS.length)];
    setEditState(pointId, { photos: [...current.photos, randomPhoto] });
  };

  const handleRemovePhoto = (pointId: string, index: number) => {
    const current = getEditState(pointId);
    setEditState(pointId, {
      photos: current.photos.filter((_, i) => i !== index),
    });
  };

  const handleSavePoint = (point: InspectionPoint) => {
    if (!task) return;

    const editState = getEditState(point.id);
    const inspector = users.find((u) => u.id === task.assignee_id);

    addInspectionRecord({
      task_id: task.id,
      point_id: point.id,
      point_name: point.name,
      building_id: task.building_id,
      inspector_id: task.assignee_id,
      inspector_name: inspector?.name || task.assignee_name,
      status: editState.status,
      remark: editState.remark || undefined,
      photos: editState.photos.length > 0 ? editState.photos : undefined,
      inspect_time: formatDateTime(new Date()),
    });

    setEditStates((prev) => {
      const next = { ...prev };
      delete next[point.id];
      return next;
    });
    setExpandedPointId(null);
  };

  const handleOpenRegisterHazard = (point: InspectionPoint) => {
    if (!task) return;
    const editState = getEditState(point.id);
    const inspector = users.find((u) => u.id === task.assignee_id);

    const record: Omit<InspectionRecord, 'id'> = {
      task_id: task.id,
      point_id: point.id,
      point_name: point.name,
      building_id: task.building_id,
      inspector_id: task.assignee_id,
      inspector_name: inspector?.name || task.assignee_name,
      status: 'abnormal',
      remark: editState.remark || undefined,
      photos: editState.photos.length > 0 ? editState.photos : undefined,
      inspect_time: formatDateTime(new Date()),
    };

    setRegisterHazardData({ point, record });
    setRegisterHazardOpen(true);
  };

  const handleConfirmRegisterHazard = (
    level: HazardLevel,
    title: string,
    deadline?: string,
    responsibleDept?: string
  ) => {
    if (!task || !registerHazardData) return;

    const savedRecord = addInspectionRecord(registerHazardData.record);

    registerHazardFromInspection({
      record: savedRecord,
      task_id: task.id,
      task_title: task.title,
      hazard_level: level,
      hazard_title: title,
      reporter_id: task.assignee_id,
      reporter_name: task.assignee_name,
      deadline,
      responsible_dept: responsibleDept,
    });

    setEditStates((prev) => {
      const next = { ...prev };
      delete next[registerHazardData.point.id];
      return next;
    });
    setExpandedPointId(null);
    setRegisterHazardData(null);
  };

  const handleToggleExpand = (pointId: string) => {
    if (completedPointIds.has(pointId)) return;
    setExpandedPointId(expandedPointId === pointId ? null : pointId);
  };

  if (!open || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">执行巡检任务</h3>
            <p className="text-sm text-slate-500 mt-0.5">{task.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-slate-400" />
              <span className="text-sm text-slate-700">{task.building_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={16} className="text-slate-400" />
              <span className="text-sm text-slate-700">{task.assignee_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              <span className="text-sm text-slate-700">截止 {formatDate(task.end_date)}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-slate-600">巡检进度</span>
              <span className="font-semibold text-slate-800">
                {completedCount} / {totalCount} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-sky-500'
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {taskPoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <MapPin size={32} className="mb-2" />
              <p className="text-sm">该任务暂无巡检点位</p>
            </div>
          ) : (
            taskPoints.map((point) => {
              const isCompleted = completedPointIds.has(point.id);
              const isExpanded = expandedPointId === point.id;
              const record = taskRecords.find((r) => r.point_id === point.id);
              const editState = getEditState(point.id);

              return (
                <div
                  key={point.id}
                  className={cn(
                    'border rounded-xl overflow-hidden transition-all',
                    isCompleted
                      ? record?.status === 'abnormal'
                        ? 'border-red-200 bg-red-50/40'
                        : 'border-emerald-200 bg-emerald-50/40'
                      : isExpanded
                      ? 'border-sky-300 shadow-md border-2'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  )}
                >
                  <div
                    onClick={() => handleToggleExpand(point.id)}
                    className={cn(
                      'flex items-center gap-3 p-4',
                      !isCompleted && 'cursor-pointer'
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                        isCompleted
                          ? record?.status === 'abnormal'
                            ? 'bg-red-500 border-red-500'
                            : 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-300 bg-white'
                      )}
                    >
                      {isCompleted && (
                        record?.status === 'abnormal' ? (
                          <XCircle size={14} className="text-white" strokeWidth={3} />
                        ) : (
                          <Check size={14} className="text-white" strokeWidth={3} />
                        )
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={cn(
                            'font-medium text-base',
                            isCompleted
                              ? record?.status === 'abnormal'
                                ? 'text-red-700'
                                : 'text-emerald-700'
                              : 'text-slate-800'
                          )}
                        >
                          {point.name}
                        </h4>
                        {isCompleted && (
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              record?.status === 'abnormal'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-700'
                            )}
                          >
                            {record?.status === 'abnormal' ? '异常' : '已完成'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {point.floor}
                        </span>
                        {record?.inspect_time && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {record.inspect_time}
                          </span>
                        )}
                      </div>
                    </div>

                    {!isCompleted && (
                      <ChevronDown
                        size={18}
                        className={cn(
                          'text-slate-400 transition-transform',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    )}
                  </div>

                  {isCompleted && record && (
                    <div className="px-4 pb-4 pt-0 space-y-2">
                      {record.remark && (
                        <div className={cn(
                          'bg-white rounded-lg p-3 border',
                          record.status === 'abnormal' ? 'border-red-100' : 'border-emerald-100'
                        )}>
                          <p className="text-xs text-slate-500 mb-1">巡检备注</p>
                          <p className="text-sm text-slate-700">{record.remark}</p>
                        </div>
                      )}
                      {record.photos && record.photos.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1.5">巡检照片</p>
                          <div className="flex gap-2 flex-wrap">
                            {record.photos.map((photo, idx) => (
                              <img
                                key={idx}
                                src={photo}
                                alt={`巡检照片 ${idx + 1}`}
                                className={cn(
                                  'w-20 h-20 rounded-lg object-cover border',
                                  record.status === 'abnormal' ? 'border-red-100' : 'border-emerald-100'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isExpanded && !isCompleted && (
                    <div className="px-4 pb-4 pt-0 space-y-3 border-t border-slate-100 mt-0">
                      <div className="pt-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          巡检状态
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditState(point.id, { status: 'normal' })}
                            className={cn(
                              'flex-1 py-2 text-sm font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5',
                              editState.status === 'normal'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            )}
                          >
                            <CheckCircle2 size={16} />
                            正常
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditState(point.id, { status: 'abnormal' })}
                            className={cn(
                              'flex-1 py-2 text-sm font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5',
                              editState.status === 'abnormal'
                                ? 'bg-red-100 text-red-700 border-red-300'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            )}
                          >
                            <XCircle size={16} />
                            异常
                          </button>
                        </div>
                      </div>

                      {editState.status === 'abnormal' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-800">发现异常情况</p>
                              <p className="text-xs text-red-600 mt-0.5">
                                请详细描述异常情况，建议同时登记隐患以便后续整改
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenRegisterHazard(point)}
                            className="mt-3 w-full py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <AlertTriangle size={16} />
                            登记隐患
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          巡检备注
                        </label>
                        <textarea
                          value={editState.remark}
                          onChange={(e) => setEditState(point.id, { remark: e.target.value })}
                          rows={3}
                          placeholder="请输入巡检情况备注..."
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          巡检照片
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {editState.photos.map((photo, idx) => (
                            <div
                              key={idx}
                              className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200"
                            >
                              <img
                                src={photo}
                                alt={`照片 ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(point.id, idx)}
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddPhoto(point.id)}
                            className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-sky-400 hover:text-sky-500 transition-colors bg-slate-50"
                          >
                            <ImagePlus size={20} />
                            <span className="text-xs">添加照片</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedPointId(null);
                            setEditStates((prev) => {
                              const next = { ...prev };
                              delete next[point.id];
                              return next;
                            });
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSavePoint(point)}
                          className={cn(
                            'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5',
                            editState.status === 'abnormal'
                              ? 'text-white bg-red-500 hover:bg-red-600'
                              : 'text-white bg-sky-500 hover:bg-sky-600'
                          )}
                        >
                          <Save size={14} />
                          保存
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              progressPercent === 100
                ? 'text-white bg-emerald-500 hover:bg-emerald-600'
                : 'text-white bg-sky-500 hover:bg-sky-600'
            )}
          >
            {progressPercent === 100 ? '完成任务' : '关闭'}
          </button>
        </div>
      </div>

      <RegisterHazardModal
        open={registerHazardOpen}
        data={registerHazardData}
        task={task}
        departments={departments}
        onClose={() => {
          setRegisterHazardOpen(false);
          setRegisterHazardData(null);
        }}
        onConfirm={handleConfirmRegisterHazard}
      />
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
              周期
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              状态
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              进度
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              时间范围
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
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                    {CheckCycleLabels[task.cycle]}
                  </span>
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
                    {formatDate(task.start_date, 'MM-DD')} ~ {formatDate(task.end_date, 'MM-DD')}
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

function TaskDetailSidebar({
  open,
  task,
  onClose,
  onExecute,
}: {
  open: boolean;
  task: InspectionTask | null;
  onClose: () => void;
  onExecute: (task: InspectionTask) => void;
}) {
  const navigate = useNavigate();
  const {
    inspectionPoints,
    buildings,
    users,
    departments,
    inspectionRecords,
    getHazardsByTaskId,
  } = useAppStore();

  const taskRecords: InspectionRecord[] = useMemo(() => {
    if (!task) return [];
    return inspectionRecords.filter((r) => r.task_id === task.id);
  }, [task, inspectionRecords]);

  const taskPoints: InspectionPoint[] = useMemo(() => {
    if (!task) return [];
    return task.point_ids
      .map((pid) => inspectionPoints.find((p) => p.id === pid))
      .filter(Boolean) as InspectionPoint[];
  }, [task, inspectionPoints]);

  const completedPointIds = useMemo(() => {
    return new Set(taskRecords.map((r) => r.point_id));
  }, [taskRecords]);

  const abnormalCount = useMemo(() => {
    return taskRecords.filter((r) => r.status === 'abnormal').length;
  }, [taskRecords]);

  const abnormalRecords = useMemo(() => {
    return taskRecords.filter((r) => r.status === 'abnormal');
  }, [taskRecords]);

  const taskHazards = useMemo(() => {
    if (!task) return [];
    return getHazardsByTaskId(task.id);
  }, [task, getHazardsByTaskId]);

  const linkedHazardCount = useMemo(() => {
    return abnormalRecords.filter((r) => r.hazard_id).length;
  }, [abnormalRecords]);

  const getHazardByRecordId = (recordId: string): Hazard | undefined => {
    return taskHazards.find((h) => h.source_record_id === recordId);
  };

  const getDepartmentName = (deptId: string): string => {
    const dept = departments.find((d) => d.id === deptId);
    return dept?.name || '';
  };

  const getHazardLevelColor = (level: HazardLevel): string => {
    switch (level) {
      case HazardLevel.CRITICAL:
        return 'bg-red-100 text-red-700 border-red-300';
      case HazardLevel.MAJOR:
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case HazardLevel.GENERAL:
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case HazardLevel.MINOR:
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getHazardStatusColor = (status: HazardStatus): string => {
    switch (status) {
      case HazardStatus.REGISTERED:
        return 'bg-slate-100 text-slate-700';
      case HazardStatus.ASSIGNED:
        return 'bg-sky-100 text-sky-700';
      case HazardStatus.RECTIFYING:
        return 'bg-amber-100 text-amber-700';
      case HazardStatus.PENDING_REVIEW:
        return 'bg-purple-100 text-purple-700';
      case HazardStatus.CLOSED:
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const totalPhotos = useMemo(() => {
    return taskRecords.reduce((sum, r) => sum + (r.photos?.length || 0), 0);
  }, [taskRecords]);

  const getPointStatus = (pointId: string): 'pending' | 'normal' | 'abnormal' => {
    const record = taskRecords.find((r) => r.point_id === pointId);
    if (!record) return 'pending';
    return record.status;
  };

  const getPointRecord = (pointId: string): InspectionRecord | undefined => {
    return taskRecords.find((r) => r.point_id === pointId);
  };

  if (!open || !task) return null;

  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isPending = task.status === TaskStatus.PENDING;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex-1 pr-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">{task.title}</h3>
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                getStatusColor(task.status, 'bg'),
                getStatusColor(task.status, 'text')
              )}
            >
              {TaskStatusLabels[task.status]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              基本信息
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 size={16} className="text-slate-400 shrink-0" />
                <span className="text-sm text-slate-600">{task.building_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <User size={16} className="text-slate-400 shrink-0" />
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium',
                      getAvatarColor(task.assignee_name)
                    )}
                  >
                    {getInitials(task.assignee_name)}
                  </div>
                  <span className="text-sm text-slate-700">{task.assignee_name}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Hash size={16} className="text-slate-400 shrink-0" />
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                  {CheckCycleLabels[task.cycle]}巡检
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <span className="text-sm text-slate-600">
                  {formatDate(task.start_date)} ~ {formatDate(task.end_date)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <UserCheck size={16} className="text-slate-400 shrink-0" />
                <span className="text-sm text-slate-600">
                  创建人：{task.creator_name} · {formatDateTime(task.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-slate-400" />
              点位明细
            </h4>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-slate-800">{taskPoints.length}</p>
                <p className="text-xs text-slate-500 mt-1">总点位</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{completedPointIds.size}</p>
                <p className="text-xs text-slate-500 mt-1">已完成</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{abnormalCount}</p>
                <p className="text-xs text-slate-500 mt-1">异常</p>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {taskPoints.map((point) => {
                const status = getPointStatus(point.id);
                const record = getPointRecord(point.id);
                return (
                  <div
                    key={point.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      status === 'normal'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : status === 'abnormal'
                        ? 'bg-red-50/50 border-red-200'
                        : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{point.name}</span>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          status === 'normal'
                            ? 'bg-emerald-100 text-emerald-700'
                            : status === 'abnormal'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-200 text-slate-600'
                        )}
                      >
                        {status === 'normal'
                          ? '正常'
                          : status === 'abnormal'
                          ? '异常'
                          : '未检'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {point.floor}
                      </span>
                      {record?.inspect_time && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {record.inspect_time}
                        </span>
                      )}
                    </div>
                    {status !== 'pending' && record?.remark && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                        备注：{record.remark}
                      </p>
                    )}
                    {status !== 'pending' && record?.photos && record.photos.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {record.photos.slice(0, 3).map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo}
                            alt={`照片 ${idx + 1}`}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ))}
                        {record.photos.length > 3 && (
                          <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center text-xs text-slate-600">
                            +{record.photos.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-6 py-5 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              异常汇总
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100">
                <p className="text-2xl font-bold text-red-600">{abnormalCount}</p>
                <p className="text-xs text-slate-500 mt-1">异常点位</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
                <p className="text-2xl font-bold text-amber-600">{linkedHazardCount}</p>
                <p className="text-xs text-slate-500 mt-1">已关联隐患</p>
              </div>
            </div>
            {abnormalRecords.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {abnormalRecords.map((record) => {
                  const point = taskPoints.find((p) => p.id === record.point_id);
                  const hazard = getHazardByRecordId(record.id);
                  return (
                    <div
                      key={record.id}
                      className="p-3 bg-red-50/50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm font-medium text-red-800">
                            {point?.name || record.point_name}
                          </span>
                          {point?.floor && (
                            <span className="text-xs text-slate-500 ml-2">
                              {point.floor}
                            </span>
                          )}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                          异常
                        </span>
                      </div>
                      {record.remark && (
                        <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                          {record.remark}
                        </p>
                      )}
                      {record.photos && record.photos.length > 0 && (
                        <div className="flex gap-1.5 mb-3">
                          {record.photos.slice(0, 3).map((photo, idx) => (
                            <img
                              key={idx}
                              src={photo}
                              alt={`照片 ${idx + 1}`}
                              className="w-12 h-12 rounded object-cover border border-red-200"
                            />
                          ))}
                          {record.photos.length > 3 && (
                            <div className="w-12 h-12 rounded bg-red-100 flex items-center justify-center text-xs text-red-600 border border-red-200">
                              +{record.photos.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                      {hazard ? (
                        <div
                          onClick={() => navigate('/hazards')}
                          className="cursor-pointer bg-white rounded-lg p-3 border border-slate-200 hover:border-sky-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-800 line-clamp-1">
                              {hazard.title}
                            </span>
                            <span
                              className={cn(
                                'text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2',
                                getHazardLevelColor(hazard.level)
                              )}
                            >
                              {HazardLevelLabels[hazard.level]}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                'text-xs px-2 py-0.5 rounded-full font-medium',
                                getHazardStatusColor(hazard.status)
                              )}
                            >
                              {HazardStatusLabels[hazard.status]}
                            </span>
                            <span className="text-xs text-sky-600 flex items-center gap-1">
                              查看整改进度
                              <ChevronDown size={12} className="-rotate-90" />
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {hazard.deadline ? formatDate(hazard.deadline) : '待设置期限'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 size={12} />
                              {hazard.responsible_dept ? getDepartmentName(hazard.responsible_dept) : '待派单'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-100 rounded-lg p-3 text-center">
                          <span className="text-xs text-slate-500">未登记隐患</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-400" />
                <p className="text-sm">暂无异常点位</p>
              </div>
            )}
          </div>

          <div className="px-6 py-5">
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Camera size={16} className="text-slate-400" />
              执行记录与照片
            </h4>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm text-slate-600">
                  已检 <span className="font-medium text-slate-800">{completedPointIds.size}</span> 个
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-sky-500" />
                <span className="text-sm text-slate-600">
                  照片 <span className="font-medium text-slate-800">{totalPhotos}</span> 张
                </span>
              </div>
            </div>
            {taskRecords.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {taskRecords.slice(0, 5).map((record) => {
                  const hazard = getHazardByRecordId(record.id);
                  return (
                    <div
                      key={record.id}
                      className={cn(
                        'p-3 rounded-lg',
                        record.status === 'abnormal' ? 'bg-red-50 border border-red-100' : 'bg-slate-50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            record.status === 'abnormal' ? 'text-red-700' : 'text-slate-700'
                          )}
                        >
                          {record.point_name}
                        </span>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            record.status === 'normal'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {record.status === 'normal' ? '正常' : '异常'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {record.inspector_name} · {record.inspect_time}
                      </p>
                      {record.status === 'abnormal' && hazard && (
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              getHazardStatusColor(hazard.status)
                            )}
                          >
                            隐患：{HazardStatusLabels[hazard.status]}
                          </span>
                        </div>
                      )}
                      {record.status === 'abnormal' && !hazard && (
                        <div className="mt-2">
                          <span className="text-xs text-slate-500">未登记隐患</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <Clock size={24} className="mx-auto mb-2" />
                <p className="text-sm">暂无执行记录</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          {isCompleted ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">任务已完成</span>
            </div>
          ) : (
            <button
              onClick={() => onExecute(task)}
              className="w-full py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
            >
              <Play size={16} />
              {isPending ? '开始执行' : '继续执行'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function Inspections() {
  const {
    inspectionTasks,
    buildings,
    users,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<InspectionTask | null>(null);
  const [executeTask, setExecuteTask] = useState<InspectionTask | null>(null);

  const filteredTasks = useMemo(() => {
    return inspectionTasks.filter((task) => {
      if (filterBuilding && task.building_id !== filterBuilding) return false;
      if (filterAssignee && task.assignee_id !== filterAssignee) return false;
      return true;
    });
  }, [inspectionTasks, filterBuilding, filterAssignee]);

  const inspectors = useMemo(
    () => users.filter((u) => u.role === UserRole.INSPECTOR),
    [users]
  );

  const handleTaskClick = (task: InspectionTask) => {
    setSelectedTask(task);
  };

  const handleExecuteTask = (task: InspectionTask) => {
    setSelectedTask(null);
    setExecuteTask(task);
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
      <TaskDetailSidebar
        open={!!selectedTask}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onExecute={handleExecuteTask}
      />
      <ExecuteModal
        open={!!executeTask}
        task={executeTask}
        onClose={() => setExecuteTask(null)}
      />
    </div>
  );
}
