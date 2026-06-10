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
  HazardSource,
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
  HazardSource as HazardSourceEnum,
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

const PERSIST_KEY = 'fire-inspection-store-v1';

interface PersistState {
  inspectionTasks: InspectionTask[];
  inspectionRecords: InspectionRecord[];
  hazards: Hazard[];
  hazardRectifies: HazardRectify[];
  drills: Drill[];
  drillAttendances: DrillAttendance[];
  equipment: Equipment[];
  equipments: Equipment[];
  changeLogs: ChangeLog[];
}

const loadPersisted = (): Partial<PersistState> => {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const persistState = (state: PersistState) => {
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
  } catch {}
};

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
  resetAllData: () => void;
  getMonthlyReports: (months?: number) => MonthlyReport[];
  getHazardLevelDistribution: () => HazardLevelDistributionItem[];
  getMaintenancesByEquipmentId: (equipmentId: string) => EquipmentMaintenance[];
  updateEquipmentCheckCycle: (category: EquipmentCategory | string, cycle: CheckCycle) => void;
  updateSingleEquipmentCycle: (equipmentId: string, cycle: CheckCycle) => void;
  addChangeLog: (log: Omit<ChangeLog, 'id' | 'operated_at'>) => void;
  addDrill: (drill: Omit<Drill, 'id' | 'created_at'>) => void;

  createInspectionTask: (data: Omit<InspectionTask, 'id' | 'created_at' | 'status' | 'progress'>) => void;
  addInspectionRecord: (record: Omit<InspectionRecord, 'id'>) => InspectionRecord | null;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  registerHazardFromInspection: (data: {
    record: InspectionRecord;
    task_id: string;
    task_title: string;
    hazard_level?: HazardLevel;
    hazard_title?: string;
    reporter_id: string;
    reporter_name: string;
    deadline?: string;
    responsible_dept?: string;
  }) => Hazard | null;
  getHazardsByTaskId: (taskId: string) => Hazard[];
  getHazardsByRecordId: (recordId: string) => Hazard | undefined;

  registerHazard: (data: Omit<Hazard, 'id' | 'status' | 'created_at'>) => void;
  assignHazard: (hazardId: string, data: { responsible_dept: string; responsible_person: string; deadline: string; assigner_name: string }) => void;
  submitHazardRectify: (rectify: Omit<HazardRectify, 'id' | 'status' | 'submit_time'>) => void;
  reviewHazard: (hazardId: string, passed: boolean, reviewer: string, reviewer_id?: string, reviewRemark?: string) => void;
  getRectifiesByHazardId: (hazardId: string) => HazardRectify[];

  updateDrillComment: (drillId: string, data: { summary: string; comment: string }) => void;

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

const formatDateTime = (date: Date): string => {
  const d = formatDate(date);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${d} ${hh}:${mm}:${ss}`;
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

const generateId = (prefix = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
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
];

const persisted = loadPersisted();

const stateKeysToPersist: (keyof PersistState)[] = [
  'inspectionTasks',
  'inspectionRecords',
  'hazards',
  'hazardRectifies',
  'drills',
  'drillAttendances',
  'equipment',
  'equipments',
  'changeLogs',
];

const doPersist = (state: PersistState) => {
  const toSave: any = {};
  stateKeysToPersist.forEach((key) => {
    toSave[key] = (state as any)[key];
  });
  persistState(toSave);
};

export const useAppStore = create<AppStore>((set, get) => ({
  buildings,
  inspectionPoints,
  equipment: persisted.equipment || equipments,
  equipments: persisted.equipments || equipments,
  maintenanceRecords: equipmentMaintenances,
  equipmentMaintenances,
  inspectionTasks: persisted.inspectionTasks || inspectionTasks,
  inspectionRecords: persisted.inspectionRecords || inspectionRecords,
  hazards: persisted.hazards || hazards,
  hazardRectifies: persisted.hazardRectifies || hazardRectifies,
  drills: persisted.drills || drills,
  drillAttendances: persisted.drillAttendances || drillAttendances,
  users,
  departments,
  changeLogs: persisted.changeLogs || mockChangeLogs,

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
    });
  },

  resetAllData: () => {
    localStorage.removeItem(PERSIST_KEY);
    set({
      inspectionTasks: [...inspectionTasks],
      inspectionRecords: [...inspectionRecords],
      hazards: [...hazards],
      hazardRectifies: [...hazardRectifies],
      drills: [...drills],
      drillAttendances: [...drillAttendances],
      equipment: [...equipments],
      equipments: [...equipments],
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
    set((state) => {
      const newEquipment = state.equipment.map((eq) => {
        if (eq.category === category) {
          const newNextCheck = addMonths(eq.last_check_date, months);
          return { ...eq, check_cycle: cycle, next_check_date: newNextCheck };
        }
        return eq;
      });
      doPersist({
        inspectionTasks: state.inspectionTasks,
        inspectionRecords: state.inspectionRecords,
        hazards: state.hazards,
        hazardRectifies: state.hazardRectifies,
        drills: state.drills,
        drillAttendances: state.drillAttendances,
        equipment: newEquipment,
        equipments: newEquipment,
        changeLogs: state.changeLogs,
      });
      return {
        equipment: newEquipment,
        equipments: newEquipment,
      };
    });
  },

  updateSingleEquipmentCycle: (equipmentId, cycle) => {
    const months = getCycleMonths(cycle);
    set((state) => {
      const targetEq = state.equipment.find(e => e.id === equipmentId);
      if (!targetEq) return {};
      
      const oldCycle = targetEq.check_cycle;
      const oldNextCheck = targetEq.next_check_date;
      const newNextCheck = addMonths(targetEq.last_check_date, months);
      
      const newEquipment = state.equipment.map((eq) => {
        if (eq.id === equipmentId) {
          return { ...eq, check_cycle: cycle, next_check_date: newNextCheck };
        }
        return eq;
      });
      
      const newLog = {
        id: generateId('cl'),
        target_type: 'equipment',
        target_id: equipmentId,
        field: 'check_cycle',
        old_value: oldCycle,
        new_value: cycle,
        operator: '张建国',
        operated_at: formatDateTime(new Date()),
      };
      const newLogs = [newLog, ...state.changeLogs];
      
      doPersist({
        inspectionTasks: state.inspectionTasks,
        inspectionRecords: state.inspectionRecords,
        hazards: state.hazards,
        hazardRectifies: state.hazardRectifies,
        drills: state.drills,
        drillAttendances: state.drillAttendances,
        equipment: newEquipment,
        equipments: newEquipment,
        changeLogs: newLogs,
      });
      return {
        equipment: newEquipment,
        equipments: newEquipment,
        changeLogs: newLogs,
      };
    });
  },

  addChangeLog: (log) => {
    set((state) => {
      const newLogs = [
        {
          ...log,
          id: generateId('cl'),
          operated_at: formatDateTime(new Date()),
        },
        ...state.changeLogs,
      ];
      doPersist({
        inspectionTasks: state.inspectionTasks,
        inspectionRecords: state.inspectionRecords,
        hazards: state.hazards,
        hazardRectifies: state.hazardRectifies,
        drills: state.drills,
        drillAttendances: state.drillAttendances,
        equipment: state.equipment,
        equipments: state.equipments,
        changeLogs: newLogs,
      });
      return { changeLogs: newLogs };
    });
  },

  addDrill: (drill) => {
    set((state) => {
      const newDrills = [
        {
          ...drill,
          id: generateId('drill'),
          created_at: formatDateTime(new Date()),
          actual_count: drill.expected_count || 0,
        } as Drill,
        ...state.drills,
      ];
      doPersist({
        inspectionTasks: state.inspectionTasks,
        inspectionRecords: state.inspectionRecords,
        hazards: state.hazards,
        hazardRectifies: state.hazardRectifies,
        drills: newDrills,
        drillAttendances: state.drillAttendances,
        equipment: state.equipment,
        equipments: state.equipments,
        changeLogs: state.changeLogs,
      });
      return { drills: newDrills };
    });
  },

  createInspectionTask: (data) => {
    set((state) => {
      const building = state.buildings.find((b) => b.id === data.building_id);
      const assignee = state.users.find((u) => u.id === data.assignee_id);
      const creator = state.users.find((u) => u.id === data.creator_id);
      const newTask: InspectionTask = {
        ...data,
        id: generateId('task'),
        status: TaskStatusEnum.PENDING,
        progress: 0,
        building_name: building?.name || '未命名楼栋',
        assignee_name: assignee?.name || '未指定',
        creator_name: creator?.name || '系统',
        created_at: formatDateTime(new Date()),
      };
      const newTasks = [newTask, ...state.inspectionTasks];
      doPersist({
        inspectionTasks: newTasks,
        inspectionRecords: state.inspectionRecords,
        hazards: state.hazards,
        hazardRectifies: state.hazardRectifies,
        drills: state.drills,
        drillAttendances: state.drillAttendances,
        equipment: state.equipment,
        equipments: state.equipments,
        changeLogs: state.changeLogs,
      });
      return { inspectionTasks: newTasks };
    });
  },

  addInspectionRecord: (record) => {
    let newRecord: InspectionRecord | null = null;
    set((state) => {
      newRecord = {
        ...record,
        id: generateId('rec'),
      };
      const newRecords = [newRecord, ...state.inspectionRecords];

      const task = state.inspectionTasks.find((t) => t.id === record.task_id);
      let newTasks = state.inspectionTasks;
      if (task) {
        const totalPoints = task.point_ids.length;
        const donePoints = new Set(
          newRecords.filter((r) => r.task_id === task.id).map((r) => r.point_id)
        ).size;
        const progress = Math.round((donePoints / Math.max(totalPoints, 1)) * 100);
        const newStatus: TaskStatus =
          progress >= 100
            ? TaskStatusEnum.COMPLETED
            : donePoints > 0
              ? TaskStatusEnum.IN_PROGRESS
              : task.status;

        newTasks = state.inspectionTasks.map((t) =>
          t.id === task.id
            ? { ...t, progress, status: newStatus }
            : t
        );
      }

      doPersist({
        inspectionTasks: newTasks,
        inspectionRecords: newRecords,
        hazards: state.hazards,
        hazardRectifies: state.hazardRectifies,
        drills: state.drills,
        drillAttendances: state.drillAttendances,
        equipment: state.equipment,
        equipments: state.equipments,
        changeLogs: state.changeLogs,
      });
      return {
        inspectionRecords: newRecords,
        inspectionTasks: newTasks,
      };
    });
    return newRecord;
  },

  updateTaskStatus: (taskId, status) => {
    set((state) => {
      const newTasks = state.inspectionTasks.map((t) =>
        t.id === taskId ? { ...t, status } : t
      );
      doPersist({
        inspectionTasks: newTasks,
        inspectionRecords: state.inspectionRecords,
        hazards: state.hazards,
        hazardRectifies: state.hazardRectifies,
        drills: state.drills,
        drillAttendances: state.drillAttendances,
        equipment: state.equipment,
        equipments: state.equipments,
        changeLogs: state.changeLogs,
      });
      return { inspectionTasks: newTasks };
    });
  },

  registerHazard: (data) => {
    set((state) => {
      const building = state.buildings.find((b) => b.id === data.building_id);
      const reporter = state.users.find((u) => u.id === data.reporter_id);
      const point = state.inspectionPoints.find((p) => p.id === data.point_id);
      const newHazard: Hazard = {
        ...data,
        id: generateId('hz'),
        status: HazardStatusEnum.REGISTERED,
        building_name: building?.name || '未命名楼栋',
        point_name: point?.name || '未命名点位',
        reporter_name: reporter?.name || '系统',
        source: data.source || HazardSourceEnum.MANUAL,
        rectify_count: 0,
        created_at: formatDateTime(new Date()),
      };
      const newHazards = [newHazard, ...state.hazards];
      doPersist({
        inspectionTasks: state.inspectionTasks,
        inspectionRecords: state.inspectionRecords,
        hazards: newHazards,
        hazardRectifies: state.hazardRectifies,
        drills: state.drills,
        drillAttendances: state.drillAttendances,
        equipment: state.equipment,
        equipments: state.equipments,
        changeLogs: state.changeLogs,
      });
      return { hazards: newHazards };
    });
  },

  registerHazardFromInspection: (data) => {
    let newHazard: Hazard | null = null;
    set((state) => {
      const point = state.inspectionPoints.find((p) => p.id === data.record.point_id);
      const building = point ? state.buildings.find((b) => b.id === point.building_id) : null;
      const title = data.hazard_title || `巡检发现：${data.record.point_name} 异常`;
      const level = data.hazard_level || HazardLevelEnum.GENERAL;
      const newHazardId = generateId('hz');
      const recordId = data.record.id || '';
      
      newHazard = {
        id: newHazardId,
        title,
        description: data.record.remark || '巡检时发现该点位存在异常情况，需进一步整改。',
        level,
        status: HazardStatusEnum.REGISTERED,
        building_id: point?.building_id || '',
        building_name: building?.name || '',
        point_id: data.record.point_id,
        point_name: data.record.point_name,
        reporter_id: data.reporter_id,
        reporter_name: data.reporter_name,
        photos: data.record.photos || [],
        responsible_dept: data.responsible_dept || '',
        responsible_person: '',
        deadline: data.deadline || '',
        created_at: formatDateTime(new Date()),
        source: HazardSourceEnum.INSPECTION,
        source_task_id: data.task_id,
        source_task_title: data.task_title,
        source_record_id: recordId,
        rectify_count: 0,
      };
      
      const newHazards = [newHazard, ...state.hazards];
      
      let newRecords = state.inspectionRecords;
      if (recordId) {
        newRecords = state.inspectionRecords.map((r) =>
          r.id === recordId ? { ...r, hazard_id: newHazardId } : r
        );
      }
      
      doPersist({
        inspectionTasks: state.inspectionTasks,
        inspectionRecords: newRecords,
        hazards: newHazards,
        hazardRectifies: state.hazardRectifies,
        drills: state.drills,
        drillAttendances: state.drillAttendances,
        equipment: state.equipment,
        equipments: state.equipments,
        changeLogs: state.changeLogs,
      });
      return { 
        hazards: newHazards,
        inspectionRecords: newRecords,
      };
    });
    return newHazard;
  },

  getHazardsByTaskId: (taskId) =>
    get().hazards.filter((h) => h.source_task_id === taskId),
  getHazardsByRecordId: (recordId) =>
    get().hazards.find((h) => h.source_record_id === recordId),

  getRectifiesByHazardId: (hazardId) =>
    get().hazardRectifies.filter((r) => r.hazard_id === hazardId),

  assignHazard: (hazardId, data) => {
    set((state) => {
      const newHazards = state.hazards.map((h) =>
        h.id === hazardId
          ? {
              ...h,
              status: HazardStatusEnum.ASSIGNED,
              responsible_dept: data.responsible_dept,
              responsible_person: data.responsible_person,
              deadline: data.deadline,
              assigned_at: formatDateTime(new Date()),
              assigned_by: data.assigner_name,
            }
          : h
      );
      doPersist({
        inspectionTasks: state.inspectionTasks,
        inspectionRecords: state.inspectionRecords,
        hazards: newHazards,
        hazardRectifies: state.hazardRectifies,
        drills: state.drills,
        drillAttendances: state.drillAttendances,
        equipment: state.equipment,
        equipments: state.equipments,
        changeLogs: state.changeLogs,
      });
      return { hazards: newHazards };
    });
  },

  submitHazardRectify: (rectify) => {
    set((state) => {
      const newRectify: HazardRectify = {
        ...rectify,
        id: generateId('rect'),
        status: 'submitted',
        submit_time: formatDateTime(new Date()),
      };
      const newRectifies = [newRectify, ...state.hazardRectifies];
      const currentCount = state.hazardRectifies.filter(r => r.hazard_id === rectify.hazard_id).length;
      const newHazards = state.hazards.map((h) =>
        h.id === rectify.hazard_id
          ? { 
              ...h, 
              status: HazardStatusEnum.PENDING_REVIEW,
              latest_submit_at: formatDateTime(new Date()),
              rectify_count: currentCount + 1,
            }
          : h
      );
      doPersist({
        inspectionTasks: state.inspectionTasks,
        inspectionRecords: state.inspectionRecords,
        hazards: newHazards,
        hazardRectifies: newRectifies,
        drills: state.drills,
        drillAttendances: state.drillAttendances,
        equipment: state.equipment,
        equipments: state.equipments,
        changeLogs: state.changeLogs,
      });
      return {
        hazards: newHazards,
        hazardRectifies: newRectifies,
      };
    });
  },

  reviewHazard: (hazardId, passed, reviewer, reviewer_id, reviewRemark) => {
    set((state) => {
      let newHazards = state.hazards;
      let newRectifies = state.hazardRectifies;
      const now = formatDateTime(new Date());

      if (passed) {
        newHazards = state.hazards.map((h) =>
          h.id === hazardId
            ? {
                ...h,
                status: HazardStatusEnum.CLOSED,
                closed_at: now,
                latest_review_at: now,
                review_remark: reviewRemark || h.review_remark,
              }
            : h
        );
        newRectifies = state.hazardRectifies.map((r) =>
          r.hazard_id === hazardId && r.status === 'submitted'
            ? {
                ...r,
                status: 'passed',
                review_time: now,
                reviewer,
                reviewer_id,
                review_remark: reviewRemark || r.review_remark,
              }
            : r
        );
      } else {
        newHazards = state.hazards.map((h) =>
          h.id === hazardId
            ? { 
                ...h, 
                status: HazardStatusEnum.RECTIFYING,
                latest_review_at: now,
                review_remark: reviewRemark || h.review_remark,
              }
            : h
        );
        newRectifies = state.hazardRectifies.map((r) =>
          r.hazard_id === hazardId && r.status === 'submitted'
            ? {
                ...r,
                status: 'rejected',
                review_time: now,
                reviewer,
                reviewer_id,
                review_remark: reviewRemark || r.review_remark,
              }
            : r
        );
      }

      doPersist({
        inspectionTasks: state.inspectionTasks,
        inspectionRecords: state.inspectionRecords,
        hazards: newHazards,
        hazardRectifies: newRectifies,
        drills: state.drills,
        drillAttendances: state.drillAttendances,
        equipment: state.equipment,
        equipments: state.equipments,
        changeLogs: state.changeLogs,
      });
      return {
        hazards: newHazards,
        hazardRectifies: newRectifies,
      };
    });
  },

  updateDrillComment: (drillId, data) => {
    set((state) => {
      const newDrills = state.drills.map((d) =>
        d.id === drillId
          ? {
              ...d,
              summary: data.summary,
              comment: data.comment,
              actual_time: d.actual_time || formatDateTime(new Date()),
            }
          : d
      );
      doPersist({
        inspectionTasks: state.inspectionTasks,
        inspectionRecords: state.inspectionRecords,
        hazards: state.hazards,
        hazardRectifies: state.hazardRectifies,
        drills: newDrills,
        drillAttendances: state.drillAttendances,
        equipment: state.equipment,
        equipments: state.equipments,
        changeLogs: state.changeLogs,
      });
      return { drills: newDrills };
    });
  },
}));

export default useAppStore;
