export const commonMessages = Object.freeze({
  loading: '正在加载…',
  loadFailed: '数据加载失败',
  loadFailedDetail: '请求未能完成，请检查网络后重试。',
  retry: '重新加载',
  save: '保存',
  saving: '保存中…',
  cancel: '取消',
  confirm: '确定',
  delete: '删除',
  deleting: '删除中…',
  create: '新建',
  edit: '编辑',
  detail: '查看详情',
  reset: '重置筛选',
  refresh: '刷新',
  search: '搜索',
  empty: '暂无数据',
  noSelection: '尚未选择任何记录',
  networkError: '网络请求失败，请稍后重试。',
  saved: '保存成功',
  created: '创建成功',
  deleted: '删除成功',
  updated: '更新成功',
  demoUploadNotice: '此功能仅在前端模拟，文件不会上传到任何服务器。',
  unknownEntity: '记录不存在或已被删除。',
});

export function deleteConfirmContent(name: string): string {
  return `确定删除“${name}”吗？删除后无法恢复。`;
}
