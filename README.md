# 数字遗产系统 (Dead Man's Switch)

一个基于 Next.js 和 Vercel 的自动化数字遗产系统，可以在用户长期不活跃时自动向指定联系人发送包含重要信息的邮件。

## 🌟 功能特点

- **自动化监控**：通过每日邮件提醒确认用户活跃状态
- **安全认证**：所有端点都通过密钥验证，确保安全访问
- **定时任务**：基于 Vercel Cron Jobs 的可靠定时执行
- **优雅邮件**：使用 Resend 发送美观的 HTML 邮件
- **易于部署**：一键部署到 Vercel，无需服务器维护
- **完全配置**：所有功能都通过环境变量配置
- **容错设计**：KV环境变量缺失时自动回退到内存存储，支持本地开发

## 🏗️ 技术栈

- **前端框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **部署平台**: Vercel
- **数据库**: Vercel KV (Redis)
- **邮件服务**: Resend
- **定时任务**: Vercel Cron Jobs

## 📁 项目结构

```
death-book/
├── app/
│   └── api/
│       ├── keep-alive/
│       │   └── route.ts          # 保持活跃端点
│       ├── combined-daily-check/
│       │   └── route.ts          # 合并的每日检查端点
│       ├── send-keep-alive-email/
│       │   └── route.ts          # 发送每日邮件端点 (保留作为备用)
│       └── check-and-send/
│           └── route.ts          # 检查并发送最终邮件端点 (保留作为备用)
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

## ⚙️ 环境变量配置

在部署前，您需要配置以下环境变量：

### 必需的环境变量

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `KEEPALIVE_SECRET` | 保持活跃 URL 的密钥（随机长字符串） | `abc123xyz789def456...` |
| `INACTIVITY_DAYS` | 不活跃天数阈值 | `7` |
| `YOUR_EMAIL` | 您的个人邮箱（接收每日邮件） | `your@email.com` |
| `RESEND_API_KEY` | Resend API 密钥 | `re_xxxxxxxxxxxxx` |
| `SENDER_EMAIL` | 发送者邮箱（需在 Resend 验证） | `noreply@yourdomain.com` |
| `RECIPIENT_EMAILS` | 最终邮件收件人列表（逗号分隔） | `friend1@email.com,friend2@email.com` |
| `EMAIL_SUBJECT` | 最终邮件主题 | `重要信息 - 来自 [您的姓名]` |
| `KEEPALIVE_EMAIL_SUBJECT` | 每日邮件主题 | `每日生存检查 - 请点击确认` |
| `FAREWELL_LETTER_HTML` | 告别信 HTML 内容 | `<p>亲爱的朋友们...</p>` |
| `IMPORTANT_INFO_HTML` | 重要信息 HTML 内容 | `<h2>账户信息</h2><p>...</p>` |
| `CRON_SECRET` | Cron 任务认证密钥 | `cron_secret_123` |

### 可选的环境变量

以下环境变量用于配置 Vercel KV 数据库（推荐用于生产环境）：

| 变量名 | 描述 | 设置方式 |
|--------|------|----------|
| `KV_REST_API_URL` | Vercel KV 数据库 URL | 由 Vercel 在创建 KV 数据库时自动设置 |
| `KV_REST_API_TOKEN` | Vercel KV 访问令牌 | 由 Vercel 在创建 KV 数据库时自动设置 |

> **注意**: 如果未配置 KV 环境变量，系统将使用内存存储作为备用方案（仅适用于开发环境，生产环境请务必配置 KV）。

### 自动设置的环境变量

以下环境变量由 Vercel 自动提供：

- `VERCEL_URL`: 您的应用 URL

## 🚀 快速开始

### 1. 获取 Resend API 密钥

1. 访问 [Resend](https://resend.com)
2. 注册账户并登录
3. 进入 Dashboard，点击 "API Keys"
4. 创建新的 API 密钥
5. 在 "Domains" 中添加并验证您的域名
6. 记录 API 密钥和验证的域名

### 2. 本地开发

```bash
# 克隆项目
git clone <your-repo-url>
cd death-book

# 安装依赖
npm install

# 设置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，设置所有必需的环境变量

# 运行开发服务器
npm run dev
```

### 3. 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fdeath-book&env=KEEPALIVE_SECRET,INACTIVITY_DAYS,YOUR_EMAIL,RESEND_API_KEY,SENDER_EMAIL,RECIPIENT_EMAILS,EMAIL_SUBJECT,KEEPALIVE_EMAIL_SUBJECT,FAREWELL_LETTER_HTML,IMPORTANT_INFO_HTML,CRON_SECRET)

或手动部署：

1. 将代码推送到 GitHub
2. 访问 [Vercel](https://vercel.com)
3. 点击 "New Project"
4. 选择您的 GitHub 仓库
5. 配置环境变量（使用上表中的值）
6. 点击 "Deploy"

### 4. 设置 Vercel KV

1. 在 Vercel 项目中，进入 "Storage" 标签
2. 点击 "Create Database"
3. 选择 "KV" 数据库
4. 创建数据库并连接到项目

## 🔧 工作原理

### 系统流程

1. **每日邮件**: 每天上午 5:00，系统向您的邮箱发送包含保持活跃链接的邮件
2. **保持活跃**: 点击邮件中的链接，调用 `/api/keep-alive` 端点，重置计时器
3. **定期检查**: 同时检查不活跃时间是否超过设定阈值
4. **发送通知**: 如果超过阈值，向指定联系人发送包含告别信和重要信息的邮件
5. **合并执行**: 所有步骤通过单一的 `/api/combined-daily-check` 端点顺序执行

> **注意**: 原有的独立端点 (`/api/send-keep-alive-email` 和 `/api/check-and-send`) 已保留作为备用方案

### API 端点

#### `GET /api/keep-alive?secret=<KEEPALIVE_SECRET>`

重置用户不活跃计时器。

**参数**:
- `secret` (查询参数): 保持活跃密钥

**响应**:
```json
{
  "message": "计时器已重置",
  "timestamp": 1699000000000
}
```

#### `POST /api/combined-daily-check`

合并的每日检查端点，由 Vercel Cron 任务调用，顺序执行以下操作：
1. 发送生存检查邮件
2. 检查不活跃状态并可能发送最终邮件

**请求头**:
- `Authorization: Bearer <CRON_SECRET>`

**响应示例**:
```json
{
  "message": "每日检查任务执行完成",
  "timestamp": "2025-10-30T07:14:33.000Z",
  "results": {
    "keepAliveEmail": {
      "success": true,
      "emailId": "email_123",
      "to": "user@example.com",
      "subject": "每日生存检查"
    },
    "finalCheck": {
      "status": "active",
      "message": "用户仍然活跃",
      "timeRemaining": 86400000
    },
    "errors": []
  }
}
```

#### `POST /api/send-keep-alive-email`

发送每日生存检查邮件的独立端点（保留作为备用）。

**请求头**:
- `Authorization: Bearer <CRON_SECRET>`

#### `POST /api/check-and-send`

检查不活跃状态并可能发送最终邮件的独立端点（保留作为备用）。

**请求头**:
- `Authorization: Bearer <CRON_SECRET>`

**响应示例**:
```json
{
  "message": "用户仍然活跃",
  "status": "active",
  "timeRemaining": 86400000
}
```

## 📧 邮件模板

### 每日生存检查邮件

- **主题**: `KEEPALIVE_EMAIL_SUBJECT`
- **内容**: 包含醒目的保持活跃按钮
- **样式**: 现代化渐变设计，移动端友好

### 最终遗产邮件

- **主题**: `EMAIL_SUBJECT`
- **结构**:
  1. **告别信部分**: 来自 `FAREWELL_LETTER_HTML`
  2. **重要信息部分**: 来自 `IMPORTANT_INFO_HTML`
  3. **发送时间戳**: 自动添加

## 🔒 安全考虑

- 所有敏感操作都需要密钥验证
- Cron 任务通过 Authorization 头验证
- 保持活跃 URL 包含随机密钥
- 环境变量存储敏感信息，不暴露在客户端

## 🛠️ 自定义配置

### 修改定时任务

编辑 `vercel.json` 文件中的 cron 表达式：

```json
{
  "crons": [
    {
      "path": "/api/combined-daily-check",
      "schedule": "0 5 * * *"  // 每天上午 5:00 UTC
    }
  ]
}
```

Cron 表达式格式: `秒 分 时 日 月 星期`

**推荐使用合并端点**: 建议使用 `combined-daily-check` 端点代替独立的端点，以减少定时任务数量和执行时间。

### 自定义邮件样式

- 合并端点: 编辑 `combined-daily-check/route.ts` 中的 HTML 模板
- 备用端点: 编辑 `send-keep-alive-email/route.ts` 和 `check-and-send/route.ts` 中的 HTML 模板

## 📝 开发指南

### 添加新的 API 端点

1. 在 `app/api/` 下创建新目录
2. 添加 `route.ts` 文件
3. 实现 `GET` 或 `POST` 处理器

### 测试本地部署

```bash
# 启动开发服务器
npm run dev

# 测试 API 端点
curl http://localhost:3000/api/keep-alive?secret=your_secret

# 类型检查
npm run type-check
```

## 🐛 故障排除

### 常见问题

**邮件未发送**
- 检查 Resend API 密钥是否正确
- 确认发送者邮箱已验证
- 查看 Vercel 函数日志

**定时任务未执行**
- 检查 `vercel.json` 配置
- 确认环境变量 `CRON_SECRET` 设置正确
- 查看 Vercel Cron Jobs 状态

**保持活跃链接无效**
- 检查 `KEEPALIVE_SECRET` 是否一致
- 确认 URL 格式正确
- 验证 Vercel KV 连接

**KV 存储错误**
- 检查 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN` 是否已设置
- 确认 Vercel KV 数据库已创建并连接
- 在开发环境中，系统会回退到内存存储（这是正常的）
- 生产环境中确保已正确配置 KV 环境变量

### 日志查看

在 Vercel Dashboard 中：
1. 进入项目页面
2. 点击 "Functions" 标签
3. 查看函数执行日志

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## ⚠️ 免责声明

本系统仅供学习和个人使用。使用前请确保遵守当地法律法规。用户需自行承担使用风险，开发者不承担任何责任。

---

**注意**: 定期测试系统功能，确保在紧急情况下能正常工作。建议设置较短的不活跃时限进行测试。
