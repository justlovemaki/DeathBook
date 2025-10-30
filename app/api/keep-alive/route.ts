import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

/**
 * POST /api/keep-alive
 * 重置用户不活跃计时器的端点
 * 接收 secret 查询参数进行身份验证
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数中的 secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // 验证 secret 是否匹配环境变量
    if (!secret || secret !== process.env.KEEPALIVE_SECRET) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 将当前时间戳存储到 Vercel KV
    const currentTimestamp = Date.now();
    await kv.set('last_active_timestamp', currentTimestamp);

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