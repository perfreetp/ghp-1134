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
  RefreshCw,
  History,
  ChevronRight,
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
import type { Equipment, EquipmentMaintenance, ChangeLog, Building } from '@/types';
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
type ViewMode = 'list' | 'warning';

const TODAY = new Date('2026-06-10');

const parseDate = (dateStr: string): Date => {
  return new Date(dateStr.replace(/-/g, '/'));
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isOverdue = (nextCheckDate: string | null | undefined): boolean => {
  if (!nextCheckDate) return false;
  return parseDate(nextCheckDate) < TODAY;
};

const isThisWeek = (nextCheckDate: string | null | undefined): boolean => {
  if (!nextCheckDate) return false;
  const date = parseDate(nextCheckDate);
  const weekEnd = addDays(TODAY, 7);
  return date >= TODAY && date <= weekEnd;
};

const isIn30Days = (nextCheckDate: string | null | undefined): boolean => {
  if (!nextCheckDate) return false;
  const date = parseDate(nextCheckDate);
  const weekEnd = addDays(TODAY, 7);
  const thirtyDaysEnd = addDays(TODAY, 30);
  return date > weekEnd && date <= thirtyDaysEnd;
};

const getDaysDiff = (nextCheckDate: string | null | undefined): number => {
  if (!nextCheckDate) return 0;
  const date = parseDate(nextCheckDate);
  const diffTime = date.getTime() - TODAY.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
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
    updateSingleEquipmentCycle,
    changeLogs,
    buildings,
  } = useAppStore();

  const [categoryFilter, setCategoryFilter] = useState<EquipmentCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [selectedEquipmentId, setShowDetailModalId] = useState<string | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState<Equipment | null>(null);
  const [showSingleCycleModal, setShowSingleCycleModal] = useState<Equipment | null>(null);
  const [singleCycleValue, setSingleCycleValue] = useState<CheckCycle>(CheckCycle.QUARTERLY);
  const [detailTab, setDetailTab] = useState<'info' | 'history'>('info');

  const selectedEquipment = useMemo(() => {
    if (!selectedEquipmentId) return null;
    return equipments.find((e) => e.id === selectedEquipmentId) || null;
  }, [selectedEquipmentId, equipments]);
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

  const warningGroups = useMemo(() => {
    const searchFiltered = equipments.filter((eq) => {
      const matchCategory = categoryFilter === 'all' || eq.category === categoryFilter;
      const matchSearch =
        !searchText ||
        eq.code.toLowerCase().includes(searchText.toLowerCase()) ||
        eq.name.toLowerCase().includes(searchText.toLowerCase()) ||
        eq.model.toLowerCase().includes(searchText.toLowerCase());
      return matchCategory && matchSearch;
    });

    const overdue = searchFiltered.filter((eq) => isOverdue(eq.next_check_date));
    const thisWeek = searchFiltered.filter((eq) => isThisWeek(eq.next_check_date));
    const in30Days = searchFiltered.filter((eq) => isIn30Days(eq.next_check_date));

    return { overdue, thisWeek, in30Days };
  }, [equipments, categoryFilter, searchText]);

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

  const equipmentChangeLogs = selectedEquipment
    ? changeLogs
        .filter(
          (log) =>
            log.target_type === 'equipment' && log.target_id === selectedEquipment.id
        )
        .sort((a, b) => b.operated_at.localeCompare(a.operated_at))
    : [];

  const handleOpenSingleCycleModal = (equipment: Equipment) => {
    setShowSingleCycleModal(equipment);
    setSingleCycleValue(equipment.check_cycle);
  };

  const handleSaveSingleCycle = () => {
    if (showSingleCycleModal) {
      updateSingleEquipmentCycle(showSingleCycleModal.id, singleCycleValue);
      setShowSingleCycleModal(null);
      showToast('检查周期已更新');
    }
  };

  const handleDetailCycleChange = (cycle: CheckCycle) => {
    if (selectedEquipment) {
      updateSingleEquipmentCycle(selectedEquipment.id, cycle);
      showToast('检查周期已更新');
    }
  };

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

        <div className="flex flex-wrap items-center gap-2">
          <StatusButton
            active={viewMode === 'list' && statusFilter === 'all'}
            onClick={() => {
              setViewMode('list');
              setStatusFilter('all');
            }}
            label="全部"
          />
          <StatusButton
            active={viewMode === 'list' && statusFilter === EquipmentStatus.NORMAL}
            onClick={() => {
              setViewMode('list');
              setStatusFilter(EquipmentStatus.NORMAL);
            }}
            label="正常"
            color="green"
          />
          <StatusButton
            active={viewMode === 'list' && statusFilter === EquipmentStatus.MAINTENANCE}
            onClick={() => {
              setViewMode('list');
              setStatusFilter(EquipmentStatus.MAINTENANCE);
            }}
            label="维护中"
            color="blue"
          />
          <StatusButton
            active={viewMode === 'list' && statusFilter === EquipmentStatus.FAULT}
            onClick={() => {
              setViewMode('list');
              setStatusFilter(EquipmentStatus.FAULT);
            }}
            label="故障"
            color="red"
          />
          <StatusButton
            active={viewMode === 'list' && statusFilter === EquipmentStatus.EXPIRED}
            onClick={() => {
              setViewMode('list');
              setStatusFilter(EquipmentStatus.EXPIRED);
            }}
            label="过期"
            color="orange"
          />
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <StatusButton
            active={viewMode === 'warning'}
            onClick={() => setViewMode('warning')}
            label="到期预警"
            color="amber"
          />
        </div>
      </div>

      {viewMode === 'list' ? (
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
                              onClick={() => setShowDetailModalId(eq.id)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenSingleCycleModal(eq)}
                              className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="调整周期"
                            >
                              <RefreshCw className="w-4 h-4" />
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
      ) : (
        <div className="space-y-6">
          <WarningGroup
            title="已逾期"
            equipments={warningGroups.overdue}
            color="red"
            getBuildingById={getBuildingById}
            onAdjustCycle={handleOpenSingleCycleModal}
            onViewMaintenance={setShowMaintenanceModal}
          />
          <WarningGroup
            title="本周到期"
            equipments={warningGroups.thisWeek}
            color="orange"
            getBuildingById={getBuildingById}
            onAdjustCycle={handleOpenSingleCycleModal}
            onViewMaintenance={setShowMaintenanceModal}
          />
          <WarningGroup
            title="30天内到期"
            equipments={warningGroups.in30Days}
            color="yellow"
            getBuildingById={getBuildingById}
            onAdjustCycle={handleOpenSingleCycleModal}
            onViewMaintenance={setShowMaintenanceModal}
          />
          {warningGroups.overdue.length === 0 &&
           warningGroups.thisWeek.length === 0 &&
           warningGroups.in30Days.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-20">
              <div className="flex flex-col items-center justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
                <p className="text-gray-500 text-lg">暂无到期预警设备</p>
                <p className="text-gray-400 text-sm mt-1">所有设备检查日期均在正常范围内</p>
              </div>
            </div>
          )}
        </div>
      )}

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

      {showSingleCycleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSingleCycleModal(null)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">调整检查周期</h2>
                <p className="text-sm text-gray-500 mt-1">单台设备周期调整</p>
              </div>
              <button
                onClick={() => setShowSingleCycleModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">设备名称</span>
                  <span className="text-sm font-medium text-gray-900">{showSingleCycleModal.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">设备编号</span>
                  <span className="text-sm font-mono text-gray-600">{showSingleCycleModal.code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">当前周期</span>
                  <span className="text-sm font-medium text-indigo-600">
                    {CheckCycleLabels[showSingleCycleModal.check_cycle]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">上次检查</span>
                  <span className="text-sm text-gray-700">{showSingleCycleModal.last_check_date}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择新周期
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(CheckCycle).map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setSingleCycleValue(cycle)}
                      className={cn(
                        'px-4 py-3 rounded-xl text-sm font-medium transition-all border',
                        singleCycleValue === cycle
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                      )}
                    >
                      {CheckCycleLabels[cycle]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  修改检查周期后，将根据上次检查日期自动计算新的下次检查时间。
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setShowSingleCycleModal(null)}
                className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors bg-white"
              >
                取消
              </button>
              <button
                onClick={handleSaveSingleCycle}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDetailModalId(null)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl mx-4 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedEquipment.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1 font-mono">{selectedEquipment.code}</p>
              </div>
              <button
                onClick={() => setShowDetailModalId(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="border-b border-gray-100">
              <div className="flex">
                <button
                  onClick={() => setDetailTab('info')}
                  className={cn(
                    'flex-1 px-6 py-3 text-sm font-medium transition-colors relative',
                    detailTab === 'info'
                      ? 'text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  设备信息
                  {detailTab === 'info' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                  )}
                </button>
                <button
                  onClick={() => setDetailTab('history')}
                  className={cn(
                    'flex-1 px-6 py-3 text-sm font-medium transition-colors relative flex items-center justify-center gap-2',
                    detailTab === 'history'
                      ? 'text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <History className="w-4 h-4" />
                  变更历史
                  {detailTab === 'history' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {detailTab === 'info' ? (
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border',
                        statusStyles[selectedEquipment.status]
                      )}
                    >
                      {statusIcons[selectedEquipment.status]}
                      {EquipmentStatusLabels[selectedEquipment.status]}
                    </span>
                    <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                      {EquipmentCategoryLabels[selectedEquipment.category]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-5 pt-2">
                    <DetailItem label="设备型号" value={selectedEquipment.model} />
                    <DetailItem label="安装日期" value={selectedEquipment.install_date} />
                    <DetailItem label="所属建筑" value={getBuildingById(selectedEquipment.building_id)?.name || '-'} />
                    <DetailItem label="上次检查" value={selectedEquipment.last_check_date} />
                  </div>

                  <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">检查周期</div>
                        <div className="text-lg font-bold text-indigo-700">
                          {CheckCycleLabels[selectedEquipment.check_cycle]}
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenSingleCycleModal(selectedEquipment)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors border border-indigo-200"
                      >
                        <RefreshCw className="w-4 h-4" />
                        调整周期
                      </button>
                    </div>
                    <div className="pt-3 border-t border-indigo-100">
                      <div className="text-xs text-gray-500 mb-1.5">下次检查日期</div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <span
                          className={cn(
                            'text-base font-semibold',
                            isOverdue(selectedEquipment.next_check_date)
                              ? 'text-red-600'
                              : 'text-gray-900'
                          )}
                        >
                          {selectedEquipment.next_check_date}
                          {isOverdue(selectedEquipment.next_check_date) && (
                            <span className="ml-1 text-xs font-medium">(已逾期)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {equipmentChangeLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <History className="w-14 h-14 text-gray-300 mb-4" />
                      <p className="text-gray-500">暂无变更记录</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {equipmentChangeLogs.map((log) => (
                        <ChangeLogCard key={log.id} log={log} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end p-6 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setShowDetailModalId(null)}
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
  color?: 'green' | 'blue' | 'red' | 'orange' | 'amber';
}) {
  const activeStyles = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
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

function ChangeLogCard({ log }: { log: ChangeLog }) {
  const fieldLabels: Record<string, string> = {
    check_cycle: '检查周期',
    status: '设备状态',
    name: '设备名称',
    model: '设备型号',
  };

  const getValueLabel = (field: string, value: string) => {
    if (field === 'check_cycle') {
      return CheckCycleLabels[value as CheckCycle] || value;
    }
    if (field === 'status') {
      return EquipmentStatusLabels[value as EquipmentStatus] || value;
    }
    return value;
  };

  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-medium rounded-lg border bg-indigo-50 text-indigo-700 border-indigo-200">
            {fieldLabels[log.field] || log.field}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          {log.operated_at}
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">原值：</span>
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
          {getValueLabel(log.field, log.old_value)}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <span className="text-gray-500">新值：</span>
        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
          {getValueLabel(log.field, log.new_value)}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
        <Check className="w-3.5 h-3.5" />
        操作人：{log.operator}
      </div>
    </div>
  );
}

interface WarningGroupProps {
  title: string;
  equipments: Equipment[];
  color: 'red' | 'orange' | 'yellow';
  getBuildingById: (id: string) => Building | undefined;
  onAdjustCycle: (equipment: Equipment) => void;
  onViewMaintenance: (equipment: Equipment) => void;
}

function WarningGroup({
  title,
  equipments,
  color,
  getBuildingById,
  onAdjustCycle,
  onViewMaintenance,
}: WarningGroupProps) {
  const colorStyles = {
    red: {
      border: 'border-red-200',
      bg: 'bg-red-50/50',
      titleBg: 'bg-red-500',
      titleText: 'text-white',
      countBg: 'bg-white/20',
    },
    orange: {
      border: 'border-orange-200',
      bg: 'bg-orange-50/50',
      titleBg: 'bg-orange-500',
      titleText: 'text-white',
      countBg: 'bg-white/20',
    },
    yellow: {
      border: 'border-yellow-200',
      bg: 'bg-yellow-50/50',
      titleBg: 'bg-yellow-500',
      titleText: 'text-white',
      countBg: 'bg-white/20',
    },
  };

  const styles = colorStyles[color];

  if (equipments.length === 0) {
    return null;
  }

  return (
    <div className={cn('rounded-xl border-2 overflow-hidden shadow-sm', styles.border, styles.bg)}>
      <div className={cn('flex items-center justify-between px-5 py-3.5', styles.titleBg)}>
        <div className="flex items-center gap-2.5">
          {color === 'red' && <AlertOctagon className="w-5 h-5 text-white" />}
          {color === 'orange' && <AlertTriangle className="w-5 h-5 text-white" />}
          {color === 'yellow' && <Clock className="w-5 h-5 text-white" />}
          <h3 className={cn('text-base font-bold', styles.titleText)}>{title}</h3>
        </div>
        <span className={cn('px-3 py-1 rounded-full text-xs font-bold', styles.countBg, styles.titleText)}>
          {equipments.length} 台
        </span>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipments.map((equipment) => (
          <WarningCard
            key={equipment.id}
            equipment={equipment}
            color={color}
            building={getBuildingById(equipment.building_id)}
            onAdjustCycle={() => onAdjustCycle(equipment)}
            onViewMaintenance={() => onViewMaintenance(equipment)}
          />
        ))}
      </div>
    </div>
  );
}

interface WarningCardProps {
  equipment: Equipment;
  color: 'red' | 'orange' | 'yellow';
  building?: Building;
  onAdjustCycle: () => void;
  onViewMaintenance: () => void;
}

function WarningCard({
  equipment,
  color,
  building,
  onAdjustCycle,
  onViewMaintenance,
}: WarningCardProps) {
  const colorStyles = {
    red: {
      border: 'border-red-200',
      dateText: 'text-red-600',
      dateBg: 'bg-red-100',
      badgeBg: 'bg-red-50',
      badgeText: 'text-red-700',
      badgeBorder: 'border-red-200',
    },
    orange: {
      border: 'border-orange-200',
      dateText: 'text-orange-600',
      dateBg: 'bg-orange-100',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-700',
      badgeBorder: 'border-orange-200',
    },
    yellow: {
      border: 'border-yellow-200',
      dateText: 'text-yellow-700',
      dateBg: 'bg-yellow-100',
      badgeBg: 'bg-yellow-50',
      badgeText: 'text-yellow-700',
      badgeBorder: 'border-yellow-200',
    },
  };

  const styles = colorStyles[color];
  const daysDiff = getDaysDiff(equipment.next_check_date);
  const hasNextCheckDate = !!equipment.next_check_date;

  const getDaysLabel = () => {
    if (!hasNextCheckDate) return '未设置';
    if (daysDiff < 0) {
      return `已逾期${Math.abs(daysDiff)}天`;
    }
    if (daysDiff === 0) {
      return '今天到期';
    }
    return `还剩${daysDiff}天`;
  };

  return (
    <div className={cn('bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow', styles.border)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-900 truncate">{equipment.name || '-'}</h4>
          <p className="text-xs font-mono text-gray-500 mt-0.5">{equipment.code || '-'}</p>
        </div>
        <span
          className={cn(
            'px-2.5 py-1 text-xs font-medium rounded-lg border ml-2 shrink-0',
            styles.badgeBg,
            styles.badgeText,
            styles.badgeBorder
          )}
        >
          {EquipmentCategoryLabels[equipment.category] || '-'}
        </span>
      </div>

      <div className="space-y-2.5 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400 shrink-0 w-14">楼栋：</span>
          <span className="text-gray-700 truncate">{building?.name || '-'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400 shrink-0 w-14">周期：</span>
          <span className="text-gray-700">
            {CheckCycleLabels[equipment.check_cycle]
              ? `${CheckCycleLabels[equipment.check_cycle]}巡检`
              : '-'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400 shrink-0 w-14">日期：</span>
          <div className="flex items-center gap-1.5">
            <Calendar className={cn('w-4 h-4', styles.dateText)} />
            <span className={cn('font-semibold', styles.dateText)}>
              {hasNextCheckDate ? equipment.next_check_date : '未设置'}
            </span>
          </div>
        </div>
      </div>

      <div className={cn('flex items-center justify-center py-2 rounded-lg mb-4', styles.dateBg)}>
        <span className={cn('text-sm font-bold', styles.dateText)}>
          {getDaysLabel()}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onAdjustCycle}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          调整周期
        </button>
        <button
          onClick={onViewMaintenance}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <FileText className="w-4 h-4" />
          维护记录
        </button>
      </div>
    </div>
  );
}
