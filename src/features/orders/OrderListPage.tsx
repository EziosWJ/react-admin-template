import { useCallback, useMemo, useState } from 'react';
import { App, Button, DatePicker, Input, Select, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Upload } from 'lucide-react';
import type { TableColumnsType } from 'antd';
import { DataTable } from '../../components/DataTable';
import { RowActions } from '../../components/RowActions';
import { ExportMenu } from '../../components/ExportMenu';
import { FormDrawer } from '../../components/FormDrawer';
import { ImportDrawer } from '../../components/ImportDrawer';
import { PageHeader } from '../../components/PageHeader';
import { QueryState } from '../../components/QueryState';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusTag } from '../../components/StatusTag';
import { ORDER_STATUS_OPTIONS } from '../../config/options';
import { paths } from '../../config/paths';
import { useListFilterDraft } from '../../hooks/useListFilterDraft';
import { useListUrlState } from '../../hooks/useListUrlState';
import { getApiErrorMessage } from '../../lib/api/errors';
import type { Order, OrderInput } from '../../types/models';
import { DATE_FORMAT, formatCurrency, formatDate } from '../../utils/format';
import { useCustomerOptions } from '../customers/queries';
import { useProjectOptions } from '../projects/queries';
import { ordersApi } from './api';
import { useOrderList, useOrderMutations } from './queries';
import { ORDER_DEFAULT_VALUES, OrderFormFields, type OrderFormValues } from './components/OrderFormFields';
import {
  buildOrderQuery,
  createOrderExportColumns,
  orderListUrlConfig,
  toOrderFormValues,
  toOrderInput,
} from './constants';

type DrawerState = { mode: 'create' } | { mode: 'edit'; order: Order };

export default function OrderListPage() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { state, actions } = useListUrlState(orderListUrlConfig);
  const draft = useListFilterDraft(state.keyword, state.filters);
  const query = useMemo(() => buildOrderQuery(state), [state]);
  const listQuery = useOrderList(query);
  const customersQuery = useCustomerOptions();
  const projectsQuery = useProjectOptions();
  const { create, update, remove } = useOrderMutations();

  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [selectedRows, setSelectedRows] = useState<Order[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [selectionVersion, setSelectionVersion] = useState(0);

  const customerNameById = useMemo(
    () =>
      new Map<string, string>(
        (customersQuery.data?.items ?? []).map((customer): [string, string] => [customer.id, customer.name]),
      ),
    [customersQuery.data],
  );
  const projectNameById = useMemo(
    () =>
      new Map<string, string>(
        (projectsQuery.data?.items ?? []).map((project): [string, string] => [project.id, project.name]),
      ),
    [projectsQuery.data],
  );
  const customerOptions = useMemo(
    () =>
      (customersQuery.data?.items ?? []).map((customer) => ({
        value: customer.id,
        label: customer.name,
      })),
    [customersQuery.data],
  );
  const exportColumns = useMemo(
    () => createOrderExportColumns(customerNameById, projectNameById),
    [customerNameById, projectNameById],
  );
  const dateRange = useMemo<[Dayjs | null, Dayjs | null] | null>(() => {
    const { dateFrom, dateTo } = draft.filters;
    if (!dateFrom && !dateTo) return null;
    return [dateFrom ? dayjs(dateFrom) : null, dateTo ? dayjs(dateTo) : null];
  }, [draft.filters]);

  const handleSelectionChange = useCallback((rows: Order[]) => setSelectedRows(rows), []);
  const closeDrawer = useCallback(() => setDrawer(null), []);

  const handleSearch = () => {
    const values = draft.submit();
    actions.applyFilters(values.keyword, values.filters);
  };

  const handleReset = () => {
    draft.reset();
    actions.reset();
  };

  const initialValues = useMemo(() => {
    if (drawer?.mode === 'edit') return toOrderFormValues(drawer.order);
    return {
      ...ORDER_DEFAULT_VALUES,
      orderDate: dayjs(),
      dueDate: dayjs().add(30, 'day'),
    };
  }, [drawer]);

  const handleSubmit = async (values: OrderFormValues) => {
    const input: OrderInput = toOrderInput(values);
    if (drawer?.mode === 'edit') {
      await update.mutateAsync({ id: drawer.order.id, input });
      message.success('订单信息已更新');
    } else {
      await create.mutateAsync(input);
      message.success('订单创建成功');
    }
    setDrawer(null);
  };

  const handleBatchDelete = () => {
    if (selectedRows.length === 0) return;
    modal.confirm({
      title: `批量删除 ${selectedRows.length} 个订单`,
      content: '删除后无法恢复，请确认这些订单不再需要。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        const results = await Promise.allSettled(selectedRows.map((row) => remove.mutateAsync(row.id)));
        const failures = results.filter((result) => result.status === 'rejected');
        if (failures.length === 0) {
          message.success(`已删除 ${selectedRows.length} 个订单`);
        } else {
          const firstFailure = failures[0] as PromiseRejectedResult;
          message.error(`${failures.length} 条删除失败：${getApiErrorMessage(firstFailure.reason)}`);
        }
        setSelectionVersion((version) => version + 1);
      },
    });
  };

  const queryAll = useCallback(async () => {
    const result = await ordersApi.list({ ...query, page: 1, pageSize: 10_000 });
    return result.items;
  }, [query]);

  const columns: TableColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      sorter: true,
      width: 140,
      render: (value: string, record) => <Link to={paths.orderDetail(record.id)}>{value}</Link>,
    },
    {
      title: '客户',
      dataIndex: 'customerId',
      key: 'customer',
      width: 140,
      responsive: ['md'],
      ellipsis: true,
      render: (value: string) => {
        const name = customerNameById.get(value);
        if (name) return <Link to={paths.customerDetail(value)}>{name}</Link>;
        return customersQuery.isPending ? '加载中…' : '客户不存在';
      },
    },
    {
      title: '关联项目',
      key: 'project',
      width: 150,
      responsive: ['lg'],
      ellipsis: true,
      render: (_value, record) => {
        if (!record.projectId) return '未关联项目';
        const name = projectNameById.get(record.projectId);
        if (name) return <Link to={paths.projectDetail(record.projectId)}>{name}</Link>;
        return projectsQuery.isPending ? '加载中…' : '项目不存在';
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      sorter: true,
      responsive: ['md'],
      width: 110,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      sorter: true,
      width: 96,
      render: (value: string) => <StatusTag value={value} options={ORDER_STATUS_OPTIONS} />,
    },
    {
      title: '下单日期',
      dataIndex: 'orderDate',
      key: 'orderDate',
      sorter: true,
      responsive: ['lg'],
      width: 104,
      render: (value: string) => formatDate(value),
    },
    {
      title: '到期日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      sorter: true,
      responsive: ['xl'],
      width: 104,
      render: (value: string) => formatDate(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 112,
      fixed: 'right',
      render: (_value, record) => (
        <RowActions
          detailTo={paths.orderDetail(record.id)}
          entityName={record.orderNo}
          onQuickEdit={() => setDrawer({ mode: 'edit', order: record })}
          onFullEdit={() => navigate(paths.orderEdit(record.id))}
          onDelete={async () => {
            await remove.mutateAsync(record.id);
            setSelectionVersion((version) => version + 1);
          }}
        />
      ),
    },
  ];

  const toolbarActions = (
    <Space wrap size={6}>
      <ExportMenu moduleLabel="订单列表" columns={exportColumns} queryAll={queryAll} selectedRows={selectedRows} />
      <Button icon={<Upload size={16} aria-hidden="true" />} onClick={() => setImportOpen(true)}>
        导入
      </Button>
    </Space>
  );

  const data = listQuery.data;

  return (
    <div className="pageStack">
      <PageHeader
        title="订单管理"
        description="维护销售订单，查看金额、状态与客户/项目关联。"
        extra={
          <Button type="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setDrawer({ mode: 'create' })}>
            新建订单
          </Button>
        }
      />

      <SearchFilterBar onSubmit={handleSearch} onReset={handleReset} dirty={draft.dirty}>
        <Input
          allowClear
          prefix={<Search size={15} aria-hidden="true" />}
          placeholder="搜索订单号或客户"
          aria-label="搜索订单"
          value={draft.keyword}
          onChange={(event) => draft.setKeyword(event.target.value)}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="按客户筛选"
          aria-label="按客户筛选"
          value={draft.filters.customerId}
          options={customerOptions}
          loading={customersQuery.isPending}
          onChange={(value) => draft.setFilter('customerId', value)}
        />
        <Select
          allowClear
          placeholder="订单状态"
          aria-label="按订单状态筛选"
          value={draft.filters.status}
          options={ORDER_STATUS_OPTIONS}
          onChange={(value) => draft.setFilter('status', value)}
        />
        <DatePicker.RangePicker
          allowClear
          format={DATE_FORMAT}
          value={dateRange}
          aria-label="按下单日期范围筛选"
          placeholder={['下单开始日期', '下单结束日期']}
          onChange={(dates) =>
            draft.setFilters({
              dateFrom: dates?.[0]?.format(DATE_FORMAT),
              dateTo: dates?.[1]?.format(DATE_FORMAT),
            })
          }
        />
      </SearchFilterBar>

      <QueryState
        isLoading={listQuery.isPending}
        isError={listQuery.isError}
        error={listQuery.error}
        onRetry={() => void listQuery.refetch()}
      >
        <DataTable<Order>
          tableKey="orders"
          title="订单列表"
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
            <Button
              type="primary"
              danger
              size="small"
              icon={<Trash2 size={14} aria-hidden="true" />}
              onClick={handleBatchDelete}
              disabled={rows.length === 0}
            >
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
          emptyDescription="暂无订单数据，可新建订单或调整筛选条件。"
        />
      </QueryState>

      <FormDrawer<OrderFormValues>
        open={drawer !== null}
        title={drawer?.mode === 'edit' ? '快捷编辑订单' : '新建订单'}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
        initialValues={initialValues}
        submitting={create.isPending || update.isPending}
        submitLabel={drawer?.mode === 'edit' ? '保存修改' : '创建订单'}
      >
        <OrderFormFields />
      </FormDrawer>

      <ImportDrawer open={importOpen} onClose={() => setImportOpen(false)} moduleLabel="订单" />
    </div>
  );
}
