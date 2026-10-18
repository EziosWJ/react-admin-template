import dayjs from 'dayjs';
import type { Customer, Industry, Order, OrderStatus, Project, ProjectStatus, User } from '../types/models';

export interface MockDatabase {
  customers: Customer[];
  projects: Project[];
  orders: Order[];
  users: User[];
}

function dateDaysAgo(days: number): string {
  return dayjs().subtract(days, 'day').format('YYYY-MM-DD');
}

function isoDaysAgo(days: number, hour = 9, minute = 0): string {
  return dayjs()
    .subtract(days, 'day')
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0)
    .toISOString();
}

const customerNames = [
  '星云科技', '蓝海制造', '恒瑞金融', '优选零售', '智学教育', '康宁医疗',
  '绿能环保', '迅达物流', '云帆互联网', '金桥电子', '远航能源', '晨光食品',
  '天工机械', '汇通贸易', '灵犀软件', '华信咨询', '海纳传媒', '中科材料',
  '博远建筑', '禾木农业', '赛博安全', '捷运出行', '潮汐文旅', '明德人力',
];

const contactNames = [
  '张伟', '王芳', '李娜', '刘洋', '陈静', '杨帆', '赵磊', '黄敏',
  '周涛', '吴倩', '徐鹏', '孙琳', '胡军', '朱琳', '高翔', '林洁',
  '何平', '郭峰', '马丽', '罗刚', '梁静', '宋阳', '郑雪', '谢峰',
];

const industries: Industry[] = ['互联网', '制造业', '金融', '零售', '教育', '医疗', '能源', '物流'];

const userSeedsBase = [
  { name: '陈晨', username: 'chenchen', department: 'product', role: 'product_manager' },
  { name: '林悦', username: 'linyue', department: 'sales', role: 'sales_manager' },
  { name: '王磊', username: 'wanglei', department: 'product', role: 'project_manager' },
  { name: '赵敏', username: 'zhaomin', department: 'success', role: 'account_manager' },
  { name: '李昊', username: 'lihao', department: 'finance', role: 'finance_specialist' },
  { name: '周婷', username: 'zhouting', department: 'marketing', role: 'member' },
  { name: '吴迪', username: 'wudi', department: 'operations', role: 'member' },
  { name: '孙悦', username: 'sunyue', department: 'hr', role: 'member' },
  { name: '郑凯', username: 'zhengkai', department: 'product', role: 'project_manager' },
  { name: '冯雪', username: 'fengxue', department: 'sales', role: 'account_manager' },
  { name: '韩冰', username: 'hanbing', department: 'success', role: 'account_manager' },
  { name: '曹阳', username: 'caoyang', department: 'product', role: 'member' },
  { name: '谢宁', username: 'xiening', department: 'operations', role: 'member' },
  { name: '邓超', username: 'dengchao', department: 'product', role: 'admin' },
] as const;

const projectNames = [
  '星云数据中台建设', '蓝海智能工厂改造', '恒瑞风控系统升级', '优选零售会员体系',
  '智学在线课堂平台', '康宁医疗数据治理', '绿能能耗分析平台', '迅达运输调度系统',
  '云帆增长分析平台', '金桥供应链协同', '远航能源巡检系统', '晨光渠道订货平台',
  '天工设备物联平台', '汇通跨境结算系统', '灵犀协作办公套件', '华信客户洞察平台',
  '海纳内容分发系统', '中科材料研发管理', '博远工程进度平台', '禾木种植监测系统',
  '赛博安全运营中心', '捷运出行调度升级', '潮汐文旅票务平台', '明德招聘管理系统',
  '星云移动端重构', '蓝海仓储可视化', '恒瑞报表体系升级', '优选门店数字化',
];

const projectStatuses: ProjectStatus[] = ['planning', 'in_progress', 'in_progress', 'on_hold', 'completed', 'completed', 'cancelled'];
const recentProjectStatuses: ProjectStatus[] = ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'];

const orderStatuses: OrderStatus[] = ['pending', 'paid', 'completed', 'completed', 'draft', 'pending', 'paid', 'cancelled'];

const orderNotes = [
  '首期合同款，按里程碑支付。', '年度服务续费。', '含实施与培训费用。', '',
  '客户要求分两期开票。', '按季度结算。', '项目验收后支付尾款。', '',
];

export function createMockDatabase(): MockDatabase {
  const users: User[] = userSeedsBase.map((item, index) => ({
    id: `u-${String(index + 1).padStart(3, '0')}`,
    name: item.name,
    username: item.username,
    email: `${item.username}@example.com`,
    department: item.department,
    role: item.role,
    status: index === 12 ? 'disabled' : 'active',
    lastLoginAt: index % 5 === 4 ? null : isoDaysAgo(index * 2 + 1, 8 + (index % 9), (index * 7) % 60),
    createdAt: isoDaysAgo(420 - index * 18, 10, index % 60),
    updatedAt: isoDaysAgo(index * 2, 18, index % 60),
  }));

  const customers: Customer[] = customerNames.map((name, index) => ({
    id: `c-${String(index + 1).padStart(3, '0')}`,
    name,
    code: `CUS-${1001 + index}`,
    industry: industries[index % industries.length],
    contactName: contactNames[index],
    phone: `138${String(10000000 + index).padStart(8, '0')}`,
    email: `contact${index + 1}@example.com`,
    status: index % 9 === 0 ? 'inactive' : index % 4 === 0 ? 'lead' : 'active',
    createdAt: isoDaysAgo(330 - index * 13, 9 + (index % 8), (index * 11) % 60),
    updatedAt: isoDaysAgo(20 + index, 15, (index * 13) % 60),
    notes: index % 3 === 0 ? '重点客户，按季度回访并同步经营数据。' : index % 5 === 0 ? '由市场活动转化，关注续约节点。' : '',
  }));

  const projects: Project[] = projectNames.map((name, index) => {
    const customer = customers[index % customers.length];
    const status = index >= 23 ? recentProjectStatuses[index - 23] : projectStatuses[index % projectStatuses.length];
    const owner = users[(index + 1) % users.length].name;
    const startOffset = index >= 23 ? 28 - (index - 23) * 6 : 310 - index * 11;
    const duration = 60 + (index % 5) * 30;
    const progress = status === 'completed' ? 100 : status === 'planning' ? 10 + (index % 4) * 5 : status === 'cancelled' ? 30 : 35 + (index % 7) * 8;
    return {
      id: `p-${String(index + 1).padStart(3, '0')}`,
      name,
      code: `PRJ-${2001 + index}`,
      customerId: customer.id,
      owner,
      status,
      progress: Math.min(progress, 100),
      startDate: dateDaysAgo(startOffset),
      endDate: dateDaysAgo(startOffset - duration),
      budget: 80_000 + (index % 10) * 45_000,
      createdAt: isoDaysAgo(startOffset, 10, (index * 17) % 60),
      updatedAt: isoDaysAgo(10 + (index % 20), 16, (index * 5) % 60),
      notes: index % 4 === 0 ? '按双周节奏交付，关键节点需客户确认。' : '',
    };
  });

  const projectsByCustomer = new Map<string, Project[]>();
  projects.forEach((project) => {
    const list = projectsByCustomer.get(project.customerId) ?? [];
    list.push(project);
    projectsByCustomer.set(project.customerId, list);
  });

  const orders: Order[] = Array.from({ length: 36 }, (_, index) => {
    const customer = customers[(index * 5 + 3) % customers.length];
    const availableProjects = projectsByCustomer.get(customer.id) ?? [];
    const linkedProject = availableProjects.length > 0 && index % 3 !== 0
      ? availableProjects[index % availableProjects.length]
      : null;
    const orderDate = dateDaysAgo(index * 10);
    const status = orderStatuses[index % orderStatuses.length];
    return {
      id: `o-${String(index + 1).padStart(3, '0')}`,
      orderNo: `SO-${dayjs(orderDate).format('YYYY')}-${String(1001 + index).padStart(4, '0')}`,
      customerId: customer.id,
      projectId: linkedProject?.id ?? null,
      amount: 18_000 + (index % 12) * 12_500,
      status,
      orderDate,
      dueDate: dayjs(orderDate).add(30 + (index % 4) * 15, 'day').format('YYYY-MM-DD'),
      createdAt: isoDaysAgo(index * 10, 11, (index * 19) % 60),
      updatedAt: isoDaysAgo(index * 10, 17, (index * 3) % 60),
      notes: orderNotes[index % orderNotes.length],
    };
  });

  return { customers, projects, orders, users };
}
