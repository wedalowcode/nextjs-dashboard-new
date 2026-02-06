import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { depts, roles, menus, users } from '../lib/placeholder-data-jp';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// 1. 种子化部门表
async function seedDepts() {
  await sql`
    CREATE TABLE IF NOT EXISTS sys_dept (
      dept_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      parent_id UUID NOT NULL,
      dept_name VARCHAR(255) NOT NULL,
      order_num INT NOT NULL,
      status CHAR(1) DEFAULT '0'
    );
  `;

  return Promise.all(
    depts.map((dept) => sql`
      INSERT INTO sys_dept (dept_id, parent_id, dept_name, order_num, status)
      VALUES (${dept.id}, ${dept.parent_id === '0' ? '00000000-0000-0000-0000-000000000000' : dept.parent_id}, ${dept.name}, ${dept.order_num}, ${dept.status})
      ON CONFLICT (dept_id) DO NOTHING;
    `)
  );
}

// 2. 种子化角色表
async function seedRoles() {
  await sql`
    CREATE TABLE IF NOT EXISTS sys_role (
      role_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      role_name VARCHAR(255) NOT NULL,
      role_key VARCHAR(100) NOT NULL UNIQUE,
      data_scope CHAR(1) DEFAULT '1',
      status CHAR(1) DEFAULT '0'
    );
  `;

  return Promise.all(
    roles.map((role) => sql`
      INSERT INTO sys_role (role_id, role_name, role_key, data_scope, status)
      VALUES (${role.id}, ${role.name}, ${role.role_key}, ${role.data_scope}, ${role.status})
      ON CONFLICT (role_id) DO NOTHING;
    `)
  );
}

// 3. 种子化菜单表
async function seedMenus() {
  await sql`
    CREATE TABLE IF NOT EXISTS sys_menu (
      menu_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      parent_id UUID NOT NULL,
      menu_name VARCHAR(255) NOT NULL,
      menu_type CHAR(1) NOT NULL,
      path VARCHAR(255),
      perms VARCHAR(100)
    );
  `;

  return Promise.all(
    menus.map((menu) => sql`
      INSERT INTO sys_menu (menu_id, parent_id, menu_name, menu_type, path, perms)
      VALUES (${menu.id}, ${menu.parent_id === '0' ? '00000000-0000-0000-0000-000000000000' : menu.parent_id}, ${menu.name}, ${menu.type}, ${menu.path}, ${menu.perms})
      ON CONFLICT (menu_id) DO NOTHING;
    `)
  );
}

// 4. 种子化用户表
async function seedUsers() {
  await sql`
    CREATE TABLE IF NOT EXISTS sys_user (
      user_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      dept_id UUID NOT NULL,
      user_name VARCHAR(255) NOT NULL UNIQUE,
      nick_name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      status CHAR(1) DEFAULT '0'
    );
  `;

  return Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return sql`
        INSERT INTO sys_user (user_id, dept_id, user_name, nick_name, email, password, status)
        VALUES (${user.id}, ${user.dept_id}, ${user.user_name}, ${user.nick_name}, ${user.email}, ${hashedPassword}, ${user.status})
        ON CONFLICT (user_id) DO NOTHING;
      `;
    })
  );
}

// 5. 关联表 (用户-角色)
async function seedUserRoles() {
  await sql`
    CREATE TABLE IF NOT EXISTS sys_user_role (
      user_id UUID REFERENCES sys_user(user_id),
      role_id UUID REFERENCES sys_role(role_id),
      PRIMARY KEY (user_id, role_id)
    );
  `;

  // 为 admin 用户分配超级管理员角色
  const adminUser = users.find(u => u.user_name === 'admin');
  const adminRole = roles.find(r => r.role_key === 'admin');

  if (adminUser && adminRole) {
    return sql`
      INSERT INTO sys_user_role (user_id, role_id)
      VALUES (${adminUser.id}, ${adminRole.id})
      ON CONFLICT (user_id, role_id) DO NOTHING;
    `;
  }
}

// 6. 关联表 (角色-菜单)
async function seedRoleMenus() {
  await sql`
    CREATE TABLE IF NOT EXISTS sys_role_menu (
      role_id UUID REFERENCES sys_role(role_id),
      menu_id UUID REFERENCES sys_menu(menu_id),
      PRIMARY KEY (role_id, menu_id)
    );
  `;

  const adminRole = roles.find(r => r.role_key === 'admin');
  if (adminRole) {
    // 为超级管理员分配所有菜单
    return Promise.all(
      menus.map((menu) => sql`
        INSERT INTO sys_role_menu (role_id, menu_id)
        VALUES (${adminRole.id}, ${menu.id})
        ON CONFLICT (role_id, menu_id) DO NOTHING;
      `)
    );
  }
}

// 7. 关联表 (角色-部门)
async function seedRoleDepts() {
  await sql`
    CREATE TABLE IF NOT EXISTS sys_role_dept (
      role_id UUID REFERENCES sys_role(role_id),
      dept_id UUID REFERENCES sys_dept(dept_id),
      PRIMARY KEY (role_id, dept_id)
    );
  `;

  const adminRole = roles.find(r => r.role_key === 'admin');
  if (adminRole) {
    // 为超级管理员分配所有部门权限
    return Promise.all(
      depts.map((dept) => sql`
        INSERT INTO sys_role_dept (role_id, dept_id)
        VALUES (${adminRole.id}, ${dept.id})
        ON CONFLICT (role_id, dept_id) DO NOTHING;
      `)
    );
  }
}

export async function GET() {
  try {
    // 启用 UUID 扩展
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // 使用事务执行所有初始化
    await sql.begin(async (sql) => {
      await seedDepts();
      await seedRoles();
      await seedMenus();
      await seedUsers();
      await seedUserRoles();
      await seedRoleMenus();
      await seedRoleDepts();
    });

    return Response.json({ message: '教培管家数据库初始化成功' });
  } catch (error) {
    console.error(error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}