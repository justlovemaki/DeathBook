// 全局类型声明
declare module 'resend' {
  export interface EmailResponse {
    id: string;
  }

  export interface EmailError {
    message: string;
    statusCode?: number;
  }

  export class Resend {
    constructor(apiKey: string);
    emails: {
      send(options: {
        from: string;
        to: string[] | string;
        subject: string;
        html: string;
      }): Promise<{
        data: EmailResponse | null;
        error: EmailError | null;
      }>;
    };
  }
}

declare module '@vercel/kv' {
  export interface KV {
    get<T = unknown>(key: string): Promise<T | null>;
    set(key: string, value: any): Promise<void>;
    del(key: string): Promise<void>;
  }

  export const kv: KV;
}