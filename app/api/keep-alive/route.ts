import { NextRequest, NextResponse } from 'next/server';
import { kvStore } from '@/lib/kv-storage';

/**
 * POST /api/keep-alive
 * 重置用户不活跃计时器的端点
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
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 验证时间戳是否存在且有效
    if (!timestamp) {
      return NextResponse.json(
        { error: '缺少时间戳参数' },
        { status: 400 }
      );
    }

    // 验证时间戳是否为有效数字
    const expireTime = parseInt(timestamp);
    if (isNaN(expireTime)) {
      return NextResponse.json(
        { error: '无效的时间戳格式' },
        { status: 400 }
      );
    }

    // 检查链接是否已过期
    const currentTime = Date.now();
    if (currentTime > expireTime) {
      return NextResponse.json(
        {
          error: '链接已过期',
          expiresAt: expireTime,
          currentTime: currentTime,
          message: '此链接已失效，请等待下次生存检查邮件'
        },
        { status: 410 } // 410 Gone
      );
    }

    // 将当前时间戳存储到 Vercel KV 或内存存储
    const currentTimestamp = Date.now();
    await kvStore.set('last_active_timestamp', currentTimestamp);

    // 返回成功响应
    return NextResponse.json({
      message: '计时器已重置',
      timestamp: currentTimestamp
    });

  } catch (error) {
    console.error('重置计时器时发生错误:', error);
    return NextResponse.json(
      { error: '内部服务器错误' },
      { status: 500 }
    );
  }
}