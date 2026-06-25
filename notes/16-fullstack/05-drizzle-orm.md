# Drizzle ORM 完全入门教程 📚

## 一、什么是 ORM？

**ORM = Object-Relational Mapping（对象关系映射）**

简单来说，ORM 就是让你用**编程语言的方式**来操作数据库，而不需要直接写 SQL 语句。

### 举个例子：

**不用 ORM（写 SQL）：**
```sql
SELECT * FROM users WHERE age > 18;
```

**用 ORM（写代码）：**
```javascript
db.select().from(users).where(users.age.gt(18))
```

**ORM 的好处：**
- ✅ **类型安全**：TypeScript 可以帮你检查错误
- ✅ **代码更清晰**：用编程语言的语法，更易读
- ✅ **数据库无关**：换数据库时代码改动少
- ✅ **自动处理**：连接管理、SQL 注入防护等

---

## 二、什么是 Drizzle ORM？

Drizzle ORM 是一个**专为 TypeScript/JavaScript 设计的轻量级 ORM**。

### 核心特点：

1. **极致的类型安全** - 基于 TypeScript，自动生成类型
2. **贴近 SQL** - 语法接近原生 SQL，学习成本低
3. **零运行时开销** - 编译后没有抽象层，性能好
4. **支持多数据库** - PostgreSQL、MySQL、SQLite、CockroachDB 等
5. **Schema 即类型** - 写 schema 自动生成 TS 类型，无需额外步骤

---

## 三、快速上手 Drizzle ORM

### 1️⃣ 安装

```bash
# 选择你的数据库驱动
npm install drizzle-orm
npm install drizzle-kit --save-dev

# 例如：SQLite
npm install better-sqlite3
```

### 2️⃣ 配置数据库连接

```typescript
// db.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite);
```

### 3️⃣ 定义 Schema（表结构）

```typescript
// schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 定义 users 表
export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  age: integer('age')
});

// 定义 posts 表
export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  authorId: integer('author_id').references(() => users.id)
});
```

### 4️⃣ 基本的 CRUD 操作

```typescript
import { db } from './db';
import { users, posts } from './schema';
import { eq, gt } from 'drizzle-orm';

// 📝 创建数据 (Create)
await db.insert(users).values({
  name: '张三',
  email: 'zhangsan@example.com',
  age: 25
});

// 🔍 查询数据 (Read)
// 查询所有用户
const allUsers = await db.select().from(users);

// 条件查询
const adults = await db.select().from(users).where(gt(users.age, 18));

// 查询单个用户
const user = await db.query.users.findFirst({
  where: eq(users.email, 'zhangsan@example.com')
});

// ✏️ 更新数据 (Update)
await db.update(users)
  .set({ age: 26 })
  .where(eq(users.name, '张三'));

// ❌ 删除数据 (Delete)
await db.delete(users).where(eq(users.id, 1));
```

### 5️⃣ 关联查询

```typescript
// 查询用户及其所有文章
const userWithPosts = await db.query.users.findFirst({
  where: eq(users.id, 1),
  with: {
    posts: true
  }
});

// 结果示例：
// {
//   id: 1,
//   name: '张三',
//   email: 'zhangsan@example.com',
//   posts: [
//     { id: 1, title: '第一篇文章', content: '...' },
//     { id: 2, title: '第二篇文章', content: '...' }
//   ]
// }
```

---

## 四、迁移（Migration）管理

Drizzle 提供了强大的迁移工具：

```bash
# 生成迁移文件
npx drizzle-kit generate

# 手动运行迁移
npx drizzle-kit migrate
```

---

## 五、与其他 ORM 对比

| 特性 | Drizzle ORM | Prisma | TypeORM |
|------|-------------|--------|---------|
| 类型安全 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 学习曲线 | 简单 | 中等 | 复杂 |
| 性能 | 极快 | 快 | 中等 |
| 运行时开销 | 零 | 有 | 有 |
| SQL 灵活性 | 高 | 中 | 高 |

---

## 六、适合谁使用？

✅ **适合：**
- TypeScript 项目
- 需要高性能的应用
- 喜欢贴近 SQL 的开发者
- Serverless 架构项目

❌ **不适合：**
- 纯 JavaScript 项目（虽然支持但体验打折）
- 需要大量自动生成代码的场景

---

## 七、学习资源

- 📖 [官方文档](https://orm.drizzle.team/)
- 🎥 [官方教程视频](https://www.youtube.com/@drizzleorm)
- 💻 [GitHub 仓库](https://github.com/drizzle-team/drizzle-orm)


# postgress

https://www.bilibili.com/video/BV1MrKpzLE2t/?spm_id_from=333.337.search-card.all.click

# PostgreSQL + TypeScript + Drizzle ORM 完整教程

Drizzle ORM 是一个轻量级、类型安全的 TypeScript ORM，特别适合现代全栈开发。相比 Prisma 等传统 ORM，Drizzle 更接近原生 SQL，性能更好，且没有二进制依赖，非常适合 Serverless 和边缘计算场景。

## 1. 项目初始化

首先创建一个 TypeScript 项目：

```bash
mkdir drizzle-postgres-demo
cd drizzle-postgres-demo
npm init -y
npm install typescript @types/node ts-node -D
npx tsc --init
```

## 2. 安装 Drizzle ORM 和 PostgreSQL 驱动

```bash
npm install drizzle-orm pg
npm install drizzle-kit -D
```

## 3. 配置环境变量

创建 `.env` 文件：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/your_database?schema=public"
```

> **提示**：如果你没有 PostgreSQL 服务器，可以使用 Docker 快速启动：
> ```bash
> docker run -d --name postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 postgres
> ```

## 4. 配置 Drizzle Kit

创建 `drizzle.config.ts` 文件：

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema.ts', // schema 文件路径
  out: './drizzle',          // migration 文件输出目录
  driver: 'pg',              // 使用 PostgreSQL 驱动
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

## 5. 定义 Schema

创建 `src/schema.ts` 文件，定义数据库表结构：

```typescript
import { 
  pgTable, 
  serial, 
  varchar, 
  timestamp, 
  boolean,
  text,
  jsonb
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 用户表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { mode: 'date' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// 文章表
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  authorId: serial('author_id').references(() => users.id),
  tags: jsonb('tags').default([]),
  createdAt: timestamp('created_at', { mode: 'date' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// 导出类型
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

## 6. 创建数据库连接

创建 `src/db.ts` 文件：

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

## 7. 设置 Migration 工作流

在 `package.json` 中添加 scripts：

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "ts-node ./src/migrate.ts"
  }
}
```

创建 `src/migrate.ts` 文件：

```typescript
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './db';
import { logger } from './logger';

async function main() {
  try {
    logger.info('开始执行数据库迁移...');
    await migrate(db, { migrationsFolder: './drizzle' });
    logger.info('数据库迁移完成！');
    process.exit(0);
  } catch (error) {
    logger.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

main();
```

## 8. 生成和运行 Migration

```bash
# 生成 migration 文件
npm run db:generate

# 运行 migration
npm run db:migrate
```

## 9. CRUD 操作示例

创建 `src/services/user.service.ts`：

```typescript
import { db } from '../db';
import { users } from '../schema';
import { eq, like } from 'drizzle-orm';

export class UserService {
  // 创建用户
  async createUser(data: { name: string; email: string; password: string }) {
    const [user] = await db.insert(users).values({
      name: data.name,
      email: data.email,
      password: data.password, // 实际应用中应该加密
    }).returning();
    return user;
  }

  // 获取所有用户
  async getAllUsers() {
    return await db.select().from(users);
  }

  // 按ID获取用户
  async getUserById(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // 按邮箱获取用户
  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // 搜索用户
  async searchUsers(query: string) {
    return await db.select().from(users)
      .where(like(users.name, `%${query}%`));
  }

  // 更新用户
  async updateUser(id: number, data: Partial<typeof users.$inferInsert>) {
    const [user] = await db.update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // 删除用户
  async deleteUser(id: number) {
    const [user] = await db.delete(users)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
}
```

## 10. 高级查询示例

创建 `src/services/post.service.ts`：

```typescript
import { db } from '../db';
import { posts, users } from '../schema';
import { eq, desc, sql, and, gte } from 'drizzle-orm';

export class PostService {
  // 创建文章
  async createPost(data: { title: string; content: string; authorId: number; tags?: string[] }) {
    const [post] = await db.insert(posts).values({
      title: data.title,
      content: data.content,
      authorId: data.authorId,
      tags: data.tags || [],
    }).returning();
    return post;
  }

  // 获取所有文章（带作者信息）
  async getAllPosts() {
    return await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        createdAt: posts.createdAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt));
  }

  // 按作者获取文章
  async getPostsByAuthor(authorId: number) {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.authorId, authorId))
      .orderBy(desc(posts.createdAt));
  }

  // 按标签搜索文章
  async searchPostsByTags(tags: string[]) {
    return await db
      .select()
      .from(posts)
      .where(sql`tags && ${tags}`);
  }

  // 获取最近7天的文章
  async getRecentPosts(days: number = 7) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    
    return await db
      .select()
      .from(posts)
      .where(gte(posts.createdAt, sinceDate))
      .orderBy(desc(posts.createdAt));
  }
}
```

## 11. 完整示例：API 路由

创建 `src/routes/api.ts`：

```typescript
import { Hono } from 'hono';
import { UserService } from '../services/user.service';
import { PostService } from '../services/post.service';
import { logger } from '../logger';

const api = new Hono();

const userService = new UserService();
const postService = new PostService();

// 用户路由
api.get('/users', async (c) => {
  try {
    const users = await userService.getAllUsers();
    return c.json({ data: users });
  } catch (error) {
    logger.error('获取用户列表失败:', error);
    return c.json({ error: '获取用户列表失败' }, 500);
  }
});

api.post('/users', async (c) => {
  try {
    const data = await c.req.json();
    const user = await userService.createUser(data);
    return c.json({ data: user }, 201);
  } catch (error) {
    logger.error('创建用户失败:', error);
    return c.json({ error: '创建用户失败' }, 500);
  }
});

// 文章路由
api.get('/posts', async (c) => {
  try {
    const posts = await postService.getAllPosts();
    return c.json({ data: posts });
  } catch (error) {
    logger.error('获取文章列表失败:', error);
    return c.json({ error: '获取文章列表失败' }, 500);
  }
});

api.post('/posts', async (c) => {
  try {
    const data = await c.req.json();
    const post = await postService.createPost(data);
    return c.json({ data: post }, 201);
  } catch (error) {
    logger.error('创建文章失败:', error);
    return c.json({ error: '创建文章失败' }, 500);
  }
});

export default api;
```

## 12. 最佳实践

### 1. 类型安全
Drizzle ORM 的最大优势是类型安全。确保在 schema 中正确定义类型：

```typescript
// 好的做法
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  // ...
});

// 使用类型推断
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### 2. 命名约定
TypeScript 使用驼峰命名法（camelCase），数据库使用蛇形命名法（snake_case）。Drizzle 支持自动转换：

```typescript
// schema.ts
export const users = pgTable('users', {
  fullName: text('full_name'), // 数据库字段名是 full_name
  // TypeScript 中使用 fullName
});

// 使用时
const user = await db.select().from(users);
console.log(user.fullName); // TypeScript 中是 camelCase
```

### 3. 事务处理
使用事务确保数据一致性：

```typescript
import { db } from './db';

async function createPostWithAuthor(postData: any, userData: any) {
  return db.transaction(async (tx) => {
    // 先创建用户
    const [author] = await tx.insert(users).values(userData).returning();
    
    // 再创建文章
    const [post] = await tx.insert(posts).values({
      ...postData,
      authorId: author.id,
    }).returning();
    
    return { author, post };
  });
}
```

### 4. 性能优化
对于复杂查询，可以直接使用 SQL：

```typescript
import { sql } from 'drizzle-orm';

// 复杂的聚合查询
const result = await db.execute(sql`
  SELECT 
    u.id,
    u.name,
    COUNT(p.id) as post_count,
    AVG(LENGTH(p.content)) as avg_content_length
  FROM users u
  LEFT JOIN posts p ON u.id = p.author_id
  GROUP BY u.id, u.name
  HAVING COUNT(p.id) > 0
  ORDER BY post_count DESC
  LIMIT 10
`);
```

### 5. 错误处理
添加全局错误处理：

```typescript
// middleware/error-handler.ts
export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    logger.error('请求处理失败:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: c.req.url,
      method: c.req.method,
    });
    
    c.status(500);
    c.json({ 
      error: '服务器内部错误',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
```

## 13. 项目结构推荐

```
src/
├── db/
│   ├── index.ts          # 数据库连接
│   └── migrate.ts        # 迁移脚本
├── schema/
│   ├── index.ts          # 导出所有 schema
│   ├── users.ts          # 用户表 schema
│   └── posts.ts          # 文章表 schema
├── services/            # 业务逻辑
│   ├── user.service.ts
│   └── post.service.ts
├── routes/              # API 路由
│   ├── api.ts
│   └── auth.ts
├── middleware/          # 中间件
│   └── error-handler.ts
├── utils/               # 工具函数
│   └── logger.ts
└── index.ts             # 入口文件
drizzle/                # 迁移文件
drizzle.config.ts       # Drizzle 配置
.env                    # 环境变量
```

## 14. 调试技巧

### 1. 启用查询日志
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { logger } from './utils/logger';

export const db = drizzle(pool, { 
  schema,
  logger: {
    logQuery(query, params) {
      logger.debug('SQL Query:', { query, params });
    },
  },
});
```

### 2. 使用 Drizzle Studio
Drizzle Studio 是一个可视化工具，可以查看和管理数据库：

```bash
npx drizzle-kit studio
```

## 总结

Drizzle ORM 为 TypeScript 开发者提供了一个轻量级、类型安全的 PostgreSQL 操作方案。它的核心优势包括：

- **类型安全**：完整的 TypeScript 类型推断
- **性能优秀**：接近原生 SQL 的性能
- **轻量无依赖**：没有二进制依赖，适合 Serverless
- **灵活可控**：可以混合使用 ORM 和原生 SQL
- **现代化工具链**：完善的 migration 和类型生成工具

