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

# Session 密钥（必填，用于用户登录鉴权，可用以下命令生成）
# openssl rand -base64 32
SESSION_SECRET="替换为你自己生成的随机字符串"

# Gemini API Key（选填，不填则 AI 功能使用占位回复）
GEMINI_API_KEY=""

# 应用名称
NEXT_PUBLIC_APP_NAME="研途 ResearchFlow"
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
