import { create } from 'zustand';
import type {
  Building,
  InspectionPoint,
  Equipment,
  EquipmentMaintenance,
  InspectionTask,
  InspectionRecord,
  Hazard,
  HazardRectify,
  Drill,
  DrillAttendance,
  User,
  Department,
  TaskStatus,
  HazardLevel,
  HazardStatus,
  Statistics,
  TrendData,
  TodoItem,
  DepartmentOverdue,
  MonthlyReport,
  RiskLevel,
  EquipmentStatus,
  ChangeLog,
  CheckCycle,
  EquipmentCategory,
} from '@/types';
import {
  TaskStatus as TaskStatusEnum,
  HazardLevel as HazardLevelEnum,
  HazardStatus as HazardStatusEnum,
  RiskLevel as RiskLevelEnum,
  EquipmentStatus as EquipmentStatusEnum,
  CheckCycle as CheckCycleEnum,
  EquipmentCategory as EquipmentCategoryEnum,
} from '@/types';
import { buildings, inspectionPoints } from '@/data/buildings';
import { equipments, equipmentMaintenances } from '@/data/equipment';
import { inspectionTasks, inspectionRecords } from '@/data/inspections';
import { hazards, hazardRectifies } from '@/data/hazards';
import { drills, drillAttendances } from '@/data/drills';
import { users, departments } from '@/data/users';

interface Filters {
  buildingId?: string;
  equipmentCategory?: string;
  taskStatus?: TaskStatus;
  hazardLevel?: HazardLevel;
  hazardStatus?: HazardStatus;
  dateRange?: [string, string];
  departmentId?: string;
  searchKeyword?: string;
}

interface EquipmentStatusDistributionItem {
  name: string;
  value: number;
  status: EquipmentStatus;
  color: string;
}

interface BuildingWithStats extends Building {
  hazard_count: number;
  equipment_count: number;
}

interface TodoGroups {
  inspections: TodoItem[];
  hazards: TodoItem[];
  reviews: TodoItem[];
}

interface HazardLevelDistributionItem {
  name: string;
  value: number;
  level: HazardLevel;
  color: string;
}

interface AppStore {
  buildings: Building[];
  inspectionPoints: InspectionPoint[];
  equipment: Equipment[];
  equipments: Equipment[];
  maintenanceRecords: EquipmentMaintenance[];
  equipmentMaintenances: EquipmentMaintenance[];
  inspectionTasks: InspectionTask[];
  inspectionRecords: InspectionRecord[];
  hazards: Hazard[];
  hazardRectifies: HazardRectify[];
  drills: Drill[];
  drillAttendances: DrillAttendance[];
  users: User[];
  departments: Department[];
  changeLogs: ChangeLog[];

  filters: Filters;

  setFilters: (filters: Partial<Filters>) => void;

  getBuildingById: (id: string) => Building | undefined;
  getEquipmentByBuilding: (buildingId: string) => Equipment[];
  getEquipmentsByBuildingId: (buildingId: string) => Equipment[];
  getEquipmentByPoint: (pointId: string) => Equipment[];
  getTasksByStatus: (status: TaskStatus) => InspectionTask[];
  getTaskRecords: (taskId: string) => InspectionRecord[];
  getHazardsByStatus: (status: HazardStatus) => Hazard[];
  getHazardsByLevel: (level: HazardLevel) => Hazard[];
  getDrillAttendances: (drillId: string) => DrillAttendance[];
  getPointsByBuildingId: (buildingId: string) => InspectionPoint[];
  getBuildingHazardCount: (buildingId: string) => number;
  getTopRiskBuildings: (limit?: number) => BuildingWithStats[];
  getEquipmentStatusDistribution: () => EquipmentStatusDistributionItem[];
  getTodoItems: () => TodoGroups;
  refreshData: () => void;
  getMonthlyReports: (months?: number) => MonthlyReport[];
  getHazardLevelDistribution: () => HazardLevelDistributionItem[];
  getMaintenancesByEquipmentId: (equipmentId: string) => EquipmentMaintenance[];
  updateEquipmentCheckCycle: (category: EquipmentCategory | string, cycle: CheckCycle) => void;
  addChangeLog: (log: Omit<ChangeLog, 'id' | 'operated_at'>) => void;
  addDrill: (drill: Omit<Drill, 'id' | 'created_at'>) => void;

  getStatistics: () => Statistics;
  getTrendData: (days?: number) => TrendData[];
  getRiskBuildings: () => BuildingWithStats[];
  getTodos: () => TodoItem[];
  getDepartmentOverdue: () => DepartmentOverdue[];
  getMonthlyReport: (year: number, month: number) => MonthlyReport;
}

const TODAY = new Date('2026-06-10');

const parseDate = (dateStr: string): Date => {
  return new Date(dateStr.replace(/-/g, '/'));
};

const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isSameMonth = (date: Date, year: number, month: number): boolean => {
  return date.getFullYear() === year && date.getMonth() === month - 1;
};

const riskLevelWeight: Record<RiskLevel, number> = {
  [RiskLevelEnum.HIGH]: 4,
  [RiskLevelEnum.MEDIUM]: 3,
  [RiskLevelEnum.LOW]: 2,
  [RiskLevelEnum.NORMAL]: 1,
};

const hazardLevelWeight: Record<HazardLevel, number> = {
  [HazardLevelEnum.CRITICAL]: 4,
  [HazardLevelEnum.MAJOR]: 3,
  [HazardLevelEnum.GENERAL]: 2,
  [HazardLevelEnum.MINOR]: 1,
};

const todoPriorityByHazardLevel: Record<HazardLevel, TodoItem['priority']> = {
  [HazardLevelEnum.CRITICAL]: 'high',
  [HazardLevelEnum.MAJOR]: 'high',
  [HazardLevelEnum.GENERAL]: 'medium',
  [HazardLevelEnum.MINOR]: 'low',
};

const hazardLevelColorMap: Record<HazardLevel, string> = {
  [HazardLevelEnum.CRITICAL]: '#DC2626',
  [HazardLevelEnum.MAJOR]: '#EA580C',
  [HazardLevelEnum.GENERAL]: '#D97706',
  [HazardLevelEnum.MINOR]: '#2563EB',
};

const equipmentStatusColorMap: Record<EquipmentStatus, string> = {
  [EquipmentStatusEnum.NORMAL]: '#10B981',
  [EquipmentStatusEnum.MAINTENANCE]: '#F59E0B',
  [EquipmentStatusEnum.FAULT]: '#EF4444',
  [EquipmentStatusEnum.EXPIRED]: '#6366F1',
};

const getCycleMonths = (cycle: CheckCycle): number => {
  switch (cycle) {
    case CheckCycleEnum.MONTHLY:
      return 1;
    case CheckCycleEnum.QUARTERLY:
      return 3;
    case CheckCycleEnum.SEMI_ANNUAL:
      return 6;
    case CheckCycleEnum.ANNUAL:
      return 12;
    default:
      return 3;
  }
};

const addMonths = (dateStr: string, months: number): string => {
  const date = parseDate(dateStr);
  date.setMonth(date.getMonth() + months);
  return formatDate(date);
};

const generateId = (): string => {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const mockChangeLogs: ChangeLog[] = [
  {
    id: 'cl_001',
    target_type: 'building',
    target_id: 'bld_001',
    field: 'manager',
    old_value: '王经理',
    new_value: '李秀英',
    operator: '张建国',
    operated_at: '2026-05-20 14:30:00',
  },
  {
    id: 'cl_002',
    target_type: 'building',
    target_id: 'bld_003',
    field: 'risk_level',
    old_value: 'medium',
    new_value: 'high',
    operator: '陈海涛',
    operated_at: '2026-06-01 16:45:00',
  },
  {
    id: 'cl_003',
    target_type: 'equipment',
    target_id: 'eq_008',
    field: 'status',
    old_value: 'normal',
    new_value: 'maintenance',
    operator: '马小龙',
    operated_at: '2026-05-15 10:20:00',
  },
  {
    id: 'cl_004',
    target_type: 'building',
    target_id: 'bld_010',
    field: 'point_count',
    old_value: '6',
    new_value: '7',
    operator: '周美玲',
    operated_at: '2026-06-05 14:00:00',
  },
  {
    id: 'cl_005',
    target_type: 'hazard',
    target_id: 'hz_009',
    field: 'status',
    old_value: 'assigned',
    new_value: 'rectifying',
    operator: '王志强',
    operated_at: '2026-06-06 09:15:00',
  },
];

export const useAppStore = create<AppStore>((set, get) => ({
  buildings,
  inspectionPoints,
  equipment: equipments,
  equipments,
  maintenanceRecords: equipmentMaintenances,
  equipmentMaintenances,
  inspectionTasks,
  inspectionRecords,
  hazards,
  hazardRectifies,
  drills,
  drillAttendances,
  users,
  departments,
  changeLogs: mockChangeLogs,

  filters: {},

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  getBuildingById: (id) => get().buildings.find((b) => b.id === id),

  getEquipmentByBuilding: (buildingId) =>
    get().equipment.filter((e) => e.building_id === buildingId),

  getEquipmentsByBuildingId: (buildingId) =>
    get().equipment.filter((e) => e.building_id === buildingId),

  getEquipmentByPoint: (pointId) =>
    get().equipment.filter((e) => e.point_id === pointId),

  getTasksByStatus: (status) =>
    get().inspectionTasks.filter((t) => t.status === status),

  getTaskRecords: (taskId) =>
    get().inspectionRecords.filter((r) => r.task_id === taskId),

  getHazardsByStatus: (status) =>
    get().hazards.filter((h) => h.status === status),

  getHazardsByLevel: (level) =>
    get().hazards.filter((h) => h.level === level),

  getDrillAttendances: (drillId) =>
    get().drillAttendances.filter((d) => d.drill_id === drillId),

  getPointsByBuildingId: (buildingId) =>
    get().inspectionPoints.filter((p) => p.building_id === buildingId),

  getBuildingHazardCount: (buildingId) =>
    get().hazards.filter(
      (h) =>
        h.building_id === buildingId && h.status !== HazardStatusEnum.CLOSED
    ).length,

  getTopRiskBuildings: (limit) => {
    const riskBuildings = get().getRiskBuildings();
    return limit ? riskBuildings.slice(0, limit) : riskBuildings;
  },

  getEquipmentStatusDistribution: () => {
    const state = get();
    const statusMap = new Map<EquipmentStatus, number>();

    state.equipment.forEach((e) => {
      statusMap.set(e.status, (statusMap.get(e.status) || 0) + 1);
    });

    const result: EquipmentStatusDistributionItem[] = [];
    const statusOrder: EquipmentStatus[] = [
      EquipmentStatusEnum.NORMAL,
      EquipmentStatusEnum.MAINTENANCE,
      EquipmentStatusEnum.FAULT,
      EquipmentStatusEnum.EXPIRED,
    ];

    const statusNameMap: Record<EquipmentStatus, string> = {
      [EquipmentStatusEnum.NORMAL]: '正常',
      [EquipmentStatusEnum.MAINTENANCE]: '维护中',
      [EquipmentStatusEnum.FAULT]: '故障',
      [EquipmentStatusEnum.EXPIRED]: '过期',
    };

    statusOrder.forEach((status) => {
      if (statusMap.has(status)) {
        result.push({
          name: statusNameMap[status],
          value: statusMap.get(status)!,
          status,
          color: equipmentStatusColorMap[status],
        });
      }
    });

    return result;
  },

  getTodoItems: () => {
    const todos = get().getTodos();
    return {
      inspections: todos.filter((t) => t.type === 'inspection'),
      hazards: todos.filter((t) => t.type === 'hazard'),
      reviews: todos.filter((t) => t.type === 'review'),
    };
  },

  refreshData: () => {
    set({
      buildings: [...buildings],
      inspectionPoints: [...inspectionPoints],
      equipment: [...equipments],
      equipments: [...equipments],
      maintenanceRecords: [...equipmentMaintenances],
      equipmentMaintenances: [...equipmentMaintenances],
      inspectionTasks: [...inspectionTasks],
      inspectionRecords: [...inspectionRecords],
      hazards: [...hazards],
      hazardRectifies: [...hazardRectifies],
      drills: [...drills],
      drillAttendances: [...drillAttendances],
      users: [...users],
      departments: [...departments],
      changeLogs: [...mockChangeLogs],
    });
  },

  getStatistics: () => {
    const state = get();
    const total_buildings = state.buildings.length;
    const total_equipment = state.equipment.length;

    const pending_hazards = state.hazards.filter(
      (h) => h.status !== HazardStatusEnum.CLOSED
    ).length;

    const overdue_count =
      state.inspectionTasks.filter((t) => t.status === TaskStatusEnum.OVERDUE)
        .length +
      state.hazards.filter(
        (h) =>
          h.status !== HazardStatusEnum.CLOSED &&
          parseDate(h.deadline) < TODAY
      ).length;

    const pending_tasks = state.inspectionTasks.filter(
      (t) =>
        t.status === TaskStatusEnum.PENDING ||
        t.status === TaskStatusEnum.IN_PROGRESS
    ).length;

    const completed_tasks_this_month = state.inspectionTasks.filter((t) => {
      if (t.status !== TaskStatusEnum.COMPLETED) return false;
      const endDate = parseDate(t.end_date);
      return isSameMonth(endDate, TODAY.getFullYear(), TODAY.getMonth() + 1);
    }).length;

    const pending_reviews = state.hazards.filter(
      (h) => h.status === HazardStatusEnum.PENDING_REVIEW
    ).length;

    const risk_high = state.buildings.filter(
      (b) => b.risk_level === RiskLevelEnum.HIGH
    ).length;

    const risk_medium = state.buildings.filter(
      (b) => b.risk_level === RiskLevelEnum.MEDIUM
    ).length;

    const normalEquipment = state.equipment.filter(
      (e) => e.status === EquipmentStatusEnum.NORMAL
    ).length;
    const equipment_normal_rate =
      total_equipment > 0
        ? Math.round((normalEquipment / total_equipment) * 100)
        : 0;

    const thirtyDaysAgo = new Date(TODAY);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tasksIn30Days = state.inspectionTasks.filter((t) => {
      const endDate = parseDate(t.end_date);
      return endDate >= thirtyDaysAgo && endDate <= TODAY;
    });
    const completedIn30Days = tasksIn30Days.filter(
      (t) => t.status === TaskStatusEnum.COMPLETED
    ).length;
    const inspection_rate_30d =
      tasksIn30Days.length > 0
        ? Math.round((completedIn30Days / tasksIn30Days.length) * 100)
        : 0;

    const allHazards = state.hazards;
    const closedHazards = allHazards.filter(
      (h) => h.status === HazardStatusEnum.CLOSED
    ).length;
    const rectification_rate =
      allHazards.length > 0
        ? Math.round((closedHazards / allHazards.length) * 100)
        : 0;

    return {
      total_buildings,
      total_equipment,
      pending_hazards,
      overdue_count,
      pending_tasks,
      completed_tasks_this_month,
      pending_reviews,
      risk_high,
      risk_medium,
      equipment_normal_rate,
      inspection_rate_30d,
      rectification_rate,
    };
  },

  getTrendData: (days = 30) => {
    const state = get();
    const result: TrendData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const currentDate = new Date(TODAY);
      currentDate.setDate(currentDate.getDate() - i);
      const dateStr = formatDate(currentDate);

      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTasks = state.inspectionTasks.filter((t) => {
        const endDate = parseDate(t.end_date);
        return endDate >= dayStart && endDate <= dayEnd;
      });

      const completedTasks = dayTasks.filter(
        (t) => t.status === TaskStatusEnum.COMPLETED
      ).length;
      const inspection_rate =
        dayTasks.length > 0
          ? Math.round((completedTasks / dayTasks.length) * 100)
          : 0;

      const dayHazards = state.hazards.filter((h) => {
        const createdAt = parseDate(h.created_at);
        return createdAt >= dayStart && createdAt <= dayEnd;
      });

      const closedDayHazards = dayHazards.filter(
        (h) => h.status === HazardStatusEnum.CLOSED
      ).length;

      const rectification_rate =
        dayHazards.length > 0
          ? Math.round((closedDayHazards / dayHazards.length) * 100)
          : (() => {
              const totalInProgress = state.hazards.filter(
                (h) => h.status !== HazardStatusEnum.CLOSED
              ).length;
              const total = state.hazards.length;
              return total > 0
                ? Math.round(((total - totalInProgress) / total) * 100)
                : 0;
            })();

      result.push({
        date: dateStr,
        inspection_rate,
        rectification_rate,
      });
    }

    return result;
  },

  getRiskBuildings: () => {
    const state = get();
    const buildingsWithStats: BuildingWithStats[] = state.buildings.map((b) => {
      const hazardCount = state.hazards.filter(
        (h) => h.building_id === b.id && h.status !== HazardStatusEnum.CLOSED
      ).length;
      const equipmentCount = state.equipment.filter(
        (e) => e.building_id === b.id
      ).length;
      return {
        ...b,
        hazard_count: hazardCount,
        equipment_count: equipmentCount,
      };
    });

    return buildingsWithStats.sort((a, b) => {
      const weightDiff =
        riskLevelWeight[b.risk_level] - riskLevelWeight[a.risk_level];
      if (weightDiff !== 0) return weightDiff;

      const hazardsA = state.hazards.filter(
        (h) =>
          h.building_id === a.id && h.status !== HazardStatusEnum.CLOSED
      );
      const hazardsB = state.hazards.filter(
        (h) =>
          h.building_id === b.id && h.status !== HazardStatusEnum.CLOSED
      );

      const riskScoreA = hazardsA.reduce(
        (sum, h) => sum + hazardLevelWeight[h.level],
        0
      );
      const riskScoreB = hazardsB.reduce(
        (sum, h) => sum + hazardLevelWeight[h.level],
        0
      );

      return riskScoreB - riskScoreA;
    });
  },

  getTodos: () => {
    const state = get();
    const todos: TodoItem[] = [];

    const pendingOrInProgressTasks = state.inspectionTasks.filter(
      (t) =>
        t.status === TaskStatusEnum.PENDING ||
        t.status === TaskStatusEnum.IN_PROGRESS ||
        t.status === TaskStatusEnum.OVERDUE
    );
    pendingOrInProgressTasks.forEach((task) => {
      const priority: TodoItem['priority'] =
        task.status === TaskStatusEnum.OVERDUE
          ? 'high'
          : task.status === TaskStatusEnum.IN_PROGRESS
            ? 'medium'
            : 'low';
      todos.push({
        id: `task-${task.id}`,
        type: 'inspection',
        title: task.title,
        description: `${task.building_name} · 负责人: ${task.assignee_name}`,
        priority,
        due_date: task.end_date,
      });
    });

    const rectifyingHazards = state.hazards.filter(
      (h) =>
        h.status === HazardStatusEnum.REGISTERED ||
        h.status === HazardStatusEnum.ASSIGNED ||
        h.status === HazardStatusEnum.RECTIFYING
    );
    rectifyingHazards.forEach((hazard) => {
      const isOverdue = parseDate(hazard.deadline) < TODAY;
      const priority: TodoItem['priority'] = isOverdue
        ? 'high'
        : todoPriorityByHazardLevel[hazard.level];
      todos.push({
        id: `hazard-${hazard.id}`,
        type: 'hazard',
        title: hazard.title,
        description: `${hazard.building_name} · ${hazard.point_name} · 责任部门: ${hazard.responsible_dept}`,
        priority,
        due_date: hazard.deadline,
      });
    });

    const pendingReviewHazards = state.hazards.filter(
      (h) => h.status === HazardStatusEnum.PENDING_REVIEW
    );
    pendingReviewHazards.forEach((hazard) => {
      const isOverdue = parseDate(hazard.deadline) < TODAY;
      todos.push({
        id: `review-${hazard.id}`,
        type: 'review',
        title: `复查：${hazard.title}`,
        description: `${hazard.building_name} · ${hazard.point_name}`,
        priority: isOverdue ? 'high' : 'medium',
        due_date: hazard.deadline,
      });
    });

    return todos.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const weightDiff =
        priorityWeight[b.priority] - priorityWeight[a.priority];
      if (weightDiff !== 0) return weightDiff;
      return (
        parseDate(a.due_date).getTime() - parseDate(b.due_date).getTime()
      );
    });
  },

  getDepartmentOverdue: () => {
    const state = get();
    const deptMap = new Map<string, { total: number; overdue: number }>();

    state.departments.forEach((dept) => {
      deptMap.set(dept.name, { total: 0, overdue: 0 });
    });

    state.hazards.forEach((hazard) => {
      const dept = hazard.responsible_dept;
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { total: 0, overdue: 0 });
      }
      const data = deptMap.get(dept)!;
      data.total++;
      if (
        hazard.status !== HazardStatusEnum.CLOSED &&
        parseDate(hazard.deadline) < TODAY
      ) {
        data.overdue++;
      }
    });

    const result: DepartmentOverdue[] = [];
    deptMap.forEach((value, key) => {
      result.push({
        department: key,
        total: value.total,
        overdue: value.overdue,
        rate:
          value.total > 0
            ? Math.round((value.overdue / value.total) * 100)
            : 0,
      });
    });

    return result.sort((a, b) => b.overdue - a.overdue);
  },

  getMonthlyReport: (year, month) => {
    const state = get();

    const total_buildings = state.buildings.length;
    const total_equipment = state.equipment.length;

    const monthTasks = state.inspectionTasks.filter((t) => {
      const endDate = parseDate(t.end_date);
      return isSameMonth(endDate, year, month);
    });
    const inspection_tasks = monthTasks.length;
    const inspection_completed = monthTasks.filter(
      (t) => t.status === TaskStatusEnum.COMPLETED
    ).length;
    const inspection_rate =
      inspection_tasks > 0
        ? Math.round((inspection_completed / inspection_tasks) * 100)
        : 0;

    const monthHazards = state.hazards.filter((h) => {
      const createdAt = parseDate(h.created_at);
      return isSameMonth(createdAt, year, month);
    });
    const hazards_registered = monthHazards.length;
    const hazards_closed = monthHazards.filter(
      (h) => h.status === HazardStatusEnum.CLOSED
    ).length;
    const rectification_rate =
      hazards_registered > 0
        ? Math.round((hazards_closed / hazards_registered) * 100)
        : 0;

    const monthDrills = state.drills.filter((d) => {
      const planTime = parseDate(d.plan_time);
      return isSameMonth(planTime, year, month);
    });
    const drills_count = monthDrills.length;
    const drills_participants = monthDrills.reduce(
      (sum, d) => sum + (d.actual_count || 0),
      0
    );

    const overdue_count =
      monthTasks.filter((t) => t.status === TaskStatusEnum.OVERDUE).length +
      state.hazards.filter(
        (h) =>
          h.status !== HazardStatusEnum.CLOSED &&
          isSameMonth(parseDate(h.created_at), year, month) &&
          parseDate(h.deadline) < TODAY
      ).length;

    const goodEquipment = state.equipment.filter(
      (e) => e.status === EquipmentStatusEnum.NORMAL
    ).length;
    const equipment_good_rate =
      total_equipment > 0
        ? Math.round((goodEquipment / total_equipment) * 100)
        : 0;

    return {
      year,
      month,
      total_buildings,
      total_equipment,
      inspection_tasks,
      inspection_completed,
      inspection_rate,
      hazards_registered,
      hazards_closed,
      rectification_rate,
      drills_count,
      drills_participants,
      overdue_count,
      equipment_good_rate,
    };
  },

  getMonthlyReports: (months = 6) => {
    const reports: MonthlyReport[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(TODAY);
      date.setMonth(date.getMonth() - i);
      reports.push(
        get().getMonthlyReport(date.getFullYear(), date.getMonth() + 1)
      );
    }
    return reports;
  },

  getHazardLevelDistribution: () => {
    const state = get();
    const levelMap = new Map<HazardLevel, number>();

    state.hazards.forEach((h) => {
      if (h.status !== HazardStatusEnum.CLOSED) {
        levelMap.set(h.level, (levelMap.get(h.level) || 0) + 1);
      }
    });

    const result: HazardLevelDistributionItem[] = [];
    const levelOrder: HazardLevel[] = [
      HazardLevelEnum.CRITICAL,
      HazardLevelEnum.MAJOR,
      HazardLevelEnum.GENERAL,
      HazardLevelEnum.MINOR,
    ];

    const levelLabels: Record<HazardLevel, string> = {
      [HazardLevelEnum.CRITICAL]: '重大隐患',
      [HazardLevelEnum.MAJOR]: '较大隐患',
      [HazardLevelEnum.GENERAL]: '一般隐患',
      [HazardLevelEnum.MINOR]: '轻微隐患',
    };

    levelOrder.forEach((level) => {
      if (levelMap.has(level)) {
        result.push({
          name: levelLabels[level],
          value: levelMap.get(level)!,
          level,
          color: hazardLevelColorMap[level],
        });
      }
    });

    return result;
  },

  getMaintenancesByEquipmentId: (equipmentId) =>
    get().maintenanceRecords.filter((m) => m.equipment_id === equipmentId),

  updateEquipmentCheckCycle: (category, cycle) => {
    const months = getCycleMonths(cycle);
    set((state) => ({
      equipment: state.equipment.map((eq) => {
        if (eq.category === category) {
          const newNextCheck = addMonths(eq.last_check_date, months);
          return { ...eq, check_cycle: cycle, next_check_date: newNextCheck };
        }
        return eq;
      }),
      equipments: state.equipments.map((eq) => {
        if (eq.category === category) {
          const newNextCheck = addMonths(eq.last_check_date, months);
          return { ...eq, check_cycle: cycle, next_check_date: newNextCheck };
        }
        return eq;
      }),
    }));
  },

  addChangeLog: (log) => {
    set((state) => ({
      changeLogs: [
        {
          ...log,
          id: generateId(),
          operated_at: new Date()
            .toLocaleString('zh-CN', { hour12: false })
            .replace(/\//g, '-'),
        },
        ...state.changeLogs,
      ],
    }));
  },

  addDrill: (drill) => {
    set((state) => ({
      drills: [
        {
          ...drill,
          id: `drill_${String(state.drills.length + 1).padStart(3, '0')}`,
          created_at: new Date()
            .toLocaleString('zh-CN', { hour12: false })
            .replace(/\//g, '-'),
        },
        ...state.drills,
      ],
    }));
  },
}));

export default useAppStore;
