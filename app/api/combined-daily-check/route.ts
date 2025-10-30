import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { kvStore } from '@/lib/kv-storage';

/**
 * 将毫秒转换为天小时格式，便于显示剩余保活时间
 */
function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return '0天0小时';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  let result = '';
  if (days > 0) result += `${days}天`;
  if (hours > 0 || days > 0) result += `${hours}小时`;
  if (days === 0 && hours < 1) result += `${minutes}分钟`;
  
  return result || '0分钟';
}

/**
 * 检查邮件是否应该发送（基于到期状态和发送限制）
 */
async function shouldSendKeepAliveEmail(inactivityDays: string): Promise<{ shouldSend: boolean; reason?: string; timeRemaining?: number }> {
  try {
    // 获取最后一次活动时间戳
    const lastActiveTimestamp = await kvStore.get('last_active_timestamp');
    
    // 如果没有活动时间戳，说明系统还未激活，发送邮件
    if (!lastActiveTimestamp) {
      return { shouldSend: true };
    }
    
    // 计算当前时间和最后一次活动时间的时间差
    const currentTime = Date.now();
    const timeDifference = currentTime - lastActiveTimestamp;
    
    // 将不活跃天数转换为毫秒
    const inactivityThreshold = parseInt(inactivityDays) * 24 * 60 * 60 * 1000;
    
    // 检查是否超过不活跃阈值
    if (timeDifference > inactivityThreshold) {
      return {
        shouldSend: false,
        reason: '已超过不活跃期，不再发送生存检查邮件',
        timeRemaining: 0
      };
    }
    
    const remainingTime = inactivityThreshold - timeDifference;
    return {
      shouldSend: true,
      timeRemaining: remainingTime
    };
  } catch (error) {
    console.error('检查邮件发送条件时发生错误:', error);
    return { shouldSend: true }; // 出错时默认发送
  }
}

/**
 * 检查最终邮件是否应该发送（3天限制）
 */
async function shouldSendFinalEmail(recipients: string[]): Promise<{ shouldSend: boolean; reason?: string }> {
  try {
    // 获取最终邮件发送次数
    const finalEmailCount = await kvStore.get('final_email_sent_count') || 0;
    
    // 如果已发送3次或以上，不再发送
    if (finalEmailCount >= 3) {
      return {
        shouldSend: false,
        reason: '最终邮件已发送3次，不再发送'
      };
    }
    
    return { shouldSend: true };
  } catch (error) {
    console.error('检查最终邮件发送条件时发生错误:', error);
    return { shouldSend: true }; // 出错时默认发送
  }
}

/**
 * 获取或创建邮件模板中的高亮时间显示
 */
function getTimeHighlightHtml(timeRemaining: number): string {
  if (timeRemaining <= 0) {
    return `
      <div class="time-highlight expired">
        <h2 style="color: #dc3545; margin-bottom: 15px;">⏰ 已到期</h2>
        <p style="color: #dc3545; font-size: 16px;">您的系统已超过不活跃期，将向指定联系人发送重要邮件</p>
      </div>
    `;
  }
  
  const days = Math.floor(timeRemaining / (24 * 3600 * 1000));
  const hours = Math.floor((timeRemaining % (24 * 3600 * 1000)) / (3600 * 1000));
  
  return `
    <div class="time-highlight active">
      <h2 style="color: #28a745; margin-bottom: 15px;">⏰ 保活倒计时</h2>
      <div class="countdown">
        <span class="days">${days}</span>
        <span class="unit">天</span>
        <span class="hours">${hours}</span>
        <span class="unit">小时</span>
      </div>
      <p style="color: #6c757d; font-size: 14px; margin-top: 10px;">距离不活跃期剩余时间</p>
    </div>
  `;
}

/**
 * POST /api/combined-daily-check
 * 合并的每日检查定时任务：先发送生存检查邮件，再检查不活跃期是否超时
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
    const recipientEmails = process.env.RECIPIENT_EMAILS;
    const finalEmailSubject = process.env.EMAIL_SUBJECT;
    const farewellLetterHtml = process.env.FAREWELL_LETTER_HTML;
    const importantInfoHtml = process.env.IMPORTANT_INFO_HTML;
    const inactivityDays = process.env.INACTIVITY_DAYS;

    // 检查邮件发送相关环境变量
    if (!resendApiKey || !senderEmail) {
      console.error('缺少邮件发送必需的环境变量');
      return NextResponse.json(
        { error: '服务器配置错误：邮件发送配置不完整' },
        { status: 500 }
      );
    }

    // 创建 Resend 客户端
    const resend = new Resend(resendApiKey);
    const results: {
      keepAliveEmail: any;
      finalCheck: any;
      errors: string[];
    } = {
      keepAliveEmail: null,
      finalCheck: null,
      errors: []
    };

    // 第一步：发送生存检查邮件（如果配置了相关环境变量）
    if (userEmail && keepAliveSecret && emailSubject) {
      try {
        console.log('第一步：发送生存检查邮件');

        // 检查是否应该发送生存检查邮件
        const shouldSendResult = await shouldSendKeepAliveEmail(inactivityDays || '30');
        
        if (!shouldSendResult.shouldSend) {
          console.log('不发送生存检查邮件:', shouldSendResult.reason);
          results.keepAliveEmail = {
            success: false,
            reason: shouldSendResult.reason || '不发送邮件'
          };
        } else {
          // 构造 keep-alive URL
          const vercelUrl = process.env.NEXT_PUBLIC_BASE_URL;
          if (!vercelUrl) {
            console.error('缺少 NEXT_PUBLIC_BASE_URL 环境变量');
            results.errors.push('缺少 NEXT_PUBLIC_BASE_URL 环境变量');
          } else {
            // 生成带时间戳的续命链接，24小时有效期
            const currentTimestamp = Date.now();
            const expiresAt = currentTimestamp + (24 * 60 * 60 * 1000); // 24小时后过期
            const keepAliveUrl = `${vercelUrl}/api/keep-alive?secret=${keepAliveSecret}&timestamp=${expiresAt}`;

            // 生成时间高亮HTML
            const timeHighlightHtml = getTimeHighlightHtml(shouldSendResult.timeRemaining || 0);

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
                    width: 95%;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8f9fa;
                    text-align: center;
                  }
                  .container {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    max-width: 620px;
                    margin: 0 auto;
                  }
                  .header {
                    text-align: center;
                    margin-bottom: 30px;
                  }
                  .header h1 {
                    color: #2c3e50;
                    margin-bottom: 10px;
                    text-align: center;
                  }
                  .content {
                    margin-bottom: 30px;
                  }
                  .content p {
                    text-align: center;
                    margin-bottom: 20px;
                  }
                  .time-highlight {
                    margin: 30px 0;
                    padding: 25px;
                    text-align: center;
                  }
                  .time-highlight.active {
                    /* 移除背景和边框 */
                  }
                  .time-highlight.expired {
                    /* 移除背景和边框 */
                  }
                  .countdown {
                    font-size: 32px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin: 15px 0;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                  }
                  .countdown .days, .countdown .hours {
                    color: #007bff;
                    font-size: 36px;
                    margin: 0 5px;
                  }
                  .countdown .unit {
                    font-size: 18px;
                    color: #6c757d;
                    margin-right: 10px;
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
                    transition: transform 0.2s, box-shadow 0.2s;
                    cursor: pointer;
                    border: none;
                    box-sizing: border-box;
                    user-select: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    pointer-events: auto;
                  }
                  .button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                  }
                  .button:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                  }
                  .button:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
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
                    
                    ${timeHighlightHtml}
                    
                    <p>为了确保您的数字遗产系统正常运行，请点击下面的按钮进行每日签到：</p>
                    <!-- 主要签到按钮 -->
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${keepAliveUrl}"
                         class="button"
                         target="_blank"
                         rel="noopener noreferrer"
                         style="min-width: 200px; display: inline-block;"
                         ${shouldSendResult.timeRemaining !== undefined && shouldSendResult.timeRemaining <= 0 ? 'style="opacity: 0.6; pointer-events: none;"' : ''}>
                        ${shouldSendResult.timeRemaining !== undefined && shouldSendResult.timeRemaining <= 0 ? '已到期，无需签到' : '点击完成每日签到'}
                      </a>
                    </div>
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

            // 发送生存检查邮件
            const { data, error } = await resend.emails.send({
              from: senderEmail,
              to: [userEmail],
              subject: emailSubject,
              html: emailHtml,
            });

            if (error) {
              console.error('发送生存检查邮件时发生错误:', error);
              results.errors.push(`生存检查邮件发送失败: ${error.message}`);
            } else {
              console.log('生存检查邮件发送成功:', data);
              results.keepAliveEmail = {
                success: true,
                emailId: data?.id || 'unknown',
                to: userEmail,
                subject: emailSubject,
                timeRemaining: shouldSendResult.timeRemaining,
                timeRemainingFormatted: shouldSendResult.timeRemaining ? formatTimeRemaining(shouldSendResult.timeRemaining) : null
              };
            }
          }
        }
      } catch (error) {
        console.error('发送生存检查邮件时发生错误:', error);
        results.errors.push(`生存检查邮件异常: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    } else {
      console.log('跳过生存检查邮件发送（缺少相关环境变量）');
      results.keepAliveEmail = {
        success: false,
        reason: '缺少生存检查邮件相关环境变量'
      };
    }

    // 第二步：检查不活跃期并发送最终邮件（如果配置了相关环境变量）
    if (recipientEmails && finalEmailSubject && farewellLetterHtml && importantInfoHtml && inactivityDays) {
      try {
        console.log('第二步：检查不活跃期并发送最终邮件');

        // 解析收件人邮箱列表
        const recipients = recipientEmails.split(',').map(email => email.trim());

        // 检查最终邮件是否应该发送（3天限制）
        const shouldSendFinalResult = await shouldSendFinalEmail(recipients);
        
        if (!shouldSendFinalResult.shouldSend) {
          console.log('不发送最终邮件:', shouldSendFinalResult.reason);
          results.finalCheck = {
            status: 'skipped',
            reason: shouldSendFinalResult.reason || '不发送最终邮件'
          };
        } else {
          // 获取最后一次活动时间戳
          const lastActiveTimestamp = await kvStore.get('last_active_timestamp');
          
          // 如果没有活动时间戳，说明系统还未激活
          if (!lastActiveTimestamp) {
            console.log('系统还未激活，跳过最终邮件检查');
            results.finalCheck = {
              status: 'inactive',
              message: '系统还未激活',
              timeRemaining: null,
              timeRemainingFormatted: null
            };
          } else {
            // 计算当前时间和最后一次活动时间的时间差
            const currentTime = Date.now();
            const timeDifference = currentTime - lastActiveTimestamp;
            
            // 将不活跃天数转换为毫秒
            const inactivityThreshold = parseInt(inactivityDays) * 24 * 60 * 60 * 1000;
            
            console.log(`时间差: ${timeDifference}ms, 阈值: ${inactivityThreshold}ms`);
            
            // 检查是否超过不活跃阈值
            if (timeDifference <= inactivityThreshold) {
              console.log('用户仍然活跃，无需发送最终邮件');
              const remainingTime = inactivityThreshold - timeDifference;
              results.finalCheck = {
                status: 'active',
                message: '用户仍然活跃',
                timeRemaining: remainingTime,
                timeRemainingFormatted: formatTimeRemaining(remainingTime)
              };
            } else {
              console.log('检测到用户长期不活跃，准备发送最终邮件');

              // 创建完整的 HTML 邮件内容
              const fullEmailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>${finalEmailSubject}</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                      line-height: 1.6;
                      color: #333;
                      width: 95%;
                      margin: 0 auto;
                      padding: 20px;
                      background-color: #f8f9fa;
                      text-align: center;
                    }
                    .container {
                      background: white;
                      padding: 40px;
                      border-radius: 12px;
                      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                      max-width: 620px;
                      margin: 0 auto;
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
                      text-align: center;
                    }
                    .header p {
                      text-align: center;
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
                      text-align: center;
                    }
                    .farewell-section div, .farewell-section p {
                      text-align: center;
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
                      text-align: center;
                    }
                    .info-section div, .info-section p {
                      text-align: center;
                    }
                    .footer {
                      text-align: center;
                      color: #666;
                      font-size: 14px;
                      margin-top: 30px;
                      padding-top: 20px;
                      border-top: 1px solid #eee;
                    }
                    .footer p {
                      text-align: center;
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
                      <div style="text-align: center;">${farewellLetterHtml}</div>
                    </div>
                    
                    <div class="info-section">
                      <h2>重要信息</h2>
                      <div style="text-align: center;">${importantInfoHtml}</div>
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

              // 发送最终邮件
              const { data, error } = await resend.emails.send({
                from: senderEmail,
                to: recipients,
                subject: finalEmailSubject,
                html: fullEmailHtml,
              });

              if (error) {
                console.error('发送最终邮件时发生错误:', error);
                results.errors.push(`最终邮件发送失败: ${error.message}`);
                results.finalCheck = {
                  status: 'error',
                  message: '发送最终邮件失败'
                };
              } else {
                console.log('最终邮件发送成功:', data);

                // 更新最终邮件发送次数
                const currentCount = await kvStore.get('final_email_sent_count') || 0;
                await kvStore.set('final_email_sent_count', currentCount + 1);

                // 更新活动时间戳，防止重复发送
                await kvStore.set('last_active_timestamp', Date.now());

                results.finalCheck = {
                  status: 'sent',
                  message: '最终邮件发送成功',
                  emailId: data?.id || 'unknown',
                  recipients: recipients,
                  timestamp: Date.now(),
                  sentCount: currentCount + 1
                };
              }
            }
          }
        }
      } catch (error) {
        console.error('检查不活跃期时发生错误:', error);
        results.errors.push(`最终邮件检查异常: ${error instanceof Error ? error.message : '未知错误'}`);
        results.finalCheck = {
          status: 'error',
          message: '最终邮件检查异常'
        };
      }
    } else {
      console.log('跳过最终邮件检查（缺少相关环境变量）');
      results.finalCheck = {
        status: 'skipped',
        reason: '缺少最终邮件相关环境变量'
      };
    }

    // 返回综合结果
    const response: {
      message: string;
      timestamp: string;
      results: {
        keepAliveEmail: any;
        finalCheck: any;
        errors: string[];
      };
    } = {
      message: '每日检查任务执行完成',
      timestamp: new Date().toISOString(),
      results: results
    };

    if (results.errors.length > 0) {
      return NextResponse.json(response, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('处理合并的每日检查请求时发生错误:', error);
    return NextResponse.json(
      { 
        error: '内部服务器错误',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}