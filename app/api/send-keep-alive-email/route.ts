import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

/**
 * POST /api/send-keep-alive-email
 * 发送每日生存检查邮件的端点
 * 由 Vercel Cron Job 触发
 */
export async function POST(request: NextRequest) {
  try {
    // 验证请求是否来自 Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 检查必需的环境变量
    const resendApiKey = process.env.RESEND_API_KEY;
    const userEmail = process.env.YOUR_EMAIL;
    const keepAliveSecret = process.env.KEEPALIVE_SECRET;
    const emailSubject = process.env.KEEPALIVE_EMAIL_SUBJECT;
    const senderEmail = process.env.SENDER_EMAIL;

    if (!resendApiKey || !userEmail || !keepAliveSecret || !emailSubject || !senderEmail) {
      console.error('缺少必需的环境变量');
      return NextResponse.json(
        { error: '服务器配置错误' },
        { status: 500 }
      );
    }

    // 构造 keep-alive URL
    const vercelUrl = process.env.VERCEL_URL;
    if (!vercelUrl) {
      console.error('缺少 VERCEL_URL 环境变量');
      return NextResponse.json(
        { error: '服务器配置错误' },
        { status: 500 }
      );
    }

    const keepAliveUrl = `${vercelUrl}/api/keep-alive?secret=${keepAliveSecret}`;

    // 创建 Resend 客户端
    const resend = new Resend(resendApiKey);

    // 创建 HTML 邮件内容
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>每日生存检查</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f8f9fa;
          }
          .container { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .header h1 { 
            color: #2c3e50; 
            margin-bottom: 10px; 
          }
          .content { 
            margin-bottom: 30px; 
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold; 
            text-align: center; 
            margin: 20px 0; 
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .footer { 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            margin-top: 20px;
          }
          .emoji {
            font-size: 2em;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="emoji">🌟</div>
            <h1>每日生存检查</h1>
          </div>
          <div class="content">
            <p>您好！这是一封每日生存检查邮件。</p>
            <p>为了确保您的数字遗产系统正常运行，请点击下面的按钮进行每日签到：</p>
            <p style="text-align: center;">
              <a href="${keepAliveUrl}" class="button">点击完成每日签到</a>
            </p>
            <p>签到后，系统将记录您的活动时间，推迟数字遗产邮件的发送。</p>
            <p><strong>请注意：</strong>如果您超过设定的不活跃天数未签到，系统将自动向您的指定联系人发送包含重要信息的邮件。</p>
          </div>
          <div class="footer">
            <p>这封邮件由数字遗产系统自动发送<br>
            如有问题，请检查您的配置</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 发送邮件
    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: [userEmail],
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error('发送邮件时发生错误:', error);
      return NextResponse.json(
        { error: '发送邮件失败' },
        { status: 500 }
      );
    }

    console.log('生存检查邮件发送成功:', data);
    return NextResponse.json({
      message: '生存检查邮件发送成功',
      emailId: data?.id || 'unknown'
    });

  } catch (error) {
    console.error('处理生存检查邮件请求时发生错误:', error);
    return NextResponse.json(
      { error: '内部服务器错误' },
      { status: 500 }
    );
  }
}