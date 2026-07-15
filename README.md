# 研途 ResearchFlow

AI 科研规划管理导师 —— 让每个孩子都能在 AI 时代探索自己感兴趣的课题。

## 本地运行

### 1. 克隆项目

```bash
git clone git@github.com:nicowangbj/research-flow.git
cd research-flow
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
# 数据库
DATABASE_URL="file:./dev.db"

# 线上 Turso/libSQL 数据库（二选一：可使用 TURSO_DATABASE_URL 或 DATABASE_URL）
# TURSO_DATABASE_URL="libsql://your-database.turso.io"
# TURSO_AUTH_TOKEN="your-turso-token"

# Session 密钥（必填，用于用户登录鉴权，可用以下命令生成）
# openssl rand -base64 32
SESSION_SECRET="替换为你自己生成的随机字符串"

# Gemini API Key（选填，不填则 AI 功能使用占位回复）
GEMINI_API_KEY=""

# 应用名称
NEXT_PUBLIC_APP_NAME="研途 ResearchFlow"

# Prompt 配置后台（默认关闭，C 端产品不要开启）
ENABLE_ADMIN="false"

# 仅 Admin 独立部署时开启：开启后非后台页面会跳转到后台
ADMIN_ONLY="false"

# 允许访问 Prompt 配置后台的管理员邮箱，多个邮箱用英文逗号分隔
ADMIN_EMAILS="your-admin@example.com"
```

### 4. 初始化数据库

```bash
npx prisma generate
npx prisma migrate dev
npx tsx prisma/seed.ts
```

这会创建数据库并写入 24 条 AI 策略 + 一个演示账号。

### 5. 启动项目

```bash
npm run dev
```

浏览器打开 http://localhost:3000

### 6. 登录

注册新账号，或使用演示账号：

- **邮箱**: `demo@researchflow.com`
- **密码**: `demo123`

## Prompt 配置后台部署

Prompt 配置后台用于维护 `/admin/strategies` 中的 AI 策略，不应暴露在 C 端产品部署中。推荐使用同一个 GitHub 仓库创建两个 Vercel Project，并让它们连接同一套数据库。

## Roto 个人版 / 学校版独立部署

Roto 现在支持用同一套代码部署成两个彼此独立的网站。推荐在 Vercel 中创建两个 Project，两个 Project 都连接同一个 GitHub 仓库，但使用不同环境变量和不同域名。

### 个人探索版

个人探索版面向学生自主使用，首页展示个人科研探索产品介绍，并隐藏学校入口。

```bash
NEXT_PUBLIC_APP_VARIANT="personal"
SESSION_SECRET="用 openssl rand -base64 32 生成"
TURSO_DATABASE_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your-turso-token"
```

可选：如果需要从个人站跳转到学校站，可以配置：

```bash
NEXT_PUBLIC_SCHOOL_SITE_URL="https://your-school-site.vercel.app"
```

### 学校版 / For School

学校版面向国际学校、教师和学校管理员，首页展示 EE、EPQ、学校科研项目和教师监督功能，并开放 `/school`、`/school/admin`、`/school/teacher`、`/school/student` 等学校工作区入口。

```bash
NEXT_PUBLIC_APP_VARIANT="school"
```

可选：如果需要从学校站跳转回个人站，可以配置：

```bash
NEXT_PUBLIC_PERSONAL_SITE_URL="https://roto-research.vercel.app"
```

### C 端产品部署

面向学生用户，只读取数据库中的 prompt，不开放后台页面和策略配置 API。

```bash
ENABLE_ADMIN="false"
ADMIN_ONLY="false"
ADMIN_EMAILS=""
```

### Admin 后台部署

只给管理员配置 prompt 使用，保存后写入同一张 `AIStrategy` 表，C 端下一次 AI 调用会读取最新配置。

```bash
ENABLE_ADMIN="true"
ADMIN_ONLY="true"
ADMIN_EMAILS="admin1@example.com,admin2@example.com"
```

Admin 后台入口：

```text
/admin/strategies
```

注意：线上新增策略（例如 `AI-S25`）时，可以执行一次 seed。seed 只会创建缺失策略和更新策略元信息，不会覆盖已经在后台手动调整过的 `promptTemplate`。

## 技术栈

- **框架**: Next.js 16 + React 19 + TypeScript
- **样式**: Tailwind CSS 4
- **数据库**: SQLite (better-sqlite3) + Prisma 7
- **AI**: Google Gemini API
- **认证**: JWT (jose) + bcryptjs

## 项目结构

```
src/
├── app/
│   ├── (student)/     # 学生端页面（选题、计划、任务、日志等）
│   ├── admin/         # 管理后台（AI 策略配置）
│   ├── api/           # API 路由
│   ├── login/         # 登录/注册页
│   └── page.tsx       # 产品首页
├── components/        # 复用组件
├── lib/               # 工具库（Prisma、Gemini、Auth）
└── proxy.ts           # 路由鉴权
prisma/
├── schema.prisma      # 数据模型
├── seed.ts            # 种子数据
└── migrations/        # 数据库迁移
```

## 常见问题

**端口占用**: 终端会提示可用端口，直接打开即可。

**没有数据**: 确认已执行 `npx prisma migrate dev` 和 `npx tsx prisma/seed.ts`。

**AI 功能不可用**: 检查 `.env` 中是否配置了 `GEMINI_API_KEY`。未配置时系统使用占位回复，不影响其他功能。

## License

Apache-2.0
