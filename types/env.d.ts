/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      KEEPALIVE_SECRET: string;
      CRON_SECRET: string;
      INACTIVITY_DAYS: string;
      YOUR_EMAIL: string;
      SENDER_EMAIL: string;
      RESEND_API_KEY: string;
      EMAIL_SUBJECT: string;
      KEEPALIVE_EMAIL_SUBJECT: string;
      FAREWELL_LETTER_HTML: string;
      IMPORTANT_INFO_HTML: string;
      RECIPIENT_EMAILS: string;
      VERCEL_URL?: string;
    }
  }
}

export {};