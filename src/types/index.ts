export enum RiskLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NORMAL = 'normal',
}

export enum EquipmentCategory {
  FIRE_EXTINGUISHER = 'fire_extinguisher',
  SPRINKLER = 'sprinkler',
  SMOKE_DETECTOR = 'smoke_detector',
  FIRE_HYDRANT = 'fire_hydrant',
  FIRE_ALARM = 'fire_alarm',
  EMERGENCY_LIGHT = 'emergency_light',
}

export enum EquipmentStatus {
  NORMAL = 'normal',
  MAINTENANCE = 'maintenance',
  FAULT = 'fault',
  EXPIRED = 'expired',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

export enum HazardLevel {
  CRITICAL = 'critical',
  MAJOR = 'major',
  GENERAL = 'general',
  MINOR = 'minor',
}

export enum HazardStatus {
  REGISTERED = 'registered',
  ASSIGNED = 'assigned',
  RECTIFYING = 'rectifying',
  PENDING_REVIEW = 'pending_review',
  CLOSED = 'closed',
}

export enum CheckCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
}

export enum DrillType {
  FIRE_EVACUATION = 'fire_evacuation',
  FIRE_EXTINGUISHER = 'fire_extinguisher',
  EMERGENCY_RESPONSE = 'emergency_response',
  COMBINED = 'combined',
}

export enum UserRole {
  SAFETY_MANAGER = 'safety_manager',
  PROPERTY_ADMIN = 'property_admin',
  INSPECTOR = 'inspector',
  DEPT_HEAD = 'dept_head',
}

export interface Building {
  id: string;
  name: string;
  address: string;
  floors: number;
  area: number;
  risk_level: RiskLevel;
  point_count: number;
  construction_year: string;
  manager: string;
  manager_phone: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionPoint {
  id: string;
  building_id: string;
  name: string;
  location: string;
  qr_code: string;
  floor: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  building_id: string;
  point_id: string;
  category: EquipmentCategory;
  code: string;
  name: string;
  model: string;
  status: EquipmentStatus;
  install_date: string;
  last_check_date: string;
  next_check_date: string;
  check_cycle: CheckCycle;
}

export interface EquipmentMaintenance {
  id: string;
  equipment_id: string;
  type: 'check' | 'repair' | 'replace';
  description: string;
  operator: string;
  date: string;
  remark?: string;
}

export interface InspectionTask {
  id: string;
  title: string;
  type: 'routine' | 'special' | 'temporary';
  status: TaskStatus;
  assignee_id: string;
  assignee_name: string;
  building_id: string;
  building_name: string;
  point_ids: string[];
  cycle: CheckCycle;
  start_date: string;
  end_date: string;
  created_at: string;
  creator_id: string;
  creator_name: string;
  progress: number;
}

export interface InspectionRecord {
  id: string;
  task_id: string;
  point_id: string;
  point_name: string;
  building_id?: string;
  inspector_id: string;
  inspector_name: string;
  status: 'normal' | 'abnormal';
  remark?: string;
  photos?: string[];
  inspect_time: string;
  hazard_id?: string;
}

export enum HazardSource {
  MANUAL = 'manual',
  INSPECTION = 'inspection',
}

export interface Hazard {
  id: string;
  title: string;
  description: string;
  level: HazardLevel;
  status: HazardStatus;
  building_id: string;
  building_name: string;
  point_id: string;
  point_name: string;
  reporter_id: string;
  reporter_name: string;
  photos: string[];
  responsible_dept: string;
  responsible_person: string;
  deadline: string;
  created_at: string;
  closed_at?: string;
  source?: HazardSource;
  source_task_id?: string;
  source_task_title?: string;
  source_record_id?: string;
  assigned_at?: string;
  assigned_by?: string;
  latest_submit_at?: string;
  latest_review_at?: string;
  review_remark?: string;
  rectify_count?: number;
}

export interface HazardRectify {
  id: string;
  hazard_id: string;
  action: string;
  photos: string[];
  remark?: string;
  status: 'submitted' | 'passed' | 'rejected';
  submit_time: string;
  submitter: string;
  submitter_id?: string;
  review_time?: string;
  reviewer?: string;
  reviewer_id?: string;
  review_remark?: string;
}

export interface Drill {
  id: string;
  title: string;
  type: DrillType;
  location: string;
  building_id?: string;
  plan_time: string;
  actual_time?: string;
  content: string;
  summary?: string;
  comment?: string;
  organizer: string;
  participant_depts: string[];
  expected_count: number;
  actual_count?: number;
  photos: string[];
  created_at: string;
}

export interface DrillAttendance {
  id: string;
  drill_id: string;
  user_name: string;
  department: string;
  sign_time?: string;
  status: 'present' | 'absent' | 'late';
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  phone: string;
  email: string;
  avatar?: string;
}

export interface Department {
  id: string;
  name: string;
  manager: string;
  member_count: number;
}

export interface ChangeLog {
  id: string;
  target_type: string;
  target_id: string;
  field: string;
  old_value: string;
  new_value: string;
  operator: string;
  operated_at: string;
}

export interface TodoItem {
  id: string;
  type: 'inspection' | 'hazard' | 'review';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  due_date: string;
  link?: string;
}

export interface TrendData {
  date: string;
  inspection_rate: number;
  rectification_rate: number;
}

export interface DepartmentOverdue {
  department: string;
  total: number;
  overdue: number;
  rate: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  total_buildings: number;
  total_equipment: number;
  inspection_tasks: number;
  inspection_completed: number;
  inspection_rate: number;
  hazards_registered: number;
  hazards_closed: number;
  rectification_rate: number;
  drills_count: number;
  drills_participants: number;
  overdue_count: number;
  equipment_good_rate: number;
}

export interface Statistics {
  total_buildings: number;
  total_equipment: number;
  pending_hazards: number;
  overdue_count: number;
  pending_tasks: number;
  completed_tasks_this_month: number;
  pending_reviews: number;
  risk_high: number;
  risk_medium: number;
  equipment_normal_rate: number;
  inspection_rate_30d: number;
  rectification_rate: number;
}

export const EquipmentCategoryLabels: Record<EquipmentCategory, string> = {
  [EquipmentCategory.FIRE_EXTINGUISHER]: '灭火器',
  [EquipmentCategory.SPRINKLER]: '喷淋系统',
  [EquipmentCategory.SMOKE_DETECTOR]: '烟感报警器',
  [EquipmentCategory.FIRE_HYDRANT]: '消火栓',
  [EquipmentCategory.FIRE_ALARM]: '火灾报警器',
  [EquipmentCategory.EMERGENCY_LIGHT]: '应急照明',
};

export const EquipmentStatusLabels: Record<EquipmentStatus, string> = {
  [EquipmentStatus.NORMAL]: '正常',
  [EquipmentStatus.MAINTENANCE]: '维护中',
  [EquipmentStatus.FAULT]: '故障',
  [EquipmentStatus.EXPIRED]: '过期',
};

export const RiskLevelLabels: Record<RiskLevel, string> = {
  [RiskLevel.HIGH]: '高风险',
  [RiskLevel.MEDIUM]: '中风险',
  [RiskLevel.LOW]: '低风险',
  [RiskLevel.NORMAL]: '正常',
};

export const TaskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: '待执行',
  [TaskStatus.IN_PROGRESS]: '执行中',
  [TaskStatus.COMPLETED]: '已完成',
  [TaskStatus.OVERDUE]: '已逾期',
};

export const HazardLevelLabels: Record<HazardLevel, string> = {
  [HazardLevel.CRITICAL]: '重大隐患',
  [HazardLevel.MAJOR]: '较大隐患',
  [HazardLevel.GENERAL]: '一般隐患',
  [HazardLevel.MINOR]: '轻微隐患',
};

export const HazardStatusLabels: Record<HazardStatus, string> = {
  [HazardStatus.REGISTERED]: '已登记',
  [HazardStatus.ASSIGNED]: '已派单',
  [HazardStatus.RECTIFYING]: '整改中',
  [HazardStatus.PENDING_REVIEW]: '待复查',
  [HazardStatus.CLOSED]: '已关闭',
};

export const CheckCycleLabels: Record<CheckCycle, string> = {
  [CheckCycle.MONTHLY]: '月度',
  [CheckCycle.QUARTERLY]: '季度',
  [CheckCycle.SEMI_ANNUAL]: '半年',
  [CheckCycle.ANNUAL]: '年度',
};

export const DrillTypeLabels: Record<DrillType, string> = {
  [DrillType.FIRE_EVACUATION]: '消防疏散',
  [DrillType.FIRE_EXTINGUISHER]: '灭火器使用',
  [DrillType.EMERGENCY_RESPONSE]: '应急响应',
  [DrillType.COMBINED]: '综合演练',
};

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.SAFETY_MANAGER]: '安全主管',
  [UserRole.PROPERTY_ADMIN]: '物业管理员',
  [UserRole.INSPECTOR]: '巡检人员',
  [UserRole.DEPT_HEAD]: '部门负责人',
};
