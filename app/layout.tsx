import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '数字遗产系统 - Digital Legacy System',
  description: '一个智能的数字遗产管理系统，在您长期不活跃时自动向指定联系人发送重要信息',
  keywords: '数字遗产, Dead Man Switch, 自动化, 邮件, 安全保障, 数字遗产系统',
  authors: [{ name: 'Digital Legacy Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
  openGraph: {
    title: '数字遗产系统',
    description: '智能的数字遗产管理平台',
    type: 'website',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '数字遗产系统',
    description: '智能的数字遗产管理平台',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="数字遗产系统" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={inter.className}>
        <div id="root">{children}</div>
        <div id="modal-root" />
      </body>
    </html>
  );
}