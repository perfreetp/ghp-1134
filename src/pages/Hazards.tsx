import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Filter,
  Building2,
  MapPin,
  User,
  Calendar,
  Clock,
  ChevronDown,
  X,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldAlert,
  Image as ImageIcon,
  Send,
  FileCheck,
  SearchCheck,
  DoorOpen,
  Clock3,
  UserCheck,
  Hammer,
  Eye,
  CircleDot,
  Upload,
  Trash2,
  FileText,
  ClipboardList,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { Hazard, HazardRectify } from '@/types';
import { HazardLevel, HazardStatus, HazardLevelLabels, HazardStatusLabels, HazardSource } from '@/types';
import {
  cn,
  formatDate,
  formatDateTime,
  isOverdue,
  getAvatarColor,
  getInitials,
  getStatusColor,
} from '@/utils';

const levelFilters: {
  key: HazardLevel | 'all';
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  icon: typeof AlertTriangle;
}[] = [
  { key: 'all', label: '全部', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400', icon: Filter },
  { key: HazardLevel.CRITICAL, label: '重大隐患', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', icon: ShieldAlert },
  { key: HazardLevel.MAJOR, label: '较大隐患', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', icon: AlertTriangle },
  { key: HazardLevel.GENERAL, label: '一般隐患', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', icon: AlertCircle },
  { key: HazardLevel.MINOR, label: '轻微隐患', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', icon: Info },
];

const statusSteps: { key: HazardStatus; label: string; icon: typeof CircleDot }[] = [
  { key: HazardStatus.REGISTERED, label: '已登记', icon: CircleDot },
  { key: HazardStatus.ASSIGNED, label: '已派单', icon: Send },
  { key: HazardStatus.RECTIFYING, label: '整改中', icon: Hammer },
  { key: HazardStatus.PENDING_REVIEW, label: '待复查', icon: SearchCheck },
  { key: HazardStatus.CLOSED, label: '已关闭', icon: DoorOpen },
];

function getDeptDisplay(
  dept: string,
  departments?: { id: string; name: string }[]
): { text: string; isPlaceholder: boolean } {
  if (!dept || dept.trim() === '') {
    return { text: '待派单', isPlaceholder: true };
  }
  if (departments && departments.length > 0) {
    const found = departments.find((d) => d.id === dept);
    if (found) {
      return { text: found.name, isPlaceholder: false };
    }
  }
  return { text: dept, isPlaceholder: false };
}

function getPersonDisplay(person: string): { text: string; isPlaceholder: boolean } {
  if (!person || person.trim() === '') {
    return { text: '待设置责任人', isPlaceholder: true };
  }
  return { text: person, isPlaceholder: false };
}

function getDeadlineDisplay(deadline: string): { text: string; isPlaceholder: boolean; isOverdue: boolean } {
  if (!deadline || deadline.trim() === '') {
    return { text: '待设置期限', isPlaceholder: true, isOverdue: false };
  }
  const overdue = isOverdue(deadline);
  return { text: formatDate(deadline), isPlaceholder: false, isOverdue: overdue };
}

function getProgressByStatus(status: HazardStatus): number {
  const map: Record<HazardStatus, number> = {
    [HazardStatus.REGISTERED]: 10,
    [HazardStatus.ASSIGNED]: 30,
    [HazardStatus.RECTIFYING]: 60,
    [HazardStatus.PENDING_REVIEW]: 85,
    [HazardStatus.CLOSED]: 100,
  };
  return map[status];
}

function getActionButtons(status: HazardStatus) {
  switch (status) {
    case HazardStatus.REGISTERED:
      return [{ key: 'assign', label: '派单', icon: Send, variant: 'primary' as const }];
    case HazardStatus.ASSIGNED:
      return [{ key: 'submit', label: '提交整改', icon: FileCheck, variant: 'primary' as const }];
    case HazardStatus.RECTIFYING:
      return [{ key: 'submit', label: '提交整改', icon: FileCheck, variant: 'primary' as const }];
    case HazardStatus.PENDING_REVIEW:
      return [
        { key: 'review', label: '复查通过', icon: Check, variant: 'success' as const },
        { key: 'reject', label: '驳回', icon: X, variant: 'danger' as const },
      ];
    case HazardStatus.CLOSED:
      return [{ key: 'view', label: '查看', icon: Eye, variant: 'secondary' as const }];
    default:
      return [];
  }
}

function LevelBadge({ level, size = 'md' }: { level: HazardLevel; size?: 'sm' | 'md' }) {
  const config = levelFilters.find((f) => f.key === level)!;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium border',
        config.bg,
        config.text,
        config.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      <Icon size={size === 'sm' ? 12 : 13} />
      {HazardLevelLabels[level]}
    </span>
  );
}

const HazardSourceLabels: Record<HazardSource, string> = {
  [HazardSource.MANUAL]: '手动登记',
  [HazardSource.INSPECTION]: '巡检发现',
};

const sourceConfig: Record<HazardSource, { icon: typeof FileText; bg: string; text: string; border: string }> = {
  [HazardSource.MANUAL]: { icon: FileText, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  [HazardSource.INSPECTION]: { icon: ClipboardList, bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
};

function SourceBadge({ source, size = 'md' }: { source: HazardSource; size?: 'sm' | 'md' }) {
  const config = sourceConfig[source];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium border',
        config.bg,
        config.text,
        config.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      <Icon size={size === 'sm' ? 12 : 13} />
      {HazardSourceLabels[source]}
    </span>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
      >
        <X size={20} />
      </button>
    </div>
  );
}

function ModalFooter({
  onCancel,
  onConfirm,
  confirmText = '确认',
  confirmDisabled = false,
  confirmVariant = 'primary',
  cancelText = '取消',
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  confirmDisabled?: boolean;
  confirmVariant?: 'primary' | 'success' | 'danger';
  cancelText?: string;
}) {
  const variantClass = {
    primary: 'bg-sky-500 hover:bg-sky-600',
    success: 'bg-emerald-500 hover:bg-emerald-600',
    danger: 'bg-red-500 hover:bg-red-600',
  }[confirmVariant];

  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
      <button
        onClick={onCancel}
        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
      >
        {cancelText}
      </button>
      <button
        onClick={onConfirm}
        disabled={confirmDisabled}
        className={cn(
          'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
          variantClass,
          confirmDisabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {confirmText}
      </button>
    </div>
  );
}

function HazardCard({
  hazard,
  onAction,
  onClick,
}: {
  hazard: Hazard;
  onAction: (action: string, hazard: Hazard) => void;
  onClick: () => void;
}) {
  const { departments } = useAppStore();
  const overdue = isOverdue(hazard.deadline);
  const progress = getProgressByStatus(hazard.status);
  const actions = getActionButtons(hazard.status);

  const getVariantClass = (variant: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-sky-500 text-white hover:bg-sky-600';
      case 'success':
        return 'bg-emerald-500 text-white hover:bg-emerald-600';
      case 'danger':
        return 'bg-red-500 text-white hover:bg-red-600';
      default:
        return 'bg-slate-100 text-slate-700 hover:bg-slate-200';
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <LevelBadge level={hazard.level} size="sm" />
          <SourceBadge source={hazard.source || HazardSource.MANUAL} size="sm" />
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border',
              getStatusColor(hazard.status, 'bg'),
              getStatusColor(hazard.status, 'text'),
              'border-transparent'
            )}
          >
            {HazardStatusLabels[hazard.status]}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">{hazard.id.toUpperCase()}</span>
      </div>

      <h4 className="font-semibold text-slate-800 text-base mb-1.5">{hazard.title}</h4>
      <p className="text-sm text-slate-500 line-clamp-2 mb-4">{hazard.description}</p>

      <div className="space-y-2.5 mb-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-slate-600 min-w-0 flex-1">
            <MapPin size={14} className="shrink-0 text-slate-400" />
            <span className="truncate">
              {hazard.building_name} · {hazard.point_name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <User size={14} className="shrink-0 text-slate-400" />
            <span>{hazard.reporter_name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock size={14} className="shrink-0 text-slate-400" />
            <span>{formatDate(hazard.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Building2 size={14} className={cn('shrink-0', getDeptDisplay(hazard.responsible_dept, departments).isPlaceholder ? 'text-slate-400' : 'text-slate-400')} />
            <span className={cn(getDeptDisplay(hazard.responsible_dept, departments).isPlaceholder ? 'text-slate-400' : 'text-slate-600')}>
              {getDeptDisplay(hazard.responsible_dept, departments).text}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserCheck size={14} className={cn('shrink-0', getPersonDisplay(hazard.responsible_person).isPlaceholder ? 'text-slate-400' : 'text-slate-400')} />
            <span className={cn(getPersonDisplay(hazard.responsible_person).isPlaceholder ? 'text-slate-400' : 'text-slate-600')}>
              {getPersonDisplay(hazard.responsible_person).text}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className={cn('shrink-0', getDeadlineDisplay(hazard.deadline).isOverdue ? 'text-red-500' : getDeadlineDisplay(hazard.deadline).isPlaceholder ? 'text-slate-400' : 'text-slate-400')} />
            <span className={cn(
              getDeadlineDisplay(hazard.deadline).isOverdue ? 'text-red-600 font-medium' : getDeadlineDisplay(hazard.deadline).isPlaceholder ? 'text-slate-400' : 'text-slate-600'
            )}>
              {getDeadlineDisplay(hazard.deadline).text}
              {getDeadlineDisplay(hazard.deadline).isOverdue && ' (已逾期)'}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">整改进度</span>
          <span className="text-xs font-medium text-slate-700">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              hazard.status === HazardStatus.CLOSED
                ? 'bg-emerald-500'
                : overdue
                ? 'bg-red-500'
                : hazard.level === HazardLevel.CRITICAL
                ? 'bg-red-500'
                : hazard.level === HazardLevel.MAJOR
                ? 'bg-orange-500'
                : 'bg-sky-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {actions.map((action) => (
            <button
              key={action.key}
              onClick={(e) => {
                e.stopPropagation();
                onAction(action.key, hazard);
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                getVariantClass(action.variant)
              )}
            >
              <action.icon size={14} />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegisterModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    buildings,
    users,
    departments,
    getPointsByBuildingId,
    registerHazard,
  } = useAppStore();

  const [title, setTitle] = useState('');
  const [level, setLevel] = useState<HazardLevel>(HazardLevel.GENERAL);
  const [buildingId, setBuildingId] = useState('');
  const [pointId, setPointId] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [dept, setDept] = useState('');
  const [personName, setPersonName] = useState('');
  const [deadline, setDeadline] = useState('');

  const points = useMemo(() => {
    if (!buildingId) return [];
    return getPointsByBuildingId(buildingId);
  }, [buildingId, getPointsByBuildingId]);

  const filteredUsers = useMemo(() => {
    if (!dept) return users;
    return users.filter((u) => u.department === dept);
  }, [users, dept]);

  const resetForm = () => {
    setTitle('');
    setLevel(HazardLevel.GENERAL);
    setBuildingId('');
    setPointId('');
    setDescription('');
    setPhotos([]);
    setDept('');
    setPersonName('');
    setDeadline('');
  };

  const handleSimulatePhoto = () => {
    const newPhoto = `https://picsum.photos/400/300?random=${Date.now()}`;
    setPhotos([...photos, newPhoto]);
  };

  const removePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const canSubmit = title && buildingId && pointId && description && dept && personName && deadline;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const reporter = users.find((u) => u.role === 'safety_manager') || users[0];
    registerHazard({
      title,
      description,
      level,
      building_id: buildingId,
      building_name: buildings.find((b) => b.id === buildingId)?.name || '',
      point_id: pointId,
      point_name: points.find((p) => p.id === pointId)?.name || '',
      reporter_id: reporter?.id || '',
      reporter_name: reporter?.name || '',
      photos,
      responsible_dept: dept,
      responsible_person: personName,
      deadline,
    });
    resetForm();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <ModalHeader title="登记隐患" onClose={() => { resetForm(); onClose(); }} />

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              隐患标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请简要描述隐患"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">隐患等级</label>
            <div className="grid grid-cols-4 gap-2">
              {([HazardLevel.CRITICAL, HazardLevel.MAJOR, HazardLevel.GENERAL, HazardLevel.MINOR] as HazardLevel[]).map((lv) => {
                const config = levelFilters.find((f) => f.key === lv)!;
                const Icon = config.icon;
                return (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setLevel(lv)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all',
                      level === lv
                        ? `${config.bg} ${config.text} ${config.border} ring-2 ring-offset-1 ring-sky-200`
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <Icon size={15} />
                    {HazardLevelLabels[lv]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                所属楼栋 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={buildingId}
                  onChange={(e) => {
                    setBuildingId(e.target.value);
                    setPointId('');
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                具体点位 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={pointId}
                  onChange={(e) => setPointId(e.target.value)}
                  disabled={!buildingId}
                  className={cn(
                    'w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all pr-10 bg-white',
                    !buildingId && 'bg-slate-50 text-slate-400 cursor-not-allowed'
                  )}
                >
                  <option value="">请选择点位</option>
                  {points.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.location})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              详细描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="请详细描述隐患情况..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              现场照片（模拟上传）
            </label>
            <div className="flex flex-wrap gap-3">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleSimulatePhoto}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-sky-400 hover:text-sky-500 transition-colors gap-1"
              >
                <Upload size={20} />
                <span className="text-xs">添加照片</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                责任部门 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={dept}
                  onChange={(e) => {
                    setDept(e.target.value);
                    setPersonName('');
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all pr-10 bg-white"
                >
                  <option value="">请选择部门</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                责任人 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  disabled={filteredUsers.length === 0}
                  className={cn(
                    'w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all pr-10 bg-white',
                    filteredUsers.length === 0 && 'bg-slate-50 text-slate-400 cursor-not-allowed'
                  )}
                >
                  <option value="">请选择责任人</option>
                  {filteredUsers.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              整改期限 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
          </div>
        </div>

        <ModalFooter
          onCancel={() => { resetForm(); onClose(); }}
          onConfirm={handleSubmit}
          confirmText="确认登记"
          confirmDisabled={!canSubmit}
        />
      </div>
    </div>
  );
}

function AssignModal({
  hazard,
  open,
  onClose,
}: {
  hazard: Hazard | null;
  open: boolean;
  onClose: () => void;
}) {
  const { users, departments, assignHazard } = useAppStore();

  const [dept, setDept] = useState('');
  const [personName, setPersonName] = useState('');
  const [deadline, setDeadline] = useState('');

  const filteredUsers = useMemo(() => {
    if (!dept) return users;
    return users.filter((u) => u.department === dept);
  }, [users, dept]);

  const resetForm = () => {
    setDept(hazard?.responsible_dept || '');
    setPersonName(hazard?.responsible_person || '');
    setDeadline(hazard?.deadline || '');
  };

  const handleOpen = () => {
    if (hazard) {
      resetForm();
    }
  };

  const canSubmit = dept && personName && deadline;

  const handleSubmit = () => {
    if (!canSubmit || !hazard) return;
    const assigner = users.find((u) => u.role === 'safety_manager')?.name || '安全管理员';
    assignHazard(hazard.id, {
      responsible_dept: dept,
      responsible_person: personName,
      deadline,
      assigner_name: assigner,
    });
    onClose();
  };

  if (!open || !hazard) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col">
        <ModalHeader title="隐患派单" onClose={onClose} />

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <LevelBadge level={hazard.level} size="sm" />
              <h4 className="font-medium text-slate-800">{hazard.title}</h4>
            </div>
            <p className="text-xs text-slate-500">
              位置：{hazard.building_name} · {hazard.point_name}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              责任部门 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={dept}
                onChange={(e) => {
                  setDept(e.target.value);
                  setPersonName('');
                }}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all pr-10 bg-white"
              >
                <option value="">请选择部门</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              责任人 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                disabled={filteredUsers.length === 0}
                className={cn(
                  'w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all pr-10 bg-white',
                  filteredUsers.length === 0 && 'bg-slate-50 text-slate-400 cursor-not-allowed'
                )}
              >
                <option value="">请选择责任人</option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              整改期限 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
          </div>
        </div>

        <ModalFooter
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmText="确认派单"
          confirmDisabled={!canSubmit}
        />
      </div>
    </div>
  );
}

function RectifyModal({
  hazard,
  open,
  onClose,
}: {
  hazard: Hazard | null;
  open: boolean;
  onClose: () => void;
}) {
  const { submitHazardRectify, users } = useAppStore();

  const [action, setAction] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [remark, setRemark] = useState('');

  const resetForm = () => {
    setAction('');
    setPhotos([]);
    setRemark('');
  };

  const handleSimulatePhoto = () => {
    const newPhoto = `https://picsum.photos/400/300?random=${Date.now()}`;
    setPhotos([...photos, newPhoto]);
  };

  const removePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const canSubmit = action.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit || !hazard) return;
    const submitter = users.find((u) => u.name === hazard.responsible_person) || users.find((u) => u.role === 'inspector') || users[0];
    submitHazardRectify({
      hazard_id: hazard.id,
      action,
      photos,
      remark: remark || undefined,
      submitter: submitter?.name || '整改人',
      submitter_id: submitter?.id || '',
    });
    resetForm();
    onClose();
  };

  if (!open || !hazard) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <ModalHeader title="提交整改" onClose={() => { resetForm(); onClose(); }} />

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <LevelBadge level={hazard.level} size="sm" />
              <h4 className="font-medium text-slate-800">{hazard.title}</h4>
            </div>
            <p className="text-xs text-slate-500 mb-1">
              位置：{hazard.building_name} · {hazard.point_name}
            </p>
            <p className="text-xs text-slate-500">
              责任人：<span className={cn(getPersonDisplay(hazard.responsible_person).isPlaceholder ? 'text-slate-400' : '')}>{getPersonDisplay(hazard.responsible_person).text}</span>
              {' · '}
              整改期限：<span className={cn(
                getDeadlineDisplay(hazard.deadline).isOverdue ? 'text-red-600' : getDeadlineDisplay(hazard.deadline).isPlaceholder ? 'text-slate-400' : ''
              )}>
                {getDeadlineDisplay(hazard.deadline).text}
                {getDeadlineDisplay(hazard.deadline).isOverdue && ' (已逾期)'}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              整改措施 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={action}
              onChange={(e) => setAction(e.target.value)}
              rows={5}
              placeholder="请详细描述所采取的整改措施和处理过程..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              整改后照片（模拟上传）
            </label>
            <div className="flex flex-wrap gap-3">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleSimulatePhoto}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-sky-400 hover:text-sky-500 transition-colors gap-1"
              >
                <Upload size={20} />
                <span className="text-xs">添加照片</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">整改说明</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
              placeholder="可选：补充说明整改过程中的特殊情况..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-none"
            />
          </div>
        </div>

        <ModalFooter
          onCancel={() => { resetForm(); onClose(); }}
          onConfirm={handleSubmit}
          confirmText="提交整改"
          confirmDisabled={!canSubmit}
        />
      </div>
    </div>
  );
}

function ReviewModal({
  hazard,
  rectifies,
  open,
  onClose,
  onConfirm,
}: {
  hazard: Hazard | null;
  rectifies: HazardRectify[];
  open: boolean;
  onClose: () => void;
  onConfirm: (passed: boolean, reviewRemark: string) => void;
}) {
  const { users, departments } = useAppStore();
  const [reviewType, setReviewType] = useState<'pass' | 'reject' | null>(null);
  const [reviewRemark, setReviewRemark] = useState('');

  const latestRectify = useMemo(() => {
    const submitted = rectifies.filter((r) => r.status === 'submitted');
    if (submitted.length === 0) return null;
    return submitted.sort((a, b) => new Date(b.submit_time).getTime() - new Date(a.submit_time).getTime())[0];
  }, [rectifies]);

  const resetForm = () => {
    setReviewType(null);
    setReviewRemark('');
  };

  const handleSubmit = () => {
    if (!reviewType || !reviewRemark.trim()) return;
    onConfirm(reviewType === 'pass', reviewRemark.trim());
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const confirmText = reviewType === 'pass' ? '确认通过' : reviewType === 'reject' ? '确认驳回' : '确认复查';
  const confirmVariant = reviewType === 'pass' ? 'success' : reviewType === 'reject' ? 'danger' : 'primary';
  const canSubmit = reviewType !== null && reviewRemark.trim().length > 0;

  if (!open || !hazard) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <ModalHeader title="隐患复查" onClose={handleCancel} />

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h4 className="font-semibold text-slate-800">{hazard.title}</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
                待复查
              </span>
            </div>
            <p className="text-xs text-slate-500">
              位置：{hazard.building_name} · {hazard.point_name}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Info size={15} className="text-sky-500" />
              基本信息
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-white border border-slate-200 rounded-xl p-5">
              <div>
                <p className="text-xs text-slate-500 mb-1">隐患等级</p>
                <LevelBadge level={hazard.level} size="sm" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">整改次数</p>
                <p className="text-sm font-medium text-slate-800">{hazard.rectify_count || 0} 次</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">责任部门</p>
                <p className={cn('text-sm font-medium', getDeptDisplay(hazard.responsible_dept, departments).isPlaceholder ? 'text-slate-400' : 'text-slate-800')}>
                  {getDeptDisplay(hazard.responsible_dept, departments).text}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">责任人</p>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs',
                      getAvatarColor(getPersonDisplay(hazard.responsible_person).text)
                    )}
                  >
                    {getInitials(getPersonDisplay(hazard.responsible_person).text)}
                  </div>
                  <span className={cn('text-sm font-medium', getPersonDisplay(hazard.responsible_person).isPlaceholder ? 'text-slate-400' : 'text-slate-800')}>
                    {getPersonDisplay(hazard.responsible_person).text}
                  </span>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-1">整改期限</p>
                <p
                  className={cn(
                    'text-sm font-medium',
                    getDeadlineDisplay(hazard.deadline).isOverdue ? 'text-red-600' : getDeadlineDisplay(hazard.deadline).isPlaceholder ? 'text-slate-400' : 'text-slate-800'
                  )}
                >
                  {getDeadlineDisplay(hazard.deadline).text}
                  {getDeadlineDisplay(hazard.deadline).isOverdue && ' (已逾期)'}
                </p>
              </div>
            </div>
          </div>

          {latestRectify && (
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <FileCheck size={15} className="text-amber-500" />
                整改内容
              </h4>
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">整改措施</p>
                  <p className="text-sm text-slate-700">{latestRectify.action}</p>
                </div>

                {latestRectify.photos && latestRectify.photos.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">整改照片</p>
                    <div className="flex flex-wrap gap-2">
                      {latestRectify.photos.map((photo, idx) => (
                        <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                          <img src={photo} alt={`整改照片 ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {latestRectify.remark && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">整改备注</p>
                    <div className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-sm text-slate-600">{latestRectify.remark}</p>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-slate-400" />
                      <span>提交人：<span className="font-medium text-slate-700">{latestRectify.submitter}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-400" />
                      <span>提交时间：<span className="font-medium text-slate-700">{formatDateTime(latestRectify.submit_time)}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <SearchCheck size={15} className="text-sky-500" />
              复查操作
            </h4>
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewType('pass')}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all border-2',
                    reviewType === 'pass'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                  )}
                >
                  <Check size={18} />
                  通过
                </button>
                <button
                  type="button"
                  onClick={() => setReviewType('reject')}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all border-2',
                    reviewType === 'reject'
                      ? 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-600'
                  )}
                >
                  <X size={18} />
                  驳回
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  复查意见 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reviewRemark}
                  onChange={(e) => setReviewRemark(e.target.value)}
                  rows={4}
                  placeholder="请填写复查意见，无论通过或驳回都需要填写..."
                  className={cn(
                    'w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all resize-none',
                    reviewType === 'pass'
                      ? 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500'
                      : reviewType === 'reject'
                      ? 'border-slate-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300 focus:ring-sky-500 focus:border-sky-500'
                  )}
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  <span className="text-amber-500">提示：</span>无论通过或驳回，请填写复查意见
                </p>
              </div>
            </div>
          </div>
        </div>

        <ModalFooter
          onCancel={handleCancel}
          onConfirm={handleSubmit}
          confirmText={confirmText}
          confirmDisabled={!canSubmit}
          confirmVariant={confirmVariant as 'primary' | 'success' | 'danger'}
        />
      </div>
    </div>
  );
}

interface TimelineItem {
  id: string;
  type: 'register' | 'assign' | 'submit' | 'review_pass' | 'review_reject';
  title: string;
  time: string;
  operator: string;
  status: string;
  remark?: string;
  action?: string;
  photos?: string[];
  reviewRemark?: string;
}

function DetailModal({
  hazard,
  rectifies,
  open,
  onClose,
  onAction,
}: {
  hazard: Hazard | null;
  rectifies: HazardRectify[];
  open: boolean;
  onClose: () => void;
  onAction: (action: string, hazard: Hazard) => void;
}) {
  const { departments } = useAppStore();
  if (!open || !hazard) return null;

  const currentStepIndex = statusSteps.findIndex((s) => s.key === hazard.status);
  const overdue = isOverdue(hazard.deadline);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];

    items.push({
      id: 'register',
      type: 'register',
      title: '隐患登记',
      time: hazard.created_at,
      operator: hazard.reporter_name,
      status: '已登记',
    });

    if (hazard.assigned_at && hazard.assigned_by) {
      items.push({
        id: 'assign',
        type: 'assign',
        title: '隐患派单',
        time: hazard.assigned_at,
        operator: hazard.assigned_by,
        status: '已派单',
      });
    }

    const sortedRectifies = [...rectifies].sort(
      (a, b) => new Date(a.submit_time).getTime() - new Date(b.submit_time).getTime()
    );

    sortedRectifies.forEach((r, idx) => {
      items.push({
        id: `submit-${r.id}`,
        type: 'submit',
        title: `整改提交 #${idx + 1}`,
        time: r.submit_time,
        operator: r.submitter,
        status: r.status === 'submitted' ? '待复查' : r.status === 'passed' ? '已通过' : '已驳回',
        action: r.action,
        remark: r.remark,
        photos: r.photos,
      });

      if (r.review_time && r.reviewer) {
        items.push({
          id: `review-${r.id}`,
          type: r.status === 'passed' ? 'review_pass' : 'review_reject',
          title: r.status === 'passed' ? '复查通过' : '复查驳回',
          time: r.review_time,
          operator: r.reviewer,
          status: r.status === 'passed' ? '已通过' : '已驳回',
          reviewRemark: r.review_remark,
        });
      }
    });

    return items;
  }, [hazard, rectifies]);

  const getTimelineDotStyle = (type: TimelineItem['type']) => {
    switch (type) {
      case 'register':
        return 'bg-sky-500 ring-2 ring-sky-100';
      case 'assign':
        return 'bg-blue-500 ring-2 ring-blue-100';
      case 'submit':
        return 'bg-amber-500 ring-2 ring-amber-100';
      case 'review_pass':
        return 'bg-emerald-500 ring-2 ring-emerald-100';
      case 'review_reject':
        return 'bg-red-500 ring-2 ring-red-100';
      default:
        return 'bg-slate-500 ring-2 ring-slate-100';
    }
  };

  const getTimelineIcon = (type: TimelineItem['type']) => {
    switch (type) {
      case 'register':
        return <CircleDot size={8} className="text-white" />;
      case 'assign':
        return <Send size={8} className="text-white" />;
      case 'submit':
        return <FileCheck size={8} className="text-white" />;
      case 'review_pass':
        return <Check size={8} className="text-white" strokeWidth={3} />;
      case 'review_reject':
        return <X size={8} className="text-white" strokeWidth={3} />;
      default:
        return <CircleDot size={8} className="text-white" />;
    }
  };

  const getStatusBadgeStyle = (type: TimelineItem['type']) => {
    switch (type) {
      case 'register':
        return 'bg-slate-50 text-slate-600';
      case 'assign':
        return 'bg-blue-50 text-blue-600';
      case 'submit':
        return 'bg-amber-50 text-amber-600';
      case 'review_pass':
        return 'bg-emerald-50 text-emerald-600';
      case 'review_reject':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <LevelBadge level={hazard.level} size="sm" />
            <SourceBadge source={hazard.source || HazardSource.MANUAL} size="sm" />
            <h3 className="text-lg font-semibold text-slate-800">{hazard.title}</h3>
            <span className="text-xs text-slate-400 font-mono">{hazard.id.toUpperCase()}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              {statusSteps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                          isActive
                            ? isCurrent
                              ? 'bg-sky-500 text-white ring-4 ring-sky-100'
                              : 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-400'
                        )}
                      >
                        {isActive && !isCurrent ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
                      </div>
                      <span
                        className={cn(
                          'text-xs mt-2 font-medium whitespace-nowrap',
                          isActive ? 'text-slate-700' : 'text-slate-400'
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {idx < statusSteps.length - 1 && (
                      <div
                        className={cn(
                          'flex-1 h-0.5 mx-3 -mt-5',
                          idx < currentStepIndex ? 'bg-emerald-500' : 'bg-slate-200'
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Info size={15} className="text-sky-500" />
              基本信息
            </h4>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4 bg-white border border-slate-200 rounded-xl p-5">
              <div>
                <p className="text-xs text-slate-500 mb-1">隐患位置</p>
                <p className="text-sm font-medium text-slate-800">
                  {hazard.building_name} · {hazard.point_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">隐患等级</p>
                <LevelBadge level={hazard.level} size="sm" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">当前状态</p>
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border border-transparent',
                    getStatusColor(hazard.status, 'bg'),
                    getStatusColor(hazard.status, 'text')
                  )}
                >
                  {HazardStatusLabels[hazard.status]}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">隐患来源</p>
                <SourceBadge source={hazard.source || HazardSource.MANUAL} size="sm" />
              </div>
              {hazard.source === HazardSource.INSPECTION && hazard.source_task_title && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">来源任务</p>
                  <p className="text-sm font-medium text-slate-800 truncate" title={hazard.source_task_title}>
                    {hazard.source_task_title}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-1">整改次数</p>
                <p className="text-sm font-medium text-slate-800">{hazard.rectify_count || 0} 次</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">上报人</p>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs',
                      getAvatarColor(hazard.reporter_name)
                    )}
                  >
                    {getInitials(hazard.reporter_name)}
                  </div>
                  <span className="text-sm font-medium text-slate-800">{hazard.reporter_name}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">上报时间</p>
                <p className="text-sm font-medium text-slate-800">{formatDateTime(hazard.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">整改期限</p>
                <p
                  className={cn(
                    'text-sm font-medium',
                    getDeadlineDisplay(hazard.deadline).isOverdue ? 'text-red-600' : getDeadlineDisplay(hazard.deadline).isPlaceholder ? 'text-slate-400' : 'text-slate-800'
                  )}
                >
                  {getDeadlineDisplay(hazard.deadline).text}
                  {getDeadlineDisplay(hazard.deadline).isOverdue && ' (已逾期)'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">责任部门</p>
                <p className={cn('text-sm font-medium', getDeptDisplay(hazard.responsible_dept, departments).isPlaceholder ? 'text-slate-400' : 'text-slate-800')}>
                  {getDeptDisplay(hazard.responsible_dept, departments).text}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">责任人</p>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs',
                      getAvatarColor(getPersonDisplay(hazard.responsible_person).text)
                    )}
                  >
                    {getInitials(getPersonDisplay(hazard.responsible_person).text)}
                  </div>
                  <span className={cn('text-sm font-medium', getPersonDisplay(hazard.responsible_person).isPlaceholder ? 'text-slate-400' : 'text-slate-800')}>
                    {getPersonDisplay(hazard.responsible_person).text}
                  </span>
                </div>
              </div>
              {hazard.closed_at && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">关闭时间</p>
                  <p className="text-sm font-medium text-slate-800">{formatDateTime(hazard.closed_at)}</p>
                </div>
              )}
              <div className="col-span-3">
                <p className="text-xs text-slate-500 mb-1">隐患描述</p>
                <p className="text-sm text-slate-700 leading-relaxed">{hazard.description}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Clock3 size={15} className="text-sky-500" />
              流转时间线
            </h4>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="relative pl-6">
                <div className="absolute left-[11px] top-1 bottom-1 w-0.5 bg-slate-200" />
                <div className="space-y-5">
                  {timelineItems.map((item) => (
                    <div key={item.id} className="relative">
                      <div
                        className={cn(
                          'absolute -left-[22px] top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center',
                          getTimelineDotStyle(item.type)
                        )}
                      >
                        {getTimelineIcon(item.type)}
                      </div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-sm font-medium text-slate-800">{item.title}</span>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            getStatusBadgeStyle(item.type)
                          )}
                        >
                          {item.status}
                        </span>
                        <span className="text-xs text-slate-400 ml-auto">{formatDateTime(item.time)}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]',
                            getAvatarColor(item.operator)
                          )}
                        >
                          {getInitials(item.operator)}
                        </div>
                        <span className="text-xs text-slate-600">
                          处理人：<span className="font-medium text-slate-700">{item.operator}</span>
                        </span>
                      </div>
                      {item.action && (
                        <p className="text-sm text-slate-600 mb-2">{item.action}</p>
                      )}
                      {item.remark && (
                        <div className="bg-slate-50 rounded-lg px-3 py-2 mb-2">
                          <p className="text-xs text-slate-500">
                            <span className="font-medium">整改备注：</span>
                            {item.remark}
                          </p>
                        </div>
                      )}
                      {item.reviewRemark && (
                        <div className="bg-slate-50 rounded-lg px-3 py-2 mb-2">
                          <p className="text-xs text-slate-500">
                            <span className="font-medium">复查意见：</span>
                            {item.reviewRemark}
                          </p>
                        </div>
                      )}
                      {item.photos && item.photos.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-1">
                          {item.photos.map((p, pi) => (
                            <div
                              key={pi}
                              className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200"
                            >
                              <img src={p} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {hazard.photos && hazard.photos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <ImageIcon size={15} className="text-sky-500" />
                现场照片
              </h4>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="grid grid-cols-6 gap-3">
                  {hazard.photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200"
                    >
                      <img
                        src={photo}
                        alt={`现场照片 ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            关闭
          </button>
          {hazard.status === HazardStatus.REGISTERED && (
            <button
              onClick={() => onAction('assign', hazard)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors"
            >
              <Send size={14} />
              派单处理
            </button>
          )}
          {(hazard.status === HazardStatus.ASSIGNED || hazard.status === HazardStatus.RECTIFYING) && (
            <button
              onClick={() => onAction('submit', hazard)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors"
            >
              <FileCheck size={14} />
              提交整改
            </button>
          )}
          {hazard.status === HazardStatus.PENDING_REVIEW && (
            <>
              <button
                onClick={() => onAction('reject', hazard)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X size={14} />
                驳回
              </button>
              <button
                onClick={() => onAction('review', hazard)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Check size={14} />
                复查通过
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Hazards() {
  const {
    hazards,
    hazardRectifies,
    departments,
    users,
    reviewHazard,
    getRectifiesByHazardId,
  } = useAppStore();

  const [searchParams, setSearchParams] = useSearchParams();

  const [levelFilter, setLevelFilter] = useState<HazardLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<HazardStatus | 'all'>('all');
  const [deptFilter, setDeptFilter] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRectifyModal, setShowRectifyModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const selectedHazard = useMemo(() => {
    if (!selectedHazardId) return null;
    return hazards.find((h) => h.id === selectedHazardId) || null;
  }, [selectedHazardId, hazards]);

  useEffect(() => {
    const hazardId = searchParams.get('hazard');
    if (hazardId) {
      const hazard = hazards.find((h) => h.id === hazardId);
      if (hazard) {
        setSelectedHazardId(hazardId);
        setShowDetailModal(true);
      }
    }
  }, [searchParams, hazards]);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: hazards.length };
    ([HazardLevel.CRITICAL, HazardLevel.MAJOR, HazardLevel.GENERAL, HazardLevel.MINOR] as HazardLevel[]).forEach((lv) => {
      counts[lv] = hazards.filter((h) => h.level === lv).length;
    });
    return counts;
  }, [hazards]);

  const filteredHazards = useMemo(() => {
    return hazards.filter((h) => {
      if (levelFilter !== 'all' && h.level !== levelFilter) return false;
      if (statusFilter !== 'all' && h.status !== statusFilter) return false;
      if (deptFilter && h.responsible_dept !== deptFilter) return false;
      return true;
    });
  }, [hazards, levelFilter, statusFilter, deptFilter]);

  const relatedRectifies = useMemo(() => {
    if (!selectedHazard) return [];
    return hazardRectifies.filter((r) => r.hazard_id === selectedHazard.id);
  }, [selectedHazard, hazardRectifies]);

  const openDetail = (hazard: Hazard) => {
    setSelectedHazardId(hazard.id);
    setShowDetailModal(true);
    setSearchParams({ hazard: hazard.id }, { replace: true });
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedHazardId(null);
    setSearchParams({}, { replace: true });
  };

  const handleAction = (action: string, hazard: Hazard) => {
    setSelectedHazardId(hazard.id);
    if (action === 'view') {
      setShowDetailModal(true);
      return;
    }
    if (action === 'assign') {
      setShowDetailModal(false);
      setShowAssignModal(true);
      return;
    }
    if (action === 'submit') {
      setShowDetailModal(false);
      setShowRectifyModal(true);
      return;
    }
    if (action === 'review' || action === 'reject') {
      setShowDetailModal(false);
      setShowReviewModal(true);
      return;
    }
  };

  const handleReviewConfirm = (passed: boolean, reviewRemark: string) => {
    if (!selectedHazard) return;
    const reviewer = users.find((u) => u.role === 'safety_manager') || users[0];
    reviewHazard(selectedHazard.id, passed, reviewer.name, reviewer.id, reviewRemark);
    setShowReviewModal(false);
    setSelectedHazardId(null);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="shrink-0 mb-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">隐患整改</h1>
            <p className="text-sm text-slate-500 mt-1">跟踪和管理所有安全隐患的整改流程</p>
          </div>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors shadow-sm"
          >
            <Plus size={16} />
            登记隐患
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {levelFilters.map((item) => {
              const Icon = item.icon;
              const isActive = levelFilter === item.key;
              const count = levelCounts[item.key] || 0;
              return (
                <button
                  key={item.key}
                  onClick={() => setLevelFilter(item.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                    isActive
                      ? `${item.bg} ${item.text} ${item.border} shadow-sm`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  {item.key !== 'all' && (
                    <span className={cn('w-2 h-2 rounded-full', item.dot)} />
                  )}
                  {item.key === 'all' && <Icon size={14} />}
                  {item.label}
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded text-xs font-medium',
                      isActive ? 'bg-white/70' : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as HazardStatus | 'all')}
              className="pl-9 pr-9 py-2 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-white min-w-[140px]"
            >
              <option value="all">全部状态</option>
              {Object.entries(HazardStatusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="pl-9 pr-9 py-2 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-white min-w-[160px]"
            >
              <option value="">全部部门</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
            <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        {filteredHazards.length > 0 ? (
          <div className="grid grid-cols-2 gap-5">
            {filteredHazards.map((hazard) => (
              <HazardCard
                key={hazard.id}
                hazard={hazard}
                onAction={handleAction}
                onClick={() => openDetail(hazard)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <ShieldAlert size={28} />
            </div>
            <p className="text-sm font-medium text-slate-600">暂无符合条件的隐患</p>
            <p className="text-xs text-slate-400 mt-1">尝试调整筛选条件或登记新的隐患</p>
          </div>
        )}
      </div>

      <RegisterModal
        open={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />

      <AssignModal
        hazard={selectedHazard}
        open={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedHazardId(null);
        }}
      />

      <RectifyModal
        hazard={selectedHazard}
        open={showRectifyModal}
        onClose={() => {
          setShowRectifyModal(false);
          setSelectedHazardId(null);
        }}
      />

      <ReviewModal
        hazard={selectedHazard}
        rectifies={selectedHazard ? getRectifiesByHazardId(selectedHazard.id) : []}
        open={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedHazardId(null);
        }}
        onConfirm={handleReviewConfirm}
      />

      <DetailModal
        hazard={selectedHazard}
        rectifies={relatedRectifies}
        open={showDetailModal}
        onClose={closeDetail}
        onAction={handleAction}
      />
    </div>
  );
}