'use client';

import './globals.css';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              数字遗产智能保护
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed">
              确保您的数字遗产在您无法访问时能够安全传递给值得信赖的联系人
            </p>
            
            {/* CTA按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                开始使用
              </button>
              <button className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all duration-200">
                了解更多
              </button>
            </div>

            {/* 功能特性网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-white/20">
                <div className="text-3xl mb-3">🛡️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  自动监控活跃状态
                </h3>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-white/20">
                <div className="text-3xl mb-3">📧</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  智能邮件提醒
                </h3>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-white/20">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  安全认证保护
                </h3>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-white/20">
                <div className="text-3xl mb-3">⚙️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  完全自定义配置
                </h3>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-white/20">
                <div className="text-3xl mb-3">📱</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  移动端友好
                </h3>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-white/20">
                <div className="text-3xl mb-3">🚀</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  一键部署
                </h3>
              </div>
            </div>
          </div>
        </section>

        {/* 详细功能介绍 */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              系统功能
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                自动化监控
              </h3>
              <p className="text-gray-600 leading-relaxed">
                通过每日邮件确认您的活跃状态，确保系统正常运行
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                安全认证
              </h3>
              <p className="text-gray-600 leading-relaxed">
                所有端点都通过密钥验证，确保只有您能控制系统
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                定时任务
              </h3>
              <p className="text-gray-600 leading-relaxed">
                基于Vercel Cron Jobs的可靠定时执行，保证系统稳定性
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                完全可配置
              </h3>
              <p className="text-gray-600 leading-relaxed">
                通过环境变量轻松配置所有功能，适应您的个性化需求
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            准备开始保护您的数字遗产？
          </h2>
          <p className="text-xl mb-8 opacity-90">
            立即部署并配置您的数字遗产系统
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="w-full sm:w-auto bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors duration-200">
              查看演示
            </button>
            <button className="w-full sm:w-auto border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200">
              联系我们
            </button>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="text-2xl">🛡️</div>
              <span className="text-xl font-bold">数字遗产系统</span>
            </div>
            <p className="text-gray-400 mb-4">基于Next.js和Vercel构建的现代化数字遗产管理平台</p>
            <p className="text-gray-500 text-sm">© 2025 数字遗产系统. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}