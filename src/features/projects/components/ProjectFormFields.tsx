import type { Dayjs } from 'dayjs';
import { Col, DatePicker, Form, Input, InputNumber, Row, Select } from 'antd';
import { DEPARTMENT_OPTIONS, optionLabel, PROJECT_STATUS_OPTIONS } from '../../../config/options';
import type { ProjectStatus } from '../../../types/models';
import { useCustomerOptions } from '../../customers/queries';
import { useUserOptions } from '../../users/queries';

export interface ProjectFormValues {
  name: string;
  code: string;
  customerId: string;
  owner: string;
  status: ProjectStatus;
  progress: number;
  startDate: Dayjs;
  endDate: Dayjs;
  budget: number;
  notes: string;
}

export const PROJECT_DEFAULT_VALUES: Partial<ProjectFormValues> = {
  status: 'planning',
  progress: 0,
  notes: '',
};

export function ProjectFormFields() {
  const customerOptionsQuery = useCustomerOptions();
  const userOptionsQuery = useUserOptions();

  const customerOptions = (customerOptionsQuery.data?.items ?? []).map((customer) => ({
    value: customer.id,
    label: `${customer.name}（${customer.code}）`,
  }));

  const ownerOptions = (userOptionsQuery.data?.items ?? []).map((user) => ({
    value: user.name,
    label: `${user.name}（${optionLabel(DEPARTMENT_OPTIONS, user.department)}）`,
  }));

  return (
    <Row gutter={16}>
      <Col xs={24} sm={12}>
        <Form.Item
          name="name"
          label="项目名称"
          rules={[
            { required: true, message: '请输入项目名称' },
            { min: 2, max: 60, message: '项目名称需为 2-60 个字符' },
            { whitespace: true, message: '项目名称不能只包含空格' },
          ]}
        >
          <Input placeholder="例如：星云数据中台建设" maxLength={60} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="code"
          label="项目编码"
          normalize={(value: string) => value.toUpperCase()}
          rules={[
            { required: true, message: '请输入项目编码' },
            { pattern: /^[A-Z0-9-]{3,24}$/, message: '需为 3-24 位字母、数字或连字符' },
          ]}
        >
          <Input placeholder="例如：PRJ-1001" maxLength={24} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="customerId"
          label="关联客户"
          rules={[{ required: true, message: '请选择关联客户' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            loading={customerOptionsQuery.isPending}
            placeholder="请选择关联客户"
            options={customerOptions}
            notFoundContent={customerOptionsQuery.isPending ? '客户加载中…' : '暂无可选客户'}
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="owner"
          label="负责人"
          rules={[{ required: true, message: '请选择项目负责人' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            loading={userOptionsQuery.isPending}
            placeholder="请选择项目负责人"
            options={ownerOptions}
            notFoundContent={userOptionsQuery.isPending ? '用户加载中…' : '暂无可选用户'}
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="status"
          label="项目状态"
          rules={[{ required: true, message: '请选择项目状态' }]}
        >
          <Select options={PROJECT_STATUS_OPTIONS} placeholder="请选择项目状态" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="progress"
          label="进度"
          rules={[{ required: true, message: '请输入项目进度' }]}
        >
          <InputNumber
            min={0}
            max={100}
            precision={0}
            suffix="%"
            placeholder="请输入 0-100 的整数"
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="startDate"
          label="开始日期"
          rules={[{ required: true, message: '请选择开始日期' }]}
        >
          <DatePicker format="YYYY-MM-DD" placeholder="请选择开始日期" style={{ width: '100%' }} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="endDate"
          label="结束日期"
          dependencies={['startDate']}
          rules={[
            { required: true, message: '请选择结束日期' },
            ({ getFieldValue }) => ({
              validator(_rule, value: Dayjs | null | undefined) {
                const startDate = getFieldValue('startDate') as Dayjs | null | undefined;
                if (!value || !startDate) return Promise.resolve();
                return value.isBefore(startDate, 'day')
                  ? Promise.reject(new Error('结束日期不能早于开始日期'))
                  : Promise.resolve();
              },
            }),
          ]}
        >
          <DatePicker format="YYYY-MM-DD" placeholder="请选择结束日期" style={{ width: '100%' }} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="budget"
          label="预算"
          rules={[{ required: true, message: '请输入项目预算' }]}
        >
          <InputNumber
            min={0}
            precision={2}
            prefix="¥"
            placeholder="请输入项目预算"
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Form.Item name="notes" label="备注" rules={[{ max: 500, message: '备注不能超过 500 个字符' }]}>
          <Input.TextArea rows={4} maxLength={500} showCount placeholder="可填写项目背景、里程碑或风险说明" />
        </Form.Item>
      </Col>
    </Row>
  );
}
