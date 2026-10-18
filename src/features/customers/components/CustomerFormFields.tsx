import { Col, Form, Input, Row, Select } from 'antd';
import { CUSTOMER_STATUS_OPTIONS, INDUSTRY_OPTIONS } from '../../../config/options';
import type { CustomerInput } from '../../../types/models';

export type CustomerFormValues = CustomerInput;

export const CUSTOMER_DEFAULT_VALUES: Partial<CustomerFormValues> = {
  status: 'active',
};

export function CustomerFormFields() {
  return (
    <Row gutter={16}>
      <Col xs={24} sm={12}>
        <Form.Item
          name="name"
          label="客户名称"
          rules={[
            { required: true, message: '请输入客户名称' },
            { min: 2, max: 40, message: '客户名称需为 2-40 个字符' },
            { whitespace: true, message: '客户名称不能只包含空格' },
          ]}
        >
          <Input placeholder="例如：星云科技" maxLength={40} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="code"
          label="客户编码"
          normalize={(value: string) => value.toUpperCase()}
          rules={[
            { required: true, message: '请输入客户编码' },
            { pattern: /^[A-Z0-9-]{3,24}$/, message: '需为 3-24 位字母、数字或连字符' },
          ]}
        >
          <Input placeholder="例如：CUS-1001" maxLength={24} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="industry"
          label="所属行业"
          rules={[{ required: true, message: '请选择所属行业' }]}
        >
          <Select
            options={INDUSTRY_OPTIONS}
            placeholder="请选择行业"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="status"
          label="客户状态"
          rules={[{ required: true, message: '请选择客户状态' }]}
        >
          <Select options={CUSTOMER_STATUS_OPTIONS} placeholder="请选择状态" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="contactName"
          label="联系人"
          rules={[
            { required: true, message: '请输入联系人姓名' },
            { min: 2, max: 20, message: '联系人需为 2-20 个字符' },
          ]}
        >
          <Input placeholder="请输入联系人姓名" maxLength={20} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="phone"
          label="联系电话"
          rules={[
            { required: true, message: '请输入联系电话' },
            {
              pattern: /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/,
              message: '请输入有效的手机号或座机号',
            },
          ]}
        >
          <Input placeholder="例如：13800000000" maxLength={20} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        >
          <Input placeholder="例如：contact@example.com" maxLength={120} />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Form.Item name="notes" label="备注" rules={[{ max: 500, message: '备注不能超过 500 个字符' }]}>
          <Input.TextArea rows={4} maxLength={500} showCount placeholder="可填写客户背景、跟进重点等信息" />
        </Form.Item>
      </Col>
    </Row>
  );
}
