import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { kvStore } from '@/lib/kv-storage';

/**
 * POST /api/check-and-send
 * 检查不活跃时限是否超时，如果超时则发送最终邮件
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
    const recipientEmails = process.env.RECIPIENT_EMAILS;
    const emailSubject = process.env.EMAIL_SUBJECT;
    const farewellLetterHtml = process.env.FAREWELL_LETTER_HTML;
    const importantInfoHtml = process.env.IMPORTANT_INFO_HTML;
    const senderEmail = process.env.SENDER_EMAIL;
    const inactivityDays = process.env.INACTIVITY_DAYS;

    if (!resendApiKey || !recipientEmails || !emailSubject || !farewellLetterHtml || !importantInfoHtml || !senderEmail || !inactivityDays) {
      console.error('缺少必需的环境变量');
      return NextResponse.json(
        { error: '服务器配置错误' },
        { status: 500 }
      );
    }

    // 获取最后一次活动时间戳
    const lastActiveTimestamp = await kvStore.get('last_active_timestamp');
    
    // 如果没有活动时间戳，说明系统还未激活，正常退出
    if (!lastActiveTimestamp) {
      console.log('系统还未激活，跳过检查');
      return NextResponse.json({
        message: '系统还未激活',
        status: 'inactive'
      });
    }

    // 计算当前时间和最后一次活动时间的时间差
    const currentTime = Date.now();
    const timeDifference = currentTime - lastActiveTimestamp;
    
    // 将不活跃天数转换为毫秒
    const inactivityThreshold = parseInt(inactivityDays) * 24 * 60 * 60 * 1000;
    
    console.log(`时间差: ${timeDifference}ms, 阈值: ${inactivityThreshold}ms`);
    
    // 检查是否超过不活跃阈值
    if (timeDifference <= inactivityThreshold) {
      console.log('用户仍然活跃，无需发送邮件');
      return NextResponse.json({
        message: '用户仍然活跃',
        status: 'active',
        timeRemaining: inactivityThreshold - timeDifference
      });
    }

    console.log('检测到用户长期不活跃，准备发送最终邮件');

    // 创建 Resend 客户端
    const resend = new Resend(resendApiKey);

    // 解析收件人邮箱列表
    const recipients = recipientEmails.split(',').map(email => email.trim());

    // 创建完整的 HTML 邮件内容
    const fullEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 700px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f8f9fa;
          }
          .container { 
            background: white; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding-bottom: 20px; 
            border-bottom: 2px solid #eee;
          }
          .header h1 { 
            color: #2c3e50; 
            margin-bottom: 10px; 
          }
          .farewell-section { 
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
          }
          .farewell-section h2 {
            color: white;
            margin-bottom: 20px;
          }
          .info-section { 
            margin-bottom: 30px;
            padding: 30px;
            background-color: #f8f9fa;
            border-left: 5px solid #007bff;
            border-radius: 5px;
          }
          .info-section h2 {
            color: #007bff;
            margin-bottom: 20px;
          }
          .footer { 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
          .emoji {
            font-size: 3em;
            margin-bottom: 15px;
          }
          .timestamp {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: monospace;
            text-align: center;
            color: #495057;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="emoji">🌟</div>
            <h1>重要通知</h1>
            <p style="font-size: 18px; color: #666;">数字遗产系统自动发送</p>
          </div>
          
          <div class="farewell-section">
            <h2>告别信</h2>
            ${farewellLetterHtml}
          </div>
          
          <div class="info-section">
            <h2>重要信息</h2>
            ${importantInfoHtml}
          </div>
          
          <div class="timestamp">
            <strong>邮件发送时间：</strong> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
          </div>
          
          <div class="footer">
            <p>此邮件由数字遗产系统自动发送<br>
            如果这是错误通知，请联系系统管理员</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 发送邮件
    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: recipients,
      subject: emailSubject,
      html: fullEmailHtml,
    });

    if (error) {
      console.error('发送最终邮件时发生错误:', error);
      return NextResponse.json(
        { error: '发送邮件失败' },
        { status: 500 }
      );
    }

    console.log('最终邮件发送成功:', data);

    // 更新活动时间戳，防止重复发送
    await kvStore.set('last_active_timestamp', currentTime);

    return NextResponse.json({
      message: '最终邮件发送成功',
      emailId: data?.id || 'unknown',
      recipients: recipients,
      timestamp: currentTime
    });

  } catch (error) {
    console.error('处理检查和发送请求时发生错误:', error);
    return NextResponse.json(
      { error: '内部服务器错误' },
      { status: 500 }
    );
  }
}