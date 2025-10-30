# API 文档

## 概述

本文档记录了数字遗产系统的 API 端点详细信息。重点关注合并的每日检查端点 `combined-daily-check`。

## 端点列表

### 1. 保持活跃端点

**端点**: `GET /api/keep-alive`

**描述**: 重置用户不活跃计时器

**URL 参数**:
- `secret` (必需): 保持活跃密钥，需与环境变量 `KEEPALIVE_SECRET` 匹配

**示例**:
```
GET /api/keep-alive?secret=abc123xyz789
```

**响应**:
```json
{
  "message": "计时器已重置",
  "timestamp": 1699000000000
}
```

**错误响应**:
```json
{
  "error": "未授权访问"
}
```

**HTTP 状态码**:
- `200`: 成功重置计时器
- `401`: 密钥验证失败

---

### 2. 合并的每日检查端点 ⭐

**端点**: `POST /api/combined-daily-check`

**描述**: 合并的每日检查任务，顺序执行生存检查邮件发送和不活跃状态检查

**认证**: 
- `Authorization: Bearer <CRON_SECRET>`

**执行流程**:
1. **第一步**: 发送生存检查邮件
   - 如果配置了相关环境变量，向用户邮箱发送包含保持活跃链接的邮件
   - 包含精美的HTML模板和保持活跃按钮
   
2. **第二步**: 检查不活跃状态
   - 获取最后一次活动时间戳
   - 计算当前时间与最后活动时间的差值
   - 如果超过阈值，发送最终遗产邮件

**环境变量依赖**:
- **基础必需**: `RESEND_API_KEY`, `SENDER_EMAIL`, `CRON_SECRET`
- **生存邮件**: `YOUR_EMAIL`, `KEEPALIVE_SECRET`, `KEEPALIVE_EMAIL_SUBJECT`, `VERCEL_URL`
- **最终邮件**: `RECIPIENT_EMAILS`, `EMAIL_SUBJECT`, `FAREWELL_LETTER_HTML`, `IMPORTANT_INFO_HTML`, `INACTIVITY_DAYS`

**示例请求**:
```bash
curl -X POST "https://your-app.vercel.app/api/combined-daily-check" \
  -H "Authorization: Bearer your_cron_secret" \
  -H "Content-Type: application/json"
```

**成功响应示例**:
```json
{
  "message": "每日检查任务执行完成",
  "timestamp": "2025-10-30T07:15:01.000Z",
  "results": {
    "keepAliveEmail": {
      "success": true,
      "emailId": "email_abc123",
      "to": "user@example.com",
      "subject": "每日生存检查 - 请点击确认"
    },
    "finalCheck": {
      "status": "active",
      "message": "用户仍然活跃",
      "timeRemaining": 604800000
    },
    "errors": []
  }
}
```

**部分成功响应示例** (多状态响应):
```json
{
  "message": "每日检查任务执行完成",
  "timestamp": "2025-10-30T07:15:01.000Z",
  "results": {
    "keepAliveEmail": {
      "success": false,
      "reason": "缺少生存检查邮件相关环境变量"
    },
    "finalCheck": {
      "status": "inactive",
      "message": "系统还未激活",
      "timeRemaining": null
    },
    "errors": []
  },
  "warnings": []
}
```

**错误响应示例**:
```json
{
  "error": "未授权访问"
}
```

**HTTP 状态码**:
- `200`: 所有步骤成功完成
- `207`: 部分步骤成功（多状态）
- `401`: 认证失败
- `500`: 服务器内部错误

**结果对象说明**:
- `keepAliveEmail`: 生存检查邮件发送结果
  - `success`: 布尔值，发送是否成功
  - `emailId`: 邮件ID（成功时）
  - `to`: 收件人邮箱
  - `subject`: 邮件主题
  - `reason`: 失败原因（失败时）

- `finalCheck`: 最终检查结果
  - `status`: 状态值
    - `active`: 用户仍然活跃
    - `inactive`: 系统未激活
    - `sent`: 已发送最终邮件
    - `error`: 检查过程中出现错误
    - `skipped`: 跳过的配置检查
  - `message`: 状态描述
  - `timeRemaining`: 剩余时间（毫秒）
  - `emailId`: 邮件ID（发送成功时）
  - `recipients`: 收件人列表（发送成功时）

- `errors`: 错误信息数组

---

### 3. 生存检查邮件端点 (备用)

**端点**: `POST /api/send-keep-alive-email`

**描述**: 发送每日生存检查邮件的独立端点（保留作为备用）

**认证**: 
- `Authorization: Bearer <CRON_SECRET>`

---

### 4. 检查和发送端点 (备用)

**端点**: `POST /api/check-and-send`

**描述**: 检查不活跃状态并可能发送最终邮件的独立端点（保留作为备用）

**认证**: 
- `Authorization: Bearer <CRON_SECRET>`

**响应示例**:
```json
{
  "message": "用户仍然活跃",
  "status": "active",
  "timeRemaining": 86400000
}
```

---

## 认证说明

所有敏感端点都需要通过 HTTP Authorization 头进行认证：

```
Authorization: Bearer your_cron_secret
```

环境变量 `CRON_SECRET` 应设置为与 Vercel Cron 任务配置相同的值。

## 错误处理

系统采用渐进式错误处理策略：

1. **单步失败不影响其他步**: 即使生存邮件发送失败，仍会继续执行最终检查
2. **配置检查**: 如果缺少相关环境变量，会优雅地跳过相应步骤
3. **详细日志**: 返回详细的错误信息和执行状态
4. **HTTP 状态码**: 使用适当的 HTTP 状态码表示不同的结果类型

## 性能优化

合并端点的优势：
- **减少定时任务**: 从2个定时任务减少到1个
- **降低延迟**: 邮件发送和状态检查的逻辑更紧凑
- **统一监控**: 所有操作的结果集中在一个响应中
- **减少资源消耗**: 减少了网络请求和函数启动次数

## 故障排除

### 常见问题

1. **401 未授权**
   - 检查 `CRON_SECRET` 环境变量是否正确设置
   - 确认请求头格式为 `Authorization: Bearer your_secret`

2. **207 多状态响应**
   - 查看响应中的 `warnings` 数组了解具体警告
   - 检查相关环境变量配置是否完整

3. **500 服务器错误**
   - 查看 Vercel 函数日志获取详细错误信息
   - 检查所有必需的环境变量是否已设置

4. **邮件发送失败**
   - 确认 Resend API 密钥有效
   - 验证发送者邮箱域名已验证
   - 检查收件人邮箱格式是否正确

### 日志查看

在 Vercel Dashboard 中：
1. 进入项目页面
2. 点击 "Functions" 标签
3. 查看函数执行日志和错误信息

### 测试端点

**本地测试**:
```bash
# 测试保持活跃端点
curl "http://localhost:3000/api/keep-alive?secret=your_secret"

# 测试合并端点
curl -X POST "http://localhost:3000/api/combined-daily-check" \
  -H "Authorization: Bearer your_cron_secret"
```

**生产环境测试**:
```bash
# 使用环境变量中的实际值替换示例中的占位符
curl -X POST "https://your-app.vercel.app/api/combined-daily-check" \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 更新日志

### v2.0.0 (2025-10-30)
- 新增合并的每日检查端点 `/api/combined-daily-check`
- 优化了定时任务配置，从2个任务减少为1个
- 改进了错误处理和响应格式
- 保持了向后兼容性，原有端点仍可用作备用
- 更新了文档和API响应示例