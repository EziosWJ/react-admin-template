import dayjs from 'dayjs';
import { PROJECT_STATUS_OPTIONS, PROJECT_STATUS_VALUES, statusLabel } from '../../config/options';
import type { Project, ProjectListQuery } from '../../types/models';
import type { ExportColumn } from '../../utils/export';
import { formatCurrency, formatDate } from '../../utils/format';
import type { ListUrlConfig, ParsedListState } from '../../utils/listQuery';
import type { ProjectFormValues } from './components/ProjectFormFields';

export const projectListUrlConfig: ListUrlConfig = {
  filters: {
    status: PROJECT_STATUS_VALUES,
    customerId: 'text',
    owner: 'text',
    dateFrom: 'date',
    dateTo: 'date',
  },
  sortKeys: ['name', 'code', 'owner', 'status', 'progress', 'startDate', 'endDate', 'budget', 'createdAt'],
  pageSizeOptions: [10, 20, 50, 100],
  defaultPageSize: 10,
};

export function buildProjectQuery(state: ParsedListState): ProjectListQuery {
  return {
    page: state.page,
    pageSize: state.pageSize,
    keyword: state.keyword || undefined,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    status: state.filters.status as ProjectListQuery['status'],
    customerId: state.filters.customerId,
    owner: state.filters.owner,
    dateFrom: state.filters.dateFrom,
    dateTo: state.filters.dateTo,
  };
}

export function toProjectFormValues(project: Project): ProjectFormValues {
  return {
    name: project.name,
    code: project.code,
    customerId: project.customerId,
    owner: project.owner,
    status: project.status,
    progress: project.progress,
    startDate: dayjs(project.startDate),
    endDate: dayjs(project.endDate),
    budget: project.budget,
    notes: project.notes,
  };
}

export function createProjectExportColumns(customerNameById: Map<string, string>): ExportColumn<Project>[] {
  return [
    { key: 'name', title: '项目名称', value: (row) => row.name, width: 26 },
    { key: 'code', title: '项目编码', value: (row) => row.code, width: 14 },
    {
      key: 'customer',
      title: '关联客户',
      value: (row) => customerNameById.get(row.customerId) ?? '客户不存在',
      width: 24,
    },
    { key: 'owner', title: '负责人', value: (row) => row.owner, width: 12 },
    { key: 'status', title: '状态', value: (row) => statusLabel(PROJECT_STATUS_OPTIONS, row.status), width: 12 },
    { key: 'progress', title: '进度', value: (row) => `${row.progress}%`, width: 10 },
    { key: 'budget', title: '预算', value: (row) => formatCurrency(row.budget), width: 16 },
    { key: 'startDate', title: '开始日期', value: (row) => formatDate(row.startDate), width: 14 },
    { key: 'endDate', title: '结束日期', value: (row) => formatDate(row.endDate), width: 14 },
    { key: 'notes', title: '备注', value: (row) => row.notes, width: 32 },
  ];
}
