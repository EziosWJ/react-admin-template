import { Col, DatePicker, Form, Input, InputNumber, Row, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import { ORDER_STATUS_OPTIONS } from '../../../config/options';
import type { OrderStatus } from '../../../types/models';
import { DATE_FORMAT } from '../../../utils/format';
import { useCustomerOptions } from '../../customers/queries';
import { useProjectOptions } from '../../projects/queries';

export interface OrderFormValues {
  orderNo: string;
  customerId: string;
  projectId?: string | null;
  amount: number;
  status: OrderStatus;
  orderDate: Dayjs;
  dueDate: Dayjs;
  notes: string;
}

export const ORDER_DEFAULT_VALUES: Partial<OrderFormValues> = {
  status: 'pending',
  notes: '',
};

export function OrderFormFields() {
  const form = Form.useFormInstance<OrderFormValues>();
  const customerId = Form.useWatch('customerId', form);
  const projectId = Form.useWatch('projectId', form);
  const customersQuery = useCustomerOptions();
  const projectsQuery = useProjectOptions(customerId || undefined);

  const customerOptions = (customersQuery.data?.items ?? []).map((customer) => ({
    value: customer.id,
    label: `${customer.name}（${customer.code}）`,
  }));

  const projectOptions = (projectsQuery.data?.items ?? []).map((project) => ({
    value: project.id,
    label: `${project.name}（${project.code}）`,
  }));

  const customerSelectOptions =
    customerId && !customersQuery.isPending && !customerOptions.some((item) => item.value === customerId)
      ? [...customerOptions, { value: customerId, label: '原客户已不存在，请重新选择' }]
      : customerOptions;

  const projectSelectOptions =
    projectId && !projectsQuery.isPending && !projectOptions.some((item) => item.value === projectId)
      ? [...projectOptions, { value: projectId, label: '原关联项目已不存在，请重新选择' }]
      : projectOptions;

  return (
    <Row gutter={16}>
      <Col xs={24} sm={12}>
        <Form.Item
          name="orderNo"
          label="订单号"
          normalize={(value: string | undefined) => (value ?? '').toUpperCase()}
          rules={[
            {
              pattern: /^SO-\d{4}-\d{4,}$/,
              message: '订单号格式应为 SO-年份-序号，例如 SO-2026-1001',
            },
          ]}
        >
          <Input placeholder="留空将自动生成，例如 SO-2026-1001" maxLength={24} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="customerId"
          label="客户"
          rules={[{ required: true, message: '请选择订单客户' }]}
          extra={customersQuery.isError ? '客户列表加载失败，请稍后重试。' : undefined}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="请选择客户"
            loading={customersQuery.isPending}
            options={customerSelectOptions}
            onChange={() => {
              form.setFieldValue('projectId', null);
            }}
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="projectId"
          label="关联项目"
          extra={projectsQuery.isError ? '关联项目加载失败，可先保存订单，稍后再关联项目。' : undefined}
        >
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={customerId ? '请选择关联项目（可选）' : '请先选择客户'}
            disabled={!customerId}
            loading={Boolean(customerId) && projectsQuery.isPending}
            options={projectSelectOptions}
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="amount"
          label="金额"
          rules={[
            { required: true, message: '请输入订单金额' },
            { type: 'number', min: 0.01, message: '订单金额需大于 0' },
          ]}
        >
          <InputNumber
            min={0.01}
            precision={2}
            step={100}
            prefix="¥"
            style={{ width: '100%' }}
            placeholder="请输入订单金额"
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: '请选择订单状态' }]}
        >
          <Select options={ORDER_STATUS_OPTIONS} placeholder="请选择订单状态" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="orderDate"
          label="下单日期"
          rules={[{ required: true, message: '请选择下单日期' }]}
        >
          <DatePicker style={{ width: '100%' }} format={DATE_FORMAT} placeholder="请选择下单日期" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="dueDate"
          label="到期日期"
          dependencies={['orderDate']}
          rules={[
            { required: true, message: '请选择到期日期' },
            ({ getFieldValue }) => ({
              validator(_rule, value: Dayjs | undefined) {
                const orderDate = getFieldValue('orderDate') as Dayjs | undefined;
                if (!value || !orderDate) return Promise.resolve();
                if (value.isBefore(orderDate, 'day')) {
                  return Promise.reject(new Error('到期日期不能早于下单日期'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <DatePicker style={{ width: '100%' }} format={DATE_FORMAT} placeholder="请选择到期日期" />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Form.Item name="notes" label="备注" rules={[{ max: 500, message: '备注不能超过 500 个字符' }]}>
          <Input.TextArea rows={4} maxLength={500} showCount placeholder="可填写合同编号、回款安排等信息" />
        </Form.Item>
      </Col>
    </Row>
  );
}
