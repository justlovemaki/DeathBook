import { NextRequest, NextResponse } from 'next/server';
import { kvStore } from '@/lib/kv-storage';

/**
 * GET /api/keep-alive
 * 重置用户不活跃计时器的端点，并重定向到状态页面
 * 接收 secret 查询参数进行身份验证
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数中的 secret 和 timestamp
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const timestamp = searchParams.get('timestamp');

    // 验证 secret 是否匹配环境变量
    if (!secret || secret !== process.env.KEEPALIVE_SECRET) {
      // 重定向到状态页面显示错误
      const errorUrl = new URL('/check-in', request.url);
      errorUrl.searchParams.set('status', 'unauthorized');
      errorUrl.searchParams.set('message', '未授权访问');
      return NextResponse.redirect(errorUrl.toString());
    }

    // 验证时间戳是否存在且有效
    if (!timestamp) {
      const errorUrl = new URL('/check-in', request.url);
      errorUrl.searchParams.set('status', 'error');
      errorUrl.searchParams.set('message', '缺少时间戳参数');
      return NextResponse.redirect(errorUrl.toString());
    }

    // 验证时间戳是否为有效数字
    const expireTime = parseInt(timestamp);
    if (isNaN(expireTime)) {
      const errorUrl = new URL('/check-in', request.url);
      errorUrl.searchParams.set('status', 'error');
      errorUrl.searchParams.set('message', '无效的时间戳格式');
      return NextResponse.redirect(errorUrl.toString());
    }

    // 检查链接是否已过期
    const currentTime = Date.now();
    if (currentTime > expireTime) {
      const errorUrl = new URL('/check-in', request.url);
      errorUrl.searchParams.set('status', 'expired');
      errorUrl.searchParams.set('expiresAt', expireTime.toString());
      errorUrl.searchParams.set('currentTime', currentTime.toString());
      errorUrl.searchParams.set('message', '此链接已失效，请等待下次生存检查邮件');
      return NextResponse.redirect(errorUrl.toString());
    }

    // 将当前时间戳存储到 Vercel KV 或内存存储
    const currentTimestamp = Date.now();
    await kvStore.set('last_active_timestamp', currentTimestamp);
    await kvStore.set('final_email_sent_count', 0);

    // 重定向到成功状态页面
    const successUrl = new URL('/check-in', request.url);
    successUrl.searchParams.set('status', 'success');
    successUrl.searchParams.set('timestamp', currentTimestamp.toString());
    return NextResponse.redirect(successUrl.toString());

  } catch (error) {
    console.error('重置计时器时发生错误:', error);
    
    // 重定向到错误状态页面
    const errorUrl = new URL('/check-in', request.url);
    errorUrl.searchParams.set('status', 'error');
    errorUrl.searchParams.set('message', '内部服务器错误');
    return NextResponse.redirect(errorUrl.toString());
  }
}