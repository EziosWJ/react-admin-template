import { Col, Form, Input, Row, Select } from 'antd';
import { DEPARTMENT_OPTIONS, ROLE_OPTIONS, USER_STATUS_OPTIONS } from '../../../config/options';
import type { UserInput } from '../../../types/models';

export type UserFormValues = UserInput;

export const USER_DEFAULT_VALUES: Partial<UserFormValues> = {
  status: 'active',
  department: 'product',
  role: 'member',
};

export function UserFormFields() {
  return (
    <Row gutter={16}>
      <Col xs={24} sm={12}>
        <Form.Item
          name="name"
          label="姓名"
          rules={[
            { required: true, message: '请输入姓名' },
            { min: 2, max: 20, message: '姓名需为 2-20 个字符' },
            { whitespace: true, message: '姓名不能只包含空格' },
          ]}
        >
          <Input placeholder="例如：陈晨" maxLength={20} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            {
              pattern: /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/,
              message: '需以字母开头，由 3-20 位字母、数字或下划线组成',
            },
          ]}
        >
          <Input placeholder="例如：chenchen" maxLength={20} autoComplete="off" />
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
          <Input placeholder="例如：chenchen@example.com" maxLength={120} autoComplete="off" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item name="department" label="部门" rules={[{ required: true, message: '请选择部门' }]}>
          <Select options={DEPARTMENT_OPTIONS} placeholder="请选择部门" showSearch optionFilterProp="label" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item name="role" label="角色/岗位" rules={[{ required: true, message: '请选择角色/岗位' }]}>
          <Select options={ROLE_OPTIONS} placeholder="请选择角色/岗位" showSearch optionFilterProp="label" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
          <Select options={USER_STATUS_OPTIONS} placeholder="请选择状态" />
        </Form.Item>
      </Col>
    </Row>
  );
}
