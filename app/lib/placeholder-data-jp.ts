export const depts = [
  { id: '3958dc9e-712f-4377-85e9-fec4b6a6442a', parent_id: '0', name: '阳光教育集团', order_num: 1, status: '0' },
  { id: '3958dc9e-712f-4377-85e9-fec4b6a6442b', parent_id: '3958dc9e-712f-4377-85e9-fec4b6a6442a', name: '旗舰校区', order_num: 1, status: '0' },
];

export const roles = [
  { id: '410544b2-4001-4271-9855-fec4b6a6442a', name: '超级管理员', role_key: 'admin', data_scope: '1', status: '0' },
  { id: '410544b2-4001-4271-9855-fec4b6a6442b', name: '分校校长', role_key: 'manager', data_scope: '4', status: '0' },
];

export const menus = [
  { id: '76162333-ac42-4939-be34-fec4b6a6442a', parent_id: '0', name: '系统管理', type: 'M', path: '/system', perms: '' },
  { id: '76162333-ac42-4939-be34-fec4b6a6442b', parent_id: '76162333-ac42-4939-be34-fec4b6a6442a', name: '人员管理', type: 'C', path: '/system/user', perms: 'system:user:list' },
  { id: '76162333-ac42-4939-be34-fec4b6a6442c', parent_id: '76162333-ac42-4939-be34-fec4b6a6442b', name: '用户新增', type: 'F', path: '', perms: 'system:user:add' },
];

export const users = [
  {
    id: 'd052668e-712f-4377-85e9-fec4b6a6442a',
    dept_id: '3958dc9e-712f-4377-85e9-fec4b6a6442b',
    user_name: 'admin',
    nick_name: '张校长',
    email: 'admin@school.com',
    password: 'password123', // 实际脚本会加密
    status: '0',
  },
];
