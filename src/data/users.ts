import type { User, Department } from '../types';
import { UserRole } from '../types';

export const departments: Department[] = [
  {
    id: 'dept_001',
    name: '安全管理部',
    manager: '张建国',
    member_count: 3,
  },
  {
    id: 'dept_002',
    name: '物业管理部',
    manager: '李秀英',
    member_count: 3,
  },
  {
    id: 'dept_003',
    name: '工程技术部',
    manager: '王志强',
    member_count: 2,
  },
  {
    id: 'dept_004',
    name: '行政人事部',
    manager: '赵丽华',
    member_count: 2,
  },
  {
    id: 'dept_005',
    name: '综合运营部',
    manager: '刘德明',
    member_count: 1,
  },
];

export const users: User[] = [
  {
    id: 'user_001',
    name: '张建国',
    role: UserRole.SAFETY_MANAGER,
    department: '安全管理部',
    phone: '13800138001',
    email: 'zhangjg@example.com',
  },
  {
    id: 'user_002',
    name: '陈海涛',
    role: UserRole.SAFETY_MANAGER,
    department: '安全管理部',
    phone: '13800138002',
    email: 'chenht@example.com',
  },
  {
    id: 'user_003',
    name: '周美玲',
    role: UserRole.SAFETY_MANAGER,
    department: '安全管理部',
    phone: '13800138003',
    email: 'zhouml@example.com',
  },
  {
    id: 'user_004',
    name: '李秀英',
    role: UserRole.PROPERTY_ADMIN,
    department: '物业管理部',
    phone: '13800138004',
    email: 'lixy@example.com',
  },
  {
    id: 'user_005',
    name: '吴大鹏',
    role: UserRole.PROPERTY_ADMIN,
    department: '物业管理部',
    phone: '13800138005',
    email: 'wudp@example.com',
  },
  {
    id: 'user_006',
    name: '孙晓燕',
    role: UserRole.PROPERTY_ADMIN,
    department: '物业管理部',
    phone: '13800138006',
    email: 'sunxy@example.com',
  },
  {
    id: 'user_007',
    name: '马小龙',
    role: UserRole.INSPECTOR,
    department: '工程技术部',
    phone: '13800138007',
    email: 'maxl@example.com',
  },
  {
    id: 'user_008',
    name: '胡春燕',
    role: UserRole.INSPECTOR,
    department: '工程技术部',
    phone: '13800138008',
    email: 'hucy@example.com',
  },
  {
    id: 'user_009',
    name: '王志强',
    role: UserRole.DEPT_HEAD,
    department: '工程技术部',
    phone: '13800138009',
    email: 'wangzq@example.com',
  },
  {
    id: 'user_010',
    name: '赵丽华',
    role: UserRole.DEPT_HEAD,
    department: '行政人事部',
    phone: '13800138010',
    email: 'zhaolh@example.com',
  },
];

export default {
  departments,
  users,
};
