import { useState } from 'react';
import { App, Button, Dropdown, type MenuProps } from 'antd';
import { Download } from 'lucide-react';
import { getApiErrorMessage } from '../lib/api/errors';
import { exportCsv, exportXlsx, type ExportColumn } from '../utils/export';

interface ExportMenuProps<T> {
  moduleLabel: string;
  columns: ExportColumn<T>[];
  queryAll: () => Promise<T[]>;
  selectedRows: T[];
}

export function ExportMenu<T>({ moduleLabel, columns, queryAll, selectedRows }: ExportMenuProps<T>) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const handleExport = async (scope: 'filtered' | 'selected', format: 'csv' | 'xlsx') => {
    setLoading(true);
    try {
      const rows = scope === 'selected' ? selectedRows : await queryAll();
      if (rows.length === 0) {
        message.info('当前条件下没有可导出的数据。');
        return;
      }
      const filename =
        format === 'csv'
          ? exportCsv(rows, columns, moduleLabel)
          : await exportXlsx(rows, columns, moduleLabel, moduleLabel);
      message.success(`已生成导出文件：${filename}`);
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const items: MenuProps['items'] = [
    { key: 'filtered-csv', label: '导出当前筛选结果（CSV）' },
    { key: 'filtered-xlsx', label: '导出当前筛选结果（XLSX）' },
    { type: 'divider' },
    {
      key: 'selected-csv',
      label: selectedRows.length > 0 ? `导出选中行（CSV，${selectedRows.length} 条）` : '导出选中行（CSV）',
      disabled: selectedRows.length === 0,
    },
    {
      key: 'selected-xlsx',
      label: selectedRows.length > 0 ? `导出选中行（XLSX，${selectedRows.length} 条）` : '导出选中行（XLSX）',
      disabled: selectedRows.length === 0,
    },
  ];

  return (
    <Dropdown
      menu={{
        items,
        onClick: ({ key }) => {
          const [scope, format] = key.split('-') as ['filtered' | 'selected', 'csv' | 'xlsx'];
          void handleExport(scope, format);
        },
      }}
      trigger={['click']}
      disabled={loading}
    >
      <Button
        icon={<Download size={16} aria-hidden="true" />}
        loading={loading}
      >
        导出
      </Button>
    </Dropdown>
  );
}
