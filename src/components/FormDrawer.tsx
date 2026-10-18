import { useEffect, useId, type ReactNode } from 'react';
import { App, Button, Drawer, Form, Space } from 'antd';
import { normalizeApiError } from '../lib/api/errors';

interface FormDrawerProps<Values extends object> {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (values: Values) => Promise<void> | void;
  initialValues?: Partial<Values>;
  submitting?: boolean;
  children: ReactNode;
  width?: number;
  submitLabel?: string;
}

export function FormDrawer<Values extends object>({
  open,
  title,
  onClose,
  onSubmit,
  initialValues,
  submitting = false,
  children,
  width = 520,
  submitLabel = '保存',
}: FormDrawerProps<Values>) {
  const [form] = Form.useForm<Values>();
  const formId = useId();
  const { message } = App.useApp();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (initialValues) {
      form.setFieldsValue(initialValues as Values);
    }
  }, [form, initialValues, open]);

  const handleFinish = async (values: Values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.field) {
        form.setFields([{ name: normalized.field as never, errors: [normalized.message] }]);
      } else {
        message.error(normalized.message);
      }
    }
  };

  return (
    <Drawer
      title={title}
      open={open}
      size={width}
      onClose={onClose}
      destroyOnHidden
      maskClosable={!submitting}
      closable={!submitting}
      styles={{
        header: {
          padding: '16px 20px',
          borderBottom: '1px solid var(--ant-color-border-secondary)',
        },
        body: { padding: '20px 20px 8px' },
        footer: {
          padding: '12px 20px',
          borderTop: '1px solid var(--ant-color-border-secondary)',
        },
      }}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={submitting}>取消</Button>
          <Button type="primary" htmlType="submit" form={formId} loading={submitting}>
            {submitLabel}
          </Button>
        </Space>
      }
    >
      <Form id={formId} form={form} layout="vertical" onFinish={handleFinish} preserve={false} scrollToFirstError>
        {children}
      </Form>
    </Drawer>
  );
}
