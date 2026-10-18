import type { ReactNode } from 'react';
import { App, Button, Dropdown, Space, Tooltip, type MenuProps } from 'antd';
import { Ellipsis, PencilLine, SquarePen, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { deleteConfirmContent } from '../config/messages';
import { getApiErrorMessage } from '../lib/api/errors';
import styles from './RowActions.module.css';

export interface RowExtraAction {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onClick: () => void;
}

interface RowActionsProps {
  detailTo: string;
  entityName: string;
  onQuickEdit: () => void;
  onFullEdit: () => void;
  onDelete: () => Promise<void> | void;
  extraActions?: RowExtraAction[];
  deleteTitle?: string;
}

export function RowActions({
  detailTo,
  entityName,
  onQuickEdit,
  onFullEdit,
  onDelete,
  extraActions = [],
  deleteTitle,
}: RowActionsProps) {
  const { modal, message } = App.useApp();

  const items: MenuProps['items'] = [
    { key: 'quick-edit', label: '快捷编辑', icon: <PencilLine size={15} aria-hidden="true" /> },
    { key: 'full-edit', label: '完整编辑', icon: <SquarePen size={15} aria-hidden="true" /> },
    ...(extraActions.length > 0
      ? [
          { type: 'divider' as const },
          ...extraActions.map((action) => ({
            key: action.key,
            label: action.label,
            icon: action.icon,
            danger: action.danger,
          })),
        ]
      : []),
    { type: 'divider' as const },
    {
      key: 'delete',
      label: '删除',
      danger: true,
      icon: <Trash2 size={15} aria-hidden="true" />,
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'quick-edit') {
      onQuickEdit();
      return;
    }
    if (key === 'full-edit') {
      onFullEdit();
      return;
    }
    if (key === 'delete') {
      modal.confirm({
        title: deleteTitle ?? `删除“${entityName}”`,
        content: deleteConfirmContent(entityName),
        okText: '删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await onDelete();
            message.success('删除成功');
          } catch (error) {
            message.error(getApiErrorMessage(error));
          }
        },
      });
      return;
    }
    extraActions.find((action) => action.key === key)?.onClick();
  };

  return (
    <Space size={2} className={styles.actions}>
      <Link to={detailTo} className={styles.detailLink}>
        详情
      </Link>
      <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={['click']} placement="bottomRight">
        <Tooltip title="更多操作">
          <Button
            type="text"
            size="small"
            className={styles.moreButton}
            aria-label={`更多操作：${entityName}`}
            icon={<Ellipsis size={16} aria-hidden="true" />}
          />
        </Tooltip>
      </Dropdown>
    </Space>
  );
}
