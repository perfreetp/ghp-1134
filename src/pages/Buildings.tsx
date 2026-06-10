import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Building2,
  MapPin,
  Layers,
  Maximize2,
  Map as MapIcon,
  Cpu,
  AlertTriangle,
  Eye,
  Edit,
  X,
  QrCode,
  Clock,
  User,
  Phone,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  RiskLevel,
  RiskLevelLabels,
  EquipmentCategoryLabels,
} from '@/types';
import type { Building } from '@/types';
import { cn } from '@/lib/utils';

const riskLevelStyles: Record<RiskLevel, string> = {
  [RiskLevel.HIGH]: 'bg-red-100 text-red-700 border-red-200',
  [RiskLevel.MEDIUM]: 'bg-orange-100 text-orange-700 border-orange-200',
  [RiskLevel.LOW]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  [RiskLevel.NORMAL]: 'bg-green-100 text-green-700 border-green-200',
};

type DetailTab = 'basic' | 'points' | 'equipment' | 'history';

const fieldLabelMap: Record<string, string> = {
  name: '楼名',
  address: '地址',
  floors: '楼层数',
  area: '面积',
  risk_level: '风险等级',
  point_count: '点位数量',
  construction_year: '建成年份',
  manager: '负责人',
  manager_phone: '联系电话',
};

export default function Buildings() {
  const {
    buildings,
    getPointsByBuildingId,
    getEquipmentsByBuildingId,
    getBuildingHazardCount,
    changeLogs,
  } = useAppStore();

  const [searchText, setSearchText] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('basic');

  const filteredBuildings = useMemo(() => {
    return buildings.filter((b) => {
      const matchSearch =
        !searchText ||
        b.name.toLowerCase().includes(searchText.toLowerCase()) ||
        b.address.toLowerCase().includes(searchText.toLowerCase());
      const matchRisk = riskFilter === 'all' || b.risk_level === riskFilter;
      return matchSearch && matchRisk;
    });
  }, [buildings, searchText, riskFilter]);

  const buildingPoints = selectedBuilding
    ? getPointsByBuildingId(selectedBuilding.id)
    : [];
  const buildingEquipments = selectedBuilding
    ? getEquipmentsByBuildingId(selectedBuilding.id)
    : [];
  const buildingChangeLogs = selectedBuilding
    ? changeLogs.filter(
        (l) => l.target_type === 'building' && l.target_id === selectedBuilding.id
      )
    : [];

  const openDetail = (building: Building) => {
    setSelectedBuilding(building);
    setDetailTab('basic');
  };

  const closeDetail = () => {
    setSelectedBuilding(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">建筑档案</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="按楼名/地址搜索..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as RiskLevel | 'all')}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">全部风险等级</option>
            <option value={RiskLevel.HIGH}>高风险</option>
            <option value={RiskLevel.MEDIUM}>中风险</option>
            <option value={RiskLevel.LOW}>低风险</option>
            <option value={RiskLevel.NORMAL}>正常</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            新增楼栋
          </button>
        </div>
      </div>

      {filteredBuildings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
          <Building2 className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">暂无符合条件的楼栋</p>
          <p className="text-gray-400 text-sm mt-1">请调整搜索条件或筛选器</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBuildings.map((building) => (
            <BuildingCard
              key={building.id}
              building={building}
              equipmentCount={getEquipmentsByBuildingId(building.id).length}
              hazardCount={getBuildingHazardCount(building.id)}
              onClick={() => openDetail(building)}
            />
          ))}
        </div>
      )}

      {selectedBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDetail}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl mx-4 flex flex-col">
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedBuilding.name}
                  </h2>
                  <span
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-full border',
                      riskLevelStyles[selectedBuilding.risk_level]
                    )}
                  >
                    {RiskLevelLabels[selectedBuilding.risk_level]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedBuilding.address}
                </p>
              </div>
              <button
                onClick={closeDetail}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex border-b border-gray-100 px-6">
              {(
                [
                  { key: 'basic', label: '基本信息' },
                  { key: 'points', label: '点位分布' },
                  { key: 'equipment', label: '设备清单' },
                  { key: 'history', label: '变更历史' },
                ] as { key: DetailTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDetailTab(tab.key)}
                  className={cn(
                    'px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                    detailTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {detailTab === 'basic' && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <InfoRow icon={<Building2 className="w-4 h-4" />} label="楼栋名称" value={selectedBuilding.name} />
                  <InfoRow icon={<MapPin className="w-4 h-4" />} label="详细地址" value={selectedBuilding.address} />
                  <InfoRow icon={<Layers className="w-4 h-4" />} label="楼层数量" value={`${selectedBuilding.floors} 层`} />
                  <InfoRow icon={<Maximize2 className="w-4 h-4" />} label="建筑面积" value={`${selectedBuilding.area.toLocaleString()} ㎡`} />
                  <InfoRow icon={<AlertTriangle className="w-4 h-4" />} label="风险等级">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 text-xs font-medium rounded-full border',
                        riskLevelStyles[selectedBuilding.risk_level]
                      )}
                    >
                      {RiskLevelLabels[selectedBuilding.risk_level]}
                    </span>
                  </InfoRow>
                  <InfoRow icon={<MapIcon className="w-4 h-4" />} label="巡检点位数" value={`${selectedBuilding.point_count} 个`} />
                  <InfoRow icon={<Clock className="w-4 h-4" />} label="建成年份" value={selectedBuilding.construction_year} />
                  <InfoRow icon={<User className="w-4 h-4" />} label="物业负责人" value={selectedBuilding.manager} />
                  <InfoRow icon={<Phone className="w-4 h-4" />} label="联系电话" value={selectedBuilding.manager_phone} />
                  <InfoRow icon={<Cpu className="w-4 h-4" />} label="设备总数" value={`${buildingEquipments.length} 台`} />
                </div>
              )}

              {detailTab === 'points' && (
                <div>
                  {buildingPoints.length === 0 ? (
                    <EmptyTip text="暂无巡检点位数据" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">点位名称</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">楼层位置</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">二维码</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">设备数</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {buildingPoints.map((point) => (
                            <tr key={point.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm font-medium text-gray-900">{point.name}</td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                <div>{point.floor}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{point.location}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
                                  <QrCode className="w-4 h-4 text-gray-500" />
                                  <span className="text-xs font-mono text-gray-600">{point.qr_code}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {getEquipmentsByBuildingId(selectedBuilding.id).filter((e) => e.point_id === point.id).length} 台
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'equipment' && (
                <div>
                  {buildingEquipments.length === 0 ? (
                    <EmptyTip text="暂无设备数据" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">设备编号</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">设备名称</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">类型</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">型号</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">所属点位</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {buildingEquipments.map((eq) => (
                            <tr key={eq.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm font-mono text-gray-600">{eq.code}</td>
                              <td className="py-3 px-4 text-sm font-medium text-gray-900">{eq.name}</td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {EquipmentCategoryLabels[eq.category]}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">{eq.model}</td>
                              <td className="py-3 px-4 text-sm text-gray-500">
                                {buildingPoints.find((p) => p.id === eq.point_id)?.name || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'history' && (
                <div>
                  {buildingChangeLogs.length === 0 ? (
                    <EmptyTip text="暂无变更记录" />
                  ) : (
                    <div className="relative pl-8">
                      <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />
                      {buildingChangeLogs.map((log, idx) => (
                        <div key={log.id} className="relative pb-6 last:pb-0">
                          <div
                            className={cn(
                              'absolute -left-5 top-1 w-4 h-4 rounded-full border-4 border-white',
                              idx === 0 ? 'bg-blue-500' : 'bg-gray-300'
                            )}
                          />
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-900">
                                修改 {fieldLabelMap[log.field] || log.field}
                              </span>
                              <span className="text-xs text-gray-400">{log.operated_at}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">
                                {RiskLevelLabels[log.old_value as RiskLevel] || log.old_value}
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                              <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">
                                {RiskLevelLabels[log.new_value as RiskLevel] || log.new_value}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                              操作人：{log.operator}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BuildingCard({
  building,
  equipmentCount,
  hazardCount,
  onClick,
}: {
  building: Building;
  equipmentCount: number;
  hazardCount: number;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="absolute top-4 right-4">
        <span
          className={cn(
            'px-2.5 py-1 text-xs font-medium rounded-full border',
            riskLevelStyles[building.risk_level]
          )}
        >
          {RiskLevelLabels[building.risk_level]}
        </span>
      </div>

      <div className="pr-20 mb-4">
        <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
          {building.name}
        </h3>
      </div>

      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{building.address}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-gray-400" />
            <span>{building.floors}层</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-gray-400" />
            <span>{building.area.toLocaleString()}㎡</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-50">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{building.point_count}</div>
          <div className="text-xs text-gray-400 mt-0.5">点位数量</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-indigo-600">{equipmentCount}</div>
          <div className="text-xs text-gray-400 mt-0.5">设备数量</div>
        </div>
        <div className="text-center">
          <div
            className={cn(
              'text-lg font-bold',
              hazardCount > 0 ? 'text-red-600' : 'text-green-600'
            )}
          >
            {hazardCount}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">隐患数量</div>
        </div>
      </div>

      <div
        className={cn(
          'absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 py-3 bg-gradient-to-t from-white via-white/95 to-transparent rounded-b-xl transition-all duration-200',
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          查看详情
        </button>
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Edit className="w-3.5 h-3.5" />
          编辑
        </button>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-400 mb-1">{label}</div>
        {children ?? <div className="text-sm font-medium text-gray-900">{value}</div>}
      </div>
    </div>
  );
}

function EmptyTip({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
        <Building2 className="w-7 h-7 text-gray-300" />
      </div>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
