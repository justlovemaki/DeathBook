import { kv } from '@vercel/kv';

// 检查KV环境变量是否存在
const checkKVAvailability = () => {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  return !!(kvUrl && kvToken);
};

// 简单的内存存储作为备用（仅用于开发环境）
const memoryStorage = new Map<string, any>();

// KV操作封装
const kvStore = {
  async set(key: string, value: any) {
    try {
      if (checkKVAvailability()) {
        // 使用Vercel KV
        await kv.set(key, value);
      } else {
        // 使用内存存储作为备用
        console.warn('Vercel KV未配置，使用内存存储（仅用于开发）');
        memoryStorage.set(key, value);
      }
    } catch (error) {
      console.error('KV存储失败:', error);
      // 尝试使用内存存储作为备用
      console.warn('回退到内存存储');
      memoryStorage.set(key, value);
    }
  },

  async get(key: string) {
    try {
      if (checkKVAvailability()) {
        // 使用Vercel KV
        return await kv.get(key);
      } else {
        // 使用内存存储作为备用
        return memoryStorage.get(key);
      }
    } catch (error) {
      console.error('KV读取失败:', error);
      // 尝试从内存存储读取
      return memoryStorage.get(key);
    }
  },

  // 获取存储状态信息
  getStatus() {
    return {
      usingKV: checkKVAvailability(),
      storageType: checkKVAvailability() ? 'vercel-kv' : 'memory',
      timestamp: new Date().toISOString()
    };
  }
};

export { kvStore };