import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Settings,
  Cpu,
  Calendar,
  Eye,
  FileText,
  X,
  Check,
  Clock,
  Wrench,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Ban,
  Save,
  Info,
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  EquipmentCategory,
  EquipmentCategoryLabels,
  EquipmentStatus,
  EquipmentStatusLabels,
  CheckCycle,
  CheckCycleLabels,
} from '@/types';
import type { Equipment, EquipmentMaintenance } from '@/types';
import { cn } from '@/lib/utils';

const equipmentCategoryList = [
  EquipmentCategory.FIRE_EXTINGUISHER,
  EquipmentCategory.SPRINKLER,
  EquipmentCategory.SMOKE_DETECTOR,
  EquipmentCategory.FIRE_HYDRANT,
  EquipmentCategory.FIRE_ALARM,
  EquipmentCategory.EMERGENCY_LIGHT,
];

const statusStyles: Record<EquipmentStatus, string> = {
  [EquipmentStatus.NORMAL]: 'bg-green-100 text-green-700 border-green-200',
  [EquipmentStatus.MAINTENANCE]: 'bg-blue-100 text-blue-700 border-blue-200',
  [EquipmentStatus.FAULT]: 'bg-red-100 text-red-700 border-red-200',
  [EquipmentStatus.EXPIRED]: 'bg-orange-100 text-orange-700 border-orange-200',
};

const statusIcons: Record<EquipmentStatus, React.ReactNode> = {
  [EquipmentStatus.NORMAL]: <CheckCircle2 className="w-3.5 h-3.5" />,
  [EquipmentStatus.MAINTENANCE]: <Wrench className="w-3.5 h-3.5" />,
  [EquipmentStatus.FAULT]: <AlertOctagon className="w-3.5 h-3.5" />,
  [EquipmentStatus.EXPIRED]: <Ban className="w-3.5 h-3.5" />,
};

type StatusFilter = 'all' | EquipmentStatus;

const today = '2026-06-10';

const isOverdue = (nextCheckDate: string): boolean => {
  return nextCheckDate < today;
};

const maintenanceTypeLabels: Record<string, string> = {
  check: '定期检查',
  repair: '维修',
  replace: '更换',
};

export default function Equipment() {
  const {
    equipments,
    getMaintenancesByEquipmentId,
    getBuildingById,
    updateEquipmentCheckCycle,
  } = useAppStore();

  const [categoryFilter, setCategoryFilter] = useState<EquipmentCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchText, setSearchText] = useState('');
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Equipment | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState<Equipment | null>(null);
  const [cycleSettings, setCycleSettings] = useState<Record<string, CheckCycle>>(() => {
    const settings: Record<string, CheckCycle> = {};
    equipmentCategoryList.forEach((cat) => {
      const sample = equipments.find((e) => e.category === cat);
      settings[cat] = sample?.check_cycle || CheckCycle.QUARTERLY;
    });
    return settings;
  });
  const [toast, setToast] = useState<string | null>(null);

  const filteredEquipments = useMemo(() => {
    return equipments.filter((eq) => {
      const matchCategory = categoryFilter === 'all' || eq.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || eq.status === statusFilter;
      const matchSearch =
        !searchText ||
        eq.code.toLowerCase().includes(searchText.toLowerCase()) ||
        eq.name.toLowerCase().includes(searchText.toLowerCase()) ||
        eq.model.toLowerCase().includes(searchText.toLowerCase());
      return matchCategory && matchStatus && matchSearch;
    });
  }, [equipments, categoryFilter, statusFilter, searchText]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveCycles = () => {
    Object.entries(cycleSettings).forEach(([category, cycle]) => {
      updateEquipmentCheckCycle(category, cycle);
    });
    setShowCycleModal(false);
    showToast('下次检查时间已自动更新');
  };

  const maintenanceRecords = showMaintenanceModal
    ? getMaintenancesByEquipmentId(showMaintenanceModal.id)
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Cpu className="w-7 h-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">设备台账</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索设备编号/名称/型号..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            />
          </div>

          <button
            onClick={() => setShowCycleModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors bg-white"
          >
            <Settings className="w-4 h-4" />
            设置检查周期
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" />
            新增设备
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <CategoryTab
            active={categoryFilter === 'all'}
            onClick={() => setCategoryFilter('all')}
            label="全部"
            count={equipments.length}
          />
          {equipmentCategoryList.map((cat) => (
            <CategoryTab
              key={cat}
              active={categoryFilter === cat}
              onClick={() => setCategoryFilter(cat)}
              label={EquipmentCategoryLabels[cat]}
              count={equipments.filter((e) => e.category === cat).length}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusButton
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
            label="全部"
          />
          <StatusButton
            active={statusFilter === EquipmentStatus.NORMAL}
            onClick={() => setStatusFilter(EquipmentStatus.NORMAL)}
            label="正常"
            color="green"
          />
          <StatusButton
            active={statusFilter === EquipmentStatus.MAINTENANCE}
            onClick={() => setStatusFilter(EquipmentStatus.MAINTENANCE)}
            label="维护中"
            color="blue"
          />
          <StatusButton
            active={statusFilter === EquipmentStatus.FAULT}
            onClick={() => setStatusFilter(EquipmentStatus.FAULT)}
            label="故障"
            color="red"
          />
          <StatusButton
            active={statusFilter === EquipmentStatus.EXPIRED}
            onClick={() => setStatusFilter(EquipmentStatus.EXPIRED)}
            label="过期"
            color="orange"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredEquipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Cpu className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">暂无设备数据</p>
            <p className="text-gray-400 text-sm mt-1">请调整筛选条件或新增设备</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">设备编号</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">设备名称</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">类型</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">型号</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">位置</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">上次检查</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">下次检查</th>
                  <th className="text-right py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEquipments.map((eq) => {
                  const building = getBuildingById(eq.building_id);
                  const overdue = isOverdue(eq.next_check_date);
                  return (
                    <tr key={eq.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-5">
                        <span className="text-sm font-mono text-gray-600">{eq.code}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm font-medium text-gray-900">{eq.name}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm text-gray-600">
                          {EquipmentCategoryLabels[eq.category]}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm text-gray-500">{eq.model}</span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="text-sm text-gray-600 max-w-[180px] truncate" title={building?.name}>
                          {building?.name || '-'}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border',
                            statusStyles[eq.status]
                          )}
                        >
                          {statusIcons[eq.status]}
                          {EquipmentStatusLabels[eq.status]}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {eq.last_check_date}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5">
                          {overdue ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          )}
                          <span
                            className={cn(
                              'text-sm font-medium',
                              overdue ? 'text-red-600 font-bold' : 'text-gray-600'
                            )}
                          >
                            {eq.next_check_date}
                            {overdue && <span className="ml-1 text-xs">(逾期)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setShowDetailModal(eq)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowMaintenanceModal(eq)}
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="维护记录"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCycleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCycleModal(false)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">设置检查周期</h2>
                <p className="text-sm text-gray-500 mt-1">为每种设备类型设置检查周期</p>
              </div>
              <button
                onClick={() => setShowCycleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {equipmentCategoryList.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {EquipmentCategoryLabels[cat]}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        共 {equipments.filter((e) => e.category === cat).length} 台设备
                      </div>
                    </div>
                  </div>
                  <select
                    value={cycleSettings[cat]}
                    onChange={(e) =>
                      setCycleSettings((prev) => ({
                        ...prev,
                        [cat]: e.target.value as CheckCycle,
                      }))
                    }
                    className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[110px]"
                  >
                    <option value={CheckCycle.MONTHLY}>{CheckCycleLabels[CheckCycle.MONTHLY]}</option>
                    <option value={CheckCycle.QUARTERLY}>{CheckCycleLabels[CheckCycle.QUARTERLY]}</option>
                    <option value={CheckCycle.SEMI_ANNUAL}>{CheckCycleLabels[CheckCycle.SEMI_ANNUAL]}</option>
                    <option value={CheckCycle.ANNUAL}>{CheckCycleLabels[CheckCycle.ANNUAL]}</option>
                  </select>
                </div>
              ))}

              <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-100 rounded-xl mt-6">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  修改检查周期后，将根据上次检查日期自动计算新的下次检查时间。
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setShowCycleModal(false)}
                className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors bg-white"
              >
                取消
              </button>
              <button
                onClick={handleSaveCycles}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDetailModal(null)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {showDetailModal.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1 font-mono">{showDetailModal.code}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border',
                    statusStyles[showDetailModal.status]
                  )}
                >
                  {statusIcons[showDetailModal.status]}
                  {EquipmentStatusLabels[showDetailModal.status]}
                </span>
                <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                  {EquipmentCategoryLabels[showDetailModal.category]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-5 pt-2">
                <DetailItem label="设备型号" value={showDetailModal.model} />
                <DetailItem label="安装日期" value={showDetailModal.install_date} />
                <DetailItem label="所属建筑" value={getBuildingById(showDetailModal.building_id)?.name || '-'} />
                <DetailItem label="检查周期" value={CheckCycleLabels[showDetailModal.check_cycle]} />
                <DetailItem label="上次检查" value={showDetailModal.last_check_date} />
                <DetailItem label="下次检查">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isOverdue(showDetailModal.next_check_date)
                        ? 'text-red-600 font-bold'
                        : 'text-gray-900'
                    )}
                  >
                    {showDetailModal.next_check_date}
                    {isOverdue(showDetailModal.next_check_date) && (
                      <span className="ml-1 text-xs">(已逾期)</span>
                    )}
                  </span>
                </DetailItem>
              </div>
            </div>

            <div className="flex items-center justify-end p-6 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setShowDetailModal(null)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMaintenanceModal(null)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl mx-4 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">维护记录</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {showMaintenanceModal.name} · {showMaintenanceModal.code}
                </p>
              </div>
              <button
                onClick={() => setShowMaintenanceModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {maintenanceRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="w-14 h-14 text-gray-300 mb-4" />
                  <p className="text-gray-500">暂无维护记录</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {maintenanceRecords.map((record) => (
                    <MaintenanceCard key={record.id} record={record} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end p-6 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setShowMaintenanceModal(null)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-gray-900 text-white rounded-xl shadow-2xl">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        active
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-200 hover:text-indigo-600'
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          'px-2 py-0.5 rounded-full text-xs font-semibold',
          active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
        )}
      >
        {count}
      </span>
    </button>
  );
}

function StatusButton({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: 'green' | 'blue' | 'red' | 'orange';
}) {
  const activeStyles = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-1.5 rounded-lg text-sm font-medium border transition-all',
        active
          ? color
            ? activeStyles[color]
            : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
      )}
    >
      {label}
    </button>
  );
}

function DetailItem({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-1.5">{label}</div>
      {children ?? <div className="text-sm font-medium text-gray-900">{value}</div>}
    </div>
  );
}

function MaintenanceCard({ record }: { record: EquipmentMaintenance }) {
  const typeColors: Record<string, string> = {
    check: 'bg-blue-50 text-blue-700 border-blue-200',
    repair: 'bg-amber-50 text-amber-700 border-amber-200',
    replace: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-lg border',
              typeColors[record.type] || 'bg-gray-50 text-gray-600 border-gray-200'
            )}
          >
            {maintenanceTypeLabels[record.type] || record.type}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          {record.date}
        </div>
      </div>
      <p className="text-sm text-gray-700 mb-2">{record.description}</p>
      {record.remark && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mt-3">
          <span className="font-medium text-gray-600">备注：</span>
          {record.remark}
        </p>
      )}
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
        <Check className="w-3.5 h-3.5" />
        操作人：{record.operator}
      </div>
    </div>
  );
}
