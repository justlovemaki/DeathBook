# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 数字遗产系统 (Dead Man's Switch)

一个基于 Next.js 和 Vercel 的自动化数字遗产系统，可以在用户长期不活跃时自动向指定联系人发送包含重要信息的邮件。

## 项目结构

```
death-book/
├── app/
│   └── api/
│       ├── keep-alive/
│       │   └── route.ts          # 保持活跃端点
│       ├── send-keep-alive-email/
│       │   └── route.ts          # 发送每日邮件端点
│       └── check-and-send/
│           └── route.ts          # 检查并发送最终邮件端点
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

## 核心架构

### API 端点
1. **`GET /api/keep-alive?secret=<KEEPALIVE_SECRET>`** - 重置用户不活跃计时器
2. **`POST /api/send-keep-alive-email`** - 由 Cron 任务调用，发送每日生存检查邮件
3. **`POST /api/check-and-send`** - 由 Cron 任务调用，检查不活跃状态并可能发送最终邮件

### 定时任务
- `0 8 * * *` - 每天上午 8:00 触发 `send-keep-alive-email` 发送生存检查邮件
- `0 5 * * *` - 每天上午 5:00 触发 `check-and-send` 检查不活跃状态

### 数据存储
- 使用 Vercel KV (Redis) 存储 `last_active_timestamp` 键以记录最后活跃时间

### 安全机制
- 所有 API 端点都需要密钥验证
- `/api/keep-alive` 需要正确的 `KEEPALIVE_SECRET` 查询参数
- Cron 任务端点使用 `CRON_SECRET` 通过 Bearer Token 验证

## 开发命令

```bash
# 安装依赖
npm install

# 运行开发服务器
npm run dev

# 构建项目
npm run build

# 启动生产服务器
npm run start

# Lint 检查
npm run lint

# 类型检查
npm run type-check
```

## 环境变量配置

### 必需变量
- `KEEPALIVE_SECRET` - 保持活跃 URL 的密钥
- `INACTIVITY_DAYS` - 不活跃天数阈值
- `YOUR_EMAIL` - 个人邮箱（接收每日邮件）
- `RESEND_API_KEY` - Resend API 密钥
- `SENDER_EMAIL` - 发送者邮箱
- `RECIPIENT_EMAILS` - 最终邮件收件人列表（逗号分隔）
- `EMAIL_SUBJECT` - 最终邮件主题
- `KEEPALIVE_EMAIL_SUBJECT` - 每日邮件主题
- `FAREWELL_LETTER_HTML` - 告别信 HTML 内容
- `IMPORTANT_INFO_HTML` - 重要信息 HTML 内容
- `CRON_SECRET` - Cron 任务认证密钥
- `VERCEL_URL` - 由 Vercel 自动提供的应用 URL

## 工作流程

1. **每日邮件** - 每天上午 8:00，系统向用户邮箱发送包含保持活跃链接的邮件
2. **保持活跃** - 点击邮件中的链接，调用 `/api/keep-alive` 端点，重置计时器
3. **定期检查** - 每天上午 5:00，系统检查不活跃时间是否超过设定阈值
4. **发送通知** - 如果超过阈值，向指定联系人发送包含告别信和重要信息的邮件