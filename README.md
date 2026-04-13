# Research Flow 项目交付说明

这是一份给项目接收方使用的说明。照着下面操作，即可在本地打开网站。

## 1. 你会收到什么

建议交付整个项目目录，并确保至少包含以下内容：

- `src/`
- `public/`
- `prisma/`
- `src/generated/`
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `tsconfig.json`

如果希望对方打开后直接看到当前已有数据，请务必一并提供：

- `prisma/dev.db`

不建议打包这些目录：

- `node_modules/`
- `.next/`

## 2. 本地运行方式

对方需要通过终端启动项目。

### 第一步：进入项目目录

```bash
cd research-flow
```

### 第二步：安装依赖

```bash
npm install
```

### 第三步：启动网站

```bash
npm run dev
```

### 第四步：在浏览器打开

默认地址：

- [http://localhost:3000](http://localhost:3000)

如果 `3000` 端口被占用，终端会提示改用 `3001` 或其他端口，请按终端提示打开对应地址。

## 3. AI 功能环境变量

如果需要使用 AI 相关功能，需要在项目根目录创建 `.env` 文件，并填写：

```bash
GEMINI_API_KEY=你的_Gemini_API_Key
```

如果没有这个 key，网站中依赖 Gemini 的功能可能无法正常使用。

## 4. 数据库说明

本项目当前使用本地 SQLite 数据库，数据库文件路径为：

```bash
prisma/dev.db
```

### 推荐交付方式

直接把 `prisma/dev.db` 一起发给对方。

这样对方执行完 `npm install` 和 `npm run dev` 后，就可以直接看到现有数据。

### 如果没有提供 `prisma/dev.db`

对方需要自己初始化数据库：

```bash
npm run db:migrate
npm run db:seed
```

## 5. 最简启动说明

如果你只想发给对方一句最短说明，可以直接发下面这段：

```bash
进入项目目录后，先运行 npm install，再运行 npm run dev，然后用浏览器打开 http://localhost:3000。
如果页面需要 AI 功能，请先在项目根目录创建 .env 文件并配置 GEMINI_API_KEY。
```

## 6. 常见问题

### 端口占用

如果终端提示 `3000` 端口被占用，不用处理，直接打开终端提示的新地址即可。

### 没有数据

通常是因为没有带上 `prisma/dev.db`，或者没有执行：

```bash
npm run db:migrate
npm run db:seed
```

### AI 功能报错

优先检查：

- 是否已创建 `.env`
- 是否已正确填写 `GEMINI_API_KEY`

## 7. 交付建议

最省事的交付方式是：

1. 发完整项目源码
2. 一并带上 `prisma/dev.db`
3. 附上本 README

这样对方通常只需要执行：

```bash
npm install
npm run dev
```
