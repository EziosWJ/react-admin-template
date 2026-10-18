import { useCallback, useMemo, useState } from 'react';
import { App, Button, DatePicker, Input, Progress, Select, Space, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Upload } from 'lucide-react';
import dayjs, { type Dayjs } from 'dayjs';
import type { TableColumnsType } from 'antd';
import { ConfirmDelete } from '../../components/ConfirmDelete';
import { DataTable } from '../../components/DataTable';
import { ExportMenu } from '../../components/ExportMenu';
import { FormDrawer } from '../../components/FormDrawer';
import { ImportDrawer } from '../../components/ImportDrawer';
import { PageHeader } from '../../components/PageHeader';
import { QueryState } from '../../components/QueryState';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusTag } from '../../components/StatusTag';
import { PROJECT_STATUS_OPTIONS } from '../../config/options';
import { paths } from '../../config/paths';
import { useListUrlState, useSyncedKeyword } from '../../hooks/useListUrlState';
import { getApiErrorMessage } from '../../lib/api/errors';
import type { Project, ProjectInput } from '../../types/models';
import { formatCurrency, formatDate } from '../../utils/format';
import { useCustomerOptions } from '../customers/queries';
import { useUserOptions } from '../users/queries';
import { projectsApi } from './api';
import { useProjectList, useProjectMutations } from './queries';
import {
  PROJECT_DEFAULT_VALUES,
  ProjectFormFields,
  type ProjectFormValues,
} from './components/ProjectFormFields';
import {
  buildProjectQuery,
  createProjectExportColumns,
  projectListUrlConfig,
  toProjectFormValues,
} from './constants';

type DrawerState = { mode: 'create' } | { mode: 'edit'; project: Project };

export default function ProjectListPage() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { state, actions } = useListUrlState(projectListUrlConfig);
  const { keyword, setKeyword, clearKeyword } = useSyncedKeyword(state.keyword, actions.setKeyword);
  const query = useMemo(() => buildProjectQuery(state), [state]);
  const listQuery = useProjectList(query);
  const { create, update, remove } = useProjectMutations();
  const customerOptionsQuery = useCustomerOptions();
  const userOptionsQuery = useUserOptions();

  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [selectedRows, setSelectedRows] = useState<Project[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [selectionVersion, setSelectionVersion] = useState(0);

  const customerNameById = useMemo(
    () => new Map((customerOptionsQuery.data?.items ?? []).map((customer) => [customer.id, customer.name])),
    [customerOptionsQuery.data],
  );

  const customerOptions = useMemo(
    () =>
      (customerOptionsQuery.data?.items ?? []).map((customer) => ({
        value: customer.id,
        label: customer.name,
      })),
    [customerOptionsQuery.data],
  );

  const ownerOptions = useMemo(
    () => (userOptionsQuery.data?.items ?? []).map((user) => ({ value: user.name, label: user.name })),
    [userOptionsQuery.data],
  );

  const exportColumns = useMemo(() => createProjectExportColumns(customerNameById), [customerNameById]);

  const dateRange = useMemo<[Dayjs | null, Dayjs | null] | null>(() => {
    const dateFrom = state.filters.dateFrom;
    const dateTo = state.filters.dateTo;
    if (!dateFrom && !dateTo) return null;
    return [dateFrom ? dayjs(dateFrom) : null, dateTo ? dayjs(dateTo) : null];
  }, [state.filters.dateFrom, state.filters.dateTo]);

  const handleSelectionChange = useCallback((rows: Project[]) => setSelectedRows(rows), []);
  const closeDrawer = useCallback(() => setDrawer(null), []);

  const initialValues = useMemo(() => {
    if (drawer?.mode === 'edit') return toProjectFormValues(drawer.project);
    return PROJECT_DEFAULT_VALUES;
  }, [drawer]);

  const handleSubmit = async (values: ProjectFormValues) => {
    const input: ProjectInput = {
      ...values,
      code: values.code.toUpperCase(),
      startDate: values.startDate.format('YYYY-MM-DD'),
      endDate: values.endDate.format('YYYY-MM-DD'),
      notes: values.notes ?? '',
    };
    if (drawer?.mode === 'edit') {
      await update.mutateAsync({ id: drawer.project.id, input });
      message.success('项目信息已更新');
    } else {
      await create.mutateAsync(input);
      message.success('项目创建成功');
    }
    setDrawer(null);
  };

  const handleBatchDelete = () => {
    if (selectedRows.length === 0) return;
    modal.confirm({
      title: `批量删除 ${selectedRows.length} 个项目`,
      content: '删除后无法恢复。若项目仍关联订单，删除会失败并给出提示。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        const results = await Promise.allSettled(selectedRows.map((row) => remove.mutateAsync(row.id)));
        const failures = results.filter((result) => result.status === 'rejected');
        if (failures.length === 0) {
          message.success(`已删除 ${selectedRows.length} 个项目`);
        } else {
          const firstFailure = failures[0] as PromiseRejectedResult;
          message.error(`${failures.length} 条删除失败：${getApiErrorMessage(firstFailure.reason)}`);
        }
        setSelectionVersion((version) => version + 1);
      },
    });
  };

  const queryAll = useCallback(async () => {
    const result = await projectsApi.list({ ...query, page: 1, pageSize: 10_000 });
    return result.items;
  }, [query]);

  const columns: TableColumnsType<Project> = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      width: 200,
      render: (value: string, record) => <Link to={paths.projectDetail(record.id)}>{value}</Link>,
    },
    { title: '项目编码', dataIndex: 'code', key: 'code', sorter: true, width: 140 },
    {
      title: '关联客户',
      dataIndex: 'customerId',
      key: 'customerId',
      width: 180,
      render: (_value: string, record) => {
        const customerName = customerNameById.get(record.customerId);
        if (customerName) {
          return <Link to={paths.customerDetail(record.customerId)}>{customerName}</Link>;
        }
        return (
          <Typography.Text type="secondary">
            {customerOptionsQuery.isPending ? '加载中…' : '客户不存在'}
          </Typography.Text>
        );
      },
    },
    { title: '负责人', dataIndex: 'owner', key: 'owner', sorter: true, width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      sorter: true,
      width: 110,
      render: (value: string) => <StatusTag value={value} options={PROJECT_STATUS_OPTIONS} />,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      sorter: true,
      width: 150,
      render: (value: number) => <Progress percent={value} size="small" style={{ minWidth: 120 }} />,
    },
    {
      title: '预算',
      dataIndex: 'budget',
      key: 'budget',
      sorter: true,
      width: 140,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      sorter: true,
      width: 120,
      render: (value: string) => formatDate(value),
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      sorter: true,
      width: 120,
      render: (value: string) => formatDate(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 230,
      fixed: 'right',
      render: (_value, record) => (
        <Space size={2}>
          <Button type="link" size="small" onClick={() => navigate(paths.projectDetail(record.id))}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => setDrawer({ mode: 'edit', project: record })}>
            快捷编辑
          </Button>
          <Button type="link" size="small" onClick={() => navigate(paths.projectEdit(record.id))}>
            完整编辑
          </Button>
          <ConfirmDelete
            entityName={record.name}
            onConfirm={async () => {
              await remove.mutateAsync(record.id);
              setSelectionVersion((version) => version + 1);
            }}
          />
        </Space>
      ),
    },
  ];

  const toolbarActions = (
    <Space wrap size={6}>
      <ExportMenu moduleLabel="项目列表" columns={exportColumns} queryAll={queryAll} selectedRows={selectedRows} />
      <Button icon={<Upload size={16} aria-hidden="true" />} onClick={() => setImportOpen(true)}>
        导入
      </Button>
    </Space>
  );

  const data = listQuery.data;

  return (
    <div className="pageStack">
      <PageHeader
        title="项目管理"
        description="维护项目主数据，跟踪负责人、进度与预算。列表状态会同步到 URL，可刷新、分享或使用浏览器前进/后退。"
        extra={
          <Button type="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setDrawer({ mode: 'create' })}>
            新建项目
          </Button>
        }
      />

      <SearchFilterBar
        onReset={() => {
          clearKeyword();
          actions.reset();
        }}
      >
        <Input
          allowClear
          prefix={<Search size={15} aria-hidden="true" />}
          placeholder="搜索项目名称、编码、负责人"
          aria-label="搜索项目"
          style={{ width: 280 }}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="关联客户"
          aria-label="按关联客户筛选"
          style={{ width: 180 }}
          value={state.filters.customerId}
          options={customerOptions}
          loading={customerOptionsQuery.isPending}
          onChange={(value) => actions.setFilter('customerId', value)}
        />
        <Select
          allowClear
          placeholder="项目状态"
          aria-label="按项目状态筛选"
          style={{ width: 150 }}
          value={state.filters.status}
          options={PROJECT_STATUS_OPTIONS}
          onChange={(value) => actions.setFilter('status', value)}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="负责人"
          aria-label="按负责人筛选"
          style={{ width: 150 }}
          value={state.filters.owner}
          options={ownerOptions}
          loading={userOptionsQuery.isPending}
          onChange={(value) => actions.setFilter('owner', value)}
        />
        <DatePicker.RangePicker
          format="YYYY-MM-DD"
          placeholder={['开始日期起', '开始日期止']}
          aria-label="按开始日期范围筛选"
          value={dateRange}
          onChange={(dates) => {
            actions.setFilters({
              dateFrom: dates?.[0] ? dates[0].format('YYYY-MM-DD') : undefined,
              dateTo: dates?.[1] ? dates[1].format('YYYY-MM-DD') : undefined,
            });
          }}
        />
      </SearchFilterBar>

      <QueryState
        isLoading={listQuery.isPending}
        isError={listQuery.isError}
        error={listQuery.error}
        onRetry={() => void listQuery.refetch()}
      >
        <DataTable<Project>
          tableKey="projects"
          title="项目列表"
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          total={data?.total}
          page={state.page}
          pageSize={state.pageSize}
          onPageChange={(page, pageSize) => actions.setPage(page, pageSize)}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSortChange={actions.setSort}
          loading={listQuery.isFetching}
          selectable
          batchActions={(rows) => (
            <Button danger size="small" onClick={handleBatchDelete} disabled={rows.length === 0}>
              批量删除
            </Button>
          )}
          onSelectionChange={handleSelectionChange}
          selectionResetKey={`${selectionVersion}-${JSON.stringify({
            keyword: state.keyword,
            filters: state.filters,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
          })}`}
          toolbarActions={toolbarActions}
          onRefresh={() => void listQuery.refetch()}
          refreshing={listQuery.isFetching}
          emptyDescription="暂无项目数据，可新建项目或调整筛选条件。"
        />
      </QueryState>

      <FormDrawer<ProjectFormValues>
        open={drawer !== null}
        title={drawer?.mode === 'edit' ? '快捷编辑项目' : '新建项目'}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
        initialValues={initialValues}
        submitting={create.isPending || update.isPending}
        submitLabel={drawer?.mode === 'edit' ? '保存修改' : '创建项目'}
      >
        <ProjectFormFields />
      </FormDrawer>

      <ImportDrawer open={importOpen} onClose={() => setImportOpen(false)} moduleLabel="项目" />
    </div>
  );
}
